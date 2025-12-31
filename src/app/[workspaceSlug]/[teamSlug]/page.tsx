import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface TeamPageProps {
  params: Promise<{ workspaceSlug: string; teamSlug: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { workspaceSlug, teamSlug } = await params;
  redirect(`/${workspaceSlug}/${teamSlug}/issues`);
}
