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
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
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

interface VideoGridCardProps {
    video: VideoLite;
    onClick?: () => void;
    onDelete?: (videoId: string) => void;
    onRename?: (videoId: string, newTitle: string) => void;
    onDuplicate?: (videoId: string) => void;
}

export function VideoGridCard({ video, onClick, onDelete, onRename, onDuplicate }: VideoGridCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [newTitle, setNewTitle] = useState(video.title || "");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const processingStatuses = ["downloading", "uploading", "transcribing", "analyzing"];
    const isProcessing = processingStatuses.includes(video.status);

    const getThumbnailUrl = () => {
        if (video.thumbnailUrl) return video.thumbnailUrl;
        if (video.sourceType === "youtube" && video.sourceUrl) {
            const match = video.sourceUrl.match(/[a-zA-Z0-9_-]{11}/);
            if (match) return `https://img.youtube.com/vi/${match[0]}/mqdefault.jpg`;
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

    const handleCopyYouTubeLink = async () => {
        if (!video.sourceUrl) return;
        try {
            await navigator.clipboard.writeText(video.sourceUrl);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error("Failed to copy link:", err);
        }
    };

    const thumbnailUrl = getThumbnailUrl();

    return (
        <>
            <div
                className={cn(
                    "group relative flex flex-col rounded-xl border bg-card overflow-hidden cursor-pointer",
                    "transition-all duration-150 hover:shadow-md hover:border-primary/30",
                    isDeleting && "opacity-40 pointer-events-none"
                )}
                onClick={onClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
                aria-label={`View clips for ${video.title?.trim() || "Untitled Video"}`}
            >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full bg-muted overflow-hidden">
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt={video.title || "Video thumbnail"}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <IconFile className="size-8 text-muted-foreground opacity-30" />
                        </div>
                    )}
                    {isProcessing && (
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite] bg-size-[200%_100%]" />
                    )}
                    {isProcessing && (
                        <div className="absolute bottom-1.5 left-1.5">
                            <Badge variant="secondary" className="text-[10px] gap-1 py-0.5">
                                <IconLoader2 className="size-2.5 animate-spin" />
                                Processing
                            </Badge>
                        </div>
                    )}
                    {video.status === "failed" && (
                        <div className="absolute bottom-1.5 left-1.5">
                            <Badge variant="destructive" className="text-[10px] py-0.5">Failed</Badge>
                        </div>
                    )}
                    {/* Actions menu */}
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="size-6 rounded-md"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <IconDots className="size-3" />
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
                                            onDuplicate(video.id);
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
                                        >
                                            <IconExternalLink className="size-4 mr-2" />
                                            Open on YouTube
                                        </DropdownMenuItem>
                                        {process.env.NODE_ENV === "development" && (
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopyYouTubeLink();
                                                }}
                                            >
                                                <IconCopy className="size-4 mr-2" />
                                                {copySuccess ? "Copied!" : "Copy YT Link"}
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                )}
                                {video.status === "completed" && (
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <IconDownload className="size-4 mr-2" />
                                            Download Transcript
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            {(["srt", "vtt", "txt", "json"] as const).map((fmt) => (
                                                <DropdownMenuItem
                                                    key={fmt}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        downloadVideoTranscript(video.id, fmt);
                                                    }}
                                                >
                                                    {fmt.toUpperCase()} Format
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                )}
                                {onDelete && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onSelect={(e) => e.preventDefault()}
                                            onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
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

                {/* Info */}
                <div className="p-2.5">
                    <p className="text-xs font-medium truncate leading-snug">
                        {video.title?.trim() || "Untitled Video"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(video.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                </div>
            </div>

            {/* Delete dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={(open) => { if (!isDeleting) setShowDeleteDialog(open); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete video?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{video.title || "Untitled Video"}" and all its clips. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? <><IconLoader2 className="size-4 mr-2 animate-spin" />Deleting...</> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Rename dialog */}
            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename video</DialogTitle>
                        <DialogDescription>Enter a new name for this video.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Video title"
                            onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRenameDialog(false)} disabled={isRenaming}>Cancel</Button>
                        <Button onClick={handleRename} disabled={isRenaming || !newTitle.trim()}>
                            {isRenaming ? <><IconLoader2 className="size-4 mr-2 animate-spin" />Saving...</> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
