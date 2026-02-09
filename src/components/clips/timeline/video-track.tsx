"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Track } from "./types";
import { useTimelineContext } from "./timeline-container";

interface VideoTrackProps {
    track: Track;
}

export function VideoTrack({ track }: VideoTrackProps) {
    const { state, clipStartTime, clipDuration, videoSrc, onSeek, xToTime } = useTimelineContext();
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const trackRef = React.useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isDragging, setIsDragging] = React.useState(false);

    // Generate thumbnails
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !videoSrc || state.trackWidth <= 0 || clipDuration <= 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let cancelled = false;
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.preload = "auto";

        const dpr = window.devicePixelRatio || 1;
        canvas.width = state.trackWidth * dpr;
        canvas.height = track.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = "#18181b";
        ctx.fillRect(0, 0, state.trackWidth, track.height);

        const generateThumbnails = async () => {
            setIsLoading(true);
            try {
                video.src = videoSrc;
                await new Promise<void>((resolve, reject) => {
                    video.onloadeddata = () => resolve();
                    video.onerror = () => reject();
                    setTimeout(() => reject(), 15000);
                });

                if (cancelled) return;

                const thumbWidth = 80;
                const thumbCount = Math.ceil(state.trackWidth / thumbWidth);
                const actualThumbWidth = state.trackWidth / thumbCount;
                const interval = clipDuration / thumbCount;

                for (let i = 0; i < thumbCount; i++) {
                    if (cancelled) break;

                    const time = clipStartTime + (i * interval) + (interval / 2);
                    video.currentTime = Math.min(time, clipStartTime + clipDuration - 0.1);

                    await new Promise<void>((resolve) => {
                        const onSeeked = () => {
                            video.removeEventListener("seeked", onSeeked);
                            const x = i * actualThumbWidth;
                            ctx.drawImage(video, x, 0, actualThumbWidth, track.height);
                            resolve();
                        };
                        video.addEventListener("seeked", onSeeked);
                        setTimeout(() => {
                            video.removeEventListener("seeked", onSeeked);
                            resolve();
                        }, 400);
                    });
                }
            } catch {
                // Keep dark background
            } finally {
                if (!cancelled) setIsLoading(false);
                video.src = "";
            }
        };

        generateThumbnails();

        return () => {
            cancelled = true;
            video.src = "";
        };
    }, [videoSrc, clipDuration, clipStartTime, state.trackWidth, track.height]);

    // Scrub on drag
    const calculateTime = React.useCallback(
        (clientX: number) => {
            if (!trackRef.current) return 0;
            const rect = trackRef.current.getBoundingClientRect();
            const x = clientX - rect.left;
            return xToTime(x);
        },
        [xToTime],
    );

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("[data-no-seek]")) return;
        e.preventDefault();
        setIsDragging(true);
        onSeek(calculateTime(e.clientX));
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => onSeek(calculateTime(e.clientX));
        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, calculateTime, onSeek]);

    return (
        <div
            ref={trackRef}
            className={cn(
                "relative rounded overflow-hidden border border-zinc-700 cursor-pointer",
                isDragging && "cursor-grabbing",
                isLoading && "animate-pulse",
            )}
            style={{ width: state.trackWidth, height: track.height }}
            onMouseDown={handleMouseDown}
        >
            <canvas
                ref={canvasRef}
                style={{ width: state.trackWidth, height: track.height, display: "block" }}
            />

            {/* Left resize handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-3 z-10 cursor-col-resize flex items-center justify-center bg-gradient-to-r from-zinc-900/80 to-transparent"
                data-no-seek
            >
                <div className="w-px h-3 bg-white/60" />
                <div className="w-px h-3 bg-white/60 ml-[2px]" />
            </div>

            {/* Right resize handle */}
            <div
                className="absolute right-0 top-0 bottom-0 w-3 z-10 cursor-col-resize flex items-center justify-center bg-gradient-to-l from-zinc-900/80 to-transparent"
                data-no-seek
            >
                <div className="w-px h-3 bg-white/60" />
                <div className="w-px h-3 bg-white/60 ml-[2px]" />
            </div>
        </div>
    );
}
