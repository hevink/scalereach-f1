/**
 * Error Page Components
 * 404, 410, and 429 error pages for public share viewer
 * 
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5, 15.6
 */

import { IconAlertCircle, IconLock, IconClock } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * 404 - Share link not found
 */
export function ShareNotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
            <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                <IconAlertCircle className="size-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Share Link Not Found</h1>
                <p className="text-muted-foreground max-w-md">
                    This share link doesn&apos;t exist or has been removed. Please check the URL and try again.
                </p>
            </div>
            <Button>
                <Link href="https://scalereach.ai">
                    Visit ScaleReach
                </Link>
            </Button>
        </div>
    );
}

/**
 * 410 - Share link revoked
 */
export function ShareRevoked() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
            <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
                <IconLock className="size-10 text-destructive" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Link Disabled</h1>
                <p className="text-muted-foreground max-w-md">
                    This link has been disabled by the creator. The clips are no longer available for viewing.
                </p>
            </div>
            <Button>
                <Link href="https://scalereach.ai">
                    Visit ScaleReach
                </Link>
            </Button>
        </div>
    );
}

/**
 * 429 - Rate limit exceeded
 */
export function RateLimitExceeded() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
            <div className="flex size-20 items-center justify-center rounded-full bg-amber-500/10">
                <IconClock className="size-10 text-amber-600" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Too Many Requests</h1>
                <p className="text-muted-foreground max-w-md">
                    You&apos;ve made too many requests. Please wait a minute and try again.
                </p>
            </div>
            <Button
                onClick={() => window.location.reload()}
                variant="outline"
            >
                Try Again
            </Button>
        </div>
    );
}

/**
 * Generic error page
 */
export function ShareError({ message }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
            <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
                <IconAlertCircle className="size-10 text-destructive" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Something Went Wrong</h1>
                <p className="text-muted-foreground max-w-md">
                    {message || "An error occurred while loading the clips. Please try again later."}
                </p>
            </div>
            <div className="flex gap-2">
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                >
                    Reload Page
                </Button>
                <Button>
                    <Link href="https://scalereach.ai">
                        Visit ScaleReach
                    </Link>
                </Button>
            </div>
        </div>
    );
}
