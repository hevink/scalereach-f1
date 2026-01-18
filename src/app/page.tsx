"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useCurrentUser } from "@/hooks/useUser";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { Spinner } from "@/components/ui/spinner";

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();

  useEffect(() => {
    // Wait for all data to load
    if (sessionPending || userLoading || workspacesLoading) return;

    // Not logged in
    if (!session?.user) {
      router.replace("/login");
      return;
    }

    // Not onboarded
    if (!user?.isOnboarded) {
      router.replace("/onboarding");
      return;
    }

    // No workspaces
    if (!workspaces || workspaces.length === 0) {
      router.replace("/onboarding");
      return;
    }

    // Single workspace - redirect to it
    if (workspaces.length === 1) {
      router.replace(`/${workspaces[0].slug}`);
      return;
    }

    // Multiple workspaces - show selector
    router.replace("/workspaces");
  }, [session, user, workspaces, sessionPending, userLoading, workspacesLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}
