import { notFound } from "next/navigation";
import { GeneralSettings } from "@/components/settings/workspace-settings/general-settings";
import { requireWorkspaceAccess } from "@/lib/workspace-utils";

export const dynamic = "force-dynamic";

export default async function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  try {
    const access = await requireWorkspaceAccess(workspaceSlug);

    return (
      <div className="mx-auto max-w-xl p-6">
        <GeneralSettings
          workspace={{
            id: access.workspace.id,
            name: access.workspace.name,
            slug: access.workspace.slug,
            description: access.workspace.description,
            logo: access.workspace.logo,
          }}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
