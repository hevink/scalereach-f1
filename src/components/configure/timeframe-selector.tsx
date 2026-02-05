"use client";

import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { IconCoin } from "@tabler/icons-react";

interface TimeframeSelectorProps {
    videoDuration: number; // total duration in seconds
    start: number;
    end: number | null;
    onChange: (start: number, end: number | null) => void;
    disabled?: boolean;
}

function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TimeframeSelector({
    videoDuration,
    start,
    end,
    onChange,
    disabled = false,
}: TimeframeSelectorProps) {
    const effectiveEnd = end ?? videoDuration;
    const isFullVideo = start === 0 && effectiveEnd === videoDuration;
    const processingDuration = effectiveEnd - start;
    const savingsPercent = Math.round((1 - processingDuration / videoDuration) * 100);

    const handleSliderChange = useCallback(
        (value: number | readonly number[]) => {
            if (Array.isArray(value)) {
                const [newStart, newEnd] = value;
                onChange(
                    newStart,
                    newEnd === videoDuration ? null : newEnd
                );
            }
        },
        [onChange, videoDuration]
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>Processing Timeframe</Label>
                {!isFullVideo && savingsPercent > 0 && (
                    <Badge variant="secondary" className="gap-1">
                        <IconCoin className="size-3" />
                        Credit saver: {savingsPercent}% less
                    </Badge>
                )}
            </div>

            <div className="space-y-2">
                <Slider
                    value={[start, effectiveEnd]}
                    min={0}
                    max={videoDuration}
                    step={1}
                    onValueChange={handleSliderChange}
                    disabled={disabled}
                    className="py-4"
                />

                <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Start: {formatTime(start)}</span>
                    <span>End: {formatTime(effectiveEnd)}</span>
                </div>

                <p className="text-center text-muted-foreground text-xs">
                    Processing {formatTime(processingDuration)} of {formatTime(videoDuration)}
                    {isFullVideo && " (full video)"}
                </p>
            </div>
        </div>
    );
}
