"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YouTubeUploadForm, UppyUpload, VideoList } from "@/components/video";
import { IconBrandYoutube, IconUpload } from "@tabler/icons-react";

interface WorkspacePageProps {
  params: Promise<{ "workspace-slug": string }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { "workspace-slug": slug } = use(params);
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: workspace, isLoading: workspaceLoading, error } = useWorkspaceBySlug(slug);
  const [activeTab, setActiveTab] = useState("youtube");

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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="youtube" className="flex items-center gap-2">
              <IconBrandYoutube className="size-4" />
              YouTube URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <IconUpload className="size-4" />
              Upload File
            </TabsTrigger>
          </TabsList>
          <TabsContent value="youtube" className="mt-4">
            <YouTubeUploadForm />
          </TabsContent>
          <TabsContent value="upload" className="mt-4">
            <UppyUpload />
          </TabsContent>
        </Tabs>

        <VideoList />
      </div>
    </div>
  );
}
