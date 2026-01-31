"use client";

import { use, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
    IconScissors,
    IconLoader2,
    IconFlame,
    IconClock,
    IconHeartFilled,
    IconHeart,
    IconFilter,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ClipDetailModal, useClipModalUrlState } from "@/components/clips/clip-detail-modal";
import { useMyVideos } from "@/hooks/useVideo";
import { useClipsByVideo } from "@/hooks/useClips";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";
import type { ClipResponse } from "@/lib/api/clips";

interface AllClipsPageProps {
    params: Promise<{ "workspace-slug": string }>;
    searchParams: Promise<{ favorites?: string }>;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getScoreColor(score: number): string {
    if (score >= 70) return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (score >= 40) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    return "bg-red-500/10 text-red-600 dark:text-red-400";
}

interface ClipCardProps {
    clip: ClipResponse;
    onClick: () => void;
}

function ClipCard({ clip, onClick }: ClipCardProps) {
    const thumbnailUrl = clip.storageUrl || clip.thumbnailUrl;
    const scoreColorClass = getScoreColor(clip.viralityScore);

    return (
        <Card
            className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/20"
            onClick={onClick}
        >
            <div className="relative aspect-video bg-muted">
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={clip.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <IconScissors className="size-12 text-muted-foreground/30" />
                    </div>
                )}

                <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-white text-xs">
                    <IconClock className="size-3" />
                    {formatDuration(clip.duration)}
                </div>

                <Badge
                    className={cn(
                        "absolute left-2 top-2 flex items-center gap-1",
                        scoreColorClass
                    )}
                >
                    <IconFlame className="size-3" />
                    {clip.viralityScore}
                </Badge>

                {clip.favorited && (
                    <div className="absolute right-2 top-2">
                        <IconHeartFilled className="size-5 text-red-500 drop-shadow-md" />
                    </div>
                )}
            </div>

            <CardContent className="p-3">
                <h3 className="line-clamp-2 font-medium text-sm leading-tight">
                    {clip.title}
                </h3>

                {clip.viralityReason && (
                    <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
                        {clip.viralityReason}
                    </p>
                )}

                {clip.hooks.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {clip.hooks.slice(0, 2).map((hook, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">
                                {hook}
                            </Badge>
                        ))}
                        {clip.hooks.length > 2 && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                +{clip.hooks.length - 2}
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function AllClipsPage({ params, searchParams }: AllClipsPageProps) {
    const { "workspace-slug": slug } = use(params);
    const { favorites } = use(searchParams);
    const router = useRouter();
    const showFavoritesOnly = favorites === "true";

    const [sortBy, setSortBy] = useState<"score" | "duration" | "createdAt">("score");

    const { selectedClipId, isOpen, openModal, closeModal } = useClipModalUrlState();

    const { data: workspace } = useWorkspaceBySlug(slug);
    const { data: videos, isLoading: videosLoading } = useMyVideos(workspace?.id || "", !!workspace?.id);

    // Get completed videos
    const completedVideos = videos?.filter((v) => v.status === "completed") || [];

    // Fetch clips for all completed videos
    const clipsQueries = completedVideos.map((video) => {
        const { data: clips } = useClipsByVideo(video.id);
        return clips || [];
    });

    // Flatten all clips
    let allClips = clipsQueries.flat();

    // Filter favorites if needed
    if (showFavoritesOnly) {
        allClips = allClips.filter((clip) => clip.favorited);
    }

    // Sort clips
    allClips = [...allClips].sort((a, b) => {
        if (sortBy === "score") return b.viralityScore - a.viralityScore;
        if (sortBy === "duration") return b.duration - a.duration;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const handleClipSelect = useCallback(
        (clipId: string) => {
            openModal(clipId);
        },
        [openModal]
    );

    const handleEditClip = useCallback(
        (clipId: string) => {
            router.push(`/${slug}/clips/${clipId}`);
        },
        [router, slug]
    );

    const handleFilterChange = (value: string | null) => {
        if (value === "favorites") {
            router.push(`/${slug}/clips?favorites=true`);
        } else {
            router.push(`/${slug}/clips`);
        }
    };

    if (videosLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-3">
                    <IconScissors className="size-6" />
                    <h1 className="text-xl font-semibold">
                        {showFavoritesOnly ? "Favorite Clips" : "All Clips"}
                    </h1>
                    <Badge variant="secondary">{allClips.length}</Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        value={showFavoritesOnly ? "favorites" : "all"}
                        onValueChange={handleFilterChange}
                    >
                        <SelectTrigger className="w-[140px]">
                            <IconFilter className="mr-2 size-4" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Clips</SelectItem>
                            <SelectItem value="favorites">
                                <span className="flex items-center gap-2">
                                    <IconHeart className="size-4" />
                                    Favorites
                                </span>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={sortBy}
                        onValueChange={(v) => setSortBy(v as typeof sortBy)}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="score">Viral Score</SelectItem>
                            <SelectItem value="duration">Duration</SelectItem>
                            <SelectItem value="createdAt">Newest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Clips Grid */}
            <div className="flex-1 overflow-auto p-6">
                {allClips.length === 0 ? (
                    <EmptyState
                        icon={showFavoritesOnly ? <IconHeart className="size-6" /> : <IconScissors className="size-6" />}
                        title={showFavoritesOnly ? "No favorite clips" : "No clips yet"}
                        description={
                            showFavoritesOnly
                                ? "Mark clips as favorites to see them here"
                                : "Upload a video to generate viral clips"
                        }
                        action={
                            !showFavoritesOnly
                                ? {
                                    label: "Upload Video",
                                    onClick: () => router.push(`/${slug}`),
                                }
                                : undefined
                        }
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {allClips.map((clip) => (
                            <ClipCard
                                key={clip.id}
                                clip={clip}
                                onClick={() => handleClipSelect(clip.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Clip Detail Modal */}
            <ClipDetailModal
                clipId={selectedClipId}
                isOpen={isOpen}
                onClose={closeModal}
                onEdit={handleEditClip}
            />
        </div>
    );
}
