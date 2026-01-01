import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const USERNAME_REGEX = /^[a-zA-Z0-9_.]+$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  const normalizedUsername = username.trim().toLowerCase();

  if (!USERNAME_REGEX.test(normalizedUsername)) {
    return NextResponse.json({ available: false }, { status: 200 });
  }

  if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
    return NextResponse.json({ available: false }, { status: 200 });
  }

  try {
    const existingUser = await db
      .select({ username: user.username })
      .from(user)
      .where(eq(user.username, normalizedUsername))
      .limit(1)
      .then((rows) => rows[0]);

    return NextResponse.json({ available: !existingUser });
  } catch (error) {
    console.error("Error checking username availability:", error);
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 }
    );
  }
}
