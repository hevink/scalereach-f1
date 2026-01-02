import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ERRORS = {
  NO_EMAIL: NextResponse.json({ error: "Email is required" }, { status: 400 }),
  SERVER_ERROR: NextResponse.json(
    { error: "Failed to check email availability" },
    { status: 500 }
  ),
};

const RESPONSES = {
  AVAILABLE: NextResponse.json({ available: true }),
  NOT_AVAILABLE: NextResponse.json({ available: false }),
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return ERRORS.NO_EMAIL;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return RESPONSES.NOT_AVAILABLE;
  }

  try {
    const existingUser = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    return existingUser.length > 0
      ? RESPONSES.NOT_AVAILABLE
      : RESPONSES.AVAILABLE;
  } catch (error) {
    console.error("Error checking email availability:", error);
    return ERRORS.SERVER_ERROR;
  }
}