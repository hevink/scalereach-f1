"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
        By proceeding you acknowledge that you have read, understood and agree to our{" "}
        <a href="https://scalereach.ai/terms" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline">
          Terms and Conditions
        </a>{" "}
        and{" "}
        <a href="https://scalereach.ai/privacy" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline">
          Privacy Policy
        </a>
        {". "}
        <a href="https://scalereach.ai/affiliate-program-agreement" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline">
          Affiliate Agreement
        </a>
      </p>
    </AuthLayout>
  );
}
