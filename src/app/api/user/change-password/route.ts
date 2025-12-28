import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { db } from "@/db";
import { account } from "@/db/schema";
import { getSessionSafe } from "@/lib/auth-utils";

const MIN_PASSWORD_LENGTH = 8;

export async function PATCH(request: Request) {
  try {
    const session = await getSessionSafe();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Current password is required" },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from your current password" },
        { status: 400 }
      );
    }

    const userAccount = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, "credential")
        )
      )
      .limit(1);

    if (userAccount.length === 0) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    const storedPassword = userAccount[0].password;
    if (!storedPassword) {
      return NextResponse.json(
        { error: "Password account not found. You may be using social login." },
        { status: 400 }
      );
    }

    const isPasswordValid = await verifyPassword({
      hash: storedPassword,
      password: currentPassword,
    });

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await db
      .update(account)
      .set({ password: hashedPassword })
      .where(eq(account.id, userAccount[0].id));

    return NextResponse.json(
      { success: true, message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

