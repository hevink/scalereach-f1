"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceBySlug, useDeleteWorkspace } from "@/hooks/useWorkspace";
import { authClient } from "@/lib/auth-client";

function DeleteWorkspaceDialog({
  workspace,
  onSuccess,
}: {
  workspace: { id: string; name: string; slug: string };
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const deleteWorkspace = useDeleteWorkspace();

  const isConfirmed = confirmText === workspace.name;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    try {
      await deleteWorkspace.mutateAsync(workspace.slug);
      toast.success("Workspace deleted successfully");
      setOpen(false);
      onSuccess();
    } catch {
      toast.error("Failed to delete workspace");
    }
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <IconTrash className="size-4 mr-2" />
        Delete Workspace
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <IconAlertTriangle className="size-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Delete workspace?</DialogTitle>
                <DialogDescription className="mt-1">
                  This action cannot be undone. This will permanently delete the workspace and all its data.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                All projects, members, and invitations will be permanently removed.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm">
                Type <span className="font-semibold">{workspace.name}</span> to confirm
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={workspace.name}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isConfirmed || deleteWorkspace.isPending}
              loading={deleteWorkspace.isPending}
            >
              Delete Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function DangerZonePage({ params }: { params: Promise<{ "workspace-slug": string }> }) {
  const { "workspace-slug": slug } = use(params);
  const router = useRouter();
  const { data: workspace, isLoading } = useWorkspaceBySlug(slug);
  const { data: session } = authClient.useSession();

  const isOwner = workspace?.role === "owner";

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-medium text-2xl">Workspace not found</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-medium text-2xl">Danger Zone</h1>
        <p className="text-muted-foreground text-sm">
          Irreversible and destructive actions for this workspace.
        </p>
      </div>

      <Card className="border-destructive/50 bg-transparent">
        <CardHeader>
          <CardTitle className="text-destructive">Delete Workspace</CardTitle>
          <CardDescription>
            Permanently delete this workspace and all of its data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isOwner ? (
            <DeleteWorkspaceDialog
              workspace={workspace}
              onSuccess={() => router.push("/workspaces")}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                Only the workspace owner can delete this workspace.
              </p>
              <Button variant="destructive" disabled>
                <IconTrash className="size-4 mr-2" />
                Delete Workspace
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
