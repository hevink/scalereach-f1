import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireTeamAccessBySlug } from "@/lib/team-utils";

export const dynamic = "force-dynamic";

interface TeamLayoutProps {
  children: ReactNode;
  params: Promise<{ workspaceSlug: string; teamSlug: string }>;
}

export default async function TeamLayout({
  children,
  params,
}: TeamLayoutProps) {
  const { workspaceSlug, teamSlug } = await params;

  try {
    await requireTeamAccessBySlug(workspaceSlug, teamSlug);
    return <>{children}</>;
  } catch {
    notFound();
  }
}
