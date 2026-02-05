import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.workspaces;

export default function WorkspacesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
