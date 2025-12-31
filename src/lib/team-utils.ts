import { and, eq, or } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { team, workspace } from "@/db/schema";
import { getSessionSafe } from "@/lib/auth-utils";
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

export const getTeamById = cache(
  async (
    teamId: string
  ): Promise<{
    id: string;
    workspaceId: string;
    name: string;
    identifier: string | null;
    icon: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null> => {
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
);

export async function requireTeamAccess(teamId: string): Promise<TeamAccess> {
  const session = await getSessionSafe();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const result = await db
    .select({
      id: team.id,
      workspaceId: team.workspaceId,
      name: team.name,
      identifier: team.identifier,
      icon: team.icon,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      workspaceSlug: workspace.slug,
      workspaceOwnerId: workspace.ownerId,
    })
    .from(team)
    .innerJoin(workspace, eq(team.workspaceId, workspace.id))
    .where(eq(team.id, teamId))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Team not found");
  }

  const data = result[0];

  const workspaceAccess = await requireWorkspaceAccess(data.workspaceSlug);

  return {
    team: {
      id: data.id,
      workspaceId: data.workspaceId,
      name: data.name,
      identifier: data.identifier,
      icon: data.icon,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
    workspaceRole: workspaceAccess.role,
  };
}

export const getTeamsByWorkspaceId = cache(
  async (
    workspaceId: string,
    limit = 100
  ): Promise<
    Array<{
      id: string;
      name: string;
      identifier: string | null;
      icon: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>
  > => {
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
      .where(eq(team.workspaceId, workspaceId))
      .orderBy(team.createdAt)
      .limit(limit);

    return teams;
  }
);

export const getTeamByWorkspaceSlugAndIdentifier = cache(
  async (
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
  } | null> => {
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
      .innerJoin(workspace, eq(team.workspaceId, workspace.id))
      .where(
        and(
          eq(workspace.slug, workspaceSlug),
          or(eq(team.identifier, teamIdentifier), eq(team.id, teamIdentifier))
        )
      )
      .limit(1);

    return result[0] || null;
  }
);

export async function requireTeamAccessBySlug(
  workspaceSlug: string,
  teamIdentifier: string
): Promise<TeamAccess> {
  const session = await getSessionSafe();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const [workspaceAccess, teamData] = await Promise.all([
    requireWorkspaceAccess(workspaceSlug),
    getTeamByWorkspaceSlugAndIdentifier(workspaceSlug, teamIdentifier),
  ]);

  if (!teamData) {
    throw new Error("Team not found");
  }

  if (teamData.workspaceId !== workspaceAccess.workspace.id) {
    throw new Error("Team not found");
  }

  return {
    team: teamData,
    workspaceRole: workspaceAccess.role,
  };
}
