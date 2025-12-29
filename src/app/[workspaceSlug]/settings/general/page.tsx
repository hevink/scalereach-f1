import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GeneralSettings } from "@/components/settings/workspace-settings/general-settings";
import { WorkspaceSettingsSidebar } from "@/components/settings/workspace-settings/workspace-settings-sidebar";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema";
import { auth } from "@/lib/auth";

async function getWorkspace(slug: string, userId: string) {
  const workspaceData = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      logo: workspace.logo,
      ownerId: workspace.ownerId,
      createdAt: workspace.createdAt,
    })
    .from(workspace)
    .where(eq(workspace.slug, slug))
    .limit(1);

  if (workspaceData.length === 0) {
    return null;
  }

  const ws = workspaceData[0];

  if (ws.ownerId === userId) {
    return ws;
  }

  const membership = await db
    .select({ id: workspaceMember.id })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, ws.id),
        eq(workspaceMember.userId, userId)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    return null;
  }

  return ws;
}

export default async function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    notFound();
  }

  const workspaceData = await getWorkspace(workspaceSlug, session.user.id);

  if (!workspaceData) {
    notFound();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WorkspaceSettingsSidebar workspaceSlug={workspaceSlug} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <GeneralSettings workspace={workspaceData} />
        </div>
      </main>
    </div>
  );
}
