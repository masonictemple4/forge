import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, users, sessions, type User } from "@db/index";
import { eq, and } from "drizzle-orm";
import * as argon2 from "argon2";
import * as jose from "jose";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { randomBytes } from "crypto";

const authRouter = new Hono();

// JWT secret (use env var in production)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "forge-dev-secret-change-in-production"
);
const JWT_EXPIRY = "7d";
const COOKIE_NAME = "forge_session";

// OAuth configuration
const getOAuthConfig = () => ({
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userUrl: "https://api.github.com/user",
    emailsUrl: "https://api.github.com/user/emails",
    scopes: ["read:user", "user:email"],
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    scopes: ["openid", "email", "profile"],
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || "",
    teamId: process.env.APPLE_TEAM_ID || "",
    keyId: process.env.APPLE_KEY_ID || "",
    privateKey: (process.env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    authUrl: "https://appleid.apple.com/auth/authorize",
    tokenUrl: "https://appleid.apple.com/auth/token",
    scopes: ["name", "email"],
  },
});

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(255),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Helper to generate verification token
function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

// Helper to create session and JWT
async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const token = await new jose.SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(JWT_SECRET);

  // Store session in database
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });

  return token;
}

// Helper to find or create OAuth user
async function findOrCreateOAuthUser(
  provider: string,
  providerId: string,
  email: string,
  name: string | null,
  avatarUrl: string | null
): Promise<User> {
  // Try to find existing user by provider + providerId
  const [existingUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.provider, provider), eq(users.providerId, providerId)));

  if (existingUser) {
    return existingUser;
  }

  // Create new user
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      name,
      avatarUrl,
      provider,
      providerId,
      emailVerified: true, // OAuth emails are pre-verified
    })
    .returning();

  return newUser;
}

// Helper to set auth cookie
function setAuthCookie(c: any, token: string) {
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// POST /api/auth/register - Create new account with email/password
authRouter.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");

  // Check if email already exists for email provider
  const [existingUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.provider, "email")));

  if (existingUser) {
    return c.json({ error: "An account with this email already exists" }, 400);
  }

  // Hash password with Argon2
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });

  // Generate verification token
  const verificationToken = generateVerificationToken();

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email,
      name,
      provider: "email",
      providerId: null,
      passwordHash,
      emailVerified: false,
      verificationToken,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    });

  // Create session
  const token = await createSession(user.id);

  // Set HTTP-only cookie
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // TODO: Send verification email with verificationToken
  // For now, log it (remove in production)
  console.log(`[Auth] Verification token for ${email}: ${verificationToken}`);

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    },
    message: "Account created successfully. Please verify your email.",
  }, 201);
});

// POST /api/auth/login - Login with email/password
authRouter.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  // Find user by email and provider
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.provider, "email")));

  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  // Check if user has a password (should always be true for email provider)
  if (!user.passwordHash) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  // Verify password
  const validPassword = await argon2.verify(user.passwordHash, password);
  if (!validPassword) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  // Create session
  const token = await createSession(user.id);

  // Set HTTP-only cookie
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl,
    },
  });
});

// POST /api/auth/logout - Logout and clear session
authRouter.post("/logout", async (c) => {
  const token = getCookie(c, COOKIE_NAME);

  if (token) {
    // Remove session from database
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  // Clear cookie
  deleteCookie(c, COOKIE_NAME, {
    path: "/",
  });

  return c.json({ message: "Logged out successfully" });
});

// GET /api/auth/me - Get current user
authRouter.get("/me", async (c) => {
  const token = getCookie(c, COOKIE_NAME);

  if (!token) {
    return c.json({ user: null });
  }

  // Find session
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token));

  if (!session || session.expiresAt < new Date()) {
    // Session expired or not found
    deleteCookie(c, COOKIE_NAME, { path: "/" });
    return c.json({ user: null });
  }

  // Get user
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      emailVerified: users.emailVerified,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, session.userId));

  if (!user) {
    deleteCookie(c, COOKIE_NAME, { path: "/" });
    return c.json({ user: null });
  }

  return c.json({ user });
});

