import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.verifyEmail;

export default function VerifyEmailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
