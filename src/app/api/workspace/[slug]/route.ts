import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlug } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  NOT_FOUND: NextResponse.json(
    { error: "Workspace not found" },
    { status: 404 }
  ),
  SERVER_ERROR: NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  ),
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionData?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const { slug } = await params;
    const userId = sessionData.user.id;

    const workspace = await getWorkspaceBySlug(slug, userId);

    if (!workspace) {
      return ERRORS.NOT_FOUND;
    }

    return NextResponse.json({ workspace }, { status: 200 });
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return ERRORS.SERVER_ERROR;
  }
}
