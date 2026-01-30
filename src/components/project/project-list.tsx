"use client";

import {
    IconFolder,
    IconPlus,
    IconSearch,
    IconScissors,
    IconVideo,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProject";
import { cn } from "@/lib/utils";
import type { ProjectResponse, ProjectStatus } from "@/lib/api/project";

/**
 * ProjectListProps interface
 *
 * @validates Requirements 25.1, 25.2, 25.4, 25.5
 */
export interface ProjectListProps {
    /** The workspace ID to fetch projects for */
    workspaceId: string;
    /** Callback when a project is selected */
    onProjectSelect: (projectId: string) => void;
    /** Callback when create project button is clicked */
    onCreateProject: () => void;
    /** Additional className */
    className?: string;
}

/**
 * Status badge variant mapping
 */
const statusVariants: Record<ProjectStatus, "default" | "secondary" | "outline" | "destructive"> = {
    draft: "outline",
    active: "default",
    completed: "secondary",
    archived: "destructive",
};

/**
 * Status display labels
 */
const statusLabels: Record<ProjectStatus, string> = {
    draft: "Draft",
    active: "Active",
    completed: "Completed",
    archived: "Archived",
};

/**
 * ProjectCard Component
 *
 * Displays a single project card with name, status, video count, and clip count.
 *
 * @validates Requirements 25.1, 25.2
 */
function ProjectCard({
    project,
    onClick,
}: {
    project: ProjectResponse;
    onClick: () => void;
}) {
    return (
        <Card
            className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            }}
            aria-label={`Project: ${project.name}, Status: ${statusLabels[project.status]}, ${project.videoCount ?? 0} videos, ${project.clipCount ?? 0} clips`}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1 text-base font-semibold">
                        {project.name}
                    </CardTitle>
                    <Badge variant={statusVariants[project.status]} aria-label={`Status: ${statusLabels[project.status]}`}>
                        {statusLabels[project.status]}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {project.description && (
                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                        {project.description}
                    </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5" aria-label={`${project.videoCount ?? 0} videos`}>
                        <IconVideo className="size-4" aria-hidden="true" />
                        <span>{project.videoCount ?? 0} videos</span>
                    </div>
                    <div className="flex items-center gap-1.5" aria-label={`${project.clipCount ?? 0} clips`}>
                        <IconScissors className="size-4" aria-hidden="true" />
                        <span>{project.clipCount ?? 0} clips</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * ProjectCardSkeleton Component
 *
 * Loading skeleton for project cards.
 */
function ProjectCardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                </div>
            </CardHeader>
            <CardContent>
                <Skeleton className="mb-3 h-4 w-full" />
                <Skeleton className="mb-3 h-4 w-3/4" />
                <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * NoProjectsEmptyState Component
 *
 * Displayed when no projects exist.
 * Uses the shared EmptyState component with appropriate icon, title, description, and CTA.
 * 
 * @validates Requirement 28.1
 */
function NoProjectsEmptyState({ onCreateProject }: { onCreateProject: () => void }) {
    return (
        <EmptyState
            icon={<IconFolder className="size-6" />}
            title="No projects yet"
            description="Create your first project to start organizing your videos and clips into collections."
            action={{
                label: "Create Project",
                onClick: onCreateProject,
            }}
            features={["Organize videos", "Track progress", "Collaborate with team"]}
            variant="card"
        />
    );
}

/**
 * NoSearchResults Component
 *
 * Displayed when search returns no results.
 * Uses the shared EmptyState component with search-specific messaging.
 */
function NoSearchResults({ searchQuery }: { searchQuery: string }) {
    return (
        <EmptyState
            icon={<IconSearch className="size-6" />}
            title="No projects found"
            description={`No projects match "${searchQuery}". Try a different search term or create a new project.`}
            variant="minimal"
        />
    );
}

/**
 * ProjectList Component
 *
 * A project dashboard component that displays:
 * - Project cards in a responsive grid layout (Requirement 25.1)
 * - Project name, status badge, video count, and clip count (Requirement 25.2)
 * - Create project button (Requirement 25.4)
 * - Search input for filtering projects by name (Requirement 25.5)
 *
 * @example
 * ```tsx
 * <ProjectList
 *   workspaceId="workspace-123"
 *   onProjectSelect={(projectId) => router.push(`/projects/${projectId}`)}
 *   onCreateProject={() => setShowCreateDialog(true)}
 * />
 * ```
 *
 * @validates Requirements 25.1, 25.2, 25.4, 25.5
 */
export function ProjectList({
    workspaceId,
    onProjectSelect,
    onCreateProject,
    className,
}: ProjectListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const { data: projects, isLoading, error } = useProjects(workspaceId);

    /**
     * Filter projects by search query
     * @validates Requirement 25.5
     */
    const filteredProjects = useMemo(() => {
        if (!projects) return [];
        if (!searchQuery.trim()) return projects;

        const query = searchQuery.toLowerCase().trim();
        return projects.filter(
            (project) =>
                project.name.toLowerCase().includes(query) ||
                project.description?.toLowerCase().includes(query)
        );
    }, [projects, searchQuery]);

    const hasProjects = projects && projects.length > 0;
    const hasFilteredProjects = filteredProjects.length > 0;

    return (
        <div className={cn("flex flex-col gap-6", className)} data-slot="project-list">
            {/* Header with Search and Create Button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search Input - Requirement 25.5 */}
                <div className="relative flex-1 sm:max-w-sm">
                    <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                        className="pl-9"
                        placeholder="Search projects..."
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={isLoading || !hasProjects}
                        aria-label="Search projects"
                    />
                </div>

                {/* Create Project Button - Requirement 25.4 */}
                <Button onClick={onCreateProject}>
                    <IconPlus className="mr-2 size-4" />
                    Create Project
                </Button>
            </div>

            {/* Error State */}
            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
                    <p>Failed to load projects. Please try again.</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <ProjectCardSkeleton key={`skeleton-${index}`} />
                    ))}
                </div>
            )}

            {/* Empty State - No Projects - Requirement 28.1 */}
            {!isLoading && !error && !hasProjects && (
                <NoProjectsEmptyState onCreateProject={onCreateProject} />
            )}

            {/* No Search Results */}
            {!isLoading && !error && hasProjects && !hasFilteredProjects && searchQuery && (
                <NoSearchResults searchQuery={searchQuery} />
            )}

            {/* Project Grid - Requirement 25.1 */}
            {!isLoading && !error && hasFilteredProjects && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={() => onProjectSelect(project.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProjectList;
