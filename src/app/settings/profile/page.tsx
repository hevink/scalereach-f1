"use client";

import { ProfileCard } from "@/components/settings/profile-card";

export default function ProfileSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-medium text-2xl">Profile</h1>
      </div>
      <div className="flex flex-col gap-4">
        <ProfileCard />
      </div>
    </div>
  );
}
