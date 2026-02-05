"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/authentication/auth-layout";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { IconCheck, IconX } from "@tabler/icons-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verifyEmail = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/auth/verify-email?token=${token}`);
        
        if (res.ok) {
          setStatus("success");
          setTimeout(() => router.push("/login"), 3000);
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    verifyEmail();
  }, [token, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <Spinner />
      </div>
    );
  }

  if (status === "error") {
    return (
      <AuthLayout title="Verification failed" subtitle="Unable to verify your email">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10">
              <IconX className="size-6 text-red-500" />
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
            The verification link is invalid or has expired.
          </p>
          <Link href="/login">
            <Button className="w-full">Go to login</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Email verified!" subtitle="Your email has been verified">
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
            <IconCheck className="size-6 text-emerald-500" />
          </div>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
          Redirecting you to login...
        </p>
      </div>
    </AuthLayout>
  );
}
