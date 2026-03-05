"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { AuthLayout } from "@/components/authentication/auth-layout";
import { AuthNavigation } from "@/components/authentication/auth-navigation";
import { LoginForm } from "@/components/authentication/login/login-form";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      // Check for last used workspace
      const lastUsedWorkspace = localStorage.getItem("lastUsedWorkspace");
      if (lastUsedWorkspace) {
        router.replace(`/${lastUsedWorkspace}`);
      } else {
        router.replace("/workspaces");
      }
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue">
      <LoginForm />
      <AuthNavigation />
      <p className="text-xs text-zinc-500 text-center">
        By proceeding you acknowledge that you have read, understood and agree to our{" "}
        <Link href="/terms" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline">
          Terms and Conditions
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline">
          Privacy Policy
        </Link>
      </p>
    </AuthLayout>
  );
}
