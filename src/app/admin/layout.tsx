"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { IconShieldLock, IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
        }
        // Check if user is admin
        if (!isPending && session && (session.user as any).role !== "admin") {
            router.push("/workspaces");
        }
    }, [session, isPending, router]);

    if (isPending) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (!session || (session.user as any).role !== "admin") {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <IconShieldLock className="h-16 w-16 text-muted-foreground" />
                <h1 className="text-2xl font-semibold">Access Denied</h1>
                <p className="text-muted-foreground">You need admin privileges to access this page.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="flex h-14 items-center gap-4 px-4">
                    <Link href="/workspaces">
                        <Button variant="ghost" size="icon">
                            <IconArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
                    </div>
                </div>
            </header>
            {children}
        </div>
    );
}
