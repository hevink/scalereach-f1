"use client";

import { use, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    IconArrowLeft,
    IconAlertCircle,
    IconLoader2,
    IconVideo,
    IconRefresh,
    IconCut,
    IconTypography,
    IconDownload,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { LazyCaptionPreview, LazyClipBoundaryEditor } from "@/components/lazy";
import type { VideoPlayerRef } from "@/components/video/video-player";
import { AspectRatioSelector, type AspectRatio } from "@/components/clips/aspect-ratio-selector";
import { CaptionTemplatePicker } from "@/components/captions/caption-template-picker";
import { CaptionStylePanel } from "@/components/captions/caption-style-panel";
import { ExportOptions } from "@/components/export/export-options";
import { ExportProgress } from "@/components/export/export-progress";
import { useClip, useUpdateClipBoundaries } from "@/hooks/useClips";
import { useCaptionTemplates, useCaptionStyle, useUpdateCaptionStyle } from "@/hooks/useCaptions";
import { useInitiateExport, useExportStatus } from "@/hooks/useExport";
import { useVideo } from "@/hooks/useVideo";
import { useCreditBalance } from "@/hooks/useCredits";
import type { CaptionStyle, CaptionTemplate } from "@/lib/api/captions";
import type { ExportOptions as ExportOptionsType } from "@/lib/api/export";

// ============================================================================
// Types
// ============================================================================

interface ClipEditorPageProps {
    params: Promise<{
        "workspace-slug": string;
        id: string;
    }>;
}

// ============================================================================
// Loading State Component
// ============================================================================

function ClipEditorLoading() {
    return (
        <div className="flex min-h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Spinner />
                <p className="text-sm text-muted-foreground">Loading clip editor...</p>
            </div>
        </div>
    );
}

// ============================================================================
// Error State Component
// ============================================================================

interface ClipEditorErrorProps {
    error: Error | null;
    onRetry?: () => void;
}

function ClipEditorError({ error, onRetry }: ClipEditorErrorProps) {
    return (
        <div className="flex min-h-[50vh] items-center justify-center p-4">
            <EmptyState
                icon={<IconAlertCircle className="size-6" />}
                title="Failed to load clip"
                description={error?.message || "An error occurred while loading the clip. Please try again."}
                action={
                    onRetry
                        ? {
                            label: "Try again",
                            onClick: onRetry,
                        }
                        : undefined
                }
            />
        </div>
    );
}

// ============================================================================
// Not Found State Component
// ============================================================================

interface ClipNotFoundProps {
    workspaceSlug: string;
}

function ClipNotFound({ workspaceSlug }: ClipNotFoundProps) {
    return (
        <div className="flex min-h-[50vh] items-center justify-center p-4">
            <EmptyState
                icon={<IconVideo className="size-6" />}
                title="Clip not found"
                description="The clip you're looking for doesn't exist or has been deleted."
                action={{
                    label: "Go back to workspace",
                    onClick: () => window.location.href = `/${workspaceSlug}`,
                }}
            />
        </div>
    );
}

// ============================================================================
// Virality Score Badge Component
// ============================================================================

interface ViralityScoreBadgeProps {
    score: number;
}

function ViralityScoreBadge({ score }: ViralityScoreBadgeProps) {
    // Color mapping based on score (Property 7)
    const getScoreColor = (score: number) => {
        if (score >= 70) return "bg-green-500/10 text-green-600 dark:text-green-400";
        if (score >= 40) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
        return "bg-red-500/10 text-red-600 dark:text-red-400";
    };

    return (
        <Badge className={cn("font-mono", getScoreColor(score))}>
            {score}% viral
        </Badge>
    );
}

// ============================================================================
// Default Caption Style
// ============================================================================

const DEFAULT_CAPTION_STYLE: CaptionStyle = {
    fontFamily: "Inter",
    fontSize: 24,
    textColor: "#FFFFFF",
    backgroundColor: "#000000",
    backgroundOpacity: 70,
    position: "bottom",
    alignment: "center",
    animation: "none",
    highlightColor: "#FFFF00",
    highlightEnabled: false,
    shadow: true,
    outline: false,
    outlineColor: "#000000",
};

// ============================================================================
// Main Clip Editor Page Component
// ============================================================================

/**
 * Clip Editor Page
 * 
 * Displays clip editor, caption editor, and export interface for a specific clip.
 * Handles loading and error states.
 * 
 * Route: /{workspace-slug}/clips/{id}
 * 
 * @validates Requirements 10.1, 12.1, 22.1
 */
export default function ClipEditorPage({ params }: ClipEditorPageProps) {
    const { "workspace-slug": workspaceSlug, id: clipId } = use(params);
    const router = useRouter();

    // Refs
    const videoPlayerRef = useRef<VideoPlayerRef>(null);

    // State
    const [activeTab, setActiveTab] = useState<string>("editor");
    const [currentTime, setCurrentTime] = useState(0);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
    const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
    const [activeExportId, setActiveExportId] = useState<string | null>(null);

    // Fetch clip data
    const {
        data: clip,
        isLoading: clipLoading,
        error: clipError,
        refetch: refetchClip,
    } = useClip(clipId);

    // Fetch video data for the clip
    const {
        data: video,
        isLoading: videoLoading,
    } = useVideo(clip?.videoId || "");

    // Fetch caption templates (Requirement 12.1)
    const {
        data: templates,
        isLoading: templatesLoading,
    } = useCaptionTemplates();

    // Fetch caption style for this clip
    const {
        data: captionsData,
        isLoading: captionsLoading,
    } = useCaptionStyle(clipId);

    // Fetch credits for export - need workspace ID from clip's video
    // For now, we'll use a default value since workspace context isn't directly available
    const { data: creditsData } = useCreditBalance(undefined);

    // Mutations
    const updateCaptionStyle = useUpdateCaptionStyle();
    const initiateExport = useInitiateExport();

    // Initialize caption style from fetched data
    useState(() => {
        if (captionsData?.style?.config) {
            setCaptionStyle(captionsData.style.config);
            setSelectedTemplateId(captionsData.style.templateId || undefined);
        }
    });

    // Handle time update from video player
    const handleTimeUpdate = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    // Handle clip boundary save
    const handleBoundarySave = useCallback((start: number, end: number) => {
        toast.success("Clip boundaries updated", {
            description: `New duration: ${Math.round(end - start)}s`,
        });
    }, []);

    // Handle template selection (Requirement 12.4)
    const handleTemplateSelect = useCallback((templateId: string) => {
        const template = templates?.find((t: CaptionTemplate) => t.id === templateId);
        if (template) {
            setSelectedTemplateId(templateId);
            setCaptionStyle(template.style);

            // Save to API
            updateCaptionStyle.mutate({
                clipId,
                style: { ...template.style, templateId },
            });
        }
    }, [templates, clipId, updateCaptionStyle]);

    // Handle caption style change (Requirement 13.8)
    const handleCaptionStyleChange = useCallback((newStyle: CaptionStyle) => {
        setCaptionStyle(newStyle);

        // Debounced save to API
        updateCaptionStyle.mutate({
            clipId,
            style: newStyle,
        });
    }, [clipId, updateCaptionStyle]);

    // Handle export initiation (Requirement 22.1)
    const handleExport = useCallback(async (options: ExportOptionsType) => {
        try {
            const result = await initiateExport.mutateAsync({
                clipId,
                options,
            });
            setActiveExportId(result.export.id);
            setActiveTab("export");
            toast.success("Export started", {
                description: "Your clip is being processed.",
            });
        } catch (error) {
            toast.error("Failed to start export", {
                description: error instanceof Error ? error.message : "An unexpected error occurred",
            });
        }
    }, [clipId, initiateExport]);

    // Handle export completion
    const handleExportComplete = useCallback((downloadUrl: string) => {
        toast.success("Export complete!", {
            description: "Your clip is ready for download.",
            action: {
                label: "Download",
                onClick: () => window.open(downloadUrl, "_blank"),
            },
        });
    }, []);

    // Handle export error
    const handleExportError = useCallback((error: string) => {
        toast.error("Export failed", {
            description: error,
        });
    }, []);

    // Loading state
    if (clipLoading || videoLoading) {
        return <ClipEditorLoading />;
    }

    // Error state
    if (clipError) {
        return (
            <ClipEditorError
                error={clipError as Error}
                onRetry={() => refetchClip()}
            />
        );
    }

    // Not found state
    if (!clip) {
        return <ClipNotFound workspaceSlug={workspaceSlug} />;
    }

    // Get video URL and duration
    const videoUrl = video?.storageUrl || "";
    const videoDuration = video?.duration || clip.duration || 60;
    const thumbnailUrl = (video?.metadata?.thumbnail as string) || undefined;

    // Get captions for preview
    const captions = captionsData?.captions || [];

    // Credit info
    const userCredits = creditsData?.balance || 0;
    const exportCreditCost = 1; // Default credit cost per export

    return (
        <div className="container max-w-7xl py-4 md:py-6 px-4 md:px-6 space-y-4 md:space-y-6">
            {/* Header - Responsive layout for mobile */}
            {/* @validates Requirement 31.3 - Mobile-friendly experience */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${workspaceSlug}/videos/${clip.videoId}`)}
                        aria-label="Go back to video"
                        className="shrink-0"
                    >
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-xl font-semibold truncate">
                            {clip.title || "Untitled Clip"}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                Duration: {formatDuration(clip.duration)}
                            </span>
                            <ViralityScoreBadge score={clip.viralityScore} />
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refetchClip()}
                    aria-label="Refresh"
                    className="shrink-0 self-end sm:self-auto"
                >
                    <IconRefresh className="size-5" />
                </Button>
            </div>

            {/* Main Content - Responsive grid for desktop/tablet/mobile */}
            {/* @validates Requirements 31.1, 31.2, 31.3 - Desktop, tablet, mobile layouts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Left Column - Video Preview */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Video Player with Caption Preview - Maintains aspect ratio */}
                    {/* @validates Requirement 31.4 - Video aspect ratio maintenance */}
                    {/* @validates Requirements 35.1, 35.2 - Lazy loaded for code splitting */}
                    {videoUrl ? (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                            <LazyCaptionPreview
                                videoUrl={videoUrl}
                                captions={captions}
                                style={captionStyle}
                                currentTime={currentTime}
                                onTimeUpdate={handleTimeUpdate}
                                poster={thumbnailUrl}
                                className="w-full h-full"
                            />
                        </div>
                    ) : (
                        <div className="aspect-video w-full rounded-lg border bg-muted flex items-center justify-center">
                            <div className="text-center space-y-2">
                                <IconVideo className="size-8 sm:size-12 mx-auto text-muted-foreground" />
                                <p className="text-xs sm:text-sm text-muted-foreground">Video not available</p>
                            </div>
                        </div>
                    )}

                    {/* Tabs for Editor, Captions, Export */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
                            <TabsTrigger value="editor" className="gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                                <IconCut className="size-3.5 sm:size-4" />
                                <span className="hidden xs:inline sm:inline">Editor</span>
                            </TabsTrigger>
                            <TabsTrigger value="captions" className="gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                                <IconTypography className="size-3.5 sm:size-4" />
                                <span className="hidden xs:inline sm:inline">Captions</span>
                            </TabsTrigger>
                            <TabsTrigger value="export" className="gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                                <IconDownload className="size-3.5 sm:size-4" />
                                <span className="hidden xs:inline sm:inline">Export</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Editor Tab - Timeline Editor (Requirement 10.1) */}
                        {/* @validates Requirement 31.5 - Timeline usable on touch devices */}
                        {/* @validates Requirements 35.1, 35.2 - Lazy loaded for code splitting */}
                        <TabsContent value="editor" className="mt-4 space-y-4 md:space-y-6">
                            {/* Timeline Editor */}
                            <div className="rounded-lg border bg-card p-3 sm:p-4">
                                <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Clip Boundaries</h3>
                                <LazyClipBoundaryEditor
                                    clipId={clipId}
                                    initialStart={clip.startTime}
                                    initialEnd={clip.endTime}
                                    videoDuration={videoDuration}
                                    videoSrc={videoUrl}
                                    videoPoster={thumbnailUrl}
                                    onSave={handleBoundarySave}
                                />
                            </div>

                            {/* Aspect Ratio Selector */}
                            <div className="rounded-lg border bg-card p-3 sm:p-4">
                                <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Aspect Ratio</h3>
                                <AspectRatioSelector
                                    value={aspectRatio}
                                    onChange={setAspectRatio}
                                    previewUrl={thumbnailUrl}
                                />
                            </div>
                        </TabsContent>

                        {/* Captions Tab - Caption Editor (Requirement 12.1) */}
                        <TabsContent value="captions" className="mt-4 space-y-4 md:space-y-6">
                            {/* Caption Templates */}
                            <div className="rounded-lg border bg-card p-3 sm:p-4">
                                <CaptionTemplatePicker
                                    templates={templates || []}
                                    selectedId={selectedTemplateId}
                                    onSelect={handleTemplateSelect}
                                    isLoading={templatesLoading}
                                />
                            </div>

                            {/* Caption Style Panel */}
                            <div className="rounded-lg border bg-card p-3 sm:p-4">
                                <CaptionStylePanel
                                    style={captionStyle}
                                    onChange={handleCaptionStyleChange}
                                />
                            </div>
                        </TabsContent>

                        {/* Export Tab - Export Interface (Requirement 22.1) */}
                        <TabsContent value="export" className="mt-4 space-y-4 md:space-y-6">
                            {/* Export Options */}
                            <ExportOptions
                                onExport={handleExport}
                                creditCost={exportCreditCost}
                                userCredits={userCredits}
                                disabled={initiateExport.isPending}
                            />

                            {/* Export Progress (if active export) */}
                            {activeExportId && (
                                <ExportProgress
                                    exportId={activeExportId}
                                    onComplete={handleExportComplete}
                                    onError={handleExportError}
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column - Clip Info Panel */}
                {/* On mobile, this appears below the main content */}
                <div className="space-y-4 order-last lg:order-0">
                    {/* Clip Info Card */}
                    <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-3 sm:space-y-4">
                        <h3 className="font-medium text-sm sm:text-base">Clip Details</h3>
                        <dl className="space-y-2 text-xs sm:text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Start Time</dt>
                                <dd className="font-mono">{formatDuration(clip.startTime)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">End Time</dt>
                                <dd className="font-mono">{formatDuration(clip.endTime)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Duration</dt>
                                <dd className="font-mono">{formatDuration(clip.duration)}</dd>
                            </div>
                            <div className="flex justify-between items-center">
                                <dt className="text-muted-foreground">Virality Score</dt>
                                <dd><ViralityScoreBadge score={clip.viralityScore} /></dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Status</dt>
                                <dd className="capitalize">{clip.status}</dd>
                            </div>
                            {clip.createdAt && (
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Created</dt>
                                    <dd>{new Date(clip.createdAt).toLocaleDateString()}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Virality Reason Card */}
                    {clip.viralityReason && (
                        <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-2">
                            <h3 className="font-medium text-sm sm:text-base">Why It's Viral</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {clip.viralityReason}
                            </p>
                        </div>
                    )}

                    {/* Hooks & Emotions */}
                    {(clip.hooks?.length > 0 || clip.emotions?.length > 0) && (
                        <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-3 sm:space-y-4">
                            {clip.hooks?.length > 0 && (
                                <div>
                                    <h4 className="text-xs sm:text-sm font-medium mb-2">Hooks</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {clip.hooks.map((hook, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {hook}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {clip.emotions?.length > 0 && (
                                <div>
                                    <h4 className="text-xs sm:text-sm font-medium mb-2">Emotions</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {clip.emotions.map((emotion, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {emotion}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transcript Preview */}
                    {clip.transcript && (
                        <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-2">
                            <h3 className="font-medium text-sm sm:text-base">Transcript</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-6">
                                {clip.transcript}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format duration in seconds to MM:SS or HH:MM:SS format
 */
function formatDuration(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}
