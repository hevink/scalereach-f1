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
        <div className="flex gap-2">
            <button
                type="button"
                onClick={() => onChange(false)}
                disabled={disabled}
                className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 font-medium transition-all",
                    !skipClipping
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50",
                    disabled && "cursor-not-allowed opacity-50"
                )}
            >
                <IconSparkles className="size-5" />
                AI Clipping
            </button>
            <button
                type="button"
                onClick={() => onChange(true)}
                disabled={disabled}
                className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 font-medium transition-all",
                    skipClipping
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50",
                    disabled && "cursor-not-allowed opacity-50"
                )}
            >
                <IconPlayerPlay className="size-5" />
                Don't Clip
            </button>
        </div>
    );
}
