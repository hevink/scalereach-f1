"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface GlassVideoPlayerProps {
    src: string;
    poster?: string | null;
    className?: string;
}

let activeVideoElement: HTMLVideoElement | null = null;

export function registerActiveClipVideo(video: HTMLVideoElement | null) {
    if (!video) {
        return;
    }

    if (activeVideoElement && activeVideoElement !== video) {
        activeVideoElement.pause();
    }

    activeVideoElement = video;
}

export function clearActiveClipVideo(video: HTMLVideoElement | null) {
    if (activeVideoElement === video) {
        activeVideoElement = null;
    }
}

export function resetActiveClipVideoForTests() {
    activeVideoElement = null;
}

export function GlassVideoPlayer({ src, poster, className }: GlassVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const currentVideo = videoRef.current;

        return () => {
            clearActiveClipVideo(currentVideo);
        };
    }, []);

    const handlePlay = () => {
        registerActiveClipVideo(videoRef.current);
    };

    return (
        <video
            ref={videoRef}
            src={src}
            poster={poster ?? undefined}
            controls
            playsInline
            preload="metadata"
            onPlay={handlePlay}
            onPause={() => clearActiveClipVideo(videoRef.current)}
            onEnded={() => clearActiveClipVideo(videoRef.current)}
            className={cn("h-full w-full rounded-[1.35rem] bg-black object-contain", className)}
        />
    );
}
