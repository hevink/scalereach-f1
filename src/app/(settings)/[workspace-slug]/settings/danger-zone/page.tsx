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
  const [creditsWarning, setCreditsWarning] = useState<{ credits: number; message: string } | null>(null);
  const deleteWorkspace = useDeleteWorkspace();

  const isConfirmed = confirmText === workspace.name;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    try {
      // First try without force - this will check for credits
      await deleteWorkspace.mutateAsync({ slug: workspace.slug, force: !!creditsWarning });
      setOpen(false);
      setCreditsWarning(null);
      onSuccess();
    } catch (error: any) {
      // Check if this is a credits confirmation error
      if (error.response?.data?.requiresConfirmation) {
        setCreditsWarning({
          credits: error.response.data.credits,
          message: error.response.data.message,
        });
        return;
      }
      // Other errors are handled by the hook
    }
  };

  const handleClose = () => {
    setOpen(false);
    setConfirmText("");
    setCreditsWarning(null);
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <IconTrash className="size-4 mr-2" />
        Delete Workspace
      </Button>
      <Dialog open={open} onOpenChange={handleClose}>
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
            {creditsWarning ? (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ This workspace has {creditsWarning.credits} credits that will be permanently lost!
                </p>
                <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
                  Credits cannot be recovered or transferred. Click "Delete Workspace" again to confirm.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">
                  All projects, members, credits, and invitations will be permanently removed.
                </p>
              </div>
            )}
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
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isConfirmed || deleteWorkspace.isPending}
              loading={deleteWorkspace.isPending}
            >
              {creditsWarning ? "Confirm Delete (Lose Credits)" : "Delete Workspace"}
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
