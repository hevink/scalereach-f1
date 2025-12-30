"use client";

import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeClientError } from "@/lib/client-logger";

interface DangerZoneProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
}

export function DangerZone({ workspace }: DangerZoneProps) {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const isNameMatch = workspaceName.trim() === workspace.name;
  const canDelete = isNameMatch && !isDeleting;

  const handleDelete = async () => {
    setIsDeleting(true);
    setShowDialog(false);

    try {
      const response = await fetch(`/api/workspace/${workspace.id}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete workspace");
      }

      toast.success("Workspace deleted successfully");
      router.push("/home");
    } catch (error) {
      safeClientError("Error deleting workspace:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete workspace"
      );
      setIsDeleting(false);
      setShowDialog(true);
    }
  };

  return (
    <>
      <div className="mx-auto flex w-full flex-col gap-6">
        <div>
          <h1 className="font-medium text-xl">Danger Zone</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Irreversible and destructive actions
          </p>
        </div>

        <Alert variant="destructive">
          <IconAlertTriangle className="size-4" />
          <AlertTitle>Delete Workspace</AlertTitle>
          <AlertDescription>
            Once you delete a workspace, there is no going back. Please be
            certain. This will permanently delete the workspace and all its
            data, including all projects, tasks, and member associations.
          </AlertDescription>
        </Alert>

        <Card className="border-destructive">
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
              <div>
                <Label
                  className="font-medium text-sm"
                  htmlFor="workspace-name-confirm"
                >
                  Type the workspace name to confirm deletion
                </Label>
                <p className="mt-1 text-muted-foreground text-xs">
                  To confirm, type <strong>{workspace.name}</strong> in the box
                  below
                </p>
              </div>
              <Input
                className="h-10"
                disabled={isDeleting}
                id="workspace-name-confirm"
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder={workspace.name}
                value={workspaceName}
              />
            </div>

            <Button
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
              disabled={!canDelete}
              onClick={() => setShowDialog(true)}
              variant="destructive"
            >
              {isDeleting ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "DELETE MY WORKSPACE"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog onOpenChange={setShowDialog} open={showDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              <strong>{workspace.name}</strong> workspace and remove all data
              associated with it, including:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>All projects and tasks</li>
                <li>All member associations</li>
                <li>All workspace settings</li>
                <li>All workspace data</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, delete workspace"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
