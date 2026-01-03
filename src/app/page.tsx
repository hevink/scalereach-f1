import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { auth } from "@/lib/auth";
import { getUserWorkspaces } from "@/lib/workspace";

export default async function HomePage() {
  const headersList = await headers();
  const sessionData = await auth.api.getSession({
    headers: headersList,
  });

  if (!sessionData?.user) {
    redirect("/home");
  }

  const userId = sessionData.user.id;

  // Fetch isOnboarded status from database
  const [userData] = await db
    .select({ isOnboarded: user.isOnboarded })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  // Check if user is onboarded
  if (!userData?.isOnboarded) {
    redirect("/onboarding");
  }

  // Get user's workspaces
  const workspaces = await getUserWorkspaces(userId);

  if (workspaces.length === 0) {
    redirect("/onboarding");
  }

  if (workspaces.length === 1) {
    // Redirect to the single workspace
    redirect(`/${workspaces[0].slug}`);
  }

  // Multiple workspaces - show selector page
  redirect("/workspaces");
}
