import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

// Logo component using the SVG directly
function ForgeLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
    >
      <defs>
        <linearGradient id="forgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <polygon
        points="50,8 88,27 88,73 50,92 12,73 12,27"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="miter"
      />
      <polygon points="28,26 72,26 68,34 28,34" fill="currentColor" />
      <polygon points="28,44 58,44 55,52 28,52" fill="currentColor" />
      <polygon points="28,62 28,74 36,74 36,52 28,52" fill="currentColor" />
    </svg>
  );
}

interface HeaderProps {
  /** Show login button. Set to false when already on login page */
  showLoginButton?: boolean;
  /** Is user authenticated? Placeholder for future auth state */
  isAuthenticated?: boolean;
}

export function Header({
  showLoginButton = true,
  isAuthenticated = false,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ForgeLogo className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight">Forge</span>
        </Link>

        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/board/api">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              {showLoginButton && (
                <Link to="/login">
                  <Button variant="default" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export { ForgeLogo };
