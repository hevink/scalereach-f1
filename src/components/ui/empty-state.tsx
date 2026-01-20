"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
} from "@/components/ui/empty";

/**
 * EmptyState component props
 * Provides a simpler API for common empty state patterns
 * 
 * @validates Requirements 28.1, 28.2, 28.3, 28.4
 */
export interface EmptyStateProps {
    /** Icon to display in the empty state */
    icon: React.ReactNode;
    /** Title text for the empty state */
    title: string;
    /** Description text explaining the empty state */
    description: string;
    /** Optional action button configuration */
    action?: {
        /** Button label text */
        label: string;
        /** Click handler for the action button */
        onClick: () => void;
    };
    /** Optional additional className for the container */
    className?: string;
}

/**
 * EmptyState - A reusable empty state component with icon, title, description, and optional action
 * 
 * This component wraps the lower-level Empty components to provide a simpler API
 * for common empty state patterns throughout the application.
 * 
 * @example
 * // Empty state for no projects (Requirement 28.1)
 * <EmptyState
 *   icon={<FolderIcon className="size-6" />}
 *   title="No projects yet"
 *   description="Create your first project to get started with video clipping."
 *   action={{
 *     label: "Create Project",
 *     onClick: () => handleCreateProject()
 *   }}
 * />
 * 
 * @example
 * // Empty state for no videos (Requirement 28.2)
 * <EmptyState
 *   icon={<VideoIcon className="size-6" />}
 *   title="No videos in this project"
 *   description="Upload a video or paste a YouTube URL to get started."
 *   action={{
 *     label: "Upload Video",
 *     onClick: () => handleUpload()
 *   }}
 * />
 * 
 * @example
 * // Empty state for no clips (Requirement 28.3)
 * <EmptyState
 *   icon={<ScissorsIcon className="size-6" />}
 *   title="No clips detected"
 *   description="We couldn't find any viral-worthy clips in this video. Try uploading a different video."
 * />
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <Empty className={className}>
            <EmptyHeader>
                <EmptyMedia variant="icon">{icon}</EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
            {action && (
                <EmptyContent>
                    <Button onClick={action.onClick}>{action.label}</Button>
                </EmptyContent>
            )}
        </Empty>
    );
}
