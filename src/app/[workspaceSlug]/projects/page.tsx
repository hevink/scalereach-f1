import { notFound } from "next/navigation";
import { requireWorkspaceAccess } from "@/lib/workspace-utils";

export const dynamic = "force-dynamic";

interface ProjectsPageProps {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { workspaceSlug } = await params;

  try {
    const access = await requireWorkspaceAccess(workspaceSlug);

    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="font-semibold text-2xl">Projects</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {access.workspace.name}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground text-sm">
            Projects content for {access.workspace.name} will be displayed here.
          </p>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
