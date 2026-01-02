import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  MISSING_FIELDS: NextResponse.json(
    { error: "Current password and new password are required" },
    { status: 400 }
  ),
  INVALID_PASSWORD_LENGTH: NextResponse.json(
    { error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters` },
    { status: 400 }
  ),
  SAME_PASSWORD: NextResponse.json(
    { error: "New password must be different from your current password" },
    { status: 400 }
  ),
  INCORRECT_PASSWORD: NextResponse.json(
    { error: "Current password is incorrect" },
    { status: 400 }
  ),
  SERVER_ERROR: NextResponse.json(
    { error: "Failed to change password" },
    { status: 500 }
  ),
};

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, revokeOtherSessions } = body;

    if (!currentPassword || !newPassword) {
      return ERRORS.MISSING_FIELDS;
    }

    if (
      typeof newPassword !== "string" ||
      newPassword.length < MIN_PASSWORD_LENGTH ||
      newPassword.length > MAX_PASSWORD_LENGTH
    ) {
      return ERRORS.INVALID_PASSWORD_LENGTH;
    }

    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();

    if (trimmedCurrentPassword === trimmedNewPassword) {
      return ERRORS.SAME_PASSWORD;
    }

    try {
      await auth.api.changePassword({
        body: {
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
          revokeOtherSessions: revokeOtherSessions ?? false,
        },
        headers: request.headers,
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : String(authError);
      const errorLower = errorMessage.toLowerCase();
      
      if (
        errorLower.includes("incorrect") ||
        errorLower.includes("invalid password") ||
        errorLower.includes("wrong password") ||
        errorLower.includes("password mismatch") ||
        errorLower.includes("unauthorized") ||
        errorLower.includes("forbidden")
      ) {
        return ERRORS.INCORRECT_PASSWORD;
      }
      
      return NextResponse.json(
        { error: errorMessage || "Failed to change password. Please try again." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

