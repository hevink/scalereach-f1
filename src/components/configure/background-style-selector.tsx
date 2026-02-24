"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";
import { IconLock } from "@tabler/icons-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { UpgradeDialog } from "@/components/pricing/upgrade-dialog";

type BackgroundStyle = "blur" | "black" | "white" | "gradient-ocean" | "gradient-midnight" | "gradient-sunset" | "mirror" | "zoom";

interface BackgroundStyleSelectorProps {
    value: BackgroundStyle;
    onChange: (style: BackgroundStyle) => void;
    disabled?: boolean;
    userPlan?: string;
    workspaceSlug?: string;
}

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
        if (ref.current) {
            ref.current.play().catch(() => { });
        }
    }, []);

    return (
        <video
            ref={ref}
            src={src}
            muted
            loop
            playsInline
            autoPlay
            className={cn(
                "h-full w-full object-cover rounded-md",
                !isSelected && "opacity-70"
            )}
        />
    );
}

export function BackgroundStyleSelector({
    value,
    onChange,
    disabled = false,
    userPlan = "free",
    workspaceSlug = "",
}: BackgroundStyleSelectorProps) {
    const isPaid = userPlan === "starter" || userPlan === "pro";
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

    const handleClick = (style: BackgroundStyle, isLocked: boolean) => {
        if (isLocked) {
            setShowUpgradeDialog(true);
            return;
        }
        onChange(style);
    };

    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">Background Style</Label>
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent className="-ml-2">
                    {BACKGROUND_STYLES.map((style) => {
                        const isSelected = value === style.value;
                        const isLocked = !isPaid && !FREE_STYLES.includes(style.value);
                        return (
                            <CarouselItem key={style.value} className="pl-2 basis-1/6">
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => handleClick(style.value, isLocked)}
                                    className={cn(
                                        "relative w-full flex flex-col items-center gap-1 rounded-lg border-2 p-1 transition-all",
                                        isSelected
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                            : "border-border hover:border-muted-foreground/30 hover:bg-muted/50",
                                        disabled && "cursor-not-allowed opacity-50"
                                    )}
                                    aria-label={`${style.label} background style${isLocked ? " (upgrade required)" : ""}`}
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
                                        "text-[10px] font-medium truncate max-w-full",
                                        isSelected ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {style.label}
                                    </span>
                                </button>
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
                <CarouselPrevious className="left-0 -translate-x-1/2" />
                <CarouselNext className="right-0 translate-x-1/2" />
            </Carousel>

            {!isPaid && workspaceSlug && (
                <UpgradeDialog
                    open={showUpgradeDialog}
                    onOpenChange={setShowUpgradeDialog}
                    workspaceSlug={workspaceSlug}
                    feature="Background Styles"
                    description="Unlock premium background styles like Blur, Gradients, Mirror, and Zoom to make your clips stand out."
                />
            )}
        </div>
    );
}
