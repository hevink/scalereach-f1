"use client";

import { use, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
    IconArrowLeft,
    IconAlertCircle,
    IconVideo,
    IconLoader2,
    IconClock,
    IconHeartFilled,
    IconHeart,
    IconDownload,
    IconEdit,
    IconShare2,
    IconSparkles,
    IconRefresh,
    IconFile,
    IconLanguage,
    IconAspectRatio,
    IconFlame,
    IconCalendar,
    IconMaximize,
    IconVolume,
    IconDotsVertical,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVideo } from "@/hooks/useVideo";
import { useClipsByVideo, useToggleFavorite } from "@/hooks/useClips";
import { cn } from "@/lib/utils";
import type { ClipResponse } from "@/lib/api/clips";

interface VideoClipsPageProps {
    params: Promise<{ "workspace-slug": string; id: string }>;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function VideoClipsLoading() {
    return (
        <div className="flex h-full flex-col bg-background">
            <div className="border-b px-6 py-4">
                <Skeleton className="h-7 w-96 mb-2" />
                <Skeleton className="h-4 w-24 mb-3" />
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border bg-card p-4">
                        <Skeleton className="h-6 w-64 mb-4" />
                        <div className="flex gap-4">
                            <Skeleton className="w-80 aspect-video rounded-lg" />
                            <div className="flex-1 space-y-3">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface VideoClipsErrorProps {
    error: Error | null;
    onBack: () => void;
}

function VideoClipsError({ error, onBack }: VideoClipsErrorProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <IconAlertCircle className="size-8 text-destructive" />
            </div>
            <div className="text-center">
                <h2 className="text-lg font-semibold">Failed to load clips</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {error?.message || "An error occurred while loading the clips."}
                </p>
            </div>
            <Button onClick={onBack} variant="outline">
                <IconArrowLeft className="mr-2 size-4" />
                Go Back
            </Button>
        </div>
    );
}

interface VideoNotFoundProps {
    onBack: () => void;
}

function VideoNotFound({ onBack }: VideoNotFoundProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <IconVideo className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
                <h2 className="text-lg font-semibold">Video not found</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    The video you&apos;re looking for doesn&apos;t exist or has been deleted.
                </p>
            </div>
            <Button onClick={onBack} variant="outline">
                <IconArrowLeft className="mr-2 size-4" />
                Go Back
            </Button>
        </div>
    );
}

interface NoClipsProps {
    videoTitle: string;
    videoStatus: string;
}

function NoClips({ videoTitle, videoStatus }: NoClipsProps) {
    if (videoStatus === "downloading") {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
                <IconLoader2 className="size-8 animate-spin text-primary" />
                <div className="text-center">
                    <h3 className="font-medium">Downloading Video</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Downloading &quot;{videoTitle}&quot; from YouTube...
                    </p>
                </div>
            </div>
        );
    }

    if (videoStatus === "uploading") {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
                <IconLoader2 className="size-8 animate-spin text-primary" />
                <div className="text-center">
                    <h3 className="font-medium">Uploading Video</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Uploading video to storage...
                    </p>
                </div>
            </div>
        );
    }

    if (videoStatus === "transcribing") {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
                <IconLoader2 className="size-8 animate-spin text-primary" />
                <div className="text-center">
                    <h3 className="font-medium">Transcribing Audio</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Converting speech to text for &quot;{videoTitle}&quot;...
                    </p>
                </div>
            </div>
        );
    }

    if (videoStatus === "analyzing" || videoStatus === "processing") {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
                <IconLoader2 className="size-8 animate-spin text-primary" />
                <div className="text-center">
                    <h3 className="font-medium">Detecting Viral Clips</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        AI is analyzing &quot;{videoTitle}&quot; for viral moments. This may take a few minutes.
                    </p>
                </div>
            </div>
        );
    }

    if (videoStatus === "failed" || videoStatus === "error") {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-8">
                <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
                    <IconAlertCircle className="size-6 text-destructive" />
                </div>
                <div className="text-center max-w-md">
                    <h3 className="font-medium text-destructive">Something went wrong</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        We couldn&apos;t process this video. Please try again or use a different video.
                    </p>
                </div>
            </div>
        );
    }

    if (videoStatus === "pending") {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
                <IconClock className="size-8 text-muted-foreground" />
                <div className="text-center">
                    <h3 className="font-medium">Queued for Processing</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        &quot;{videoTitle}&quot; is waiting in the queue. Processing will start soon.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
            <IconVideo className="size-8 text-muted-foreground" />
            <div className="text-center">
                <h3 className="font-medium">No Clips Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    No viral clips were detected in this video. Try a video with more engaging content.
                </p>
            </div>
        </div>
    );
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

