"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

const API_BASE_URL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001";

export default function MagicLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError("No token provided");
            return;
        }

        const exchangeToken = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/magic-login/exchange`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    setError(data.error || "Magic link is invalid or expired");
                    return;
                }

                // Cookie is now set, redirect to workspaces
                router.replace("/workspaces");
            } catch {
                setError("Failed to authenticate. Please try again.");
            }
        };

        exchangeToken();
    }, [token, router]);

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <p className="text-destructive">{error}</p>
                    <a href="/login" className="text-sm text-muted-foreground underline">
                        Go to login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
                <Spinner />
                <p className="text-sm text-muted-foreground">Signing you in...</p>
            </div>
        </div>
    );
}
