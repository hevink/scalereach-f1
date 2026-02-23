"use client";

import { useState } from "react";
import { VideoLite } from "@/lib/api/video";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { YouTubeIcon } from "@/components/icons/youtube-icon";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
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
import { downloadVideoTranscript } from "@/lib/api/subtitle";
import {
    IconFile,
    IconLoader2,
    IconDots,
    IconTrash,
    IconPencil,
    IconCopy,
    IconExternalLink,
    IconDownload,
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
    const [copySuccess, setCopySuccess] = useState(false);

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
        if (video.thumbnailUrl) {
            return video.thumbnailUrl;
        }
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

    const handleCopyYouTubeLink = async () => {
        if (!video.sourceUrl) return;
        try {
            await navigator.clipboard.writeText(video.sourceUrl);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    const thumbnailUrl = getThumbnailUrl();

    return (
        <>
            <div
                data-testid="video-card"
                className={cn(
                    "group relative cursor-pointer",
                    // Mobile: flex row layout
                    "flex items-center gap-3 px-4 py-3",
                    // Desktop: grid table layout
                    "md:grid md:grid-cols-[80px_1fr_140px_100px] lg:grid-cols-[80px_1fr_140px_140px_100px] xl:grid-cols-[80px_1fr_140px_140px_100px_100px] md:gap-6 md:px-6 md:py-5",
                    "bg-card",
                    "transition-all duration-150 ease-out",
                    "hover:bg-accent/30",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
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
                {/* Thumbnail column */}
                <div className="shrink-0 w-14 h-14 md:w-20 md:h-20 rounded-lg overflow-hidden bg-muted relative shadow-sm">
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt={video.title || "Video thumbnail"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-muted to-muted/50">
                            <IconFile className="size-5 md:size-7 text-muted-foreground opacity-40" />
                        </div>
                    )}
                </div>

                {/* Description column */}
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate mb-1 md:mb-1.5 group-hover:text-primary transition-colors">
                        {video.title?.trim() || "Untitled Video"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <span className="font-medium">Created:</span>
                            <span>{new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </span>
                        <span className="text-muted-foreground/40 hidden sm:inline">•</span>
                        <span className="hidden sm:flex items-center gap-1">
                            <span className="font-medium">Expires:</span>
                            <span>{new Date(new Date(video.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </span>
                    </div>
                    {/* Source badge - shown inline on mobile only */}
                    <div className="flex md:hidden items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            {video.sourceType === 'youtube' ? (
                                <>
                                    <YouTubeIcon className="size-3 text-[#FF0000]" />
                                    <span>YouTube</span>
                                </>
                            ) : (
                                <>
                                    <img src="/file-color-blue-icon.svg" alt="" className="size-3" />
                                    <span>Upload</span>
                                </>
                            )}
                        </div>
                        {getStatusBadge()}
                    </div>
                </div>

                {/* Source column - desktop only */}
                <div className="hidden md:flex items-center justify-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 text-xs font-medium">
                        {video.sourceType === 'youtube' ? (
                            <>
                                <YouTubeIcon className="size-3.5 text-[#FF0000]" />
                                <span>YouTube</span>
                            </>
                        ) : (
                            <>
                                <img src="/file-color-blue-icon.svg" alt="" className="size-3.5" />
                                <span>Upload</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Video type column - desktop only */}
                <div className="hidden lg:flex items-center justify-center text-xs font-medium">
                    Viral Clips
                </div>

                {/* Ratio column - desktop only */}
                <div className="hidden xl:flex items-center justify-center text-xs font-medium">
                    9:16
                </div>

                {/* Actions column */}
                <div className="flex items-center justify-end gap-1 md:gap-2 shrink-0">
                    {/* Status badge - desktop only */}
                    <div className="hidden md:block">
                        {getStatusBadge()}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0"
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
                                <>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(video.sourceUrl!, "_blank");
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <IconExternalLink className="size-4 mr-2" />
                                        Open on YouTube
                                    </DropdownMenuItem>
                                    {process.env.NODE_ENV === 'development' && (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyYouTubeLink();
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <IconCopy className="size-4 mr-2" />
                                            {copySuccess ? "Copied!" : "Copy YT Link"}
                                        </DropdownMenuItem>
                                    )}
                                </>
                            )}
                            {video.status === "completed" && (
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="cursor-pointer">
                                        <IconDownload className="size-4 mr-2" />
                                        Download Transcript
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                downloadVideoTranscript(video.id, 'srt');
                                            }}
                                            className="cursor-pointer"
                                        >
                                            SRT Format
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                downloadVideoTranscript(video.id, 'vtt');
                                            }}
                                            className="cursor-pointer"
                                        >
                                            VTT Format
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                downloadVideoTranscript(video.id, 'txt');
                                            }}
                                            className="cursor-pointer"
                                        >
                                            Text Format
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                downloadVideoTranscript(video.id, 'json');
                                            }}
                                            className="cursor-pointer"
                                        >
                                            JSON Format
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            )}
                            {onDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowDeleteDialog(true);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <IconTrash className="size-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:inline-flex size-8 shrink-0"
                        onClick={onClick}
                        aria-label="View clips"
                    >
                        <IconExternalLink className="size-4" />
                    </Button>
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
