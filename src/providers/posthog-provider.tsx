"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Initialize PostHog only on client side
if (typeof window !== "undefined") {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false, // We capture manually for better control
        capture_pageleave: true,
        autocapture: true,
    });
}

function PostHogPageViewInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname) {
            let url = window.origin + pathname;
            if (searchParams?.toString()) {
                url = url + `?${searchParams.toString()}`;
            }
            posthog.capture("$pageview", { $current_url: url });
        }
    }, [pathname, searchParams]);

    return null;
}

function PostHogPageView() {
    return (
        <Suspense fallback={null}>
            <PostHogPageViewInner />
        </Suspense>
    );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    return (
        <PHProvider client={posthog}>
            <PostHogPageView />
            {children}
        </PHProvider>
    );
}

// Export posthog instance for manual event tracking
export { posthog };
