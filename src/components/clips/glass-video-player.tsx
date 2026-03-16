"use client";

import { cn } from "@/lib/utils";

interface GlassVideoPlayerProps {
    src: string;
    poster?: string | null;
    className?: string;
}

export function GlassVideoPlayer({ src, poster, className }: GlassVideoPlayerProps) {
    return (
        <video
            src={src}
            poster={poster ?? undefined}
            controls
            playsInline
            preload="metadata"
            className={cn("h-full w-full rounded-[1.35rem] bg-black object-contain", className)}
        />
    );
}
