"use client";

import { useState, useCallback, useEffect } from "react";
import { IconBrandYoutube, IconCheck, IconLoader2, IconX, IconAlertCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useValidateYouTubeUrl, useSubmitYouTubeUrl } from "@/hooks/useVideo";
import { toast } from "sonner";
import type { VideoInfo } from "@/lib/api/video";

// YouTube URL patterns
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

interface YouTubeUploadFormProps {
    projectId?: string;
    onSuccess?: (videoId: string) => void;
}

export function YouTubeUploadForm({ projectId, onSuccess }: YouTubeUploadFormProps) {
    const [url, setUrl] = useState("");
    const [validationState, setValidationState] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const validateMutation = useValidateYouTubeUrl();
    const submitMutation = useSubmitYouTubeUrl();

    // Debounced validation
    useEffect(() => {
        const trimmedUrl = url.trim();

        if (!trimmedUrl) {
            setValidationState("idle");
            setVideoInfo(null);
            setErrorMessage(null);
            return;
        }

        // Quick client-side validation first
        if (!isValidYouTubeUrl(trimmedUrl)) {
            setValidationState("invalid");
            setVideoInfo(null);
            setErrorMessage("Please enter a valid YouTube URL");
            return;
        }

        // Debounce server validation
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

    const handleSubmit = useCallback(async () => {
        if (validationState !== "valid" || !url.trim()) {
            return;
        }

        try {
            const result = await submitMutation.mutateAsync({
                youtubeUrl: url.trim(),
                projectId,
            });

            toast.success("Video submitted for processing", {
                description: videoInfo?.title || "Your video is being processed",
            });

            // Reset form
            setUrl("");
            setValidationState("idle");
            setVideoInfo(null);

            onSuccess?.(result.video.id);
        } catch (error) {
            toast.error("Failed to submit video", {
                description: error instanceof Error ? error.message : "Please try again",
            });
        }
    }, [validationState, url, projectId, videoInfo, submitMutation, onSuccess]);

    const handleClear = useCallback(() => {
        setUrl("");
        setValidationState("idle");
        setVideoInfo(null);
        setErrorMessage(null);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IconBrandYoutube className="size-5 text-red-500" />
                    Upload YouTube Video
                </CardTitle>
                <CardDescription>
                    Paste a YouTube URL to extract viral clips automatically
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* URL Input */}
                <div className="space-y-2">
                    <div className="relative">
                        <Input
                            type="url"
                            placeholder="https://youtube.com/watch?v=..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className={`pr-10 ${validationState === "valid"
                                    ? "border-green-500 focus-visible:ring-green-500"
                                    : validationState === "invalid"
                                        ? "border-red-500 focus-visible:ring-red-500"
                                        : ""
                                }`}
                            disabled={submitMutation.isPending}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {validationState === "validating" && (
                                <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
                            )}
                            {validationState === "valid" && (
                                <IconCheck className="size-4 text-green-500" />
                            )}
                            {validationState === "invalid" && (
                                <IconX className="size-4 text-red-500" />
                            )}
                        </div>
                    </div>

                    {/* Error message */}
                    {errorMessage && validationState === "invalid" && (
                        <p className="flex items-center gap-1 text-red-500 text-sm">
                            <IconAlertCircle className="size-4" />
                            {errorMessage}
                        </p>
                    )}

                    {/* Supported formats hint */}
                    {validationState === "idle" && (
                        <p className="text-muted-foreground text-xs">
                            Supported: youtube.com/watch, youtu.be, youtube.com/shorts
                        </p>
                    )}
                </div>

                {/* Video Preview */}
                {videoInfo && validationState === "valid" && (
                    <div className="flex gap-4 rounded-lg border bg-muted/30 p-3">
                        <img
                            src={videoInfo.thumbnail}
                            alt={videoInfo.title}
                            className="h-20 w-36 rounded object-cover"
                        />
                        <div className="flex flex-1 flex-col justify-center gap-1 overflow-hidden">
                            <h4 className="truncate font-medium text-sm">{videoInfo.title}</h4>
                            <p className="text-muted-foreground text-xs">{videoInfo.channelName}</p>
                            <p className="text-muted-foreground text-xs">
                                Duration: {formatDuration(videoInfo.duration)}
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
                )}

                {/* Submit Button */}
                <div className="flex gap-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={validationState !== "valid" || submitMutation.isPending}
                        className="flex-1"
                    >
                        {submitMutation.isPending ? (
                            <>
                                <IconLoader2 className="mr-2 size-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Process Video"
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
