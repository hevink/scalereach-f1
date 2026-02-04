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
    IconUpload,
    IconSubtask,
    IconMoodSmile,
    IconTypography,
    IconLanguage,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useValidateYouTubeUrl, useVideo } from "@/hooks/useVideo";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { videoApi } from "@/lib/api/video";
import { videoConfigApi, DEFAULT_VIDEO_CONFIG, type VideoConfigInput } from "@/lib/api/video-config";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VideoInfo } from "@/lib/api/video";
import { CaptionTemplateGrid } from "@/components/configure/caption-template-grid";
import { AspectRatioSelector } from "@/components/configure/aspect-ratio-selector";
import { YouTubeIcon } from "@/components/icons/youtube-icon";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES, type SupportedLanguageCode } from "@/lib/api/video-config";

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

    // Get URL or videoId from query params
    const urlFromQuery = searchParams.get("url") || "";
    const videoIdFromQuery = searchParams.get("videoId") || "";

    // Determine mode: "youtube" for YouTube URLs, "upload" for uploaded videos
    const mode = videoIdFromQuery ? "upload" : "youtube";

    // Get workspace data to get workspaceId
    const { data: workspace } = useWorkspaceBySlug(workspaceSlug);

    // Fetch uploaded video data if videoId is provided
    const { data: uploadedVideo, isLoading: uploadedVideoLoading } = useVideo(videoIdFromQuery);

    const [url, setUrl] = useState(urlFromQuery);
    const [validationState, setValidationState] = useState<"idle" | "validating" | "valid" | "invalid">(
        videoIdFromQuery ? "valid" : (urlFromQuery ? "validating" : "idle")
    );
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [config, setConfig] = useState<VideoConfigInput>(DEFAULT_VIDEO_CONFIG);

    const validateMutation = useValidateYouTubeUrl();

    // Set validation state to valid when uploaded video is loaded
    useEffect(() => {
        if (mode === "upload" && uploadedVideo) {
            setValidationState("valid");
        }
    }, [mode, uploadedVideo]);

    // Fetch caption templates
    const { data: templates = [] } = useQuery({
        queryKey: ["caption-templates"],
        queryFn: videoConfigApi.getCaptionTemplates,
        staleTime: 1000 * 60 * 10,
    });

    // Submit mutation for YouTube URLs - creates video + starts processing
    const submitYouTubeMutation = useMutation({
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
                language: config.language,
                captionTemplateId: config.captionTemplateId,
                aspectRatio: config.aspectRatio,
                enableCaptions: config.enableCaptions,
                enableEmojis: config.enableEmojis,
                enableIntroTitle: config.enableIntroTitle,
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

    // Submit mutation for uploaded videos - configures and starts processing
    const submitUploadMutation = useMutation({
        mutationFn: async (videoId: string) => {
            const result = await videoConfigApi.configure(videoId, {
                skipClipping: config.skipClipping,
                clipModel: config.clipModel,
                genre: config.genre,
                clipDurationMin: config.clipDurationMin || 15,
                clipDurationMax: config.clipDurationMax || 90,
                language: config.language,
                captionTemplateId: config.captionTemplateId,
                aspectRatio: config.aspectRatio,
                enableCaptions: config.enableCaptions,
                enableEmojis: config.enableEmojis,
                enableIntroTitle: config.enableIntroTitle,
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

    const isSubmitting = submitYouTubeMutation.isPending || submitUploadMutation.isPending;

    // Debounced validation for YouTube URLs only
    useEffect(() => {
        // Skip validation for upload mode
        if (mode === "upload") return;

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
            } catch (error: any) {
                setValidationState("invalid");
                setVideoInfo(null);

                // Handle different error types
                const errorMsg = error?.response?.data?.error
                    || error?.message
                    || "Failed to validate YouTube URL";
                setErrorMessage(errorMsg);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [url, mode]);

    const handleGetClips = useCallback(async () => {
        if (validationState !== "valid") return;

        if (mode === "upload" && videoIdFromQuery) {
            await submitUploadMutation.mutateAsync(videoIdFromQuery);
        } else if (mode === "youtube" && url.trim()) {
            await submitYouTubeMutation.mutateAsync(url.trim());
        }
    }, [validationState, mode, videoIdFromQuery, url, submitUploadMutation, submitYouTubeMutation]);

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
                <div className={cn(
                    "mx-auto mb-3 flex size-14 items-center justify-center rounded-full",
                    mode === "upload" ? "bg-primary/10" : "bg-red-500/10"
                )}>
                    {mode === "upload" ? (
                        <IconUpload className="size-7 text-primary" />
                    ) : (
                        <YouTubeIcon className="size-7" />
                    )}
                </div>
                <h1 className="font-bold text-2xl">Get Viral Clips</h1>
                <p className="mt-1 text-muted-foreground">
                    {mode === "upload"
                        ? "Configure your clip settings for the uploaded video"
                        : "Paste a YouTube URL and configure your clip settings"
                    }
                </p>
            </div>

            <div className="space-y-6">
                {/* Video Info Card - Different for upload vs YouTube */}
                {mode === "upload" ? (
                    /* Uploaded Video Info Card */
                    <Card>
                        <CardHeader>
                            <CardTitle>Uploaded Video</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {uploadedVideoLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : uploadedVideo ? (
                                <div className="flex items-center gap-4 rounded-lg border p-4">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <IconUpload className="size-6 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-medium text-sm truncate">
                                            {uploadedVideo.title || "Uploaded Video"}
                                        </h4>
                                        <p className="mt-1 text-muted-foreground text-xs">
                                            {uploadedVideo.duration ? formatDuration(uploadedVideo.duration) : "Processing..."}
                                        </p>
                                    </div>
                                    <IconCheck className="size-5 text-green-500 shrink-0" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-red-500">
                                    <IconAlertCircle className="size-4" />
                                    <span className="text-sm">Video not found</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    /* YouTube URL Input Card */
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
                                    disabled={isSubmitting}
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
                )}

                {/* Configuration Options - Show when valid (for both modes) */}
                {validationState === "valid" && (mode === "upload" ? uploadedVideo : true) && (
                    <Card>
                        <CardContent className="space-y-8 pt-6">
                            {/* Caption Style Section */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold">Caption Style</h3>
                                    <p className="text-muted-foreground text-sm">
                                        Choose how captions appear on your clips
                                    </p>
                                </div>
                                <CaptionTemplateGrid
                                    templates={templates}
                                    selectedId={config.captionTemplateId ?? "classic"}
                                    onSelect={(id) => updateConfig({ captionTemplateId: id })}
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Aspect Ratio Section */}
                            <div className="space-y-4 border-t pt-6">
                                <div>
                                    <h3 className="font-semibold">Aspect Ratio</h3>
                                    <p className="text-muted-foreground text-sm">
                                        Choose the output format for your clips
                                    </p>
                                </div>
                                <AspectRatioSelector
                                    value={config.aspectRatio ?? "9:16"}
                                    onChange={(ratio) => updateConfig({ aspectRatio: ratio })}
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Language Section */}
                            <div className="space-y-4 border-t pt-6">
                                <div>
                                    <h3 className="font-semibold">Language</h3>
                                    <p className="text-muted-foreground text-sm">
                                        Select the spoken language for better transcription accuracy
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <IconLanguage className="size-5 text-muted-foreground" />
                                    <Select
                                        value={config.language ?? "auto"}
                                        onValueChange={(value) => updateConfig({ language: value as SupportedLanguageCode })}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger className="w-full max-w-xs">
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                                                <SelectItem key={code} value={code}>
                                                    {name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Editing Options Section */}
                            <div className="space-y-4 border-t pt-6">
                                <div>
                                    <h3 className="font-semibold">Editing Options</h3>
                                </div>
                                <div className="space-y-1">
                                    {/* Captions */}
                                    <div className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <IconSubtask className="size-5 text-muted-foreground" />
                                            <span className="font-medium">Captions</span>
                                        </div>
                                        <Switch
                                            checked={config.enableCaptions ?? true}
                                            onCheckedChange={(checked) => updateConfig({ enableCaptions: checked })}
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Emojis */}
                                    <div className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <IconMoodSmile className="size-5 text-muted-foreground" />
                                            <span className="font-medium">Emojis</span>
                                        </div>
                                        <Switch
                                            checked={config.enableEmojis ?? true}
                                            onCheckedChange={(checked) => updateConfig({ enableEmojis: checked })}
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Intro Title */}
                                    <div className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <IconTypography className="size-5 text-muted-foreground" />
                                            <span className="font-medium">Intro title</span>
                                        </div>
                                        <Switch
                                            checked={config.enableIntroTitle ?? true}
                                            onCheckedChange={(checked) => updateConfig({ enableIntroTitle: checked })}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Get Clips Button */}
                <Button
                    onClick={handleGetClips}
                    disabled={
                        validationState !== "valid" ||
                        isSubmitting ||
                        (mode === "upload" && !uploadedVideo)
                    }
                    className="w-full gap-2"
                    size="lg"
                >
                    {isSubmitting ? (
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
