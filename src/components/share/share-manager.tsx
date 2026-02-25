"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconShare2, IconLoader2, IconLock, IconWorld } from "@tabler/icons-react";
import { ShareModal, ShareAnalytics } from "./share-modal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import { UpgradeDialog } from "@/components/pricing/upgrade-dialog";
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

export interface ShareManagerProps {
    videoId: string;
    workspaceSlug: string;
    clipCount: number;
    userPlan: "free" | "starter" | "pro" | "agency";
}

interface CreateShareResponse {
    success: boolean;
    shareToken: string;
    shareUrl: string;
    createdAt: string;
    analytics: {
        totalViews: number;
        totalDownloads: number;
    };
}

interface ShareStatusResponse {
    exists: boolean;
    shareToken?: string;
    shareUrl?: string;
    createdAt?: string;
}

export function ShareManager({
    videoId,
    workspaceSlug,
    clipCount,
    userPlan,
}: ShareManagerProps) {
    const router = useRouter();
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [analytics, setAnalytics] = useState<ShareAnalytics>({
        totalViews: 0,
        uniqueViewers: 0,
        totalDownloads: 0,
    });

    const isPro = userPlan === "pro" || userPlan === "agency";
    const hasClips = clipCount > 0;
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

    const handleCreateShare = async () => {
        if (!isPro) {
            setShowUpgradeDialog(true);
            return;
        }

        if (!hasClips) {
            toast.error("No clips available", {
                description: "Generate clips before creating a share link.",
            });
            return;
        }

        // If we already have a share link in state, go straight to modal
        if (shareLink) {
            setIsModalOpen(true);
            return;
        }

        // Check if share link already exists on the server
        setIsLoading(true);
        try {
            const { data } = await api.get<ShareStatusResponse>(
                `/api/videos/${videoId}/share`
            );

            if (data.exists && data.shareUrl) {
                // Already public — skip confirmation, open modal directly
                setShareLink(data.shareUrl);
                setIsModalOpen(true);
            } else {
                // Not public yet — ask for confirmation
                setShowConfirmDialog(true);
            }
        } catch {
            // If check fails, fall back to showing confirmation
            setShowConfirmDialog(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmShare = async () => {
        setIsCreating(true);

        try {
            const response = await api.post<CreateShareResponse>(
                `/api/videos/${videoId}/share`
            );

            if (response.data.success) {
                setShareLink(response.data.shareUrl);
                setAnalytics({
                    totalViews: response.data.analytics.totalViews,
                    uniqueViewers: 0,
                    totalDownloads: response.data.analytics.totalDownloads,
                });
                setShowConfirmDialog(false);
                setIsModalOpen(true);
            }
        } catch (error: any) {
            console.error("Failed to create share link:", error);
            setShowConfirmDialog(false);

            if (error.response?.status === 403) {
                toast.error("Pro plan required", {
                    description: error.response.data.message || "Upgrade to Pro to share clips.",
                    action: {
                        label: "Upgrade",
                        onClick: () => router.push(`/${workspaceSlug}/pricing`),
                    },
                });
            } else {
                toast.error("Failed to create share link", {
                    description: error.response?.data?.message || "Please try again later.",
                });
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleRevokeLink = async () => {
        setIsLoading(true);

        try {
            await api.delete(`/api/videos/${videoId}/share`);
            setShareLink(null);
            setIsModalOpen(false);
            toast.success("Share link revoked successfully");
        } catch (error: any) {
            console.error("Failed to revoke share link:", error);
            toast.error("Failed to revoke share link", {
                description: error.response?.data?.message || "Please try again later.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerateLink = async () => {
        setIsLoading(true);

        try {
            const response = await api.post<CreateShareResponse>(
                `/api/videos/${videoId}/share/regenerate`
            );

            if (response.data.success) {
                setShareLink(response.data.shareUrl);
                setAnalytics({
                    totalViews: 0,
                    uniqueViewers: 0,
                    totalDownloads: 0,
                });
                toast.success("Share link regenerated successfully!");
            }
        } catch (error: any) {
            console.error("Failed to regenerate share link:", error);
            toast.error("Failed to regenerate share link", {
                description: error.response?.data?.message || "Please try again later.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getButtonProps = () => {
        if (!isPro) {
            return {
                disabled: false,
                tooltip: "Pro feature - Upgrade to share clips",
                icon: <IconLock className="size-4" />,
                label: "Share Clips (Pro)",
            };
        }

        if (!hasClips) {
            return {
                disabled: true,
                tooltip: "Generate clips before sharing",
                icon: <IconShare2 className="size-4" />,
                label: "Share Clips",
            };
        }

        return {
            disabled: false,
            tooltip: "Share your clips publicly",
            icon: isLoading ? <IconLoader2 className="size-4 animate-spin" /> : <IconShare2 className="size-4" />,
            label: "Share Clips",
        };
    };

    const buttonProps = getButtonProps();

    return (
        <>
            <Button
                variant={isPro ? "default" : "outline"}
                className="gap-2"
                onClick={handleCreateShare}
                disabled={buttonProps.disabled || isLoading}
                title={buttonProps.tooltip}
            >
                {buttonProps.icon}
                {buttonProps.label}
            </Button>

            {/* Confirmation Dialog — only shown for first-time share */}
            <AlertDialog open={showConfirmDialog} onOpenChange={(open) => !isCreating && setShowConfirmDialog(open)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <IconWorld className="size-5 text-primary" />
                            Make Clips Public?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will generate a public link that anyone can use to view and download your clips — no sign-in required. You can revoke access anytime.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCreating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmShare} disabled={isCreating} className="gap-2">
                            {isCreating && <IconLoader2 className="size-4 animate-spin" />}
                            {isCreating ? "Creating..." : "Yes, Make Public"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {shareLink && (
                <ShareModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    shareUrl={shareLink}
                    analytics={analytics}
                    onRevoke={handleRevokeLink}
                    onRegenerate={handleRegenerateLink}
                    isLoading={isLoading}
                />
            )}

            <UpgradeDialog
                open={showUpgradeDialog}
                onOpenChange={setShowUpgradeDialog}
                workspaceSlug={workspaceSlug}
                feature="Share Clips"
            />
        </>
    );
}
