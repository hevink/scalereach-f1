"use client";

import { IconBuilding } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role: "owner" | "admin" | "member";
}

function _WorkspaceCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function WorkspacesPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    const fetchWorkspaces = async () => {
      try {
        const response = await fetch("/api/workspace/list");
        if (response.ok) {
          const data = await response.json();
          setWorkspaces(data.workspaces || []);
        }
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, [session, isSessionPending, router]);

  const handleWorkspaceSelect = (slug: string) => {
    router.push(`/${slug}`);
  };

  if (isSessionPending || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No workspaces</CardTitle>
            <CardDescription>
              You don't have any workspaces yet. Create one to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => router.push("/onboarding")}
            >
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 font-sans">
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-semibold text-3xl">Select a workspace</h1>
          <p className="text-lg text-muted-foreground">
            Choose a workspace to continue
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Card
              className="cursor-pointer transition-colors hover:bg-accent"
              key={workspace.id}
              onClick={() => handleWorkspaceSelect(workspace.slug)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary/10">
                    <IconBuilding className="size-5 text-primary" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <CardTitle className="font-[490] text-base">
                      {workspace.name}
                    </CardTitle>
                    {workspace.description && (
                      <CardDescription className="text-xs">
                        {workspace.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs capitalize">
                    {workspace.role}
                  </span>
                  <Button size="sm" variant="ghost">
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
