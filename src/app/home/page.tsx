"use client";

import { IconDashboard } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <Spinner />
      </div>
    );
  }

  const isLoggedIn = !!session?.user;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 bg-white px-16 py-32 sm:items-start dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs font-semibold text-3xl text-black leading-10 tracking-tight dark:text-zinc-50">
            Welcome Home
          </h1>
          <p className="max-w-md text-lg text-zinc-600 leading-8 dark:text-zinc-400">
            {isLoggedIn
              ? "You're logged in! Access your dashboard to view your profile."
              : "Get started by logging in or creating an account."}
          </p>
        </div>
        <div className="flex flex-col gap-4 font-medium text-base sm:flex-row">
          {isLoggedIn ? (
            <Button>
              <Link className="flex items-center gap-2" href="/">
                <IconDashboard className="size-4" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="outline">
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
