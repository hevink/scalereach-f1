"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTimelineContext } from "./timeline-container";
import { IconLetterT } from "@tabler/icons-react";

export interface TextOverlayItem {
    id: string;
    text: string;
    startTime: number;
    endTime: number;
    color: string;
}

interface TextOverlayTrackProps {
    overlays: TextOverlayItem[];
    height?: number;
    onOverlayClick?: (id: string) => void;
}

export function TextOverlayTrack({ overlays, height = 32, onOverlayClick }: TextOverlayTrackProps) {
    const { state, timeToX } = useTimelineContext();

    if (overlays.length === 0) return null;

    return (
        <div
            className="relative rounded overflow-hidden border border-zinc-700/50"
            style={{ width: state.trackWidth, height }}
            data-no-seek
        >
            {/* Background */}
            <div className="absolute inset-0 bg-zinc-900/60" />

            {/* Overlay blocks */}
            {overlays.map((overlay) => {
                const left = timeToX(overlay.startTime);
                const width = timeToX(overlay.endTime) - left;

                if (width < 2) return null;

                return (
                    <button
                        key={overlay.id}
                        className={cn(
                            "absolute top-1 bottom-1 rounded-sm flex items-center gap-1 px-1.5 overflow-hidden",
                            "border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30",
                            "transition-colors cursor-pointer group"
                        )}
                        style={{ left, width: Math.max(width, 20) }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onOverlayClick?.(overlay.id);
                        }}
                        title={overlay.text}
                    >
                        <IconLetterT className="size-3 text-amber-400 shrink-0" />
                        {width > 50 && (
                            <span className="text-[9px] text-amber-300 truncate leading-none">
                                {overlay.text}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
