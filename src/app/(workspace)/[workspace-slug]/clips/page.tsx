"use client";

import { use, useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    IconScissors,
    IconLoader2,
    IconHeartFilled,
    IconHeart,
    IconFilter,
    IconDownload,
    IconEdit,
    IconShare2,
    IconSparkles,
    IconVideo,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";
import type { ClipResponse } from "@/lib/api/clips";

interface AllClipsPageProps {
    params: Promise<{ "workspace-slug": string }>;
    searchParams: Promise<{ favorites?: string }>;
}

interface ClipCardProps {
    clip: ClipResponse;
    index: number;
    onEdit: (clipId: string) => void;
    onFavorite: (e: React.MouseEvent, clipId: string) => void;
    onDownload: (clip: ClipResponse) => void;
    onShare: (clip: ClipResponse) => void;
}

function ClipCard({ clip, index, onEdit, onFavorite, onDownload, onShare }: ClipCardProps) {
    const [activeTab, setActiveTab] = useState<"transcript" | "description">("transcript");
    const isGenerating = clip.status === "generating" || clip.status === "detected";

    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            {/* Clip Title */}
            <div className="px-5 py-3 border-b bg-muted/30">
                <h3 className="font-semibold text-base">
                    <span className="text-muted-foreground">#{index + 1}</span>{" "}
                    {clip.title}
                </h3>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
                    {/* Video Preview */}
                    <div className="shrink-0">
                        <div className="relative w-full lg:w-[230px] h-[400px] rounded-lg overflow-hidden bg-black">
                            {isGenerating ? (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                                    <IconLoader2 className="size-8 animate-spin text-primary" />
                                    <span className="text-xs text-muted-foreground">Generating clip...</span>
                                </div>
                            ) : clip.storageUrl ? (
                                <video
                                    src={clip.storageUrl}
                                    poster={clip.thumbnailUrl}
                                    className="h-full w-full object-cover"
                                    controls
                                />
                            ) : clip.thumbnailUrl ? (
                                <img
                                    src={clip.thumbnailUrl}
                                    alt={clip.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <IconVideo className="size-12 text-muted-foreground/30" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <div className="h-full">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "transcript" | "description")}>
                            <TabsList className="mb-3">
                                <TabsTrigger value="transcript" className="gap-1.5">
                                    <span className="size-2 rounded-full bg-green-500" />
                                    Transcript
                                </TabsTrigger>
                                <TabsTrigger value="description" className="gap-1.5">
                                    <span className="size-2 rounded-full bg-muted-foreground" />
                                    Auto-Description
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="transcript" className="mt-0">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {clip.transcript || "No transcript available."}
                                </p>
                            </TabsContent>

                            <TabsContent value="description" className="mt-0">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {clip.viralityReason || "No auto-description available."}
                                </p>
                                {clip.hooks.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {clip.hooks.map((hook, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                                {hook}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            className="gap-2"
                            onClick={() => onDownload(clip)}
                            disabled={!clip.storageUrl || isGenerating}
                        >
                            <IconDownload className="size-4" />
                            Download
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            disabled={isGenerating}
                        >
                            <IconSparkles className="size-4" />
                            Remove watermark
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => onEdit(clip.id)}
                            disabled={isGenerating}
                        >
                            <IconEdit className="size-4" />
                            Edit
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                                "size-9",
                                clip.favorited && "text-red-500 hover:text-red-600"
                            )}
                            onClick={(e) => onFavorite(e, clip.id)}
                        >
                            {clip.favorited ? (
                                <IconHeartFilled className="size-5" />
                            ) : (
                                <IconHeart className="size-5" />
                            )}
                        </Button>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-9"
                            onClick={() => onShare(clip)}
                        >
                            <IconShare2 className="size-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AllClipsPage({ params, searchParams }: AllClipsPageProps) {
    const { "workspace-slug": slug } = use(params);
    const { favorites } = use(searchParams);
    const router = useRouter();
    const showFavoritesOnly = favorites === "true";

    const [sortBy, setSortBy] = useState<"score" | "duration" | "createdAt">("score");

    const { data: workspace } = useWorkspaceBySlug(slug);
    const { data: videos, isLoading: videosLoading } = useMyVideos(workspace?.id || "", !!workspace?.id);
    const toggleFavorite = useToggleFavorite();

    // Get completed videos
    const completedVideos = videos?.filter((v) => v.status === "completed") || [];

    // Get video IDs in a stable way
    const videoIds = useMemo(() => completedVideos.map(v => v.id), [completedVideos]);

    // Fetch clips for each video - call hooks unconditionally
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

    // Collect all clips
    const allClipsData = [
        clips0.data || [],
        clips1.data || [],
        clips2.data || [],
        clips3.data || [],
        clips4.data || [],
        clips5.data || [],
        clips6.data || [],
        clips7.data || [],
        clips8.data || [],
        clips9.data || [],
    ].flat();

    // Filter and sort
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
                    // Refetch all clip queries to update the UI
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

    const handleDownload = useCallback((clip: ClipResponse) => {
        if (clip.storageUrl) {
            const link = document.createElement("a");
            link.href = clip.storageUrl;
            link.download = `${clip.title || "clip"}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, []);

    const handleShare = useCallback((clip: ClipResponse) => {
        if (navigator.share && clip.storageUrl) {
            navigator.share({
                title: clip.title,
                url: clip.storageUrl,
            });
        } else {
            // Fallback: copy to clipboard
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

    if (videosLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-background">
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

            {/* Clips List */}
            <div className="flex-1 overflow-auto p-6 flex justify-center">
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
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
