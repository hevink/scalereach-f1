import { AppearanceCard } from "@/components/settings/appearance-card";

export default function GeneralSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-medium text-2xl">General</h1>
      </div>
      <div className="flex flex-col gap-4">
        <AppearanceCard />
      </div>
    </div>
  );
}
