import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.signUp;

export default function SignUpLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
