/**
 * Loading Skeleton Components
 * Loading states for public viewer
 * 
 * Validates: Requirements 15.1, 29.1, 29.2, 29.3
 */

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for clips grid
 */
export function ClipsGridSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-[140px]" />
                    <Skeleton className="h-9 w-[140px]" />
                    <Skeleton className="h-9 w-12" />
                    <Skeleton className="h-9 w-32" />
                </div>
            </div>

            {/* Grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card overflow-hidden">
                        {/* Thumbnail skeleton */}
                        <Skeleton className="aspect-[9/16] w-full" />

                        {/* Content skeleton */}
                        <div className="p-4 space-y-3">
                            <div>
                                <Skeleton className="h-5 w-full mb-2" />
                                <Skeleton className="h-5 w-3/4 mb-2" />
                                <Skeleton className="h-6 w-24" />
                            </div>

                            <div className="flex gap-1">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-16" />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Skeleton className="h-9 flex-1" />
                                <Skeleton className="h-9 flex-1" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Loading skeleton for video player
 */
export function PlayerSkeleton() {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="size-16 rounded-full" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
    );
}
