"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface WorkspacePageProps {
  params: Promise<{ "workspace-slug": string }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { "workspace-slug": slug } = use(params);
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: workspace, isLoading: workspaceLoading, error } = useWorkspaceBySlug(slug);

  useEffect(() => {
    if (sessionPending || workspaceLoading) return;

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    if (error || !workspace) {
      router.replace("/");
      return;
    }
  }, [session, workspace, error, sessionPending, workspaceLoading, router]);

  if (sessionPending || workspaceLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-3xl">{workspace.name}</h1>
        {workspace.description && (
          <p className="text-lg text-muted-foreground">
            {workspace.description}
          </p>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to your workspace</CardTitle>
          <CardDescription>
            This is your workspace dashboard. More features coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Your workspace is ready to use. Start building your projects here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
