"use client";

import { use, useState } from "react";
import { IconMail, IconTrash, IconRefresh, IconUserPlus, IconCrown, IconShield, IconUser, IconAlertTriangle, IconCopy, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useWorkspaceBySlug,
  useWorkspaceMembers,
  useWorkspaceInvitations,
  useCreateInvitation,
  useCancelInvitation,
  useResendInvitation,
  useUpdateMemberRole,
  useRemoveMember,
} from "@/hooks/useWorkspace";
import { authClient } from "@/lib/auth-client";
import { workspaceApi } from "@/lib/api/workspace";
import type { WorkspaceInvitation, WorkspaceMember } from "@/lib/api/workspace";

function getRoleIcon(role: string) {
  switch (role) {
    case "owner":
      return <IconCrown className="size-4 text-yellow-500" />;
    case "admin":
      return <IconShield className="size-4 text-blue-500" />;
    default:
      return <IconUser className="size-4 text-muted-foreground" />;
  }
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "owner":
      return "default" as const;
    case "admin":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "pending":
      return "secondary" as const;
    case "accepted":
      return "default" as const;
    case "declined":
    case "expired":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}


// Confirmation Dialog Component
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
  isLoading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {variant === "destructive" && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <IconAlertTriangle className="size-4 text-destructive" />
              </div>
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isLoading} />}>
            {cancelText}
          </DialogClose>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteMemberDialog({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const createInvitation = useCreateInvitation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    await createInvitation.mutateAsync({ workspaceId, email: email.trim(), role });
    setEmail("");
    setRole("member");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <IconUserPlus className="size-4 mr-2" />
        Invite Member
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a new member</DialogTitle>
          <DialogDescription>
            Send an invitation email to add someone to your workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => value && setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Admins can manage members and workspace settings.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createInvitation.isPending}>
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Remove Member Dialog
function RemoveMemberDialog({
  member,
  workspaceId,
  isCurrentUser,
}: {
  member: WorkspaceMember;
  workspaceId: string;
  isCurrentUser: boolean;
}) {
  const [open, setOpen] = useState(false);
  const removeMember = useRemoveMember();

  const handleConfirm = async () => {
    await removeMember.mutateAsync({ workspaceId, memberId: member.id });
    setOpen(false);
  };

  const title = isCurrentUser ? "Leave workspace?" : "Remove member?";
  const description = isCurrentUser
    ? "Are you sure you want to leave this workspace? You'll lose access to all workspace resources."
    : `Are you sure you want to remove ${member.user?.name || member.user?.email} from this workspace? They will lose access immediately.`;

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        title={isCurrentUser ? "Leave workspace" : "Remove member"}
      >
        <IconTrash className="size-4 text-destructive" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmText={isCurrentUser ? "Leave" : "Remove"}
        onConfirm={handleConfirm}
        isLoading={removeMember.isPending}
      />
    </>
  );
}


// Cancel Invitation Dialog
function CancelInvitationDialog({
  invitation,
  workspaceId,
}: {
  invitation: WorkspaceInvitation;
  workspaceId: string;
}) {
  const [open, setOpen] = useState(false);
  const cancelInvitation = useCancelInvitation();

  const handleConfirm = async () => {
    await cancelInvitation.mutateAsync({ workspaceId, invitationId: invitation.id });
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        title="Cancel invitation"
      >
        <IconTrash className="size-4 text-destructive" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Cancel invitation?"
        description={`Are you sure you want to cancel the invitation to ${invitation.email}? They won't be able to join using the existing link.`}
        confirmText="Cancel Invitation"
        onConfirm={handleConfirm}
        isLoading={cancelInvitation.isPending}
      />
    </>
  );
}

// Resend Invitation Dialog
function ResendInvitationDialog({
  invitation,
  workspaceId,
}: {
  invitation: WorkspaceInvitation;
  workspaceId: string;
}) {
  const [open, setOpen] = useState(false);
  const resendInvitation = useResendInvitation();

  const handleConfirm = async () => {
    await resendInvitation.mutateAsync({ workspaceId, invitationId: invitation.id });
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        title="Resend invitation"
      >
        <IconRefresh className="size-4" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Resend invitation?"
        description={`Send a new invitation email to ${invitation.email}? The invitation link will remain the same.`}
        confirmText="Resend"
        variant="default"
        onConfirm={handleConfirm}
        isLoading={resendInvitation.isPending}
      />
    </>
  );
}

