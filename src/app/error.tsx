"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950">
      <h1 className="text-9xl font-bold text-zinc-200 dark:text-zinc-800">500</h1>
      <h2 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-white">Something went wrong</h2>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">An unexpected error occurred.</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
      >
        Try again
      </button>
    </div>
  );
}
