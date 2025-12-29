"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";

export default function RootPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isPending || isRedirecting) {
      return;
    }

    if (!session) {
      router.push("/home");
      return;
    }

    const lastWorkspace = localStorage.getItem("lastWorkspace");

    if (lastWorkspace) {
      setIsRedirecting(true);
      router.push(`/${lastWorkspace}`);
      return;
    }

    setIsRedirecting(true);

    fetch("/api/workspace/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.workspaces && data.workspaces.length > 0) {
          const firstWorkspace = data.workspaces[0];
          localStorage.setItem("lastWorkspace", firstWorkspace.slug);
          localStorage.setItem("currentWorkspaceId", firstWorkspace.id);
          router.push(`/${firstWorkspace.slug}`);
        } else {
          router.push("/onboarding");
        }
      })
      .catch(() => {
        router.push("/onboarding");
      });
  }, [session, isPending, router, isRedirecting]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Spinner />
      <p className="font-[450] text-muted-foreground text-sm">
        Setting up your workspace
      </p>
    </div>
  );
}
