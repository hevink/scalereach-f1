"use client";

import { IconCheck, IconPalette, IconSparkles } from "@tabler/icons-react";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CaptionStyle } from "@/lib/api/captions";
import { cn } from "@/lib/utils";
import { getFontFamily } from "./caption-style-panel";

/**
 * CaptionStylePreset interface
 * Represents a pre-designed caption style preset
 *
 * @validates Requirements 9.1, 9.3
 */
export interface CaptionStylePreset {
    id: string;
    name: string;
    description: string;
    thumbnail?: string; // Optional preview image URL
    style: CaptionStyle;
    tags: string[]; // e.g., ["viral", "bold", "minimal"]
}

/**
 * CaptionStylePresetsProps interface
 *
 * @validates Requirements 9.1, 9.3
 */
export interface CaptionStylePresetsProps {
    /** Available caption style presets */
    presets?: CaptionStylePreset[];
    /** Currently selected preset ID */
    selectedPresetId?: string;
    /** Callback when a preset is selected */
    onSelect: (presetId: string) => void;
    /** Additional className */
    className?: string;
    /** Whether the picker is in a loading state */
    isLoading?: boolean;
    /** Whether the picker is disabled */
    disabled?: boolean;
    /** Filter presets by tags */
    filterTags?: string[];
}

/**
 * Default caption style presets
 * Provides at least 5 pre-designed caption style presets
 *
 * @validates Requirements 9.1
 */
export const DEFAULT_PRESETS: CaptionStylePreset[] = [
    {
        id: "viral-bold",
        name: "Viral Bold",
        description: "High-impact bold text with yellow highlight - perfect for viral content",
        style: {
            fontFamily: "Bangers",
            fontSize: 48,
            textColor: "#FFFFFF",
            backgroundColor: "#000000",
            backgroundOpacity: 70,
            position: "bottom",
            alignment: "center",
            animation: "word-by-word",
            highlightColor: "#FFFF00",
            highlightEnabled: true,
            shadow: true,
            outline: true,
            outlineColor: "#000000",
        },
        tags: ["viral", "bold", "trending"],
    },
    {
        id: "clean-minimal",
        name: "Clean Minimal",
        description: "Simple and clean style for professional content",
        style: {
            fontFamily: "Inter",
            fontSize: 36,
            textColor: "#FFFFFF",
            backgroundColor: "#000000",
            backgroundOpacity: 50,
            position: "bottom",
            alignment: "center",
            animation: "fade",
            highlightColor: "#3B82F6",
            highlightEnabled: false,
            shadow: true,
            outline: false,
        },
        tags: ["minimal", "clean", "professional"],
    },
    {
        id: "neon-glow",
        name: "Neon Glow",
        description: "Eye-catching neon style with cyan highlights",
        style: {
            fontFamily: "Permanent Marker",
            fontSize: 44,
            textColor: "#00FFFF",
            backgroundColor: "#000000",
            backgroundOpacity: 0,
            position: "center",
            alignment: "center",
            animation: "karaoke",
            highlightColor: "#FF00FF",
            highlightEnabled: true,
            shadow: true,
            outline: true,
            outlineColor: "#000000",
        },
        tags: ["neon", "glow", "vibrant"],
    },
    {
        id: "street-style",
        name: "Street Style",
        description: "Urban street style with bold impact font",
        style: {
            fontFamily: "Anton",
            fontSize: 52,
            textColor: "#FFFFFF",
            backgroundColor: "#FF0000",
            backgroundOpacity: 80,
            position: "bottom",
            alignment: "left",
            animation: "bounce",
            highlightColor: "#FFFF00",
            highlightEnabled: true,
            shadow: false,
            outline: true,
            outlineColor: "#000000",
        },
        tags: ["street", "urban", "bold"],
    },
    {
        id: "elegant-serif",
        name: "Elegant Serif",
        description: "Sophisticated style for premium content",
        style: {
            fontFamily: "Oswald",
            fontSize: 40,
            textColor: "#F5F5DC",
            backgroundColor: "#1A1A2E",
            backgroundOpacity: 60,
            position: "bottom",
            alignment: "center",
            animation: "fade",
            highlightColor: "#FFD700",
            highlightEnabled: false,
            shadow: true,
            outline: false,
        },
        tags: ["elegant", "premium", "sophisticated"],
    },
    {
        id: "pop-fun",
        name: "Pop Fun",
        description: "Playful and colorful style for fun content",
        style: {
            fontFamily: "Bebas Neue",
            fontSize: 46,
            textColor: "#FF69B4",
            backgroundColor: "#FFFFFF",
            backgroundOpacity: 90,
            position: "center",
            alignment: "center",
            animation: "bounce",
            highlightColor: "#00FF00",
            highlightEnabled: true,
            shadow: false,
            outline: true,
            outlineColor: "#000000",
        },
        tags: ["fun", "playful", "colorful"],
    },
    {
        id: "dark-cinematic",
        name: "Dark Cinematic",
        description: "Cinematic style with dramatic shadows",
        style: {
            fontFamily: "Montserrat",
            fontSize: 38,
            textColor: "#E0E0E0",
            backgroundColor: "#000000",
            backgroundOpacity: 40,
            position: "bottom",
            alignment: "center",
            animation: "fade",
            highlightColor: "#FF4500",
            highlightEnabled: false,
            shadow: true,
            outline: false,
        },
        tags: ["cinematic", "dark", "dramatic"],
    },
];

