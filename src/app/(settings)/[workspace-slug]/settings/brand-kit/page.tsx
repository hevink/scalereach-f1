"use client";

import { use } from "react";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { LazyBrandKitManager, BrandKitManagerSkeleton } from "@/components/lazy";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconRefresh, IconPalette } from "@tabler/icons-react";

interface BrandKitSettingsPageProps {
    params: Promise<{ "workspace-slug": string }>;
}

/**
 * Brand Kit Settings Page
 *
 * Route: /{workspace-slug}/settings/brand-kit
 *
 * This page displays the BrandKitManager component for managing
 * brand assets including logos, colors, and fonts.
 *
 * Features:
 * - Displays brand kit manager component
 * - Handles loading states with skeleton UI
 * - Handles error states with retry option
 *
 * @validates Requirements 18.1, 19.1, 20.1, 21.1
 */
export default function BrandKitSettingsPage({
    params,
}: BrandKitSettingsPageProps) {
    const { "workspace-slug": slug } = use(params);
    const {
        data: workspace,
        isLoading: workspaceLoading,
        isError: workspaceError,
        error,
        refetch,
    } = useWorkspaceBySlug(slug);

    // Loading state
    if (workspaceLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                </div>
                <BrandKitManagerSkeleton />
            </div>
        );
    }

    // Error state
    if (workspaceError || !workspace) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="font-medium text-2xl">Brand Kit</h1>
                    <p className="text-muted-foreground text-sm">
                        Customize your brand assets for video exports
                    </p>
                </div>
                <Card className="border-destructive/50">
                    <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
                        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                            <IconPalette className="size-8 text-destructive" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-medium text-lg">Failed to load workspace</h3>
                            <p className="text-muted-foreground text-sm">
                                {error instanceof Error
                                    ? error.message
                                    : "Unable to load workspace data. Please try again."}
                            </p>
                        </div>
                        <Button onClick={() => refetch()} variant="outline">
                            <IconRefresh className="mr-2 size-4" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="font-medium text-2xl">Brand Kit</h1>
                <p className="text-muted-foreground text-sm">
                    Customize your brand assets for video exports
                </p>
            </div>
            {/* @validates Requirements 35.1, 35.2 - Lazy loaded for code splitting */}
            <LazyBrandKitManager workspaceId={workspace.id} />
        </div>
    );
}
