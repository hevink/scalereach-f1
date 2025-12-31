import { and, eq, or } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { team, workspace } from "@/db/schema";
import { auth } from "@/lib/auth";
import { requireWorkspaceAccess } from "@/lib/workspace-utils";

export interface TeamAccess {
  team: {
    id: string;
    workspaceId: string;
    name: string;
    identifier: string | null;
    icon: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  workspaceRole: "owner" | "member";
}

export async function getTeamById(teamId: string): Promise<{
  id: string;
  workspaceId: string;
  name: string;
  identifier: string | null;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  const result = await db
    .select({
      id: team.id,
      workspaceId: team.workspaceId,
      name: team.name,
      identifier: team.identifier,
      icon: team.icon,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);

  return result[0] || null;
}

export async function requireTeamAccess(teamId: string): Promise<TeamAccess> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const teamData = await getTeamById(teamId);

  if (!teamData) {
    throw new Error("Team not found");
  }

  const workspaceData = await db
    .select({
      slug: workspace.slug,
    })
    .from(workspace)
    .where(eq(workspace.id, teamData.workspaceId))
    .limit(1);

  if (workspaceData.length === 0) {
    throw new Error("Workspace not found");
  }

  const workspaceAccess = await requireWorkspaceAccess(workspaceData[0].slug);

  return {
    team: teamData,
    workspaceRole: workspaceAccess.role,
  };
}

export async function getTeamsByWorkspaceId(workspaceId: string): Promise<
  Array<{
    id: string;
    name: string;
    identifier: string | null;
    icon: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>
> {
  const teams = await db
    .select({
      id: team.id,
      name: team.name,
      identifier: team.identifier,
      icon: team.icon,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    })
    .from(team)
    .where(eq(team.workspaceId, workspaceId));

  return teams;
}

export async function getTeamByWorkspaceSlugAndIdentifier(
  workspaceSlug: string,
  teamIdentifier: string
): Promise<{
  id: string;
  workspaceId: string;
  name: string;
  identifier: string | null;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  // First get the workspace
  const workspaceData = await db
    .select({
      id: workspace.id,
    })
    .from(workspace)
    .where(eq(workspace.slug, workspaceSlug))
    .limit(1);

  if (workspaceData.length === 0) {
    return null;
  }

  // Try to find team by identifier first, then fallback to ID
  const teamData = await db
    .select({
      id: team.id,
      workspaceId: team.workspaceId,
      name: team.name,
      identifier: team.identifier,
      icon: team.icon,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    })
    .from(team)
    .where(
      and(
        eq(team.workspaceId, workspaceData[0].id),
        or(eq(team.identifier, teamIdentifier), eq(team.id, teamIdentifier))
      )
    )
    .limit(1);

  return teamData[0] || null;
}

export async function requireTeamAccessBySlug(
  workspaceSlug: string,
  teamIdentifier: string
): Promise<TeamAccess> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // First verify workspace access
  const workspaceAccess = await requireWorkspaceAccess(workspaceSlug);

  // Then get the team
  const teamData = await getTeamByWorkspaceSlugAndIdentifier(
    workspaceSlug,
    teamIdentifier
  );

  if (!teamData) {
    throw new Error("Team not found");
  }

  // Verify the team belongs to the workspace
  if (teamData.workspaceId !== workspaceAccess.workspace.id) {
    throw new Error("Team not found");
  }

  return {
    team: teamData,
    workspaceRole: workspaceAccess.role,
  };
}
