"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface BackgroundStyleSelectorProps {
    value: "blur" | "black" | "white";
    onChange: (style: "blur" | "black" | "white") => void;
    disabled?: boolean;
}

const BACKGROUND_STYLES = [
    {
        value: "blur" as const,
        label: "Blur",
        description: "Blurred video background",
        bgClass: "bg-gradient-to-b from-blue-400/30 to-purple-400/30 backdrop-blur-sm",
        previewBg: "bg-gradient-to-b from-blue-200 to-purple-200",
        videoBg: "bg-slate-400",
    },
    {
        value: "black" as const,
        label: "Black",
        description: "Solid black background",
        bgClass: "bg-black",
        previewBg: "bg-black",
        videoBg: "bg-slate-400",
    },
    {
        value: "white" as const,
        label: "White",
        description: "Solid white background",
        bgClass: "bg-white border border-border",
        previewBg: "bg-white",
        videoBg: "bg-slate-400",
    },
];

export function BackgroundStyleSelector({
    value,
    onChange,
    disabled = false,
}: BackgroundStyleSelectorProps) {
    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">Background Style</Label>
            <div className="grid grid-cols-3 gap-3">
                {BACKGROUND_STYLES.map((style) => {
                    const isSelected = value === style.value;
                    return (
                        <button
                            key={style.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(style.value)}
                            className={cn(
                                "group relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all",
                                isSelected
                                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/50",
                                disabled && "cursor-not-allowed opacity-50"
                            )}
                            aria-label={`${style.label} background - ${style.description}`}
                        >
                            {/* Phone-shaped preview */}
                            <div
                                className={cn(
                                    "relative flex h-20 w-11 items-center justify-center overflow-hidden rounded-md",
                                    style.previewBg
                                )}
                            >
                                {/* Simulated video content in center */}
                                <div className={cn("h-7 w-10 rounded-sm", style.videoBg)} />
                            </div>
                            <span className={cn(
                                "text-xs font-medium",
                                isSelected ? "text-primary" : "text-muted-foreground"
                            )}>
                                {style.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
