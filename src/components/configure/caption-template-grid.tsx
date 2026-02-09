"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import type { CaptionTemplate } from "@/lib/api/video-config";

// Map font family names to CSS variable names
function getFontVariable(fontFamily: string): string {
    const fontMap: Record<string, string> = {
        "Montserrat": "var(--font-montserrat)",
        "Poppins": "var(--font-poppins)",
        "Lexend": "var(--font-lexend)",
        "Titan One": "var(--font-titan-one)",
        "Libre Baskerville": "var(--font-libre-baskerville)",
        "Bangers": "var(--font-bangers)",
        "Lilita One": "var(--font-lilita-one)",
        "Inter": "var(--font-inter)",
        "Oswald": "var(--font-oswald)",
        "Righteous": "var(--font-righteous)",
        "Russo One": "var(--font-russo-one)",
        "Black Ops One": "var(--font-black-ops-one)",
        "Georgia": "Georgia, serif",
    };
    return fontMap[fontFamily] || fontFamily;
}

interface CaptionTemplateGridProps {
    templates: CaptionTemplate[];
    selectedId: string;
    onSelect: (templateId: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
}

function CaptionTemplateGridSkeleton() {
    return (
        <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col basis-[20%] min-w-[80px]">
                    <Skeleton className="aspect-[9/16] rounded-xl" />
                    <Skeleton className="h-4 mt-1.5 w-3/4 mx-auto" />
                </div>
            ))}
        </div>
    );
}

