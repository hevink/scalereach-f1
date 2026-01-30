import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950">
      <h1 className="text-9xl font-bold text-zinc-200 dark:text-zinc-800">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-white">Page not found</h2>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">The page you're looking for doesn't exist.</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
      >
        Go home
      </Link>
    </div>
  );
}
