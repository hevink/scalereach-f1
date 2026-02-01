import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.onboarding;

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
