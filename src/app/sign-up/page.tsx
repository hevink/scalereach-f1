"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { AuthLayout } from "@/components/authentication/auth-layout";
import { AuthNavigation } from "@/components/authentication/auth-navigation";
import { SignUpForm } from "@/components/authentication/signup/signup-form";
import { Spinner } from "@/components/ui/spinner";

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/workspaces");
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
    <AuthLayout title="Create your account" subtitle="Get started with ScaleReach for free">
      <SignUpForm />
      <AuthNavigation />
      <p className="text-xs text-zinc-500 text-center">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline">
          Privacy Policy
        </Link>
      </p>
    </AuthLayout>
  );
}
