"use client";

import { useState } from "react";
import { VideoLite } from "@/lib/api/video";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { IconFile, IconLoader2, IconDots, IconTrash } from "@tabler/icons-react";

interface VideoGridCardProps {
    video: VideoLite;
    onClick?: () => void;
    onDelete?: (videoId: string) => void;
}

export function VideoGridCard({ video, onClick, onDelete }: VideoGridCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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
                    {/* Status overlay */}
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
                    {onDelete && (
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
                                <DropdownMenuContent align="end" className="w-36">
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                                    >
                                        <IconTrash className="size-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
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

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete video?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the video and all its clips.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
