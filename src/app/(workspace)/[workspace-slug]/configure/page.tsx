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
    IconLanguage,
    IconRefresh,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { TimeframeSelector } from "@/components/configure/timeframe-selector";
import { ClipTypeSelector } from "@/components/configure/clip-type-selector";
import { ClipDurationSelector } from "@/components/configure/clip-duration-selector";
import { SplitScreenSection } from "@/components/configure/split-screen-section";
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

    const urlFromQuery = searchParams.get("url") || "";
    const videoIdFromQuery = searchParams.get("videoId") || "";
    const mode = videoIdFromQuery ? "upload" : "youtube";

    const { data: workspace } = useWorkspaceBySlug(workspaceSlug);
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
    const [clipType, setClipType] = useState("viral-clips");
    const [clipTypeCustomPrompt, setClipTypeCustomPrompt] = useState("");

    const [showInsufficientMinutes, setShowInsufficientMinutes] = useState(false);
    const [insufficientMinutesDetails, setInsufficientMinutesDetails] = useState<{
        minutesRemaining: number;
        minutesNeeded: number;
        errorType?: "duration" | "fileSize" | "minutes";
        currentLimit?: string;
        attemptedValue?: string;
    } | null>(null);

    const planLimits = usePlanLimits(workspaceSlug);
    const validateMutation = useValidateYouTubeUrl();

    useEffect(() => {
        if (mode === "upload" && uploadedVideo) {
            setValidationState("valid");
        }
    }, [mode, uploadedVideo]);

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

    const hasUnsavedChanges = JSON.stringify(config) !== JSON.stringify(initialConfigRef.current);

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

    const submitYouTubeMutation = useMutation({
        mutationFn: async (youtubeUrl: string) => {
            if (!workspace?.id) throw new Error("Workspace not found");
            return videoApi.submitYouTubeUrl(youtubeUrl, workspace.id, undefined, workspaceSlug, {
                skipClipping: config.skipClipping,
                clipModel: config.clipModel,
                genre: config.genre,
                clipDurationMin: config.clipDurationMin || 30,
                clipDurationMax: config.clipDurationMax || 60,
                timeframeStart: config.timeframeStart ?? 0,
                timeframeEnd: config.timeframeEnd ?? null,
                language: config.language,
                clipType,
                customPrompt: clipTypeCustomPrompt || undefined,
                captionTemplateId: config.captionTemplateId,
                aspectRatio: config.aspectRatio,
                enableCaptions: config.enableCaptions,
                enableEmojis: config.enableEmojis,
                enableIntroTitle: config.enableIntroTitle,
                enableSplitScreen: config.enableSplitScreen,
                splitScreenBgVideoId: config.splitScreenBgVideoId,
                splitScreenBgCategoryId: config.splitScreenBgCategoryId,
                splitRatio: config.splitRatio,
            });
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
            if (error.response?.data?.upgradeRequired && error.response?.data?.reason === "VIDEO_TOO_LONG") {
                setInsufficientMinutesDetails({
                    minutesRemaining: 0,
                    minutesNeeded: 0,
                    errorType: "duration",
                    currentLimit: error.response.data.currentLimit || planLimits.maxDurationFormatted,
                    attemptedValue: error.response.data.attemptedValue || "Unknown",
                });
                setShowInsufficientMinutes(true);
            } else if (error.response?.data?.reason === "INSUFFICIENT_MINUTES") {
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

    const submitUploadMutation = useMutation({
        mutationFn: async (videoId: string) => {
            return videoConfigApi.configure(videoId, {
                skipClipping: config.skipClipping,
                clipModel: config.clipModel,
                genre: config.genre,
                clipDurationMin: config.clipDurationMin || 30,
                clipDurationMax: config.clipDurationMax || 60,
                timeframeStart: config.timeframeStart ?? 0,
                timeframeEnd: config.timeframeEnd ?? null,
                language: config.language,
                clipType,
                customPrompt: clipTypeCustomPrompt || undefined,
                captionTemplateId: config.captionTemplateId,
                aspectRatio: config.aspectRatio,
                enableCaptions: config.enableCaptions,
                enableEmojis: config.enableEmojis,
                enableIntroTitle: config.enableIntroTitle,
                enableSplitScreen: config.enableSplitScreen,
                splitScreenBgVideoId: config.splitScreenBgVideoId,
                splitScreenBgCategoryId: config.splitScreenBgCategoryId,
                splitRatio: config.splitRatio,
            });
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
            toast.error("Failed to process video", { description: error.message });
        },
    });

    const isSubmitting = submitYouTubeMutation.isPending || submitUploadMutation.isPending;

    useEffect(() => {
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
                const errorMsg = error?.response?.data?.error || error?.message || "Failed to validate YouTube URL";
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

    const videoDuration = mode === "upload" ? uploadedVideo?.duration : videoInfo?.duration;
    const showConfig = validationState === "valid" && (mode === "upload" ? !!uploadedVideo : true);

    return (
        <>
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

            <div className="container mx-auto max-w-6xl px-4 py-6">
                {/* Back button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/${workspaceSlug}`)}
                    className="mb-4"
                >
                    <IconArrowLeft className="mr-2 size-4" />
                    Back
                </Button>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* LEFT COLUMN - Video Preview (sticky on desktop) */}
                    <div className="w-full lg:w-[400px] lg:shrink-0">
                        <div className="lg:sticky lg:top-6 space-y-4">
                            {mode === "upload" ? (
                                <div className="overflow-hidden rounded-xl border bg-card">
                                    {uploadedVideoLoading ? (
                                        <div className="flex items-center justify-center py-16">
                                            <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : uploadedVideo ? (
                                        <div className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                    <IconUpload className="size-6 text-primary" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-medium text-sm truncate">
                                                        {uploadedVideo.title || "Uploaded Video"}
                                                    </h4>
                                                    <p className="mt-0.5 text-muted-foreground text-xs">
                                                        {uploadedVideo.duration ? formatDuration(uploadedVideo.duration) : "Processing..."}
                                                    </p>
                                                </div>
                                                <IconCheck className="size-5 text-green-500 shrink-0" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 p-4 text-red-500">
                                            <IconAlertCircle className="size-4" />
                                            <span className="text-sm">Video not found</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border bg-card">
                                    {/* URL Input */}
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <YouTubeIcon className="size-4" />
                                            YouTube URL
                                        </div>
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
                                                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-red-700 text-xs dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
                                            >
                                                <IconAlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                                                <span className="flex-1">{errorMessage}</span>
                                                {(errorMessage.toLowerCase().includes("network") || errorMessage.toLowerCase().includes("fetch")) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-xs text-red-700 hover:text-red-800 hover:bg-red-100 dark:text-red-400"
                                                        onClick={() => setUrl(url + " ")}
                                                    >
                                                        <IconRefresh className="size-3 mr-1" aria-hidden="true" />
                                                        Retry
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Video Thumbnail Preview */}
                                    {videoInfo && validationState === "valid" && (
                                        <>
                                            <div className="border-t" />
                                            <div className="relative">
                                                <img
                                                    src={videoInfo.thumbnail}
                                                    alt={videoInfo.title}
                                                    className="aspect-video w-full object-cover"
                                                />
                                            </div>
                                            <div className="p-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-medium text-sm line-clamp-2">{videoInfo.title}</h4>
                                                        <p className="mt-0.5 text-muted-foreground text-xs">
                                                            {videoInfo.channelName} • {formatDuration(videoInfo.duration)}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 shrink-0"
                                                        onClick={handleClear}
                                                        aria-label="Clear YouTube URL"
                                                    >
                                                        <IconX className="size-3.5" aria-hidden="true" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Configuration Form */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            {showConfig ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                    className="space-y-5"
                                >
                                    {/* Clip Type */}
                                    <div className="rounded-xl border bg-card p-4 space-y-3">
                                        <div>
                                            <h3 className="font-semibold text-sm">Clip Type</h3>
                                            <p className="text-muted-foreground text-xs">Choose what kind of clips to generate</p>
                                        </div>
                                        <ClipTypeSelector
                                            value={clipType}
                                            customPrompt={clipTypeCustomPrompt}
                                            onChange={setClipType}
                                            onCustomPromptChange={setClipTypeCustomPrompt}
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Caption Style */}
                                    <div className="rounded-xl border bg-card p-4 space-y-3">
                                        <div>
                                            <h3 className="font-semibold text-sm">Caption Style</h3>
                                            <p className="text-muted-foreground text-xs">Choose how captions appear on your clips</p>
                                        </div>
                                        {templatesError ? (
                                            <div role="alert" className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4">
                                                <IconAlertCircle className="size-6 text-muted-foreground" aria-hidden="true" />
                                                <p className="text-muted-foreground text-xs">Failed to load caption templates</p>
                                                <Button variant="outline" size="sm" onClick={() => refetchTemplates()} disabled={templatesRefetching} className="h-7 text-xs">
                                                    {templatesRefetching ? (
                                                        <><IconLoader2 className="size-3 mr-1.5 animate-spin" aria-hidden="true" />Retrying...</>
                                                    ) : (
                                                        <><IconRefresh className="size-3 mr-1.5" aria-hidden="true" />Retry</>
                                                    )}
                                                </Button>
                                            </div>
                                        ) : templatesLoading ? (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                {Array.from({ length: 8 }).map((_, i) => (
                                                    <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                                                ))}
                                            </div>
                                        ) : (
                                            <Carousel opts={{ align: "start", loop: true }} className="w-full">
                                                <CarouselContent className="-ml-2">
                                                    {Array.from({ length: Math.ceil(templates.length / 8) }).map((_, pageIndex) => {
                                                        const startIdx = pageIndex * 8;
                                                        const pageTemplates = templates.slice(startIdx, startIdx + 8);
                                                        return (
                                                            <CarouselItem key={pageIndex} className="pl-2">
                                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-1">
                                                                    {pageTemplates.map((template) => {
                                                                        const isSelected = (config.captionTemplateId ?? "classic") === template.id;
                                                                        return (
                                                                            <button
                                                                                key={template.id}
                                                                                onClick={() => updateConfig({ captionTemplateId: template.id })}
                                                                                disabled={isSubmitting}
                                                                                className={cn(
                                                                                    "relative flex flex-col items-center justify-center rounded-lg border p-2 pb-4 h-[72px] transition-all",
                                                                                    "bg-muted/50 border-border",
                                                                                    "hover:bg-muted hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                                                                                    isSelected && "ring-1 ring-primary bg-muted border-primary",
                                                                                    isSubmitting && "opacity-50 cursor-not-allowed"
                                                                                )}
                                                                            >
                                                                                <div className="flex flex-col items-center justify-center">
                                                                                    <span
                                                                                        className="text-[9px] font-bold leading-tight"
                                                                                        style={{
                                                                                            fontFamily: template.style?.fontFamily || "Inter",
                                                                                            color: template.style?.textColor || "#FFFFFF",
                                                                                            textShadow: template.style?.shadow ? "1px 1px 2px rgba(0,0,0,0.8)" : "none",
                                                                                        }}
                                                                                    >
                                                                                        TO GET
                                                                                    </span>
                                                                                    <span
                                                                                        className="text-[9px] font-bold leading-tight"
                                                                                        style={{
                                                                                            fontFamily: template.style?.fontFamily || "Inter",
                                                                                            color: template.style?.highlightColor || template.style?.textColor || "#00FF00",
                                                                                            textShadow: template.style?.shadow ? "1px 1px 2px rgba(0,0,0,0.8)" : "none",
                                                                                        }}
                                                                                    >
                                                                                        STARTED
                                                                                    </span>
                                                                                </div>
                                                                                <span className="absolute bottom-0.5 text-[8px] text-muted-foreground truncate max-w-full px-1">
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

                                    {/* Aspect Ratio, Language & Clip Duration - inline rows */}
                                    <div className="rounded-xl border bg-card divide-y">
                                        <div className="flex items-center justify-between gap-4 px-4 py-3">
                                            <span className="text-sm font-medium shrink-0">Clip Duration</span>
                                            <ClipDurationSelector
                                                min={config.clipDurationMin ?? 30}
                                                max={config.clipDurationMax ?? 60}
                                                onChange={(min, max) => updateConfig({ clipDurationMin: min, clipDurationMax: max })}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between gap-4 px-4 py-3">
                                            <span className="text-sm font-medium shrink-0">Aspect Ratio</span>
                                            <div className="w-48">
                                                <AspectRatioSelector
                                                    value={config.aspectRatio ?? "9:16"}
                                                    onChange={(ratio) => updateConfig({ aspectRatio: ratio })}
                                                    disabled={isSubmitting || (config.enableSplitScreen ?? false)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 px-4 py-3">
                                            <div className="flex items-center gap-2 shrink-0">
                                                <IconLanguage className="size-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">Language</span>
                                            </div>
                                            <Select
                                                value={config.language ?? "auto"}
                                                onValueChange={(value) => updateConfig({ language: value as SupportedLanguageCode })}
                                                disabled={isSubmitting}
                                            >
                                                <SelectTrigger className="w-48">
                                                    <SelectValue placeholder="Select language" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                                                        <SelectItem key={code} value={code}>{name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Timeframe */}
                                    {videoDuration && videoDuration > 0 && (
                                        <div className="rounded-xl border bg-card p-4 space-y-3">
                                            <div>
                                                <h3 className="font-semibold text-sm">Processing Timeframe</h3>
                                                <p className="text-muted-foreground text-xs">Select which part of the video to process</p>
                                            </div>
                                            <TimeframeSelector
                                                videoDuration={videoDuration}
                                                start={config.timeframeStart ?? 0}
                                                end={config.timeframeEnd ?? null}
                                                onChange={(start, end) => updateConfig({ timeframeStart: start, timeframeEnd: end })}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    )}

                                    {/* Editing Options */}
                                    <div className="rounded-xl border bg-card p-4 space-y-2">
                                        <h3 className="font-semibold text-sm">Editing Options</h3>
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-2.5">
                                                <IconSubtask className="size-4 text-muted-foreground" />
                                                <span className="text-sm">Captions</span>
                                            </div>
                                            <Switch
                                                checked={config.enableCaptions ?? true}
                                                onCheckedChange={(checked) => updateConfig({ enableCaptions: checked })}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="border-t pt-3">
                                            <SplitScreenSection
                                                config={config}
                                                onChange={updateConfig}
                                                disabled={isSubmitting}
                                                userPlan={workspace?.plan || "free"}
                                            />
                                        </div>
                                    </div>

                                    {/* Get Clips Button */}
                                    <Button
                                        onClick={handleGetClips}
                                        disabled={validationState !== "valid" || isSubmitting || (mode === "upload" && !uploadedVideo)}
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
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-16 text-center">
                                    <div className={cn(
                                        "mb-3 flex size-12 items-center justify-center rounded-full",
                                        mode === "upload" ? "bg-primary/10" : "bg-red-500/10"
                                    )}>
                                        {mode === "upload" ? (
                                            <IconUpload className="size-6 text-primary" />
                                        ) : (
                                            <YouTubeIcon className="size-6" />
                                        )}
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        {mode === "upload"
                                            ? "Loading video details..."
                                            : "Paste a YouTube URL to configure your clips"
                                        }
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </>
    );
}
