"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthLayout } from "@/components/authentication/auth-layout";
import { TwoFactorVerify } from "@/components/authentication/two-factor-verify";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session?.user && !session.user.twoFactorEnabled) {
      router.replace("/workspaces");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <Spinner />
      </div>
    );
  }

  if (session?.user && !session.user.twoFactorEnabled) return null;

  return (
    <AuthLayout title="Two-factor authentication" subtitle="Enter the code from your authenticator app">
      <TwoFactorVerify />
    </AuthLayout>
  );
}
