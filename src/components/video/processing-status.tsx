"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import {
    IconClock,
    IconDownload,
    IconUpload,
    IconMicrophone,
    IconBrain,
    IconCheck,
    IconX,
    IconRefresh,
    IconLoader2,
    IconBell,
    IconBellOff,
} from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useVideoStatus } from "@/hooks/useVideo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Video } from "@/lib/api/video";
import { analytics } from "@/lib/analytics";

// Video status type
type VideoStatus = Video["status"];

// Status configuration with icons, labels, and colors
interface StatusConfig {
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    badgeVariant: "default" | "secondary" | "destructive" | "outline";
}

const STATUS_CONFIG: Record<VideoStatus, StatusConfig> = {
    pending: {
        label: "Pending",
        description: "Waiting to start processing...",
        icon: <IconClock className="size-5" />,
        color: "text-muted-foreground",
        bgColor: "bg-muted/50",
        borderColor: "border-muted",
        badgeVariant: "secondary",
    },
    pending_config: {
        label: "Awaiting Config",
        description: "Waiting for configuration...",
        icon: <IconClock className="size-5" />,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        badgeVariant: "secondary",
    },
    downloading: {
        label: "Downloading",
        description: "Downloading video from source...",
        icon: <IconDownload className="size-5" />,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        badgeVariant: "default",
    },
    uploading: {
        label: "Uploading",
        description: "Uploading video to storage...",
        icon: <IconUpload className="size-5" />,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
        badgeVariant: "default",
    },
    transcribing: {
        label: "Transcribing",
        description: "Converting speech to text...",
        icon: <IconMicrophone className="size-5" />,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        badgeVariant: "default",
    },
    analyzing: {
        label: "Analyzing",
        description: "Detecting viral clips with AI...",
        icon: <IconBrain className="size-5" />,
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-500/30",
        badgeVariant: "default",
    },
    completed: {
        label: "Completed",
        description: "Video processing complete!",
        icon: <IconCheck className="size-5" />,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
        badgeVariant: "outline",
    },
    failed: {
        label: "Failed",
        description: "Processing failed",
        icon: <IconX className="size-5" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        badgeVariant: "destructive",
    },
};

// Processing stages in order for progress visualization
const PROCESSING_STAGES: VideoStatus[] = [
    "pending",
    "downloading",
    "uploading",
    "transcribing",
    "analyzing",
    "completed",
];

// Estimated time per stage in seconds (based on average processing times)
const STAGE_ESTIMATED_TIMES: Record<VideoStatus, number> = {
    pending: 10,
    pending_config: 0,
    downloading: 60,
    uploading: 45,
    transcribing: 90,
    analyzing: 120,
    completed: 0,
    failed: 0,
};

// Get stage index for progress calculation
function getStageIndex(status: VideoStatus): number {
    if (status === "failed") return -1;
    return PROCESSING_STAGES.indexOf(status);
}

// Calculate overall progress percentage based on stage
function calculateStageProgress(status: VideoStatus, jobProgress?: number): number {
    if (status === "failed") return 0;
    if (status === "completed") return 100;

    const stageIndex = getStageIndex(status);
    if (stageIndex === -1) return 0;

    // Each stage represents ~20% of total progress (5 stages before completed)
    const baseProgress = (stageIndex / (PROCESSING_STAGES.length - 1)) * 100;

    // If we have job progress, interpolate within the current stage
    if (jobProgress !== undefined && jobProgress > 0) {
        const stageWeight = 100 / (PROCESSING_STAGES.length - 1);
        return Math.min(baseProgress + (jobProgress / 100) * stageWeight, 99);
    }

    return baseProgress;
}

// Calculate estimated time remaining in seconds
function calculateEstimatedTime(status: VideoStatus, jobProgress?: number, videoDuration?: number | null): number {
    if (status === "failed" || status === "completed") return 0;

    const currentIndex = getStageIndex(status);
    if (currentIndex === -1) return 0;

    // Calculate time for current stage (adjusted by job progress)
    const currentStageTime = STAGE_ESTIMATED_TIMES[status];
    const currentStageRemaining = jobProgress
        ? currentStageTime * (1 - jobProgress / 100)
        : currentStageTime;

    // Calculate time for remaining stages
    let remainingStagesTime = 0;
    for (let i = currentIndex + 1; i < PROCESSING_STAGES.length - 1; i++) {
        remainingStagesTime += STAGE_ESTIMATED_TIMES[PROCESSING_STAGES[i]];
    }

    // Adjust based on video duration (longer videos take more time)
    const durationMultiplier = videoDuration ? Math.max(1, videoDuration / 600) : 1;

    return Math.ceil((currentStageRemaining + remainingStagesTime) * durationMultiplier);
}

