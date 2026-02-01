import { pageMetadata } from "@/lib/seo";
import { SettingsLayoutContent } from "@/components/settings/settings-layout-content";

export const metadata = pageMetadata.settings;

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return <SettingsLayoutContent>{children}</SettingsLayoutContent>;
}
