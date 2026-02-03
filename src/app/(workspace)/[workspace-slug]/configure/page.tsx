"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
    IconCheck,
    IconLoader2,
    IconX,
    IconAlertCircle,
    IconSparkles,
    IconArrowLeft,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useValidateYouTubeUrl } from "@/hooks/useVideo";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { videoApi } from "@/lib/api/video";
import { videoConfigApi, DEFAULT_VIDEO_CONFIG, type VideoConfigInput, type CaptionTemplate } from "@/lib/api/video-config";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VideoInfo } from "@/lib/api/video";
import { CaptionTemplateGrid } from "@/components/configure/caption-template-grid";
import { AspectRatioSelector } from "@/components/configure/aspect-ratio-selector";
import { YouTubeIcon } from "@/components/icons/youtube-icon";

const YOUTUBE_URL_PATTERNS = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

function isValidYouTubeUrl(url: string): boolean {
    return YOUTUBE_URL_PATTERNS.some((pattern) => pattern.test(url.trim()));
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

export default function ConfigurePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const workspaceSlug = params["workspace-slug"] as string;
    const queryClient = useQueryClient();

    // Get URL from query params if provided
    const urlFromQuery = searchParams.get("url") || "";

    // Get workspace data to get workspaceId
    const { data: workspace } = useWorkspaceBySlug(workspaceSlug);

    const [url, setUrl] = useState(urlFromQuery);
    const [validationState, setValidationState] = useState<"idle" | "validating" | "valid" | "invalid">(urlFromQuery ? "validating" : "idle");
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [config, setConfig] = useState<VideoConfigInput>(DEFAULT_VIDEO_CONFIG);

    const validateMutation = useValidateYouTubeUrl();

    // Fetch caption templates
    const { data: templates = [] } = useQuery({
        queryKey: ["caption-templates"],
        queryFn: videoConfigApi.getCaptionTemplates,
        staleTime: 1000 * 60 * 10,
    });

    // Submit mutation - creates video + starts processing
    const submitMutation = useMutation({
        mutationFn: async (youtubeUrl: string) => {
            if (!workspace?.id) {
                throw new Error("Workspace not found");
            }
            const result = await videoApi.submitYouTubeUrl(youtubeUrl, workspace.id, undefined, workspaceSlug, {
                skipClipping: config.skipClipping,
                clipModel: config.clipModel,
                genre: config.genre,
                clipDurationMin: config.clipDurationMin || 15,
                clipDurationMax: config.clipDurationMax || 90,
                captionTemplateId: config.captionTemplateId,
                aspectRatio: config.aspectRatio,
            });
            return result;
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["videos"] });
            toast.success("Processing started!", {
                description: "Your video is being processed. Clips will be ready soon.",
            });
            router.push(`/${workspaceSlug}/videos/${result.video.id}/clips`);
        },
        onError: (error: Error) => {
            toast.error("Failed to process video", {
                description: error.message,
            });
        },
    });

    // Debounced validation
    useEffect(() => {
        const trimmedUrl = url.trim();

        if (!trimmedUrl) {
            setValidationState("idle");
            setVideoInfo(null);
            setErrorMessage(null);
            return;
        }

        if (!isValidYouTubeUrl(trimmedUrl)) {
            setValidationState("invalid");
            setVideoInfo(null);
            setErrorMessage("Please enter a valid YouTube URL");
            return;
        }

        const timeoutId = setTimeout(async () => {
            setValidationState("validating");
            setErrorMessage(null);

            try {
                const result = await validateMutation.mutateAsync(trimmedUrl);

                if (result.valid && result.videoInfo) {
                    setValidationState("valid");
                    setVideoInfo(result.videoInfo);
                    setErrorMessage(null);
                } else {
                    setValidationState("invalid");
                    setVideoInfo(null);
                    setErrorMessage(result.error || "Could not fetch video information");
                }
            } catch (error) {
                setValidationState("invalid");
                setVideoInfo(null);
                setErrorMessage(error instanceof Error ? error.message : "Failed to validate URL");
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [url]);

    const handleGetClips = useCallback(async () => {
        if (validationState !== "valid" || !url.trim()) return;
        await submitMutation.mutateAsync(url.trim());
    }, [validationState, url, submitMutation]);

    const handleClear = useCallback(() => {
        setUrl("");
        setValidationState("idle");
        setVideoInfo(null);
        setErrorMessage(null);
    }, []);

    const updateConfig = useCallback((updates: Partial<VideoConfigInput>) => {
        setConfig((prev) => ({ ...prev, ...updates }));
    }, []);

    return (
        <div className="container mx-auto max-w-3xl px-4 py-8">
            {/* Back button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/${workspaceSlug}`)}
                className="mb-6"
            >
                <IconArrowLeft className="mr-2 size-4" />
                Back
            </Button>

            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-red-500/10">
                    <YouTubeIcon className="size-7" />
                </div>
                <h1 className="font-bold text-2xl">Get Viral Clips</h1>
                <p className="mt-1 text-muted-foreground">
                    Paste a YouTube URL and configure your clip settings
                </p>
            </div>

            <div className="space-y-6">
                {/* URL Input Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>YouTube URL</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Input
                                type="url"
                                placeholder="https://youtube.com/watch?v=..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className={cn(
                                    "pr-10",
                                    validationState === "valid" && "border-green-500 focus-visible:ring-green-500",
                                    validationState === "invalid" && "border-red-500 focus-visible:ring-red-500"
                                )}
                                disabled={submitMutation.isPending}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {validationState === "validating" && (
                                    <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
                                )}
                                {validationState === "valid" && <IconCheck className="size-4 text-green-500" />}
                                {validationState === "invalid" && <IconX className="size-4 text-red-500" />}
                            </div>
                        </div>
                        {errorMessage && validationState === "invalid" && (
                            <p className="flex items-center gap-1 text-red-500 text-sm">
                                <IconAlertCircle className="size-4" />
                                {errorMessage}
                            </p>
                        )}

                        {/* Video Preview */}
                        {videoInfo && validationState === "valid" && (
                            <div className="overflow-hidden rounded-lg border">
                                <img
                                    src={videoInfo.thumbnail}
                                    alt={videoInfo.title}
                                    className="aspect-video w-full object-cover"
                                />
                                <div className="p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-medium text-sm line-clamp-2">{videoInfo.title}</h4>
                                            <p className="mt-1 text-muted-foreground text-xs">
                                                {videoInfo.channelName} • {formatDuration(videoInfo.duration)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 shrink-0"
                                            onClick={handleClear}
                                        >
                                            <IconX className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Configuration Options - Only show when URL is valid */}
                {validationState === "valid" && (
                    <>
                        {/* Caption Template */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Caption Style</CardTitle>
                                <CardDescription>
                                    Choose how captions appear on your clips
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <CaptionTemplateGrid
                                    templates={templates}
                                    selectedId={config.captionTemplateId ?? "karaoke"}
                                    onSelect={(id) => updateConfig({ captionTemplateId: id })}
                                    disabled={submitMutation.isPending}
                                />
                            </CardContent>
                        </Card>

                        {/* Aspect Ratio */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Aspect Ratio</CardTitle>
                                <CardDescription>
                                    Choose the output format for your clips
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AspectRatioSelector
                                    value={config.aspectRatio ?? "9:16"}
                                    onChange={(ratio) => updateConfig({ aspectRatio: ratio })}
                                    disabled={submitMutation.isPending}
                                />
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Get Clips Button */}
                <Button
                    onClick={handleGetClips}
                    disabled={validationState !== "valid" || submitMutation.isPending}
                    className="w-full gap-2"
                    size="lg"
                >
                    {submitMutation.isPending ? (
                        <>
                            <IconLoader2 className="size-5 animate-spin" />
                            Starting...
                        </>
                    ) : (
                        <>
                            <IconSparkles className="size-5" />
                            Get Clips
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
