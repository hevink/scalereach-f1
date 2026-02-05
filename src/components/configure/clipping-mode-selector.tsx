"use client";

import { IconSparkles, IconPlayerPlay } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface ClippingModeSelectorProps {
    skipClipping: boolean;
    onChange: (skipClipping: boolean) => void;
    disabled?: boolean;
}

export function ClippingModeSelector({
    skipClipping,
    onChange,
    disabled = false,
}: ClippingModeSelectorProps) {
    return (
        <div className="flex gap-2" role="radiogroup" aria-label="Clipping mode selection">
            <button
                type="button"
                role="radio"
                aria-checked={!skipClipping}
                aria-label="AI Clipping - Automatically detect and generate viral clips"
                onClick={() => onChange(false)}
                disabled={disabled}
                className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    !skipClipping
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50",
                    disabled && "cursor-not-allowed opacity-50"
                )}
            >
                <IconSparkles className="size-5" aria-hidden="true" />
                AI Clipping
            </button>
            <button
                type="button"
                role="radio"
                aria-checked={skipClipping}
                aria-label="Don't Clip - Skip clipping and process the full video"
                onClick={() => onChange(true)}
                disabled={disabled}
                className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    skipClipping
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50",
                    disabled && "cursor-not-allowed opacity-50"
                )}
            >
                <IconPlayerPlay className="size-5" aria-hidden="true" />
                Don't Clip
            </button>
        </div>
    );
}