export function CaptionTemplateGrid({
    templates,
    selectedId,
    onSelect,
    disabled = false,
    isLoading = false,
}: CaptionTemplateGridProps) {
    const [activeTab, setActiveTab] = useState<"presets" | "my-presets">("presets");

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                </div>
                <CaptionTemplateGridSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-4" role="tablist" aria-label="Caption template categories">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "presets"}
                    aria-controls="presets-panel"
                    onClick={() => setActiveTab("presets")}
                    className={cn(
                        "font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-1",
                        activeTab === "presets"
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Presets
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "my-presets"}
                    aria-controls="my-presets-panel"
                    onClick={() => setActiveTab("my-presets")}
                    className={cn(
                        "font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-1",
                        activeTab === "my-presets"
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    My presets
                </button>
            </div>

            {activeTab === "presets" ? (
                <div id="presets-panel" role="tabpanel" aria-label="Preset caption templates">
                    <Carousel
                        opts={{
                            align: "start",
                            dragFree: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-2">
                            {templates.map((template) => (
                                <CarouselItem key={template.id} className="pl-2 basis-[20%] min-w-[80px]">
                                    <TemplateCard
                                        template={template}
                                        isSelected={selectedId === template.id}
                                        onSelect={() => onSelect(template.id)}
                                        disabled={disabled}
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="-left-3 size-7" />
                        <CarouselNext className="-right-3 size-7" />
                    </Carousel>
                </div>
            ) : (
                <div
                    id="my-presets-panel"
                    role="tabpanel"
                    aria-label="My custom caption templates"
                    className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed"
                >
                    <p className="text-muted-foreground text-sm">
                        No custom presets yet
                    </p>
                </div>
            )}
        </div>
    );
}

interface TemplateCardProps {
    template: CaptionTemplate;
    isSelected: boolean;
    onSelect: () => void;
    disabled?: boolean;
}

function TemplateCard({ template, isSelected, onSelect, disabled }: TemplateCardProps) {
    const style = template.style;
    const fontFamily = getFontVariable(style.fontFamily);

    // Check if this is a box-style highlight
    const isBoxHighlight = style.backgroundOpacity > 50;

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
        }
    }, [disabled, onSelect]);

    return (
        <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={`${template.name} caption style`}
            aria-pressed={isSelected}
            onClick={disabled ? undefined : onSelect}
            onKeyDown={handleKeyDown}
            className={cn(
                "flex flex-col cursor-pointer focus-visible:outline-none",
                disabled && "cursor-not-allowed opacity-50"
            )}
        >
            {/* Preview container - 9:16 aspect ratio */}
            <div
                className={cn(
                    "aspect-[9/16] rounded-xl isolate overflow-hidden relative text-white flex items-center justify-center group bg-slate-400 dark:bg-slate-800",
                    isSelected && "ring-2 ring-primary ring-offset-2",
                    !disabled && "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
            >
                {/* Background image */}
                <img
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover absolute inset-0 opacity-50 pointer-events-none"
                    src="https://images.pexels.com/photos/2310713/pexels-photo-2310713.jpeg"
                />

                {/* Background gradient overlay */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-black/10 to-black/30" aria-hidden="true" />

                {/* Top text - sample paragraph */}
                <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[calc(100%-16px)] text-center" aria-hidden="true">
                    <p
                        className="text-[5px] leading-tight opacity-80"
                        style={{
                            color: style.textColor,
                            textShadow: "0.5px 0.5px 1px rgba(0,0,0,0.5)",
                        }}
                    >
                        The quick brown fox jumps over the lazy dog
                    </p>
                </div>

                {/* Caption preview - positioned at 70% from top */}
                <div className="absolute left-1/2 -translate-x-1/2" style={{ top: "70%" }} aria-hidden="true">
                    <div className="text-center">
                        {/* Line 1 */}
                        <div className="flex items-center justify-center gap-0.5">
                            <span
                                className="font-bold leading-tight"
                                style={{
                                    fontFamily,
                                    fontSize: "9px",
                                    color: style.highlightEnabled ? style.highlightColor : style.textColor,
                                    textTransform: "uppercase",
                                    textShadow: style.shadow ? "0.5px 0.5px 0px rgba(0,0,0,0.8)" : undefined,
                                    WebkitTextStroke: style.outline
                                        ? `0.3px ${style.outlineColor || "#000"}`
                                        : undefined,
                                    backgroundColor: isBoxHighlight ? style.highlightColor : undefined,
                                    padding: isBoxHighlight ? "1px 3px" : undefined,
                                    borderRadius: isBoxHighlight ? "2px" : undefined,
                                }}
                            >
                                The
                            </span>
                            <span
                                className="font-bold leading-tight"
                                style={{
                                    fontFamily,
                                    fontSize: "9px",
                                    color: style.highlightEnabled ? style.highlightColor : style.textColor,
                                    textTransform: "uppercase",
                                    textShadow: style.shadow ? "0.5px 0.5px 0px rgba(0,0,0,0.8)" : undefined,
                                    WebkitTextStroke: style.outline
                                        ? `0.3px ${style.outlineColor || "#000"}`
                                        : undefined,
                                }}
                            >
                                {" "}quick
                            </span>
                        </div>
                        {/* Line 2 */}
                        <span
                            className="font-bold leading-tight block"
                            style={{
                                fontFamily,
                                fontSize: "9px",
                                color: style.textColor,
                                textTransform: "uppercase",
                                textShadow: style.shadow ? "0.5px 0.5px 0px rgba(0,0,0,0.8)" : undefined,
                                WebkitTextStroke: style.outline
                                    ? `0.3px ${style.outlineColor || "#000"}`
                                    : undefined,
                            }}
                        >
                            brown
                        </span>
                    </div>
                </div>

                {/* Bottom gradient */}
                <div className="h-6 bg-gradient-to-t from-black/30 to-transparent absolute w-full bottom-0 inset-x-0 pointer-events-none" aria-hidden="true" />

                {/* Inner ring for selected state */}
                {isSelected && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none ring-2 ring-white/50 ring-inset" aria-hidden="true" />
                )}

                {/* Default label at bottom left */}
                {isSelected && (
                    <span className="text-[8px] font-normal absolute bottom-1 left-1 px-1.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-white truncate z-10">
                        Default
                    </span>
                )}
            </div>

            {/* Name label */}
            <span
                className="text-xs font-bold mt-1.5 text-center text-white truncate uppercase"
                style={{ fontFamily }}
            >
                {template.name}
            </span>
        </div>
    );
}
