"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthHeader } from "@/components/authentication/auth-header";
import { AuthNavigation } from "@/components/authentication/auth-navigation";
import { SignUpForm } from "@/components/authentication/signup/signup-form";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/home");
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
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-6 p-4">
        <AuthHeader />
        <SignUpForm />
        <AuthNavigation />
      </div>
    </div>
  );
}
