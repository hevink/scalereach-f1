import { pageMetadata } from "@/lib/seo";
import { WorkspaceLayoutContent } from "@/components/workspace/workspace-layout-content";

export const metadata = pageMetadata.workspace.dashboard;

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ "workspace-slug": string }>;
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { "workspace-slug": slug } = await params;

  return (
    <WorkspaceLayoutContent slug={slug}>
      {children}
    </WorkspaceLayoutContent>
  );
}
