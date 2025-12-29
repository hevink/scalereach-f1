import { notFound } from "next/navigation";
import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { requireWorkspaceAccess } from "@/lib/workspace-utils";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  try {
    const access = await requireWorkspaceAccess(workspaceSlug);

    return (
      <WorkspaceDashboard
        workspace={{
          id: access.workspace.id,
          name: access.workspace.name,
          slug: access.workspace.slug,
          description: access.workspace.description,
        }}
      />
    );
  } catch {
    notFound();
  }
}
