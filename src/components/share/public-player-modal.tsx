"use client";

/**
 * Public Video Player Modal Component
 * Full-screen modal for clip playback with controls
 * 
 * Validates: Requirements 7.1, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import { useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconDownload, IconX } from "@tabler/icons-react";
import { PublicClipData } from "./public-clips-grid";

export interface PublicPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    clip: PublicClipData | null;
    onDownload: (clip: PublicClipData) => void;
}

export function PublicPlayerModal({
    isOpen,
    onClose,
    clip,
    onDownload,
}: PublicPlayerModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Handle keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const video = videoRef.current;
            if (!video) return;

            switch (e.key) {
                case " ": // Space - play/pause
                    e.preventDefault();
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                    break;
                case "ArrowLeft": // Left arrow - seek backward 5s
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 5);
                    break;
                case "ArrowRight": // Right arrow - seek forward 5s
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration, video.currentTime + 5);
                    break;
                case "f": // F - fullscreen
                case "F":
                    e.preventDefault();
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        video.requestFullscreen();
                    }
                    break;
                case "Escape": // Escape - close modal
                    onClose();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Stop playback when modal closes
    useEffect(() => {
        if (!isOpen && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isOpen]);

    if (!clip) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 gap-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{clip.title}</h3>
                        <p className="text-sm text-muted-foreground">
                            Virality Score: {clip.viralityScore}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => onDownload(clip)}
                        >
                            <IconDownload className="size-4" />
                            Download
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onClose}
                        >
                            <IconX className="size-4" />
                        </Button>
                    </div>
                </div>

                {/* Video Player */}
                <div className="relative bg-black aspect-[9/16] max-h-[70vh]">
                    {clip.storageUrl ? (
                        <video
                            ref={videoRef}
                            src={clip.storageUrl}
                            poster={clip.thumbnailUrl}
                            className="w-full h-full object-contain"
                            controls
                            autoPlay
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-white">
                            <p>Video not available</p>
                        </div>
                    )}
                </div>

                {/* Description */}
                {clip.viralityReason && (
                    <div className="p-4 border-t">
                        <h4 className="text-sm font-medium mb-2">Why this clip is viral:</h4>
                        <p className="text-sm text-muted-foreground">
                            {clip.viralityReason}
                        </p>
                    </div>
                )}

                {/* Keyboard shortcuts hint */}
                <div className="px-4 pb-4 text-xs text-muted-foreground">
                    <p>
                        <kbd className="px-1.5 py-0.5 bg-muted rounded">Space</kbd> Play/Pause •{" "}
                        <kbd className="px-1.5 py-0.5 bg-muted rounded">←</kbd>{" "}
                        <kbd className="px-1.5 py-0.5 bg-muted rounded">→</kbd> Seek •{" "}
                        <kbd className="px-1.5 py-0.5 bg-muted rounded">F</kbd> Fullscreen •{" "}
                        <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> Close
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
