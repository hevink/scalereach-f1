"use client";

import { useState } from "react";
import { VideoLite } from "@/lib/api/video";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import {
    IconFile,
    IconLoader2,
    IconClock,
    IconDots,
    IconTrash,
    IconPencil,
    IconCopy,
    IconExternalLink,
} from "@tabler/icons-react";

interface VideoCardProps {
    video: VideoLite;
    onClick?: () => void;
    onDelete?: (videoId: string) => void;
    onRename?: (videoId: string, newTitle: string) => void;
    onDuplicate?: (videoId: string) => void;
    className?: string;
    workspaceSlug?: string;
}

/**
 * VideoCard component displays a video thumbnail with metadata
 * Includes hover effects, processing status, menu options, and responsive design
 */
export function VideoCard({
    video,
    onClick,
    onDelete,
    onRename,
    onDuplicate,
    className,
}: VideoCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [newTitle, setNewTitle] = useState(video.title || "");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getStatusBadge = () => {
        const processingStatuses = ["downloading", "uploading", "transcribing", "analyzing"];

        if (processingStatuses.includes(video.status)) {
            return (
                <Badge variant="secondary" className="text-xs gap-1">
                    <IconLoader2 className="size-3 animate-spin" />
                    Processing
                </Badge>
            );
        }

        if (video.status === "failed") {
            return <Badge variant="destructive" className="text-xs">Failed</Badge>;
        }

        return null;
    };

    const getThumbnailUrl = () => {
        if (video.sourceType === "youtube" && video.sourceUrl) {
            const videoIdMatch = video.sourceUrl.match(/[a-zA-Z0-9_-]{11}/);
            if (videoIdMatch) {
                return `https://img.youtube.com/vi/${videoIdMatch[0]}/mqdefault.jpg`;
            }
        }
        return null;
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(video.id);
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const handleRename = async () => {
        if (!onRename || !newTitle.trim()) return;
        setIsRenaming(true);
        try {
            await onRename(video.id, newTitle.trim());
        } finally {
            setIsRenaming(false);
            setShowRenameDialog(false);
        }
    };

    const handleDuplicate = () => {
        if (onDuplicate) {
            onDuplicate(video.id);
        }
    };

    const thumbnailUrl = getThumbnailUrl();

    return (
        <>
            <div
                data-testid="video-card"
                className={cn(
                    "group relative cursor-pointer",
                    "transition-transform duration-200 ease-out",
                    "hover:scale-[1.02] hover:z-10",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
                    className
                )}
                onClick={onClick}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onClick?.();
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View clips for ${video.title?.trim() || "Untitled Video"}`}
            >
                {/* Video thumbnail with aspect ratio preservation */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt={video.title || "Video thumbnail"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                            <IconFile className="size-6 sm:size-8 text-muted-foreground opacity-50" />
                        </div>
                    )}

                    {/* Processing status badge */}
                    <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
                        {getStatusBadge()}
                    </div>

                    {/* Duration overlay */}
                    {video.duration && (
                        <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 bg-black/70 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded backdrop-blur-sm">
                            {formatDuration(video.duration)}
                        </div>
                    )}

                    {/* Expiry indicator (7 days) */}
                    <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 bg-black/70 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
                        <IconClock className="size-3" />
                        7 days
                    </div>

                    {/* Hover overlay effect */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                </div>

                {/* Video metadata */}
                <div className="mt-1.5 sm:mt-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {video.title?.trim() || "Untitled Video"}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                            {video.sourceType}
                        </p>
                    </div>

                    {/* Menu button with dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "size-6 shrink-0 transition-opacity",
                                    "opacity-0 group-hover:opacity-100",
                                    "focus:opacity-100"
                                )}
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Video options"
                            >
                                <IconDots className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {onRename && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setNewTitle(video.title || "");
                                        setShowRenameDialog(true);
                                    }}
                                >
                                    <IconPencil className="size-4 mr-2" />
                                    Rename
                                </DropdownMenuItem>
                            )}
                            {onDuplicate && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDuplicate();
                                    }}
                                >
                                    <IconCopy className="size-4 mr-2" />
                                    Duplicate
                                </DropdownMenuItem>
                            )}
                            {video.sourceType === "youtube" && video.sourceUrl && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(video.sourceUrl!, "_blank");
                                    }}
                                >
                                    <IconExternalLink className="size-4 mr-2" />
                                    Open on YouTube
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowDeleteDialog(true);
                                        }}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <IconTrash className="size-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete video?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{video.title || "Untitled Video"}" and all its clips.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <IconLoader2 className="size-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Rename Dialog */}
            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename video</DialogTitle>
                        <DialogDescription>
                            Enter a new name for this video.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Video title"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleRename();
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRenameDialog(false)} disabled={isRenaming}>
                            Cancel
                        </Button>
                        <Button onClick={handleRename} disabled={isRenaming || !newTitle.trim()}>
                            {isRenaming ? (
                                <>
                                    <IconLoader2 className="size-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
