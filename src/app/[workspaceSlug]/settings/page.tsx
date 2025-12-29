import { redirect } from "next/navigation";
import { Suspense } from "react";

async function WorkspaceSettingsRedirect({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  redirect(`/${workspaceSlug}/settings/general`);
  return null;
}

export default function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  return (
    <Suspense>
      <WorkspaceSettingsRedirect params={params} />
    </Suspense>
  );
}
