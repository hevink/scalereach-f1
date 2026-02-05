import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  projectApi,
  type ProjectResponse,
  type ProjectWithVideosResponse,
  type CreateProjectRequest,
  type UpdateProjectRequest,
} from "@/lib/api/project";
import { toast } from "sonner";

// Query keys following the design document pattern
export const projectKeys = {
  all: ["projects"] as const,
  byWorkspace: (workspaceId: string) =>
    [...projectKeys.all, "workspace", workspaceId] as const,
  byId: (id: string) => [...projectKeys.all, id] as const,
};

/**
 * Get all projects for a workspace
 * Requirements: 25.1, 30.4
 */
export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: projectKeys.byWorkspace(workspaceId),
    queryFn: () => projectApi.getProjects(workspaceId),
    enabled: !!workspaceId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Get a single project by ID with videos
 * Requirements: 26.1, 30.4
 */
export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.byId(projectId),
    queryFn: () => projectApi.getProjectById(projectId),
    enabled: !!projectId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Create a new project in a workspace
 * Requirements: 25.4, 30.1, 30.5
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: CreateProjectRequest;
    }) => projectApi.createProject(workspaceId, data),
    onSuccess: (_data, variables) => {
      // Invalidate the workspace's projects list to refetch with new project
      queryClient.invalidateQueries({
        queryKey: projectKeys.byWorkspace(variables.workspaceId),
      });
      toast.success("Project created", {
        description: "Your new project has been created successfully.",
      });
    },
    onError: (error) => {
      // Log error for debugging (Requirement 30.5)
      console.error("[useCreateProject] Failed to create project:", {
        error,
        timestamp: new Date().toISOString(),
      });
      // Show error toast (Requirement 30.1)
      toast.error("Failed to create project", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}

/**
 * Update an existing project
 * Requirements: 25.1, 30.1, 30.5
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: UpdateProjectRequest;
    }) => projectApi.updateProject(projectId, data),
    onSuccess: (data) => {
      // Update the single project cache
      queryClient.setQueryData(projectKeys.byId(data.project.id), (oldData: ProjectWithVideosResponse | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          ...data.project,
        };
      });
      // Invalidate all projects lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success("Project updated", {
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      // Log error for debugging (Requirement 30.5)
      console.error("[useUpdateProject] Failed to update project:", {
        error,
        timestamp: new Date().toISOString(),
      });
      // Show error toast (Requirement 30.1)
      toast.error("Failed to update project", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}

/**
 * Delete a project
 * Requirements: 25.1, 30.1, 30.5
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectApi.deleteProject(projectId),
    onSuccess: (_data, projectId) => {
      // Remove the project from cache
      queryClient.removeQueries({ queryKey: projectKeys.byId(projectId) });
      // Invalidate all projects lists to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success("Project deleted", {
        description: "The project has been deleted.",
      });
    },
    onError: (error) => {
      // Log error for debugging (Requirement 30.5)
      console.error("[useDeleteProject] Failed to delete project:", {
        error,
        timestamp: new Date().toISOString(),
      });
      // Show error toast (Requirement 30.1)
      toast.error("Failed to delete project", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}