export default function VideoClipsPage({ params }: VideoClipsPageProps) {
    const { "workspace-slug": slug, id: videoId } = use(params);
    const router = useRouter();

    const {
        data: video,
        isLoading: videoLoading,
        error: videoError,
    } = useVideo(videoId);

    const {
        data: clips,
        isLoading: clipsLoading,
        error: clipsError,
        refetch: refetchClips,
    } = useClipsByVideo(videoId);

    const toggleFavorite = useToggleFavorite();

    const handleBack = useCallback(() => {
        router.push(`/${slug}`);
    }, [router, slug]);

    const handleEditClip = useCallback(
        (clipId: string) => {
            router.push(`/${slug}/clips/${clipId}`);
        },
        [router, slug]
    );

    const handleFavorite = useCallback(
        (e: React.MouseEvent, clipId: string) => {
            e.stopPropagation();
            toggleFavorite.mutate(clipId);
        },
        [toggleFavorite]
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

    const handleRegenerate = useCallback(() => {
        refetchClips();
    }, [refetchClips]);

    if (videoLoading || clipsLoading) {
        return <VideoClipsLoading />;
    }

    if (videoError || clipsError) {
        return (
            <VideoClipsError
                error={(videoError || clipsError) as Error}
                onBack={handleBack}
            />
        );
    }

    if (!video) {
        return <VideoNotFound onBack={handleBack} />;
    }

    // Derive metadata for tags
    const sourceType = video.sourceType === "youtube" ? "YouTube" : "Local file";
    const aspectRatio = "9:16"; // Default, could come from video config
    const language = "English"; // Could come from video metadata

    return (
        <div className="flex h-full flex-col bg-background">
            {/* Header */}
            <div className="border-b px-6 py-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBack}
                            className="mt-0.5"
                            aria-label="Go back"
                        >
                            <IconArrowLeft className="size-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold">
                                {video.title || "Untitled Video"}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {formatDate(video.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* <Button variant="outline" className="gap-2" onClick={handleRegenerate}>
                        <IconRefresh className="size-4" />
                        Regenerate
                    </Button> */}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2 mt-3 ml-11">
                    <Badge variant="outline" className="gap-1.5">
                        <IconFile className="size-3" />
                        {sourceType}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                        <IconLanguage className="size-3" />
                        {language}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                        <IconAspectRatio className="size-3" />
                        {aspectRatio}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                        <IconFlame className="size-3" />
                        Viral Clips
                    </Badge>
                    {video.createdAt && (
                        <Badge variant="outline" className="gap-1.5 text-primary border-primary/30">
                            <IconCalendar className="size-3" />
                            Expires: {formatDate(new Date(new Date(video.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Clips List */}
            <div className="flex-1 overflow-auto p-6 flex flex-col justify-center items-center">
                {!clips || clips.length === 0 ? (
                    <NoClips
                        videoTitle={video.title || "this video"}
                        videoStatus={video.status}
                    />
                ) : (
                    <div className="space-y-6 max-w-4xl">
                        {clips.map((clip, index) => (
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
