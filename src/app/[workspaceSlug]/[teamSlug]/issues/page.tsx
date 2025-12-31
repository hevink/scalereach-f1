import { notFound } from "next/navigation";
import { requireTeamAccessBySlug } from "@/lib/team-utils";

export const dynamic = "force-dynamic";

interface TeamIssuesPageProps {
  params: Promise<{ workspaceSlug: string; teamSlug: string }>;
}

export default async function TeamIssuesPage({
  params,
}: TeamIssuesPageProps) {
  const { workspaceSlug, teamSlug } = await params;

  try {
    const access = await requireTeamAccessBySlug(workspaceSlug, teamSlug);

    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          {access.team.icon && (
            <span className="text-2xl">{access.team.icon}</span>
          )}
          <div>
            <h1 className="font-semibold text-2xl">{access.team.name}</h1>
            <p className="text-muted-foreground text-sm">
              {access.team.identifier && (
                <span className="font-mono">{access.team.identifier}</span>
              )}
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-medium text-lg mb-4">Issues</h2>
          <p className="text-muted-foreground text-sm">
            Issues for this team will be displayed here.
          </p>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}

