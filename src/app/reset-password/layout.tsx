import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.resetPassword;

export default function ResetPasswordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
