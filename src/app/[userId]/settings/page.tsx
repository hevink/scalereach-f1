import { redirect } from "next/navigation";

interface SettingsPageProps {
  params: Promise<{ userId: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { userId } = await params;
  redirect(`/${userId}/settings/profile`);
}
