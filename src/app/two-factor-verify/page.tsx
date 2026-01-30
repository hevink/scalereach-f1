"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthLayout } from "@/components/authentication/auth-layout";
import { TwoFactorVerify } from "@/components/authentication/two-factor-verify";
import { Spinner } from "@/components/ui/spinner";

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(true);
  const [user, setUser] = useState<{ id: string; twoFactorEnabled?: boolean } | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        setUser(data.user);
        if (data.user && !data.user.twoFactorEnabled) {
          router.replace("/workspaces");
        }
      } catch (error) {
        console.error("Failed to check session:", error);
        setUser(null);
      } finally {
        setIsPending(false);
      }
    };
    checkSession();
  }, [router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <Spinner />
      </div>
    );
  }

  if (user && !user.twoFactorEnabled) return null;

  return (
    <AuthLayout title="Two-factor authentication" subtitle="Enter the code from your authenticator app">
      <TwoFactorVerify />
    </AuthLayout>
  );
}
