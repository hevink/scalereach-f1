"use client";

import { use, useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    IconScissors,
    IconLoader2,
    IconHeart,
    IconFilter,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useMyVideos } from "@/hooks/useVideo";
import { useClipsByVideo, useToggleFavorite } from "@/hooks/useClips";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { analytics } from "@/lib/analytics";
import type { ClipResponse } from "@/lib/api/clips";
import { ClipCard } from "@/components/clips/clip-card";

interface AllClipsPageProps {
    params: Promise<{ "workspace-slug": string }>;
    searchParams: Promise<{ favorites?: string }>;
}

export default function AllClipsPage({ params, searchParams }: AllClipsPageProps) {
    const { "workspace-slug": slug } = use(params);
    const { favorites } = use(searchParams);
    const router = useRouter();
    const showFavoritesOnly = favorites === "true";

    const [sortBy, setSortBy] = useState<"score" | "duration" | "createdAt">("createdAt");

    const { data: workspace } = useWorkspaceBySlug(slug);
    const { data: videos, isLoading: videosLoading } = useMyVideos(workspace?.id || "", !!workspace?.id);
    const toggleFavorite = useToggleFavorite();

    // Get completed videos
    const completedVideos = videos?.filter((v) => v.status === "completed") || [];
    const videoIds = useMemo(() => completedVideos.map(v => v.id), [completedVideos]);

    const clips0 = useClipsByVideo(videoIds[0] || "");
    const clips1 = useClipsByVideo(videoIds[1] || "");
    const clips2 = useClipsByVideo(videoIds[2] || "");
    const clips3 = useClipsByVideo(videoIds[3] || "");
    const clips4 = useClipsByVideo(videoIds[4] || "");
    const clips5 = useClipsByVideo(videoIds[5] || "");
    const clips6 = useClipsByVideo(videoIds[6] || "");
    const clips7 = useClipsByVideo(videoIds[7] || "");
    const clips8 = useClipsByVideo(videoIds[8] || "");
    const clips9 = useClipsByVideo(videoIds[9] || "");

    const clipsQueries = [clips0, clips1, clips2, clips3, clips4, clips5, clips6, clips7, clips8, clips9];
    const clipsLoading = videoIds.length > 0 && clipsQueries.some((q, i) => i < videoIds.length && q.isLoading);
    const allClipsData = clipsQueries.map(q => q.data || []).flat();

    let allClips = showFavoritesOnly
        ? allClipsData.filter((clip) => clip.favorited)
        : allClipsData;

    allClips = [...allClips].sort((a, b) => {
        if (sortBy === "score") return b.viralityScore - a.viralityScore;
        if (sortBy === "duration") return b.duration - a.duration;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const handleEditClip = useCallback(
        (clipId: string) => {
            router.push(`/${slug}/clips/${clipId}`);
        },
        [router, slug]
    );

    const handleFavorite = useCallback(
        (e: React.MouseEvent, clipId: string) => {
            e.stopPropagation();
            toggleFavorite.mutate(clipId, {
                onSuccess: () => {
                    clips0.refetch();
                    clips1.refetch();
                    clips2.refetch();
                    clips3.refetch();
                    clips4.refetch();
                    clips5.refetch();
                    clips6.refetch();
                    clips7.refetch();
                    clips8.refetch();
                    clips9.refetch();
                }
            });
        },
        [toggleFavorite, clips0, clips1, clips2, clips3, clips4, clips5, clips6, clips7, clips8, clips9]
    );

    const handleDownload = useCallback(async (clip: ClipResponse) => {
        if (clip.storageUrl) {
            analytics.clipDownloaded(clip.id);
            try {
                const response = await fetch(clip.storageUrl);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${clip.title || "clip"}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch {
                // Fallback: open in new tab
                window.open(clip.storageUrl, "_blank");
            }
        }
    }, []);

    const handleShare = useCallback((clip: ClipResponse) => {
        if (navigator.share && clip.storageUrl) {
            navigator.share({ title: clip.title, url: clip.storageUrl });
        } else {
            navigator.clipboard.writeText(clip.storageUrl || "");
        }
    }, []);

    const handleFilterChange = (value: string | null) => {
        if (value === "favorites") {
            router.push(`/${slug}/clips?favorites=true`);
        } else {
            router.push(`/${slug}/clips`);
        }
    };

    if (videosLoading || clipsLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const userPlan = (workspace?.plan || "free") as "free" | "starter" | "pro" | "agency";

    return (
        <div className="flex h-full flex-col bg-background">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                    <IconScissors className="size-5 sm:size-6" />
                    <h1 className="text-lg sm:text-xl font-semibold">
                        {showFavoritesOnly ? "Favorite Clips" : "All Clips"}
                    </h1>
                    <Badge variant="secondary">{allClips.length}</Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        value={showFavoritesOnly ? "favorites" : "all"}
                        onValueChange={handleFilterChange}
                    >
                        <SelectTrigger className="w-[120px] sm:w-[140px]">
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
                        <SelectTrigger className="w-[120px] sm:w-[140px]">
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

            {/* Clips List */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center">
                {allClips.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
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
                    </div>
                ) : (
                    <div className="space-y-6 max-w-4xl w-full">
                        {allClips.map((clip, index) => (
                            <ClipCard
                                key={clip.id}
                                clip={clip}
                                index={index}
                                onEdit={handleEditClip}
                                onFavorite={handleFavorite}
                                onDownload={handleDownload}
                                onShare={handleShare}
                                userPlan={userPlan}
                                workspaceSlug={slug}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
