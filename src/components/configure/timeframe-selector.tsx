"use client";

import { useCallback, useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconClock, IconCoin, IconRefresh } from "@tabler/icons-react";

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

/** Parse a time string like "1:23:45", "12:30", or "90" into seconds. Returns null if invalid. */
function parseTime(input: string, maxSeconds: number): number | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const parts = trimmed.split(":").map((p) => Number.parseInt(p, 10));
    if (parts.some((p) => Number.isNaN(p) || p < 0)) return null;

    let totalSeconds = 0;
    if (parts.length === 3) {
        totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        totalSeconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        totalSeconds = parts[0];
    } else {
        return null;
    }

    return Math.min(Math.max(0, totalSeconds), maxSeconds);
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

    // Local input state for the text fields
    const [startInput, setStartInput] = useState(formatTime(start));
    const [endInput, setEndInput] = useState(formatTime(effectiveEnd));

    // Sync local inputs when slider/external changes happen
    useEffect(() => {
        setStartInput(formatTime(start));
    }, [start]);

    useEffect(() => {
        setEndInput(formatTime(effectiveEnd));
    }, [effectiveEnd]);

    const handleSliderChange = useCallback(
        (value: number | readonly number[]) => {
            if (Array.isArray(value)) {
                const [newStart, newEnd] = value;
                onChange(newStart, newEnd === videoDuration ? null : newEnd);
            }
        },
        [onChange, videoDuration],
    );

    const commitStartInput = useCallback(() => {
        const parsed = parseTime(startInput, videoDuration);
        if (parsed !== null && parsed < effectiveEnd) {
            onChange(parsed, end);
        } else {
            // Reset to current value
            setStartInput(formatTime(start));
        }
    }, [startInput, videoDuration, effectiveEnd, start, end, onChange]);

    const commitEndInput = useCallback(() => {
        const parsed = parseTime(endInput, videoDuration);
        if (parsed !== null && parsed > start) {
            onChange(start, parsed === videoDuration ? null : parsed);
        } else {
            // Reset to current value
            setEndInput(formatTime(effectiveEnd));
        }
    }, [endInput, videoDuration, start, effectiveEnd, onChange]);

    const handleReset = useCallback(() => {
        onChange(0, null);
    }, [onChange]);

    return (
        <div className="space-y-4">
            {/* Slider */}
            <div className="space-y-3">
                <Slider
                    value={[start, effectiveEnd]}
                    min={0}
                    max={videoDuration}
                    step={1}
                    onValueChange={handleSliderChange}
                    disabled={disabled}
                    className="py-2"
                />

                {/* Time inputs row */}
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <label className="mb-1 block text-muted-foreground text-xs">Start</label>
                        <div className="relative">
                            <IconClock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={startInput}
                                onChange={(e) => setStartInput(e.target.value)}
                                onBlur={commitStartInput}
                                onKeyDown={(e) => e.key === "Enter" && commitStartInput()}
                                disabled={disabled}
                                className="h-8 pl-8 font-mono text-sm"
                                placeholder="0:00"
                                aria-label="Start time"
                            />
                        </div>
                    </div>

                    <span className="mt-5 text-muted-foreground text-xs">to</span>

                    <div className="flex-1">
                        <label className="mb-1 block text-muted-foreground text-xs">End</label>
                        <div className="relative">
                            <IconClock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={endInput}
                                onChange={(e) => setEndInput(e.target.value)}
                                onBlur={commitEndInput}
                                onKeyDown={(e) => e.key === "Enter" && commitEndInput()}
                                disabled={disabled}
                                className="h-8 pl-8 font-mono text-sm"
                                placeholder={formatTime(videoDuration)}
                                aria-label="End time"
                            />
                        </div>
                    </div>

                    {!isFullVideo && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-5 size-8 shrink-0"
                            onClick={handleReset}
                            disabled={disabled}
                            aria-label="Reset to full video"
                        >
                            <IconRefresh className="size-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary bar */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-muted-foreground text-xs">
                    Processing {formatTime(processingDuration)} of {formatTime(videoDuration)}
                    {isFullVideo && " (full video)"}
                </span>
                {!isFullVideo && savingsPercent > 0 && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                        <IconCoin className="size-3" />
                        Save {savingsPercent}%
                    </Badge>
                )}
            </div>
        </div>
    );
}
