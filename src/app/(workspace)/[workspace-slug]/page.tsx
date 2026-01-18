"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { Spinner } from "@/components/ui/spinner";
import { YouTubeUploadForm, VideoList } from "@/components/video";

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

      <div className="grid gap-6 lg:grid-cols-2">
        <YouTubeUploadForm />
        <VideoList />
      </div>
    </div>
  );
}