// Format seconds to human readable string
function formatEstimatedTime(seconds: number): string {
    if (seconds <= 0) return "";
    if (seconds < 60) return "Less than a minute";
    if (seconds < 120) return "~1 minute";
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `~${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (remainingMins === 0) return `~${hours} hour${hours > 1 ? "s" : ""}`;
    return `~${hours}h ${remainingMins}m`;
}

// Browser notification helper
async function requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const permission = await Notification.requestPermission();
    return permission === "granted";
}

function sendBrowserNotification(title: string, body: string, icon?: string) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const notification = new Notification(title, {
        body,
        icon: icon || "/favicon.ico",
        badge: "/favicon.ico",
        tag: "video-processing",
        requireInteraction: true,
    });

    notification.onclick = () => {
        window.focus();
        notification.close();
    };
}

export interface ProcessingStatusProps {
    videoId: string;
    onComplete?: () => void;
    onError?: (error: string) => void;
}

export function ProcessingStatus({ videoId, onComplete, onError }: ProcessingStatusProps) {
    const { data, isLoading, error, refetch } = useVideoStatus(videoId);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
    const hasNotifiedCompletion = useRef(false);
    const hasTrackedProcessing = useRef(false);

    const video = data?.video;
    const job = data?.job;
    const status = video?.status ?? "pending";
    const statusConfig = STATUS_CONFIG[status];
    const progress = calculateStageProgress(status, job?.progress);
    const estimatedTime = calculateEstimatedTime(status, job?.progress, video?.duration);
    const estimatedTimeText = formatEstimatedTime(estimatedTime);

    // Check notification permission on mount
    useEffect(() => {
        if (!("Notification" in window)) {
            setNotificationPermission("unsupported");
            return;
        }
        setNotificationPermission(Notification.permission);
        if (Notification.permission === "granted") {
            setNotificationsEnabled(true);
        }
    }, []);

    // Track video processing status changes
    useEffect(() => {
        if (status === "analyzing" && !hasTrackedProcessing.current) {
            hasTrackedProcessing.current = true;
            analytics.videoProcessingStarted(videoId);
        }
    }, [status, videoId]);

    // Handle enabling notifications
    const handleEnableNotifications = useCallback(async () => {
        const granted = await requestNotificationPermission();
        setNotificationPermission(granted ? "granted" : "denied");
        setNotificationsEnabled(granted);
        if (granted) {
            toast.success("Notifications enabled", {
                description: "We'll notify you when your video is ready.",
            });
        } else {
            toast.error("Notifications blocked", {
                description: "Please enable notifications in your browser settings.",
            });
        }
    }, []);

    // Handle completion callback and browser notification
    useEffect(() => {
        if (status === "completed" && !hasNotifiedCompletion.current) {
            hasNotifiedCompletion.current = true;

            analytics.videoProcessingCompleted({
                videoId,
                clipsGenerated: (job as any)?.clipsGenerated ?? 0,
                duration: video?.duration ?? 0,
            });

            toast.success("Video processing complete!", {
                description: "Your video is ready. You can now view the detected clips.",
            });

            // Send browser notification if enabled
            if (notificationsEnabled) {
                sendBrowserNotification(
                    "Video Ready!",
                    `"${video?.title || "Your video"}" has been processed. Click to view your clips.`
                );
            }

            onComplete?.();
        }
    }, [status, onComplete, notificationsEnabled, video?.title]);

    // Handle error callback
    useEffect(() => {
        if (status === "failed" && onError && video?.errorMessage) {
            analytics.videoProcessingFailed(videoId, video.errorMessage);
            if (notificationsEnabled) {
                sendBrowserNotification(
                    "Processing Failed",
                    `There was an error processing "${video?.title || "your video"}".`
                );
            }
            onError(video.errorMessage);
        }
    }, [status, onError, video?.errorMessage, video?.title, notificationsEnabled]);

    const handleRetry = useCallback(async () => {
        // Refetch to check if status has changed
        await refetch();
        toast.info("Checking status...");
    }, [refetch]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
                    <IconX className="size-8 text-red-500" />
                    <p className="text-center text-muted-foreground">
                        Failed to load processing status
                    </p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <IconRefresh className="mr-2 size-4" />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("overflow-hidden transition-all duration-300", statusConfig.borderColor)}>
            <CardHeader className={cn("transition-colors duration-300", statusConfig.bgColor)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Animated icon container */}
                        <div
                            className={cn(
                                "flex size-10 items-center justify-center rounded-full transition-all duration-300",
                                statusConfig.bgColor,
                                statusConfig.color,
                                status !== "completed" && status !== "failed" && "animate-pulse"
                            )}
                        >
                            {statusConfig.icon}
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                Processing Status
                                <Badge variant={statusConfig.badgeVariant} className="ml-2">
                                    {status !== "completed" && status !== "failed" && (
                                        <IconLoader2 className="mr-1 size-3 animate-spin" />
                                    )}
                                    {statusConfig.label}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                                {statusConfig.description}
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
                {/* Progress bar */}
                {status !== "failed" && (
                    <div className="space-y-2">
                        <div className="flex w-full items-center justify-between">
                            <span className="font-medium text-sm">Progress</span>
                            <div className="flex items-center gap-3">
                                {estimatedTimeText && status !== "completed" && (
                                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                                        <IconClock className="size-3.5" />
                                        {estimatedTimeText}
                                    </span>
                                )}
                                <span className="text-muted-foreground text-sm tabular-nums">{Math.round(progress)}%</span>
                            </div>
                        </div>
                        <Progress value={progress} className="w-full" />
                    </div>
                )}

                {/* Browser notification toggle */}
                {status !== "completed" && status !== "failed" && notificationPermission !== "unsupported" && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                        <div className="flex items-center gap-2">
                            {notificationsEnabled ? (
                                <IconBell className="size-4 text-green-500" />
                            ) : (
                                <IconBellOff className="size-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">
                                {notificationsEnabled
                                    ? "We'll notify you when done"
                                    : "Get notified when ready"}
                            </span>
                        </div>
                        {!notificationsEnabled && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEnableNotifications}
                                className="h-7 text-xs"
                            >
                                Enable
                            </Button>
                        )}
                        {notificationsEnabled && (
                            <Badge variant="outline" className="text-green-500 border-green-500/30">
                                <IconCheck className="size-3 mr-1" />
                                Enabled
                            </Badge>
                        )}
                    </div>
                )}

                {/* Safe to leave message */}
                {status !== "completed" && status !== "failed" && (
                    <p className="text-xs text-muted-foreground text-center">
                        You can close this page. {notificationsEnabled ? "We'll send you a notification" : "We'll email you"} when your video is ready.
                    </p>
                )}

                {/* Stage indicators */}
                <div className="flex items-center justify-between gap-1">
                    {PROCESSING_STAGES.slice(0, -1).map((stage, index) => {
                        const currentIndex = getStageIndex(status);
                        const isActive = index === currentIndex;
                        const isComplete = index < currentIndex || status === "completed";
                        const stageConfig = STATUS_CONFIG[stage];

                        return (
                            <div
                                key={stage}
                                className={cn(
                                    "flex flex-1 flex-col items-center gap-1 transition-all duration-300",
                                    isComplete && "opacity-100",
                                    !isComplete && !isActive && "opacity-40"
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex size-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                                        isComplete && "border-green-500 bg-green-500/10 text-green-500",
                                        isActive && cn(stageConfig.borderColor, stageConfig.bgColor, stageConfig.color),
                                        !isComplete && !isActive && "border-muted bg-muted/30 text-muted-foreground"
                                    )}
                                >
                                    {isComplete ? (
                                        <IconCheck className="size-4" />
                                    ) : isActive ? (
                                        <IconLoader2 className="size-4 animate-spin" />
                                    ) : (
                                        <span className="text-xs font-medium">{index + 1}</span>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "text-center text-xs transition-colors duration-300",
                                        isActive && stageConfig.color,
                                        isComplete && "text-green-500",
                                        !isComplete && !isActive && "text-muted-foreground"
                                    )}
                                >
                                    {stageConfig.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Job progress details */}
                {job && job.progress > 0 && status !== "completed" && status !== "failed" && (
                    <div className="rounded-lg bg-muted/30 p-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Current stage progress</span>
                            <span className="font-medium">{job.progress}%</span>
                        </div>
                    </div>
                )}

                {/* Error state with retry */}
                {status === "failed" && (
                    <div className="space-y-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                        <div className="flex items-start gap-3">
                            <IconX className="mt-0.5 size-5 shrink-0 text-red-500" />
                            <div className="flex-1">
                                <p className="font-medium text-red-500">Processing Failed</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {video?.errorMessage || "An unexpected error occurred during processing."}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRetry}
                            className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10"
                        >
                            <IconRefresh className="mr-2 size-4" />
                            Check Status
                        </Button>
                    </div>
                )}

                {/* Success state */}
                {status === "completed" && (
                    <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                        <IconCheck className="size-5 text-green-500" />
                        <div>
                            <p className="font-medium text-green-500">Processing Complete</p>
                            <p className="text-sm text-muted-foreground">
                                Your video has been processed successfully. You can now view the detected clips.
                            </p>
                        </div>
                    </div>
                )}

                {/* Video title if available */}
                {video?.title && (
                    <div className="border-t pt-3">
                        <p className="truncate text-sm text-muted-foreground">
                            <span className="font-medium">Video:</span> {video.title}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
