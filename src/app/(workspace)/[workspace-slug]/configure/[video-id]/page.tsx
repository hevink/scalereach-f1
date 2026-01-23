"use client";

import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconBrandYoutube, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoConfigForm } from "@/components/configure";
import { useVideoConfig } from "@/hooks/useVideoConfig";

export default function ConfigurePage() {
    const params = useParams();
    const router = useRouter();
    const workspaceSlug = params["workspace-slug"] as string;
    const videoId = params["video-id"] as string;

    const {
        config,
        setConfig,
        video,
        templates,
        isLoading,
        isSaving,
        saveConfig,
        saveAsDefault,
    } = useVideoConfig({
        videoId,
        onConfigureSuccess: () => {
            // Redirect to video detail page after processing starts
            router.push(`/${workspaceSlug}/videos/${videoId}`);
        },
    });

    if (isLoading) {
        return <ConfigurePageSkeleton />;
    }

    if (!video) {
        return (
            <div className="container mx-auto max-w-4xl px-4 py-8">
                <div className="flex flex-col items-center justify-center gap-4 py-16">
                    <p className="text-muted-foreground">Video not found</p>
                    <Button variant="outline" onClick={() => router.back()}>
                        <IconArrowLeft className="mr-2 size-4" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    // Extract YouTube thumbnail from source URL
    const getYouTubeThumbnail = (url: string | null) => {
        if (!url) return null;
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        if (match) {
            return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
        }
        return null;
    };

    const thumbnail = getYouTubeThumbnail(video.sourceUrl);
    const videoDuration = video.duration || 300; // Default to 5 minutes if unknown

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/${workspaceSlug}`)}
                    className="mb-4"
                >
                    <IconArrowLeft className="mr-2 size-4" />
                    Back to Dashboard
                </Button>

                <h1 className="font-bold text-2xl">Configure Video Processing</h1>
                <p className="mt-1 text-muted-foreground">
                    Customize how your video will be processed
                </p>
            </div>

            {/* Video Preview */}
            <div className="mb-8 flex gap-4 rounded-lg border bg-muted/30 p-4">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={video.title || "Video thumbnail"}
                        className="h-24 w-40 rounded object-cover"
                    />
                ) : (
                    <div className="flex h-24 w-40 items-center justify-center rounded bg-muted">
                        <IconBrandYoutube className="size-8 text-muted-foreground" />
                    </div>
                )}
                <div className="flex flex-1 flex-col justify-center gap-1 overflow-hidden">
                    <h2 className="truncate font-semibold text-lg">{video.title || "Untitled Video"}</h2>
                    <p className="text-muted-foreground text-sm">
                        Duration: {formatDuration(videoDuration)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                        Status: {video.status}
                    </p>
                </div>
            </div>

            {/* Configuration Form */}
            <VideoConfigForm
                config={config}
                onChange={setConfig}
                templates={templates}
                videoDuration={videoDuration}
                isLoading={isLoading}
                isSaving={isSaving}
                onSubmit={saveConfig}
                onSaveAsDefault={saveAsDefault}
            />
        </div>
    );
}

function ConfigurePageSkeleton() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="mb-8">
                <Skeleton className="mb-4 h-8 w-32" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="mt-2 h-4 w-48" />
            </div>

            <div className="mb-8 flex gap-4 rounded-lg border p-4">
                <Skeleton className="h-24 w-40" />
                <div className="flex flex-1 flex-col justify-center gap-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
            </div>

            <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border p-6">
                        <Skeleton className="mb-2 h-6 w-32" />
                        <Skeleton className="mb-4 h-4 w-48" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}