// POST /api/auth/verify-email - Verify email with token
authRouter.post("/verify-email", async (c) => {
  const { token } = await c.req.json<{ token: string }>();

  if (!token) {
    return c.json({ error: "Verification token is required" }, 400);
  }

  // Find user with this verification token
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.verificationToken, token));

  if (!user) {
    return c.json({ error: "Invalid or expired verification token" }, 400);
  }

  // Mark email as verified
  await db
    .update(users)
    .set({
      emailVerified: true,
      verificationToken: null,
    })
    .where(eq(users.id, user.id));

  return c.json({ message: "Email verified successfully" });
});

// ============================================
// GITHUB OAUTH
// ============================================

// GET /auth/github - Redirect to GitHub OAuth
authRouter.get("/github", (c) => {
  const config = getOAuthConfig();

  if (!config.github.clientId) {
    return c.json({ error: "GitHub OAuth not configured" }, 500);
  }

  const state = randomBytes(16).toString("hex");
  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: `${config.baseUrl}/auth/github/callback`,
    scope: config.github.scopes.join(" "),
    state,
  });

  return c.redirect(`${config.github.authUrl}?${params}`);
});

// GET /auth/github/callback - Handle GitHub OAuth callback
authRouter.get("/github/callback", async (c) => {
  const config = getOAuthConfig();
  const code = c.req.query("code");
  const state = c.req.query("state");
  const storedState = getCookie(c, "oauth_state");

  deleteCookie(c, "oauth_state");

  if (!code || !state || state !== storedState) {
    return c.redirect("/?error=invalid_state");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(config.github.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: `${config.baseUrl}/auth/github/callback`,
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!tokenData.access_token) {
      console.error("GitHub token error:", tokenData);
      return c.redirect("/?error=token_exchange_failed");
    }

    // Fetch user profile
    const userResponse = await fetch(config.github.userUrl, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    });

    const userData = (await userResponse.json()) as {
      id: number;
      email: string | null;
      name: string | null;
      avatar_url: string;
    };

    // GitHub email might be private, fetch from emails endpoint
    let email = userData.email;
    if (!email) {
      const emailsResponse = await fetch(config.github.emailsUrl, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/json",
        },
      });

      const emails = (await emailsResponse.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;

      const primaryEmail = emails.find((e) => e.primary && e.verified);
      email = primaryEmail?.email || emails[0]?.email || `${userData.id}@github.local`;
    }

    // Find or create user
    const user = await findOrCreateOAuthUser(
      "github",
      String(userData.id),
      email,
      userData.name,
      userData.avatar_url
    );

    // Create session
    const token = await createSession(user.id);
    setAuthCookie(c, token);

    return c.redirect("/");
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return c.redirect("/?error=oauth_failed");
  }
});

// ============================================
// GOOGLE OAUTH
// ============================================

// GET /auth/google - Redirect to Google OAuth
authRouter.get("/google", (c) => {
  const config = getOAuthConfig();

  if (!config.google.clientId) {
    return c.json({ error: "Google OAuth not configured" }, 500);
  }

  const state = randomBytes(16).toString("hex");
  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: `${config.baseUrl}/auth/google/callback`,
    response_type: "code",
    scope: config.google.scopes.join(" "),
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return c.redirect(`${config.google.authUrl}?${params}`);
});

