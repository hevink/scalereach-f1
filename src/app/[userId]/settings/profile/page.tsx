import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ProfileSettings } from "@/components/settings/user-settings/profile-settings/profile-settings";
import { SettingsSidebar } from "@/components/settings/user-settings/settings-sidebar";
import { auth } from "@/lib/auth";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/home");
  }

  if (session.user.id !== userId) {
    notFound();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SettingsSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <ProfileSettings />
        </div>
      </main>
    </div>
  );
}
