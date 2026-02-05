import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-zinc-200">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-zinc-100">
          Page Not Found
        </h2>
        <p className="mt-2 text-zinc-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link
        to="/"
        className="rounded-lg bg-orange-600 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-700"
      >
        Go Home
      </Link>
    </div>
  );
}