// GET /auth/google/callback - Handle Google OAuth callback
authRouter.get("/google/callback", async (c) => {
  const config = getOAuthConfig();
  const code = c.req.query("code");
  const state = c.req.query("state");
  const storedState = getCookie(c, "oauth_state");

  deleteCookie(c, "oauth_state");

  if (!code || !state || state !== storedState) {
    return c.redirect("/?error=invalid_state");
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(config.google.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: `${config.baseUrl}/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      id_token?: string;
      error?: string;
    };

    if (!tokenData.access_token) {
      console.error("Google token error:", tokenData);
      return c.redirect("/?error=token_exchange_failed");
    }

    // Fetch user info
    const userResponse = await fetch(config.google.userUrl, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = (await userResponse.json()) as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    // Find or create user
    const user = await findOrCreateOAuthUser(
      "google",
      userData.id,
      userData.email,
      userData.name,
      userData.picture
    );

    // Create session
    const token = await createSession(user.id);
    setAuthCookie(c, token);

    return c.redirect("/");
  } catch (error) {
    console.error("Google OAuth error:", error);
    return c.redirect("/?error=oauth_failed");
  }
});

// ============================================
// APPLE OAUTH
// ============================================

// Generate Apple client secret (JWT signed with private key)
async function generateAppleClientSecret(): Promise<string> {
  const config = getOAuthConfig();

  if (!config.apple.privateKey) {
    throw new Error("Apple private key not configured");
  }

  const privateKey = await jose.importPKCS8(config.apple.privateKey, "ES256");

  const token = await new jose.SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: config.apple.keyId })
    .setIssuer(config.apple.teamId)
    .setIssuedAt()
    .setExpirationTime("5m")
    .setAudience("https://appleid.apple.com")
    .setSubject(config.apple.clientId)
    .sign(privateKey);

  return token;
}

// GET /auth/apple - Redirect to Apple OAuth
authRouter.get("/apple", (c) => {
  const config = getOAuthConfig();

  if (!config.apple.clientId) {
    return c.json({ error: "Apple OAuth not configured" }, 500);
  }

  const state = randomBytes(16).toString("hex");
  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: config.apple.clientId,
    redirect_uri: `${config.baseUrl}/auth/apple/callback`,
    response_type: "code",
    scope: config.apple.scopes.join(" "),
    response_mode: "form_post",
    state,
  });

  return c.redirect(`${config.apple.authUrl}?${params}`);
});

// POST /auth/apple/callback - Handle Apple OAuth callback (form_post)
authRouter.post("/apple/callback", async (c) => {
  const config = getOAuthConfig();
  const body = await c.req.parseBody();
  const code = body.code as string;
  const state = body.state as string;
  const userJson = body.user as string | undefined; // Apple sends user info on first auth
  const storedState = getCookie(c, "oauth_state");

  deleteCookie(c, "oauth_state");

  if (!code || !state || state !== storedState) {
    return c.redirect("/?error=invalid_state");
  }

  try {
    // Generate client secret
    const clientSecret = await generateAppleClientSecret();

    // Exchange code for tokens
    const tokenResponse = await fetch(config.apple.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.apple.clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${config.baseUrl}/auth/apple/callback`,
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      id_token?: string;
      error?: string;
    };

    if (!tokenData.id_token) {
      console.error("Apple token error:", tokenData);
      return c.redirect("/?error=token_exchange_failed");
    }

    // Decode ID token to get user info
    const idTokenPayload = jose.decodeJwt(tokenData.id_token) as {
      sub: string;
      email?: string;
      email_verified?: boolean;
    };

    // Parse user info if provided (only on first authentication)
    let name: string | null = null;
    if (userJson) {
      try {
        const userInfo = JSON.parse(userJson) as {
          name?: { firstName?: string; lastName?: string };
        };
        if (userInfo.name) {
          name =
            [userInfo.name.firstName, userInfo.name.lastName]
              .filter(Boolean)
              .join(" ") || null;
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Find or create user
    const user = await findOrCreateOAuthUser(
      "apple",
      idTokenPayload.sub,
      idTokenPayload.email || `${idTokenPayload.sub}@privaterelay.appleid.com`,
      name,
      null // Apple doesn't provide avatar
    );

    // Create session
    const token = await createSession(user.id);
    setAuthCookie(c, token);

    return c.redirect("/");
  } catch (error) {
    console.error("Apple OAuth error:", error);
    return c.redirect("/?error=oauth_failed");
  }
});

// GET /auth/apple/callback - Handle Apple OAuth callback (GET fallback)
authRouter.get("/apple/callback", async (c) => {
  const error = c.req.query("error");
  if (error) {
    return c.redirect(`/?error=${error}`);
  }
  return c.redirect("/?error=invalid_request");
});

export { authRouter };
