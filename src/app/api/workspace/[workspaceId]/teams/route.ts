import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { team, workspace } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";
import {
  validateBodySize,
  validateParsedBodySize,
} from "@/lib/request-validation";
import {
  sanitizeTeamIcon,
  sanitizeTeamIdentifier,
  sanitizeTeamName,
} from "@/lib/sanitize";
import { getTeamsByWorkspaceId } from "@/lib/team-utils";
import { requireWorkspaceAccess } from "@/lib/workspace-utils";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    const workspaceData = await db
      .select({ slug: workspace.slug })
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);

    if (workspaceData.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    await requireWorkspaceAccess(workspaceData[0].slug);

    const teams = await getTeamsByWorkspaceId(workspaceId);

    return NextResponse.json({ teams });
  } catch (error) {
    safeError("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const sizeError = validateBodySize(request);
    if (sizeError) {
      return sizeError;
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    const workspaceData = await db
      .select({ slug: workspace.slug })
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);

    if (workspaceData.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    await requireWorkspaceAccess(workspaceData[0].slug);

    const body = await request.json();

    const parsedSizeError = validateParsedBodySize(body);
    if (parsedSizeError) {
      return parsedSizeError;
    }

    const { name, identifier, icon } = body;

    const sanitizedName = sanitizeTeamName(name);
    if (!sanitizedName) {
      return NextResponse.json(
        { error: "Name is required and must be 1-50 characters" },
        { status: 400 }
      );
    }

    const sanitizedIdentifier = sanitizeTeamIdentifier(identifier);
    if (
      identifier !== null &&
      identifier !== undefined &&
      !sanitizedIdentifier
    ) {
      return NextResponse.json(
        {
          error:
            "Identifier must be 1-10 characters and contain only uppercase letters and numbers",
        },
        { status: 400 }
      );
    }

    const sanitizedIcon = sanitizeTeamIcon(icon);

    if (sanitizedIdentifier) {
      const existingTeam = await db
        .select({ id: team.id })
        .from(team)
        .where(
          and(
            eq(team.workspaceId, workspaceId),
            eq(team.identifier, sanitizedIdentifier)
          )
        )
        .limit(1);

      if (existingTeam.length > 0) {
        return NextResponse.json(
          {
            error: `A team with identifier "${sanitizedIdentifier}" already exists in this workspace`,
          },
          { status: 409 }
        );
      }
    }

    const teamId = crypto.randomUUID();

    await db.insert(team).values({
      id: teamId,
      workspaceId,
      name: sanitizedName,
      identifier: sanitizedIdentifier,
      icon: sanitizedIcon,
    });

    const newTeam = await db
      .select()
      .from(team)
      .where(eq(team.id, teamId))
      .limit(1);

    return NextResponse.json({ team: newTeam[0] }, { status: 201 });
  } catch (error) {
    safeError("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
