"use client";

/**
 * Share Manager Component
 * Manages share link creation, display, and revocation within the authenticated clips page
 * 
 * Validates: Requirements 1.1, 1.2, 2.1, 3.2, 4.1, 4.2, 4.4, 17.1, 17.2
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconShare2, IconLoader2, IconLock, IconWorld } from "@tabler/icons-react";
import { ShareModal, ShareAnalytics } from "./share-modal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
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
    userPlan: "free" | "starter" | "pro";
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

    const isPro = userPlan === "pro";
    const hasClips = clipCount > 0;

    const handleCreateShare = async () => {
        // Check Pro plan requirement
        if (!isPro) {
            toast.error("Pro plan required", {
                description: "Clip sharing is available for Pro users only. Upgrade to share your clips publicly.",
                action: {
                    label: "Upgrade",
                    onClick: () => router.push(`/${workspaceSlug}/pricing`),
                },
            });
            return;
        }

        // Check if video has clips
        if (!hasClips) {
            toast.error("No clips available", {
                description: "Generate clips before creating a share link.",
            });
            return;
        }

        // Show confirmation dialog
        setShowConfirmDialog(true);
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
                    totalViews: 0, // Reset analytics for new link
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

    // Determine button state and tooltip
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

            {/* Confirmation Dialog */}
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
        </>
    );
}
