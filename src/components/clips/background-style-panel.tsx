"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { IconLock } from "@tabler/icons-react";

type BackgroundStyle = "blur" | "black" | "white" | "gradient-ocean" | "gradient-midnight" | "gradient-sunset" | "mirror" | "zoom";
type AspectRatio = "9:16" | "1:1" | "16:9";

const FREE_STYLES: BackgroundStyle[] = ["black", "white"];

const BACKGROUND_STYLES: { value: BackgroundStyle; label: string; video: string }[] = [
    { value: "black", label: "Black", video: "/bg-preview-black.mp4" },
    { value: "white", label: "White", video: "/bg-preview-white.mp4" },
    { value: "blur", label: "Blur", video: "/bg-preview-blur.mp4" },
    { value: "gradient-ocean", label: "Ocean", video: "/bg-preview-gradient-ocean.mp4" },
    { value: "gradient-midnight", label: "Midnight", video: "/bg-preview-gradient-midnight.mp4" },
    { value: "gradient-sunset", label: "Sunset", video: "/bg-preview-gradient-sunset.mp4" },
    { value: "mirror", label: "Mirror", video: "/bg-preview-mirror.mp4" },
    { value: "zoom", label: "Zoom", video: "/bg-preview-zoom.mp4" },
];

function PreviewVideo({ src, isSelected }: { src: string; isSelected: boolean }) {
    const ref = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        ref.current?.play().catch(() => { });
    }, []);
    return (
        <video
            ref={ref}
            src={src}
            muted
            loop
            playsInline
            autoPlay
            className={cn("h-full w-full object-cover rounded-md", !isSelected && "opacity-70")}
        />
    );
}

interface BackgroundStylePanelProps {
    value: BackgroundStyle;
    onChange: (style: BackgroundStyle) => void;
    aspectRatio?: AspectRatio;
    disabled?: boolean;
    userPlan?: string;
}

export function BackgroundStylePanel({
    value,
    onChange,
    aspectRatio = "9:16",
    disabled,
    userPlan = "free",
}: BackgroundStylePanelProps) {
    const isPaid = userPlan === "starter" || userPlan === "pro" || userPlan === "agency";

    return (
        <div className="space-y-5">
            {/* Background Style Section - hidden for 16:9 since video fills the frame */}
            {aspectRatio !== "16:9" && <div className="space-y-2">
                <h4 className="text-xs font-medium text-zinc-300 uppercase tracking-wide">Background Style</h4>
                <p className="text-[10px] text-zinc-500">
                    Choose a background style for your clip. Save and regenerate to apply.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {BACKGROUND_STYLES.map((style) => {
                        const isSelected = value === style.value;
                        const isLocked = !isPaid && !FREE_STYLES.includes(style.value);
                        return (
                            <button
                                key={style.value}
                                type="button"
                                disabled={disabled || isLocked}
                                onClick={() => onChange(style.value)}
                                className={cn(
                                    "relative flex flex-col items-center gap-1 rounded-lg border-2 p-1 transition-all",
                                    isSelected
                                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                        : "border-zinc-800 hover:border-zinc-600",
                                    (disabled || isLocked) && "cursor-not-allowed opacity-50"
                                )}
                            >
                                <div className="relative aspect-9/16 w-full overflow-hidden rounded-md">
                                    <PreviewVideo src={style.video} isSelected={isSelected} />
                                    {isLocked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
                                            <IconLock className="size-4 text-white" />
                                        </div>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium",
                                    isSelected ? "text-primary" : "text-zinc-400"
                                )}>
                                    {style.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>}
        </div>
    );
}
