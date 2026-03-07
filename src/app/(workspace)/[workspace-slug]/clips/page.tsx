"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    IconScissors,
    IconLoader2,
    IconHeart,
    IconFilter,
    IconCalendar,
    IconArrowRight,
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
import { useClipsByWorkspace, useToggleFavorite } from "@/hooks/useClips";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { analytics } from "@/lib/analytics";
import type { ClipFilters, ClipResponse } from "@/lib/api/clips";
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

    const filters: Partial<ClipFilters> = {
        sortBy,
        sortOrder: "desc",
        ...(showFavoritesOnly ? { favorited: true } : {}),
    };

    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch,
    } = useClipsByWorkspace(workspace?.id || "", filters);

    const toggleFavorite = useToggleFavorite();

    // Flatten all pages
    const allClips = data?.pages.flatMap((p) => p.clips) ?? [];

    // Sentinel ref for IntersectionObserver
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleEditClip = useCallback(
        (clipId: string) => router.push(`/${slug}/clips/${clipId}`),
        [router, slug]
    );

    const handleFavorite = useCallback(
        (e: React.MouseEvent, clipId: string) => {
            e.stopPropagation();
            toggleFavorite.mutate(clipId, { onSuccess: () => refetch() });
        },
        [toggleFavorite, refetch]
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
        router.push(value === "favorites" ? `/${slug}/clips?favorites=true` : `/${slug}/clips`);
    };

    if (isLoading || !workspace) {
        return (
            <div className="flex h-full items-center justify-center">
                <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const userPlan = (workspace?.plan || "free") as "free" | "starter" | "pro" | "agency";
    const totalCount = data?.pages[0]?.clips !== undefined ? allClips.length : 0;

    return (
        <div className="flex h-full flex-col bg-background">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                    <IconScissors className="size-5 sm:size-6" />
                    <h1 className="text-lg sm:text-xl font-semibold">
                        {showFavoritesOnly ? "Favorite Clips" : "All Clips"}
                    </h1>
                    <Badge variant="secondary">{allClips.length}{hasNextPage ? "+" : ""}</Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={showFavoritesOnly ? "favorites" : "all"} onValueChange={handleFilterChange}>
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

                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
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

            <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center">
                {allClips.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <EmptyState
                            illustration={showFavoritesOnly ? "favorites" : "clips"}
                            title={showFavoritesOnly ? "No favorite clips" : "No clips yet"}
                            description={
                                showFavoritesOnly
                                    ? "Heart the clips you love to find them quickly here"
                                    : "Upload a video to generate viral clips"
                            }
                            action={
                                showFavoritesOnly
                                    ? { label: "View All Clips", onClick: () => setShowFavoritesOnly(false) }
                                    : { label: "Upload Video", onClick: () => router.push(`/${slug}`) }
                            }
                        />
                    </div>
                ) : (
                    <div className="space-y-6 max-w-4xl w-full">
                        <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    <IconCalendar className="size-4 text-primary" />
                                </div>
                                <p className="text-sm text-foreground">
                                    Ready to grow? Schedule your clips to TikTok, Instagram, YouTube Shorts & more.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push(`/${slug}/social`)}
                                className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                Schedule
                                <IconArrowRight className="size-3" />
                            </button>
                        </div>

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
                                workspaceId={workspace?.id}
                            />
                        ))}

                        {/* Scroll sentinel */}
                        <div ref={sentinelRef} className="h-4" />

                        {isFetchingNextPage && (
                            <div className="flex justify-center py-4">
                                <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
