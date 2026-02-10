"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
    IconRefresh,
    IconVolume,
    IconTrash,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { useValidateYouTubeUrl, useVideo } from "@/hooks/useVideo";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { videoApi } from "@/lib/api/video";
import { videoConfigApi, DEFAULT_VIDEO_CONFIG, type VideoConfigInput } from "@/lib/api/video-config";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VideoInfo } from "@/lib/api/video";
import { AspectRatioSelector } from "@/components/configure/aspect-ratio-selector";
import { YouTubeIcon } from "@/components/icons/youtube-icon";
import { InsufficientMinutesModal } from "@/components/upload/insufficient-minutes-modal";
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
    const initialConfigRef = useRef<VideoConfigInput>(DEFAULT_VIDEO_CONFIG);
    const [translateTo, setTranslateTo] = useState<string[]>([]);

    // Insufficient minutes modal state - used for all limit errors
    const [showInsufficientMinutes, setShowInsufficientMinutes] = useState(false);
    const [insufficientMinutesDetails, setInsufficientMinutesDetails] = useState<{
        minutesRemaining: number;
        minutesNeeded: number;
        errorType?: "duration" | "fileSize" | "minutes";
        currentLimit?: string;
        attemptedValue?: string;
    } | null>(null);

    // Get plan limits for this workspace
    const planLimits = usePlanLimits(workspaceSlug);

    const validateMutation = useValidateYouTubeUrl();

    // Set validation state to valid when uploaded video is loaded
    useEffect(() => {
        if (mode === "upload" && uploadedVideo) {
            setValidationState("valid");
        }
    }, [mode, uploadedVideo]);

    // Fetch caption templates with retry
    const {
        data: templates = [],
        isLoading: templatesLoading,
        isError: templatesError,
        refetch: refetchTemplates,
        isRefetching: templatesRefetching,
    } = useQuery({
        queryKey: ["caption-templates"],
        queryFn: videoConfigApi.getCaptionTemplates,
        staleTime: 1000 * 60 * 10,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    });

    // Track unsaved changes
    const hasUnsavedChanges = JSON.stringify(config) !== JSON.stringify(initialConfigRef.current);

    // Warn user about unsaved changes when navigating away
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges && validationState === "valid") {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges, validationState]);

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
            const translateParams = translateTo.length > 0 ? `?translate=${translateTo.join(",")}` : "";
            router.push(`/${workspaceSlug}/videos/${result.video.id}/clips${translateParams}`);
        },
        onError: (error: any) => {
            // Check if it's a plan limit error (duration)
            if (error.response?.data?.upgradeRequired && error.response?.data?.reason === "VIDEO_TOO_LONG") {
                // Show pricing modal for duration limit errors
                setInsufficientMinutesDetails({
                    minutesRemaining: 0, // Not applicable for duration errors
                    minutesNeeded: 0, // Not applicable for duration errors
                    errorType: "duration",
                    currentLimit: error.response.data.currentLimit || planLimits.maxDurationFormatted,
                    attemptedValue: error.response.data.attemptedValue || "Unknown",
                });
                setShowInsufficientMinutes(true);
            } else if (error.response?.data?.reason === "INSUFFICIENT_MINUTES") {
                // Show pricing modal for insufficient minutes
                setInsufficientMinutesDetails({
                    minutesRemaining: error.response.data.minutesRemaining || 0,
                    minutesNeeded: error.response.data.minutesNeeded || 0,
                    errorType: "minutes",
                });
                setShowInsufficientMinutes(true);
            } else {
                toast.error("Failed to process video", {
                    description: error.message || error.response?.data?.error || "An error occurred",
                });
            }
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
            const translateParams = translateTo.length > 0 ? `?translate=${translateTo.join(",")}` : "";
            router.push(`/${workspaceSlug}/videos/${result.video.id}/clips${translateParams}`);
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
        <>
            {/* Insufficient Minutes Modal - handles all limit errors */}
            {insufficientMinutesDetails && (
                <InsufficientMinutesModal
                    isOpen={showInsufficientMinutes}
                    onClose={() => {
                        setShowInsufficientMinutes(false);
                        setInsufficientMinutesDetails(null);
                    }}
                    currentPlan={planLimits.planName}
                    minutesRemaining={insufficientMinutesDetails.minutesRemaining}
                    minutesNeeded={insufficientMinutesDetails.minutesNeeded}
                    workspaceSlug={workspaceSlug}
                    errorType={insufficientMinutesDetails.errorType}
                    currentLimit={insufficientMinutesDetails.currentLimit}
                    attemptedValue={insufficientMinutesDetails.attemptedValue}
                />
            )}

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
                                        aria-label="YouTube video URL"
                                        aria-invalid={validationState === "invalid"}
                                        aria-describedby={errorMessage ? "youtube-url-error" : undefined}
                                        className={cn(
                                            "pr-10",
                                            validationState === "valid" && "border-green-500 focus-visible:ring-green-500",
                                            validationState === "invalid" && "border-red-500 focus-visible:ring-red-500"
                                        )}
                                        disabled={isSubmitting}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {validationState === "validating" && (
                                            <IconLoader2 className="size-4 animate-spin text-muted-foreground" aria-label="Validating URL" />
                                        )}
                                        {validationState === "valid" && <IconCheck className="size-4 text-green-500" aria-label="Valid URL" />}
                                        {validationState === "invalid" && <IconX className="size-4 text-red-500" aria-label="Invalid URL" />}
                                    </div>
                                </div>
                                {errorMessage && validationState === "invalid" && (
                                    <div
                                        id="youtube-url-error"
                                        role="alert"
                                        aria-live="assertive"
                                        className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
                                    >
                                        <IconAlertCircle className="size-4 shrink-0" aria-hidden="true" />
                                        <span className="text-sm flex-1">{errorMessage}</span>
                                        {errorMessage.toLowerCase().includes("network") || errorMessage.toLowerCase().includes("fetch") ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-red-700 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50"
                                                onClick={() => setUrl(url + " ")}
                                            >
                                                <IconRefresh className="size-3 mr-1" aria-hidden="true" />
                                                Retry
                                            </Button>
                                        ) : null}
                                    </div>
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
                                                    aria-label="Clear YouTube URL"
                                                >
                                                    <IconX className="size-4" aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Configuration Options - Show when valid (for both modes) */}
                    <AnimatePresence mode="wait">
                        {validationState === "valid" && (mode === "upload" ? uploadedVideo : true) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
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
                                            {templatesError ? (
                                                <div
                                                    role="alert"
                                                    className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6"
                                                >
                                                    <IconAlertCircle className="size-8 text-muted-foreground" aria-hidden="true" />
                                                    <p className="text-muted-foreground text-sm text-center">
                                                        Failed to load caption templates
                                                    </p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => refetchTemplates()}
                                                        disabled={templatesRefetching}
                                                    >
                                                        {templatesRefetching ? (
                                                            <>
                                                                <IconLoader2 className="size-4 mr-2 animate-spin" aria-hidden="true" />
                                                                Retrying...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <IconRefresh className="size-4 mr-2" aria-hidden="true" />
                                                                Retry
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            ) : templatesLoading ? (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {Array.from({ length: 8 }).map((_, i) => (
                                                        <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                                                    ))}
                                                </div>
                                            ) : (
                                                <Carousel
                                                    opts={{
                                                        align: "start",
                                                        loop: true,
                                                    }}
                                                    className="w-full"
                                                >
                                                    <CarouselContent>
                                                        {Array.from({ length: Math.ceil(templates.length / 8) }).map((_, pageIndex) => {
                                                            const startIdx = pageIndex * 8;
                                                            const pageTemplates = templates.slice(startIdx, startIdx + 8);
                                                            return (
                                                                <CarouselItem key={pageIndex}>
                                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                        {pageTemplates.map((template) => {
                                                                            const isSelected = (config.captionTemplateId ?? "classic") === template.id;
                                                                            return (
                                                                                <button
                                                                                    key={template.id}
                                                                                    onClick={() => updateConfig({ captionTemplateId: template.id })}
                                                                                    disabled={isSubmitting}
                                                                                    className={cn(
                                                                                        "relative flex flex-col items-center justify-center rounded-lg border p-3 h-20 transition-all",
                                                                                        "bg-muted/50 border-border",
                                                                                        "hover:bg-muted hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                                                                                        isSelected && "ring-1 ring-primary bg-muted border-primary",
                                                                                        isSubmitting && "opacity-50 cursor-not-allowed"
                                                                                    )}
                                                                                >
                                                                                    <div className="flex flex-col items-center justify-center">
                                                                                        <span
                                                                                            className="text-[10px] font-bold leading-tight"
                                                                                            style={{
                                                                                                fontFamily: template.style?.fontFamily || "Inter",
                                                                                                color: template.style?.textColor || "#FFFFFF",
                                                                                                textShadow: template.style?.shadow ? "1px 1px 2px rgba(0,0,0,0.8)" : "none",
                                                                                            }}
                                                                                        >
                                                                                            TO GET
                                                                                        </span>
                                                                                        <span
                                                                                            className="text-[10px] font-bold leading-tight"
                                                                                            style={{
                                                                                                fontFamily: template.style?.fontFamily || "Inter",
                                                                                                color: template.style?.highlightColor || template.style?.textColor || "#00FF00",
                                                                                                textShadow: template.style?.shadow ? "1px 1px 2px rgba(0,0,0,0.8)" : "none",
                                                                                            }}
                                                                                        >
                                                                                            STARTED
                                                                                        </span>
                                                                                    </div>
                                                                                    <span className="absolute bottom-1 text-[9px] text-muted-foreground truncate max-w-full px-1">
                                                                                        {template.name}
                                                                                    </span>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </CarouselItem>
                                                            );
                                                        })}
                                                    </CarouselContent>
                                                    <CarouselPrevious className="left-0 -translate-x-1/2" />
                                                    <CarouselNext className="right-0 translate-x-1/2" />
                                                </Carousel>
                                            )}
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

                                        {/* Translate To Section - Temporarily disabled
                                        <div className="space-y-4 border-t pt-6">
                                            <div>
                                                <h3 className="font-semibold">Translate To</h3>
                                                <p className="text-muted-foreground text-sm">
                                                    Select languages to auto-translate captions after processing
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { code: "es", name: "Spanish" },
                                                    { code: "fr", name: "French" },
                                                    { code: "de", name: "German" },
                                                    { code: "it", name: "Italian" },
                                                    { code: "pt", name: "Portuguese" },
                                                    { code: "nl", name: "Dutch" },
                                                    { code: "ja", name: "Japanese" },
                                                    { code: "ko", name: "Korean" },
                                                    { code: "zh", name: "Chinese" },
                                                    { code: "ru", name: "Russian" },
                                                    { code: "ar", name: "Arabic" },
                                                    { code: "hi", name: "Hindi" },
                                                    { code: "tr", name: "Turkish" },
                                                    { code: "pl", name: "Polish" },
                                                    { code: "sv", name: "Swedish" },
                                                    { code: "th", name: "Thai" },
                                                    { code: "vi", name: "Vietnamese" },
                                                    { code: "uk", name: "Ukrainian" },
                                                ].filter((lang) => lang.code !== (config.language || "en")).map((lang) => {
                                                    const isSelected = translateTo.includes(lang.code);
                                                    return (
                                                        <button
                                                            key={lang.code}
                                                            type="button"
                                                            disabled={isSubmitting}
                                                            onClick={() => {
                                                                setTranslateTo((prev) =>
                                                                    isSelected
                                                                        ? prev.filter((c) => c !== lang.code)
                                                                        : [...prev, lang.code]
                                                                );
                                                            }}
                                                            className={cn(
                                                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                                                                isSelected
                                                                    ? "border-primary bg-primary/10 text-primary"
                                                                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                                            )}
                                                        >
                                                            {isSelected && <IconCheck className="size-3" />}
                                                            {lang.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {translateTo.length > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    {translateTo.length} language{translateTo.length > 1 ? "s" : ""} selected — translations will start automatically after video processing
                                                </p>
                                            )}
                                        </div>
                                        */}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Translation & Dubbing - Show when video exists */}

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
                        aria-busy={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <IconLoader2 className="size-5 animate-spin" aria-hidden="true" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <IconSparkles className="size-5" aria-hidden="true" />
                                Get Clips
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </>
    );
}
