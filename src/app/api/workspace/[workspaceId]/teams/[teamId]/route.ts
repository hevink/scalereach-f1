import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { team } from "@/db/schema";
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
import { requireTeamAccess } from "@/lib/team-utils";

function validateName(
  name: unknown
): { error: NextResponse } | { data: string } {
  const sanitizedName = sanitizeTeamName(name as string);
  if (!sanitizedName) {
    return {
      error: NextResponse.json(
        { error: "Name must be 1-50 characters" },
        { status: 400 }
      ),
    };
  }
  return { data: sanitizedName };
}

async function validateIdentifier(
  identifier: unknown,
  teamId: string
): Promise<{ error: NextResponse } | { data: string | null }> {
  const sanitizedIdentifier = sanitizeTeamIdentifier(identifier);
  if (identifier !== null && !sanitizedIdentifier) {
    return {
      error: NextResponse.json(
        {
          error:
            "Identifier must be 1-10 characters and contain only uppercase letters and numbers",
        },
        { status: 400 }
      ),
    };
  }

  if (sanitizedIdentifier) {
    const teamData = await db
      .select({ workspaceId: team.workspaceId })
      .from(team)
      .where(eq(team.id, teamId))
      .limit(1);

    if (teamData.length > 0) {
      const existingTeam = await db
        .select({ id: team.id })
        .from(team)
        .where(
          and(
            eq(team.workspaceId, teamData[0].workspaceId),
            eq(team.identifier, sanitizedIdentifier),
            ne(team.id, teamId)
          )
        )
        .limit(1);

      if (existingTeam.length > 0) {
        return {
          error: NextResponse.json(
            {
              error: `A team with identifier "${sanitizedIdentifier}" already exists in this workspace`,
            },
            { status: 409 }
          ),
        };
      }
    }
  }

  return { data: sanitizedIdentifier };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; teamId: string }> }
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

    const { teamId } = await params;

    await requireTeamAccess(teamId);

    const body = await request.json();

    const parsedSizeError = validateParsedBodySize(body);
    if (parsedSizeError) {
      return parsedSizeError;
    }

    const { name, identifier, icon } = body;

    const updateData: {
      name?: string;
      identifier?: string | null;
      icon?: string | null;
    } = {};

    if (name !== undefined) {
      const nameResult = validateName(name);
      if ("error" in nameResult) {
        return nameResult.error;
      }
      updateData.name = nameResult.data;
    }

    if (identifier !== undefined) {
      const identifierResult = await validateIdentifier(identifier, teamId);
      if ("error" in identifierResult) {
        return identifierResult.error;
      }
      updateData.identifier = identifierResult.data;
    }

    if (icon !== undefined) {
      updateData.icon = sanitizeTeamIcon(icon);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await db.update(team).set(updateData).where(eq(team.id, teamId));

    const updatedTeam = await db
      .select()
      .from(team)
      .where(eq(team.id, teamId))
      .limit(1);

    return NextResponse.json({ team: updatedTeam[0] });
  } catch (error) {
    safeError("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; teamId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    await requireTeamAccess(teamId);

    await db.delete(team).where(eq(team.id, teamId));

    return NextResponse.json({ success: true });
  } catch (error) {
    safeError("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
