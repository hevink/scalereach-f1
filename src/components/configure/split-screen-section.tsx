"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconLayoutRows, IconLock, IconArrowUp } from "@tabler/icons-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { backgroundVideoApi, type BackgroundCategory, type BackgroundVideo } from "@/lib/api/background-video";
import type { VideoConfigInput } from "@/lib/api/video-config";
import { cn } from "@/lib/utils";

interface SplitScreenSectionProps {
    config: VideoConfigInput;
    onChange: (updates: Partial<VideoConfigInput>) => void;
    disabled?: boolean;
    userPlan: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
    "subway-surfer": "🏃",
    minecraft: "⛏️",
    asmr: "🎧",
    satisfying: "✨",
    parkour: "🤸",
    "soap-cutting": "🧼",
    slime: "🫧",
    cooking: "🍳",
};

function VideoCard({
    video,
    isSelected,
    disabled,
    onSelect,
}: {
    video: BackgroundVideo;
    isSelected: boolean;
    disabled?: boolean;
    onSelect: (id: string) => void;
}) {
    const [imgError, setImgError] = useState(false);

    return (
        <button
            type="button"
            onClick={() => onSelect(video.id)}
            disabled={disabled}
            className={cn(
                "relative rounded-xl border-2 overflow-hidden transition-all aspect-9/16",
                isSelected
                    ? "border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/20"
                    : "border-border/50 hover:border-border hover:ring-1 hover:ring-primary/20"
            )}
        >
            {video.thumbnailUrl && !imgError ? (
                <img
                    src={video.thumbnailUrl}
                    alt={video.displayName}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground px-1 text-center">
                    {video.displayName}
                </div>
            )}
            {/* Selected checkmark */}
            {isSelected && (
                <div className="absolute top-1.5 right-1.5 size-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="size-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
            {/* Duration badge */}
            <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
            </span>
            {/* Video name */}
            <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium truncate max-w-[70%]">
                {video.displayName}
            </span>
        </button>
    );
}

export function SplitScreenSection({ config, onChange, disabled, userPlan }: SplitScreenSectionProps) {
    const isFreePlan = userPlan === "free";
    const isEnabled = config.enableSplitScreen ?? false;
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
        config.splitScreenBgCategoryId ?? null
    );

    const { data: categories = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ["background-categories"],
        queryFn: backgroundVideoApi.listCategories,
        enabled: isEnabled && !isFreePlan,
        staleTime: 1000 * 60 * 10,
    });

    const { data: videos = [], isLoading: videosLoading } = useQuery({
        queryKey: ["background-videos", selectedCategoryId],
        queryFn: () => backgroundVideoApi.listVideosByCategory(selectedCategoryId!),
        enabled: !!selectedCategoryId && isEnabled,
        staleTime: 1000 * 60 * 5,
    });

    // Sync selectedCategoryId with config
    useEffect(() => {
        if (config.splitScreenBgCategoryId !== selectedCategoryId) {
            setSelectedCategoryId(config.splitScreenBgCategoryId ?? null);
        }
    }, [config.splitScreenBgCategoryId]);

    const handleToggle = (checked: boolean) => {
        if (isFreePlan) return;
        onChange({
            enableSplitScreen: checked,
            // Force 9:16 when enabling split-screen
            ...(checked ? { aspectRatio: "9:16" } : {}),
        });
    };

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategoryId(categoryId);
        onChange({
            splitScreenBgCategoryId: categoryId,
            splitScreenBgVideoId: null, // Reset video selection when category changes
        });
    };

    const handleVideoSelect = (videoId: string) => {
        onChange({ splitScreenBgVideoId: videoId });
    };

    const handleRatioChange = (value: number | readonly number[]) => {
        const v = Array.isArray(value) ? value[0] : value;
        // Snap to increments of 5
        const snapped = Math.round(v / 5) * 5;
        onChange({ splitRatio: snapped });
    };

    const splitRatio = config.splitRatio ?? 50;

    return (
        <div className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <IconLayoutRows className="size-5 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                        <Label className="text-base font-medium">Split Screen</Label>
                        {isFreePlan && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="gap-1 cursor-default">
                                        <IconLock className="size-3" />
                                        Starter
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Upgrade to Starter to unlock Split Screen
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>
                <Switch
                    checked={isEnabled}
                    onCheckedChange={handleToggle}
                    disabled={disabled || isFreePlan}
                />
            </div>

            {isFreePlan && (
                <p className="text-xs text-muted-foreground pl-8">
                    Add engaging background videos like Subway Surfer, Minecraft, and more to boost retention.
                </p>
            )}

            {/* Content (shown when enabled) */}
            {isEnabled && !isFreePlan && (
                <div className="space-y-5 pt-2">
                    {/* 9:16 info */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <IconArrowUp className="size-3.5 rotate-45" />
                        Aspect ratio locked to 9:16 for split-screen mode
                    </p>

                    {/* Category Selection */}
                    <div className="space-y-2.5">
                        <Label className="text-sm font-medium">Background Category</Label>
                        {categoriesLoading ? (
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 rounded-lg" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => handleCategorySelect(cat.id)}
                                        disabled={disabled}
                                        className={cn(
                                            "flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs transition-all hover:bg-muted/50",
                                            selectedCategoryId === cat.id
                                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                : "border-border"
                                        )}
                                    >
                                        <span className="text-lg">{CATEGORY_EMOJIS[cat.slug] ?? "🎬"}</span>
                                        <span className="font-medium truncate w-full text-center">{cat.displayName}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Video Grid (shown when category selected) */}
                    {selectedCategoryId && (
                        <div className="space-y-2.5">
                            <Label className="text-sm font-medium">Background Video</Label>
                            {videosLoading ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <Skeleton key={i} className="aspect-video rounded-lg" />
                                    ))}
                                </div>
                            ) : videos.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                    No videos in this category yet. A random one will be picked automatically.
                                </p>
                            ) : (
                                <div className="grid grid-cols-4 gap-2.5">
                                    {videos.map((video) => (
                                        <VideoCard
                                            key={video.id}
                                            video={video}
                                            isSelected={config.splitScreenBgVideoId === video.id}
                                            disabled={disabled}
                                            onSelect={handleVideoSelect}
                                        />
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Leave unselected for a random background from this category.
                            </p>
                        </div>
                    )}

                    {/* Split Ratio Slider */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Split Ratio</Label>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {splitRatio}% / {100 - splitRatio}%
                            </span>
                        </div>
                        <Slider
                            value={[splitRatio]}
                            min={30}
                            max={70}
                            onValueChange={handleRatioChange}
                            disabled={disabled}
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Main video</span>
                            <span>Background</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
