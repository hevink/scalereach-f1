"use client";

import { use, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
    IconArrowLeft,
    IconAlertCircle,
    IconFolder,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonVideoGrid } from "@/components/ui/skeletons";
import { ProjectDetail } from "@/components/project/project-detail";
import { useProject } from "@/hooks/useProject";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ProjectDetailPageProps {
    params: Promise<{ "workspace-slug": string; id: string }>;
}

// ============================================================================
// Loading State Component
// ============================================================================

function ProjectDetailLoading() {
    return (
        <div className="flex h-full flex-col">
            {/* Header skeleton */}
            <div className="flex items-center gap-4 border-b px-4 py-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-6 w-48" />
            </div>

            {/* Content skeleton */}
            <div className="flex-1 p-4 sm:p-6">
                {/* Project info skeleton */}
                <div className="mb-6 space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-96" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>

                {/* Controls skeleton */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-[140px]" />
                        <Skeleton className="h-9 w-[130px]" />
                    </div>
                    <Skeleton className="h-9 w-full sm:w-[120px]" />
                </div>

                {/* Video grid skeleton */}
                <SkeletonVideoGrid count={8} />
            </div>
        </div>
    );
}

// ============================================================================
// Error State Component
// ============================================================================

interface ProjectDetailErrorProps {
    error: Error | null;
    onBack: () => void;
}

function ProjectDetailError({ error, onBack }: ProjectDetailErrorProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <IconAlertCircle className="size-8 text-destructive" />
            </div>
            <div className="text-center">
                <h2 className="text-lg font-semibold">Failed to load project</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {error?.message || "An error occurred while loading the project."}
                </p>
            </div>
            <Button onClick={onBack} variant="outline">
                <IconArrowLeft className="mr-2 size-4" />
                Go Back
            </Button>
        </div>
    );
}

// ============================================================================
// Project Not Found Component
// ============================================================================

interface ProjectNotFoundProps {
    onBack: () => void;
}

function ProjectNotFound({ onBack }: ProjectNotFoundProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <IconFolder className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
                <h2 className="text-lg font-semibold">Project not found</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    The project you&apos;re looking for doesn&apos;t exist or has been deleted.
                </p>
            </div>
            <Button onClick={onBack} variant="outline">
                <IconArrowLeft className="mr-2 size-4" />
                Go Back
            </Button>
        </div>
    );
}

// ============================================================================
// Main Project Detail Page Component
// ============================================================================

/**
 * ProjectDetailPage - Displays project information and video grid
 * 
 * Features:
 * - Project info display (name, description, status)
 * - Video grid with thumbnails and status
 * - Video filtering and sorting
 * - Navigation to video detail page on video selection
 * - Add video functionality
 * - Responsive layout for desktop, tablet, and mobile
 * 
 * Route: /{workspace-slug}/projects/{id}
 * 
 * @validates Requirements 26.1, 26.2, 26.3, 26.4, 26.5, 26.6
 */
export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
    const { "workspace-slug": slug, id: projectId } = use(params);
    const router = useRouter();

    // State for upload dialog (future implementation)
    const [showUploadDialog, setShowUploadDialog] = useState(false);

    // Fetch project data for initial loading/error states
    const {
        data: project,
        isLoading: projectLoading,
        error: projectError,
    } = useProject(projectId);

    // Navigation handlers
    const handleBack = useCallback(() => {
        router.push(`/${slug}`);
    }, [router, slug]);

    const handleVideoSelect = useCallback(
        (videoId: string) => {
            router.push(`/${slug}/videos/${videoId}/clips`);
        },
        [router, slug]
    );

    const handleAddVideo = useCallback(() => {
        // Navigate to workspace page where upload UI is available
        // In the future, this could open an upload dialog directly
        router.push(`/${slug}`);
    }, [router, slug]);

    // Loading state
    if (projectLoading) {
        return <ProjectDetailLoading />;
    }

    // Error state
    if (projectError) {
        return <ProjectDetailError error={projectError as Error} onBack={handleBack} />;
    }

    // Not found state
    if (!project) {
        return <ProjectNotFound onBack={handleBack} />;
    }

    return (
        <div className="flex h-full flex-col">
            {/* Header with back button and project title */}
            <div className="flex items-center gap-4 border-b px-4 py-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    aria-label="Go back to workspace"
                >
                    <IconArrowLeft className="size-5" />
                </Button>
                <h1 className="truncate text-lg font-semibold">{project.name}</h1>
            </div>

            {/* Main content area with ProjectDetail component */}
            {/* @validates Requirement 31.3 - Mobile-friendly experience */}
            <div className="flex-1 overflow-auto p-4 sm:p-6">
                <ProjectDetail
                    projectId={projectId}
                    onVideoSelect={handleVideoSelect}
                    onAddVideo={handleAddVideo}
                    className={cn(
                        "mx-auto max-w-7xl",
                        // Responsive padding adjustments
                        "px-0 sm:px-2"
                    )}
                />
            </div>
        </div>
    );
}
