"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

interface ReferralPageProps {
    params: Promise<{ username: string }>;
}

export default function ReferralPage({ params }: ReferralPageProps) {
    const { username } = use(params);
    const router = useRouter();

    useEffect(() => {
        // Fix #6: Only set ref if no existing valid referral — prevent last-click hijack
        if (username) {
            const existingRef = localStorage.getItem("ref");
            const existingTs = localStorage.getItem("ref_ts");
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            const hasValidExistingRef =
                existingRef &&
                existingTs &&
                Date.now() - parseInt(existingTs) < thirtyDays;

            if (!hasValidExistingRef) {
                localStorage.setItem("ref", username);
                localStorage.setItem("ref_ts", Date.now().toString());
            }
        }

        // Redirect to signup page
        router.replace("/sign-up");
    }, [username, router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Spinner />
                <p className="text-muted-foreground text-sm">Redirecting...</p>
            </div>
        </div>
    );
}
