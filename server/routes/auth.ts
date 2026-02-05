import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, users, sessions } from "@db/index";
import { eq, and } from "drizzle-orm";
import * as argon2 from "argon2";
import { SignJWT } from "jose";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { randomBytes } from "crypto";

const authRouter = new Hono();

// JWT secret (use env var in production)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "forge-dev-secret-change-in-production"
);
const JWT_EXPIRY = "7d";
const COOKIE_NAME = "forge_session";

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

  const token = await new SignJWT({ sub: userId })
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

export { authRouter };
