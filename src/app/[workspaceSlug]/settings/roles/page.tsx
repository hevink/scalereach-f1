import { Suspense } from "react";
import { RolesSettings } from "@/components/settings/workspace-settings/roles-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkspaceAccess } from "@/lib/workspace-utils";

export const dynamic = "force-dynamic";

function RolesSettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="flex flex-col gap-6">
        {[1, 2, 3].map((i) => (
          <div className="rounded-lg border p-6" key={i}>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="mb-2 h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-9 w-32" />
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-4 w-24" />
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <div className="flex items-center gap-2" key={j}>
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function RolesSettingsContent({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const access = await getWorkspaceAccess(workspaceSlug);

  if (!access) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground text-sm">
            You don't have access to this workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <RolesSettings
        userRole={access.role}
        workspace={{
          id: access.workspace.id,
          name: access.workspace.name,
          slug: access.workspace.slug,
        }}
      />
    </div>
  );
}

export default async function RolesSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  return (
    <Suspense fallback={<RolesSettingsSkeleton />}>
      <RolesSettingsContent params={params} />
    </Suspense>
  );
}
