"use client";

import Link from "next/link";
import { AuthLayout } from "@/components/authentication/auth-layout";
import { AuthNavigation } from "@/components/authentication/auth-navigation";
import { SignUpForm } from "@/components/authentication/signup/signup-form";

export default function SignUpPage() {
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
