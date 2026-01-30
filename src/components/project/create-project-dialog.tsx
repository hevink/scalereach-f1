"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/useProject";

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

const projectSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} character`)
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
    )
    .optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onSuccess?: (project: { id: string; name: string }) => void;
}

/**
 * CreateProjectDialog Component
 *
 * A dialog for creating a new project within a workspace.
 *
 * @validates Requirement 25.4 - Create project button
 */
export function CreateProjectDialog({
  open,
  onOpenChange,
  workspaceId,
  onSuccess,
}: CreateProjectDialogProps) {
  const resetRef = useRef<
    ReturnType<typeof useForm<ProjectFormData>>["reset"] | null
  >(null);

  const createProjectMutation = useCreateProject();
  const isLoading = createProjectMutation.isPending;

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "onChange",
  });

  resetRef.current = form.reset;

  // Reset form when dialog closes
  useEffect(() => {
    if (!open && resetRef.current) {
      resetRef.current();
    }
  }, [open]);

  const onSubmit = useCallback(
    async (data: ProjectFormData) => {
      createProjectMutation.mutate(
        {
          workspaceId,
          data: {
            name: data.name.trim(),
            description: data.description?.trim() || undefined,
          },
        },
        {
          onSuccess: (result) => {
            onOpenChange(false);
            onSuccess?.({
              id: result.project.id,
              name: result.project.name,
            });
          },
        }
      );
    },
    [workspaceId, onOpenChange, onSuccess, createProjectMutation]
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Create a new project to organize your videos and clips into a
            collection.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Field>
              <FieldLabel>
                <span>Name</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("name")}
                  aria-invalid={form.formState.errors.name ? "true" : "false"}
                  placeholder="My Project..."
                  autoFocus
                />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>
                <span>Description</span>
                <span className="font-normal text-muted-foreground">
                  {" "}
                  (optional)
                </span>
              </FieldLabel>
              <FieldContent>
                <Textarea
                  {...form.register("description")}
                  aria-invalid={
                    form.formState.errors.description ? "true" : "false"
                  }
                  placeholder="A brief description of your project..."
                  rows={3}
                />
                <FieldError errors={[form.formState.errors.description]} />
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isLoading}
              loading={isLoading}
              type="submit"
            >
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
