"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconLayoutRows, IconLock, IconArrowUp } from "@tabler/icons-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UpgradeDialog } from "@/components/pricing/upgrade-dialog";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { backgroundVideoApi, type BackgroundVideo, type BackgroundCategory } from "@/lib/api/background-video";
import type { VideoConfigInput } from "@/lib/api/video-config";
import { cn } from "@/lib/utils";

interface SplitScreenSectionProps {
    config: VideoConfigInput;
    onChange: (updates: Partial<VideoConfigInput>) => void;
    disabled?: boolean;
    userPlan: string;
    workspaceSlug: string;
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
                "relative rounded-xl border-2 overflow-hidden transition-all aspect-auto",
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
                    style={{ imageRendering: "crisp-edges" }}
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

export function SplitScreenSection({ config, onChange, disabled, userPlan, workspaceSlug }: SplitScreenSectionProps) {
    const isFreePlan = userPlan === "free";
    const isEnabled = config.enableSplitScreen ?? false;
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
    const VIDEOS_PER_PAGE = 8; // 4 columns x 2 rows

    const { data: categories = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ["background-categories"],
        queryFn: backgroundVideoApi.listCategories,
        enabled: isEnabled && !isFreePlan,
        staleTime: 1000 * 60 * 10,
    });

    const { data: allVideos = [], isLoading: videosLoading } = useQuery({
        queryKey: ["background-videos-all"],
        queryFn: backgroundVideoApi.listAllVideos,
        enabled: isEnabled && !isFreePlan,
        staleTime: 1000 * 60 * 5,
    });

    // Filter videos by selected category
    const filteredVideos = useMemo(() => {
        if (!selectedCategorySlug) return allVideos;
        const category = categories.find((c) => c.slug === selectedCategorySlug);
        if (!category) return allVideos;
        return allVideos.filter((v) => v.categoryId === category.id);
    }, [allVideos, selectedCategorySlug, categories]);

    // Group videos into pages (8 per page)
    const videoPages = useMemo(() => {
        const pages = [];
        for (let i = 0; i < filteredVideos.length; i += VIDEOS_PER_PAGE) {
            pages.push(filteredVideos.slice(i, i + VIDEOS_PER_PAGE));
        }
        return pages;
    }, [filteredVideos]);

    const handleCategoryFilter = (slug: string | null) => {
        setSelectedCategorySlug(slug);
    };

    const handleToggle = (checked: boolean) => {
        if (isFreePlan) {
            setShowUpgradeDialog(true);
            return;
        }
        onChange({
            enableSplitScreen: checked,
            // Force 9:16 when enabling split-screen
            ...(checked ? { aspectRatio: "9:16" } : {}),
        });
    };

    const handleVideoSelect = (videoId: string) => {
        onChange({
            splitScreenBgVideoId: videoId,
            splitScreenBgCategoryId: null, // Clear category since we're not using it
        });
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
                <div className="flex items-center gap-2.5">
                    <IconLayoutRows className="size-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Split Screen</span>
                        {isFreePlan && (
                            <Badge
                                variant="secondary"
                                className="gap-1 cursor-pointer"
                                onClick={() => setShowUpgradeDialog(true)}
                            >
                                <IconLock className="size-3" />
                                Starter
                            </Badge>
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
                <p
                    className="text-xs text-muted-foreground pl-8 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => setShowUpgradeDialog(true)}
                >
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

                    {/* Video Grid */}
                    <div className="space-y-2.5">
                        <Label className="text-sm font-medium">Background Video</Label>

                        {/* Category Filter Chips */}
                        {!categoriesLoading && categories.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleCategoryFilter(null)}
                                    disabled={disabled}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                        selectedCategorySlug === null
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    )}
                                >
                                    All
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => handleCategoryFilter(category.slug)}
                                        disabled={disabled}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
                                            selectedCategorySlug === category.slug
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        )}
                                    >
                                        <span>{CATEGORY_EMOJIS[category.slug] ?? "🎬"}</span>
                                        <span>{category.displayName}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {videosLoading ? (
                            <div className="grid grid-cols-4 gap-2.5">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Skeleton key={i} className="aspect-9/16 rounded-lg" />
                                ))}
                            </div>
                        ) : filteredVideos.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                No background videos available{selectedCategorySlug ? " in this category" : ""}.
                            </p>
                        ) : (
                            <Carousel
                                opts={{
                                    align: "start",
                                    loop: false,
                                }}
                                className="w-full"
                            >
                                <CarouselContent>
                                    {videoPages.map((page, pageIndex) => (
                                        <CarouselItem key={pageIndex}>
                                            <div className="grid grid-cols-4 gap-2.5">
                                                {page.map((video) => (
                                                    <VideoCard
                                                        key={video.id}
                                                        video={video}
                                                        isSelected={config.splitScreenBgVideoId === video.id}
                                                        disabled={disabled}
                                                        onSelect={handleVideoSelect}
                                                    />
                                                ))}
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {videoPages.length > 1 && (
                                    <>
                                        <CarouselPrevious className="left-0 -translate-x-1/2" />
                                        <CarouselNext className="right-0 translate-x-1/2" />
                                    </>
                                )}
                            </Carousel>
                        )}
                    </div>

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

            {isFreePlan && (
                <UpgradeDialog
                    open={showUpgradeDialog}
                    onOpenChange={setShowUpgradeDialog}
                    workspaceSlug={workspaceSlug}
                    feature="Split Screen"
                    description="Add engaging background videos like Subway Surfer, Minecraft, and more to boost retention."
                />
            )}
        </div>
    );
}
