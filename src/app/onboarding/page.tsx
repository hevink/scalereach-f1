"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Spinner } from "@/components/ui/spinner";
import { authClient, type ExtendedUser } from "@/lib/auth-client";
import { workspaceApi } from "@/lib/api";
import { userApi } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user as ExtendedUser | undefined;

  useEffect(() => {
    if (isPending) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.isOnboarded) {
      router.replace("/workspaces");
      return;
    }

    // User is not onboarded but may already have a workspace from an interrupted onboarding.
    // In that case, just mark them as onboarded and redirect to their workspace.
    workspaceApi.getAll().then((workspaces) => {
      if (workspaces && workspaces.length > 0) {
        userApi.completeOnboarding().catch(() => { });
        router.replace(`/${workspaces[0].slug}`);
      }
    }).catch(() => {
      // If the request fails, just let them go through onboarding normally
    });
  }, [user, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // If user is not authenticated or already onboarded, don't render (will redirect)
  if (!user || user.isOnboarded) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <OnboardingForm />
    </div>
  );
}
