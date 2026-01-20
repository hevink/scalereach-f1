"use client";

import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    IconArrowLeft,
    IconAlertCircle,
    IconFolder,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectDetail } from "@/components/project/project-detail";
import { useProject } from "@/hooks/useProject";

// ============================================================================
// Types
// ============================================================================

interface ProjectDetailPageProps {
    params: Promise<{
        "workspace-slug": string;
        id: string;
    }>;
}

// ============================================================================
// Loading State Component
// ============================================================================

function ProjectDetailLoading() {
    return (
        <div className="flex min-h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Spinner />
                <p className="text-sm text-muted-foreground">Loading project...</p>
            </div>
        </div>
    );
}

// ============================================================================
// Error State Component
// ============================================================================

interface ProjectDetailErrorProps {
    error: Error | null;
    onRetry?: () => void;
}

function ProjectDetailError({ error, onRetry }: ProjectDetailErrorProps) {
    return (
        <div className="flex min-h-[50vh] items-center justify-center p-4">
            <EmptyState
                icon={<IconAlertCircle className="size-6" />}
                title="Failed to load project"
                description={error?.message || "An error occurred while loading the project. Please try again."}
                action={
                    onRetry
                        ? {
                            label: "Try again",
                            onClick: onRetry,
                        }
                        : undefined
                }
            />
        </div>
    );
}

// ============================================================================
// Not Found State Component
// ============================================================================

interface ProjectNotFoundProps {
    workspaceSlug: string;
}

function ProjectNotFound({ workspaceSlug }: ProjectNotFoundProps) {
    return (
        <div className="flex min-h-[50vh] items-center justify-center p-4">
            <EmptyState
                icon={<IconFolder className="size-6" />}
                title="Project not found"
                description="The project you're looking for doesn't exist or has been deleted."
                action={{
                    label: "Go back to workspace",
                    onClick: () => window.location.href = `/${workspaceSlug}`,
                }}
            />
        </div>
    );
}

// ============================================================================
// Main Project Detail Page Component
// ============================================================================

/**
 * Project Detail Page
 * 
 * Displays project information and video grid for a specific project.
 * Handles loading and error states.
 * 
 * Route: /{workspace-slug}/projects/{id}
 * 
 * @validates Requirements 26.1
 */
export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
    const { "workspace-slug": workspaceSlug, id: projectId } = use(params);
    const router = useRouter();

    // Fetch project data
    const {
        data: project,
        isLoading,
        error,
        refetch,
    } = useProject(projectId);

    // Handle video selection - navigate to video detail page
    const handleVideoSelect = useCallback((videoId: string) => {
        router.push(`/${workspaceSlug}/videos/${videoId}`);
    }, [router, workspaceSlug]);

    // Handle add video - navigate to workspace page with upload dialog
    // For now, navigate to workspace page where upload functionality exists
    const handleAddVideo = useCallback(() => {
        // Navigate to workspace page - upload functionality is there
        // In the future, this could open a modal or navigate to a dedicated upload page
        router.push(`/${workspaceSlug}?upload=true&projectId=${projectId}`);
    }, [router, workspaceSlug, projectId]);

    // Handle back navigation
    const handleBack = useCallback(() => {
        router.push(`/${workspaceSlug}`);
    }, [router, workspaceSlug]);

    // Loading state
    if (isLoading) {
        return <ProjectDetailLoading />;
    }

    // Error state
    if (error) {
        return (
            <ProjectDetailError
                error={error as Error}
                onRetry={() => refetch()}
            />
        );
    }

    // Not found state
    if (!project) {
        return <ProjectNotFound workspaceSlug={workspaceSlug} />;
    }

    return (
        <div className="container max-w-7xl py-6 space-y-6">
            {/* Back Button */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    aria-label="Go back to workspace"
                >
                    <IconArrowLeft className="size-5" />
                </Button>
                <span className="text-sm text-muted-foreground">
                    Back to workspace
                </span>
            </div>

            {/* Project Detail Component */}
            <ProjectDetail
                projectId={projectId}
                onVideoSelect={handleVideoSelect}
                onAddVideo={handleAddVideo}
            />
        </div>
    );
}