/**
 * Get all unique tags from presets
 */
function getAllTags(presets: CaptionStylePreset[]): string[] {
    const tagSet = new Set<string>();
    presets.forEach((preset) => {
        preset.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
}

/**
 * Get preview style object for displaying preset preview
 * @validates Requirements 9.3
 */
function getPreviewStyle(style: CaptionStyle): React.CSSProperties {
    const bgOpacityHex = Math.round((style.backgroundOpacity / 100) * 255)
        .toString(16)
        .padStart(2, "0");

    return {
        fontFamily: getFontFamily(style.fontFamily),
        fontSize: `${Math.min(style.fontSize, 18)}px`, // Cap preview font size
        color: style.textColor,
        backgroundColor: style.backgroundColor
            ? `${style.backgroundColor}${bgOpacityHex}`
            : "transparent",
        textAlign: style.alignment,
        textShadow: style.shadow ? "2px 2px 4px rgba(0,0,0,0.8)" : "none",
        WebkitTextStroke: style.outline
            ? `1px ${style.outlineColor || "#000000"}`
            : "none",
        padding: "4px 8px",
        borderRadius: "4px",
    };
}

/**
 * PresetCard Component
 *
 * Individual preset card with preview and selection state
 * @validates Requirements 9.3
 */
interface PresetCardProps {
    preset: CaptionStylePreset;
    isSelected: boolean;
    onSelect: () => void;
    disabled?: boolean;
}

function PresetCard({
    preset,
    isSelected,
    onSelect,
    disabled,
}: PresetCardProps) {
    const previewStyle = getPreviewStyle(preset.style);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card
                        className={cn(
                            "relative cursor-pointer transition-all duration-200",
                            "hover:ring-2 hover:ring-primary/50 hover:shadow-lg",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            isSelected && "ring-2 ring-primary shadow-md",
                            disabled && "cursor-not-allowed opacity-50"
                        )}
                        onClick={() => !disabled && onSelect()}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        role="button"
                        tabIndex={disabled ? -1 : 0}
                        aria-pressed={isSelected}
                        aria-label={`Select ${preset.name} preset`}
                        onKeyDown={(e) => {
                            if (!disabled && (e.key === "Enter" || e.key === " ")) {
                                e.preventDefault();
                                onSelect();
                            }
                        }}
                        data-testid={`preset-card-${preset.id}`}
                    >
                        {/* Selection indicator */}
                        {isSelected && (
                            <div className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <IconCheck className="size-4" />
                            </div>
                        )}

                        {/* Preview thumbnail area */}
                        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-linear-to-br from-slate-800 to-slate-900">
                            {preset.thumbnail ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={preset.thumbnail}
                                    alt={`${preset.name} preset preview`}
                                    className="size-full object-cover"
                                />
                            ) : (
                                // Styled preview fallback
                                <div className="flex size-full items-center justify-center p-4">
                                    <div
                                        className="max-w-full truncate text-center transition-transform duration-200"
                                        style={{
                                            ...previewStyle,
                                            transform: isHovered ? "scale(1.05)" : "scale(1)",
                                        }}
                                    >
                                        Sample Text
                                    </div>
                                </div>
                            )}

                            {/* Hover overlay with full preview */}
                            {isHovered && !preset.thumbnail && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                                    <div
                                        className="max-w-[90%] truncate text-center"
                                        style={previewStyle}
                                    >
                                        Preview Caption
                                    </div>
                                </div>
                            )}
                        </div>

                        <CardContent className="p-3">
                            {/* Preset name */}
                            <h3 className="mb-1 font-medium text-sm truncate">{preset.name}</h3>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1">
                                {preset.tags.slice(0, 2).map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="text-[10px] px-1.5 py-0 h-4"
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                                {preset.tags.length > 2 && (
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 h-4"
                                    >
                                        +{preset.tags.length - 2}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium">{preset.name}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                        {preset.description}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Loading skeleton for preset cards
 */
function PresetCardSkeleton() {
    return (
        <Card>
            <Skeleton className="aspect-video w-full rounded-t-lg" />
            <CardContent className="p-3">
                <Skeleton className="mb-2 h-4 w-20" />
                <div className="flex gap-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-10" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Tag filter button component
 */
interface TagFilterProps {
    tag: string;
    isActive: boolean;
    onClick: () => void;
}

function TagFilter({ tag, isActive, onClick }: TagFilterProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
            aria-pressed={isActive}
        >
            {tag}
        </button>
    );
}

/**
 * CaptionStylePresets Component
 *
 * Displays caption style presets in a grid layout with:
 * - Visual preview for each preset (Requirement 9.3)
 * - At least 5 pre-designed presets (Requirement 9.1)
 * - Hover to see full preview
 * - Click to apply preset
 * - Visual indicator for selected preset
 * - Filter by tags
 *
 * @example
 * ```tsx
 * const [selectedPresetId, setSelectedPresetId] = useState<string>();
 *
 * <CaptionStylePresets
 *   selectedPresetId={selectedPresetId}
 *   onSelect={(presetId) => {
 *     setSelectedPresetId(presetId);
 *     // Apply preset style to caption
 *   }}
 * />
 * ```
 *
 * @validates Requirements 9.1, 9.3
 */
export function CaptionStylePresets({
    presets = DEFAULT_PRESETS,
    selectedPresetId,
    onSelect,
    className,
    isLoading = false,
    disabled = false,
    filterTags,
}: CaptionStylePresetsProps) {
    const [activeTagFilters, setActiveTagFilters] = useState<string[]>(
        filterTags || []
    );

    // Get all unique tags from presets
    const allTags = useMemo(() => getAllTags(presets), [presets]);

    // Filter presets based on active tag filters
    const filteredPresets = useMemo(() => {
        if (activeTagFilters.length === 0) {
            return presets;
        }
        return presets.filter((preset) =>
            activeTagFilters.some((tag) => preset.tags.includes(tag))
        );
    }, [presets, activeTagFilters]);

    // Toggle tag filter
    const toggleTagFilter = useCallback((tag: string) => {
        setActiveTagFilters((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    }, []);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setActiveTagFilters([]);
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <div
                className={cn("flex flex-col gap-4", className)}
                role="region"
                aria-label="Caption style presets"
                aria-busy="true"
            >
                <div className="flex items-center gap-2">
                    <IconSparkles className="size-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Style Presets</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <PresetCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (presets.length === 0) {
        return (
            <div
                className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center",
                    className
                )}
                role="region"
                aria-label="Caption style presets"
            >
                <IconPalette className="size-8 text-muted-foreground" />
                <p className="font-medium text-sm">No presets available</p>
                <p className="text-muted-foreground text-xs">
                    Caption style presets will appear here once configured.
                </p>
            </div>
        );
    }

    return (
        <div
            className={cn("flex flex-col gap-4", className)}
            role="region"
            aria-label="Caption style presets"
            data-testid="caption-style-presets"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <IconSparkles className="size-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Style Presets</span>
                </div>
                <span className="text-muted-foreground text-xs">
                    {filteredPresets.length} preset{filteredPresets.length !== 1 ? "s" : ""}{" "}
                    available
                </span>
            </div>

            {/* Tag filters */}
            {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-xs">Filter:</span>
                    {allTags.map((tag) => (
                        <TagFilter
                            key={tag}
                            tag={tag}
                            isActive={activeTagFilters.includes(tag)}
                            onClick={() => toggleTagFilter(tag)}
                        />
                    ))}
                    {activeTagFilters.length > 0 && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            )}

            {/* Preset grid - Requirement 9.1: Display at least 5 caption style presets */}
            <div
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                role="listbox"
                aria-label="Select a caption style preset"
            >
                {filteredPresets.map((preset) => (
                    <PresetCard
                        key={preset.id}
                        preset={preset}
                        isSelected={selectedPresetId === preset.id}
                        onSelect={() => onSelect(preset.id)}
                        disabled={disabled}
                    />
                ))}
            </div>

            {/* No results after filtering */}
            {filteredPresets.length === 0 && activeTagFilters.length > 0 && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center">
                    <p className="text-muted-foreground text-sm">
                        No presets match the selected filters.
                    </p>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="text-sm text-primary hover:underline"
                    >
                        Clear filters
                    </button>
                </div>
            )}

            {/* Selected preset info */}
            {selectedPresetId && (
                <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-muted-foreground text-xs">
                        <span className="font-medium text-foreground">Selected:</span>{" "}
                        {presets.find((p) => p.id === selectedPresetId)?.name ?? "Unknown"}
                    </p>
                </div>
            )}
        </div>
    );
}

/**
 * Get a preset by ID from the default presets
 */
export function getPresetById(presetId: string): CaptionStylePreset | undefined {
    return DEFAULT_PRESETS.find((preset) => preset.id === presetId);
}

/**
 * Get the style from a preset by ID
 */
export function getPresetStyle(presetId: string): CaptionStyle | undefined {
    return getPresetById(presetId)?.style;
}

export default CaptionStylePresets;
