import { redirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata.pricing;

/**
 * Public /pricing route - exports unique SEO metadata,
 * then redirects unauthenticated visitors to sign-up.
 * Authenticated users are handled client-side in the workspace pricing page.
 */
export default function PublicPricingPage() {
    redirect("/sign-up");
}
