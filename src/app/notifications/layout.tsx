import { WorkspaceLayoutWrapper } from "@/components/dashboard/workspace-layout-wrapper";

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceLayoutWrapper>{children}</WorkspaceLayoutWrapper>;
}

