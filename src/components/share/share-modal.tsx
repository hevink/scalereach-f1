"use client";

/**
 * Share Modal Component
 * Displays share link, analytics, and management actions in a modal dialog
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 4.1, 4.5, 18.1, 18.2, 18.3, 18.4
 */

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconEye, IconDownload, IconTrash, IconRefresh, IconAlertCircle, IconLoader2 } from "@tabler/icons-react";
import { CopyInterface } from "./copy-interface";
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

export interface ShareAnalytics {
    totalViews: number;
    uniqueViewers: number;
    totalDownloads: number;
    viewTrend?: Array<{
        date: string;
        views: number;
        uniqueViewers: number;
    }>;
}

export interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareUrl: string;
    analytics: ShareAnalytics;
    onRevoke: () => Promise<void>;
    onRegenerate: () => Promise<void>;
    isLoading: boolean;
}

export function ShareModal({
    isOpen,
    onClose,
    shareUrl,
    analytics,
    onRevoke,
    onRegenerate,
    isLoading,
}: ShareModalProps) {
    const [showRevokeDialog, setShowRevokeDialog] = useState(false);
    const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const handleRevoke = async () => {
        setIsRevoking(true);
        await onRevoke();
        setIsRevoking(false);
        setShowRevokeDialog(false);
        onClose();
    };

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        await onRegenerate();
        setIsRegenerating(false);
        setShowRegenerateDialog(false);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Share Clips</DialogTitle>
                        <DialogDescription>
                            Share your viral clips with anyone. They can view and download clips without signing in.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Share URL */}
                        <div>
                            {isLoading && !shareUrl ? (
                                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                                    <IconRefresh className="size-4 animate-spin text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Generating share link...</span>
                                </div>
                            ) : (
                                <>
                                    <CopyInterface
                                        text={shareUrl}
                                        label="Share Link"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Anyone with this link can view and download your clips
                                    </p>
                                </>
                            )}
                        </div>

                        <Separator />

                        {/* Analytics Summary */}
                        <div>
                            <h3 className="text-sm font-medium mb-3">Analytics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <IconEye className="size-4" />
                                        <span className="text-xs font-medium">Total Views</span>
                                    </div>
                                    <p className="text-2xl font-bold">{analytics.totalViews}</p>
                                </div>
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <IconDownload className="size-4" />
                                        <span className="text-xs font-medium">Downloads</span>
                                    </div>
                                    <p className="text-2xl font-bold">{analytics.totalDownloads}</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => setShowRegenerateDialog(true)}
                                disabled={isLoading}
                            >
                                <IconRefresh className="size-4" />
                                Regenerate Link
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 text-destructive hover:text-destructive"
                                onClick={() => setShowRevokeDialog(true)}
                                disabled={isLoading}
                            >
                                <IconTrash className="size-4" />
                                Revoke Link
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Revoke Confirmation Dialog */}
            <AlertDialog open={showRevokeDialog} onOpenChange={(open) => !isRevoking && setShowRevokeDialog(open)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Share Link?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently disable the share link. Anyone trying to access it will see an error message.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRevoke}
                            disabled={isRevoking}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                        >
                            {isRevoking && <IconLoader2 className="size-4 animate-spin" />}
                            {isRevoking ? "Revoking..." : "Revoke Link"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Regenerate Warning Dialog */}
            <AlertDialog open={showRegenerateDialog} onOpenChange={(open) => !isRegenerating && setShowRegenerateDialog(open)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <IconAlertCircle className="size-5 text-amber-500" />
                            Regenerate Share Link?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will create a new share link and invalidate the old one. Anyone with the old link will no longer
                            be able to access your clips. Analytics will be reset.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRegenerating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRegenerate} disabled={isRegenerating} className="gap-2">
                            {isRegenerating && <IconLoader2 className="size-4 animate-spin" />}
                            {isRegenerating ? "Regenerating..." : "Regenerate Link"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
