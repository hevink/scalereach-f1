"use client";

/**
 * Public Clips Grid Component
 * Displays clips in a responsive grid with filtering and sorting
 * 
 * Validates: Requirements 6.1, 6.2, 6.7, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 22.1, 22.2, 22.3, 22.4, 22.5
 */

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconDownload, IconPlayerPlay } from "@tabler/icons-react";
import { FireIcon as FireAnimatedIcon } from "@/components/ui/fire-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface PublicClipData {
    id: string;
    title: string;
    duration: number;
    viralityScore: number;
    viralityReason: string;
    hooks: string[];
    thumbnailUrl: string;
    storageUrl: string;
    aspectRatio: string;
}

export interface PublicClipsGridProps {
    clips: PublicClipData[];
    videoTitle: string;
    onClipClick: (clip: PublicClipData) => void;
    onDownload: (clip: PublicClipData) => void;
    onDownloadAll: () => void;
}

type FilterOption = "all" | "high" | "medium" | "low";
type SortOption = "score" | "duration" | "title";
type SortOrder = "asc" | "desc";

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getViralityBadge(score: number) {
    if (score >= 80) {
        return { label: "High", variant: "default" as const, color: "text-green-600" };
    } else if (score >= 60) {
        return { label: "Medium", variant: "secondary" as const, color: "text-amber-600" };
    } else {
        return { label: "Low", variant: "outline" as const, color: "text-muted-foreground" };
    }
}

export function PublicClipsGrid({
    clips,
    videoTitle,
    onClipClick,
    onDownload,
    onDownloadAll,
}: PublicClipsGridProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [filter, setFilter] = useState<FilterOption>(
        (searchParams.get("filter") as FilterOption) || "all"
    );
    const [sort, setSort] = useState<SortOption>(
        (searchParams.get("sort") as SortOption) || "score"
    );
    const [order, setOrder] = useState<SortOrder>(
        (searchParams.get("order") as SortOrder) || "desc"
    );

    // Filter clips based on virality score
    const filteredClips = useMemo(() => {
        return clips.filter((clip) => {
            if (filter === "all") return true;
            if (filter === "high") return clip.viralityScore >= 80;
            if (filter === "medium") return clip.viralityScore >= 60 && clip.viralityScore < 80;
            if (filter === "low") return clip.viralityScore < 60;
            return true;
        });
    }, [clips, filter]);

    // Sort clips
    const sortedClips = useMemo(() => {
        const sorted = [...filteredClips];

        sorted.sort((a, b) => {
            let comparison = 0;

            if (sort === "score") {
                comparison = a.viralityScore - b.viralityScore;
            } else if (sort === "duration") {
                comparison = a.duration - b.duration;
            } else if (sort === "title") {
                comparison = a.title.localeCompare(b.title);
            }

            return order === "asc" ? comparison : -comparison;
        });

        return sorted;
    }, [filteredClips, sort, order]);

    // Update URL when filters change
    const updateFilters = (newFilter?: FilterOption, newSort?: SortOption, newOrder?: SortOrder) => {
        const params = new URLSearchParams(searchParams.toString());

        if (newFilter) {
            params.set("filter", newFilter);
            setFilter(newFilter);
        }
        if (newSort) {
            params.set("sort", newSort);
            setSort(newSort);
        }
        if (newOrder) {
            params.set("order", newOrder);
            setOrder(newOrder);
        }

        router.push(`?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="space-y-6">
            {/* Header with filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">{videoTitle}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {sortedClips.length} {sortedClips.length === 1 ? "clip" : "clips"} available
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Filter */}
                    <Select value={filter} onValueChange={(v) => updateFilters(v as FilterOption)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Clips</SelectItem>
                            <SelectItem value="high">High (80-100)</SelectItem>
                            <SelectItem value="medium">Medium (60-79)</SelectItem>
                            <SelectItem value="low">Low (0-59)</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select value={sort} onValueChange={(v) => updateFilters(undefined, v as SortOption)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="score">Virality Score</SelectItem>
                            <SelectItem value="duration">Duration</SelectItem>
                            <SelectItem value="title">Title</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort Order */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateFilters(undefined, undefined, order === "asc" ? "desc" : "asc")}
                    >
                        {order === "asc" ? "↑" : "↓"}
                    </Button>

                    {/* Download All */}
                    {clips.length > 0 && (
                        <Button
                            variant="default"
                            size="sm"
                            className="gap-2"
                            onClick={onDownloadAll}
                        >
                            <IconDownload className="size-4" />
                            Download All
                        </Button>
                    )}
                </div>
            </div>

            {/* Clips Grid */}
            {sortedClips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground">No clips match your filters</p>
                    <Button
                        variant="link"
                        onClick={() => updateFilters("all")}
                        className="mt-2"
                    >
                        Clear filters
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedClips.map((clip) => {
                        const badge = getViralityBadge(clip.viralityScore);

                        return (
                            <div
                                key={clip.id}
                                className="group rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                {/* Thumbnail */}
                                <div
                                    className="relative aspect-[9/16] bg-black cursor-pointer"
                                    onClick={() => onClipClick(clip)}
                                >
                                    {clip.thumbnailUrl ? (
                                        <img
                                            src={clip.thumbnailUrl}
                                            alt={clip.title}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <IconPlayerPlay className="size-12 text-muted-foreground/30" />
                                        </div>
                                    )}

                                    {/* Play overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="rounded-full bg-white/90 p-4">
                                            <IconPlayerPlay className="size-8 text-black" />
                                        </div>
                                    </div>

                                    {/* Duration badge */}
                                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                        {formatDuration(clip.duration)}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 space-y-3">
                                    {/* Title and Score */}
                                    <div>
                                        <h3 className="font-semibold line-clamp-2 mb-2">
                                            {clip.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={badge.variant} className="gap-1">
                                                <FireAnimatedIcon />
                                                {badge.label} ({clip.viralityScore})
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Hooks */}
                                    {clip.hooks.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {clip.hooks.slice(0, 3).map((hook, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                    {hook}
                                                </Badge>
                                            ))}
                                            {clip.hooks.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{clip.hooks.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 gap-2"
                                            onClick={() => onClipClick(clip)}
                                        >
                                            <IconPlayerPlay className="size-4" />
                                            Play
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="flex-1 gap-2"
                                            onClick={() => onDownload(clip)}
                                        >
                                            <IconDownload className="size-4" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