// Copy Invite Link Button
function CopyInviteLinkButton({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async () => {
    setIsLoading(true);
    try {
      const { token } = await workspaceApi.getInvitationLink(workspaceId, invitationId);
      const inviteUrl = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Invite link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      disabled={isLoading}
      title="Copy invite link"
    >
      {isLoading ? (
        <IconRefresh className="size-4 animate-spin" />
      ) : copied ? (
        <IconCheck className="size-4 text-green-500" />
      ) : (
        <IconCopy className="size-4" />
      )}
    </Button>
  );
}

function MembersList({ workspaceId, currentUserId, currentUserRole }: { workspaceId: string; currentUserId: string; currentUserRole: string }) {
  const { data: members, isLoading } = useWorkspaceMembers(workspaceId);
  const updateRole = useUpdateMemberRole();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!members?.length) {
    return <p className="text-muted-foreground text-sm py-4">No members found.</p>;
  }

  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div className="flex flex-col divide-y">
      {members.map((member) => {
        const isCurrentUser = member.userId === currentUserId;
        const canEditRole = canManageMembers && member.role !== "owner" && !isCurrentUser;
        const canRemove = (canManageMembers && member.role !== "owner" && !isCurrentUser) ||
          (isCurrentUser && member.role !== "owner");

        return (
          <div key={member.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={member.user?.image} />
                <AvatarFallback>
                  {member.user?.name?.charAt(0) || member.user?.email?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {member.user?.name || "Unknown"}
                    {isCurrentUser && <span className="text-muted-foreground"> (you)</span>}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">{member.user?.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEditRole ? (
                <Select
                  value={member.role}
                  onValueChange={(newRole) =>
                    newRole && updateRole.mutate({ workspaceId, memberId: member.id, role: newRole })
                  }
                  disabled={updateRole.isPending}
                >
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
                  {getRoleIcon(member.role)}
                  <span className="ml-1">{member.role}</span>
                </Badge>
              )}
              {canRemove && (
                <RemoveMemberDialog
                  member={member}
                  workspaceId={workspaceId}
                  isCurrentUser={isCurrentUser}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function InvitationsList({ workspaceId, canManage }: { workspaceId: string; canManage: boolean }) {
  const { data: invitations, isLoading } = useWorkspaceInvitations(workspaceId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const pendingInvitations = invitations?.filter((inv) => inv.status === "pending") || [];

  if (!pendingInvitations.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-3">
          <IconMail className="size-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">No pending invitations</p>
        <p className="text-muted-foreground text-xs mt-1">
          Invite team members to collaborate on this workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y">
      {pendingInvitations.map((invitation) => {
        const expiresAt = new Date(invitation.expiresAt);
        const isExpiringSoon = expiresAt.getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000; // 2 days

        return (
          <div key={invitation.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <IconMail className="size-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{invitation.email}</span>
                <span className="text-muted-foreground text-xs">
                  Invited by {invitation.inviter.name} ·{" "}
                  <span className={isExpiringSoon ? "text-orange-500" : ""}>
                    Expires {expiresAt.toLocaleDateString()}
                    {isExpiringSoon && " (soon)"}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadgeVariant(invitation.role)} className="capitalize">
                {invitation.role}
              </Badge>
              {canManage && (
                <>
                  <CopyInviteLinkButton workspaceId={workspaceId} invitationId={invitation.id} />
                  <ResendInvitationDialog invitation={invitation} workspaceId={workspaceId} />
                  <CancelInvitationDialog invitation={invitation} workspaceId={workspaceId} />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MembersPage({ params }: { params: Promise<{ "workspace-slug": string }> }) {
  const { "workspace-slug": slug } = use(params);
  const { data: workspace, isLoading: isLoadingWorkspace } = useWorkspaceBySlug(slug);
  const { data: session } = authClient.useSession();

  const currentUserId = session?.user?.id || "";
  const currentUserRole = workspace?.role || "member";
  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";

  if (isLoadingWorkspace) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
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
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-2xl">Members</h1>
          <p className="text-muted-foreground text-sm">
            Manage who has access to this workspace.
          </p>
        </div>
        {canManageMembers && <InviteMemberDialog workspaceId={workspace.id} />}
      </div>

      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            People who have access to this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersList
            workspaceId={workspace.id}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        </CardContent>
      </Card>

      {canManageMembers && (
        <Card className="bg-transparent">
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Invitations that haven't been accepted yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvitationsList workspaceId={workspace.id} canManage={canManageMembers} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
