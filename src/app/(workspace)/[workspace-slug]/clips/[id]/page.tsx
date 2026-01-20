"use client";

import { use, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
    IconArrowLeft,
    IconAlertCircle,
    IconScissors,
    IconEdit,
    IconTypography,
    IconDownload,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClipBoundaryEditor } from "@/components/clips/clip-boundary-editor";
import { AspectRatioSelector, type AspectRatio } from "@/components/clips/aspect-ratio-selector";
import { CaptionTemplatePicker } from "@/components/captions/caption-template-picker";
import { CaptionStylePanel } from "@/components/captions/caption-style-panel";
import { CaptionPreview } from "@/components/captions/caption-preview";
import { ExportOptions } from "@/components/export/export-options";
import { ExportProgress } from "@/components/export/export-progress";
import { useClip } from "@/hooks/useClips";
import { useVideo } from "@/hooks/useVideo";
import { useCaptionTemplates, useCaptionStyle, useUpdateCaptionStyle } from "@/hooks/useCaptions";
import { useInitiateExport } from "@/hooks/useExport";
import { useCreditBalance } from "@/hooks/useCredits";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import type { CaptionStyle } from "@/lib/api/captions";
import type { ExportOptions as ExportOptionsType } from "@/lib/api/export";

// ============================================================================
// Types
// ============================================================================

interface ClipEditorPageProps {
    params: Promise<{ "workspace-slug": string; id: string }>;
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
    highlightColor: "#FFD700",
    highlightEnabled: false,
    shadow: true,
    outline: false,
    outlineColor: "#000000",
};

// ============================================================================
// Loading State Component
// ============================================================================

function ClipEditorLoading() {
    return (
        <div className="flex h-full flex-col">
            {/* Header skeleton */}
            <div className="flex items-center gap-4 border-b px-4 py-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-6 w-48" />
            </div>

            {/* Tabs skeleton */}
            <div className="border-b px-4 py-2">
                <Skeleton className="h-10 w-64" />
            </div>

            {/* Content skeleton */}
            <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row">
                <div className="flex-1">
                    <Skeleton className="aspect-video w-full rounded-lg" />
                    <Skeleton className="mt-4 h-24 w-full rounded-lg" />
                </div>
                <div className="w-full lg:w-80">
                    <Skeleton className="h-64 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Error State Component
// ============================================================================

interface ClipEditorErrorProps {
    error: Error | null;
    onBack: () => void;
}

function ClipEditorError({ error, onBack }: ClipEditorErrorProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <IconAlertCircle className="size-8 text-destructive" />
            </div>
            <div className="text-center">
                <h2 className="text-lg font-semibold">Failed to load clip</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {error?.message || "An error occurred while loading the clip."}
                </p>
            </div>
            <Button onClick={onBack} variant="outline">
                <IconArrowLeft className="mr-2 size-4" />
                Go Back
            </Button>
        </div>
    );
}

// ============================================================================
// Clip Not Found Component
// ============================================================================

interface ClipNotFoundProps {
    onBack: () => void;
}

function ClipNotFound({ onBack }: ClipNotFoundProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <IconScissors className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
                <h2 className="text-lg font-semibold">Clip not found</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    The clip you&apos;re looking for doesn&apos;t exist or has been deleted.
                </p>
            </div>
            <Button onClick={onBack} variant="outline">
                <IconArrowLeft className="mr-2 size-4" />
                Go Back
            </Button>
        </div>
    );
}

// ============================================================================
// Main Clip Editor Page Component
// ============================================================================

/**
 * ClipEditorPage - Displays clip editor with tabs for editing, captions, and export
 * 
 * Features:
 * - Edit tab: Clip boundary editor with timeline
 * - Captions tab: Caption template picker, style panel, preview
 * - Export tab: Export options and progress
 * - Responsive layout for mobile and desktop
 * 
 * @validates Requirements 10.1, 10.8, 11.1-11.5, 12.1-12.5, 13.1-13.8, 17.1-17.5, 22.1-22.5, 23.1-23.5
 */
export default function ClipEditorPage({ params }: ClipEditorPageProps) {
    const { "workspace-slug": slug, id: clipId } = use(params);
    const router = useRouter();

    // State
    const [activeTab, setActiveTab] = useState("edit");
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
    const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeExportId, setActiveExportId] = useState<string | null>(null);

    // Fetch workspace data
    const { data: workspace } = useWorkspaceBySlug(slug);

    // Fetch clip data
    const {
        data: clip,
        isLoading: clipLoading,
        error: clipError,
    } = useClip(clipId);

    // Fetch parent video data
    const {
        data: video,
        isLoading: videoLoading,
        error: videoError,
    } = useVideo(clip?.videoId ?? "");

    // Fetch caption templates
    const { data: templates, isLoading: templatesLoading } = useCaptionTemplates();

    // Fetch caption style for this clip
    const { data: captionData } = useCaptionStyle(clipId);

    // Fetch user credits
    const { data: creditBalance } = useCreditBalance(workspace?.id);

    // Mutations
    const updateCaptionStyle = useUpdateCaptionStyle();
    const initiateExport = useInitiateExport();

    // Initialize caption style from fetched data
    useState(() => {
        if (captionData?.style?.config) {
            setCaptionStyle(captionData.style.config);
        }
    });

    // Navigation handlers
    const handleBack = useCallback(() => {
        if (clip?.videoId) {
            router.push(`/${slug}/videos/${clip.videoId}`);
        } else {
            router.push(`/${slug}`);
        }
    }, [router, slug, clip?.videoId]);

    // Clip boundary save handler
    const handleBoundarySave = useCallback((start: number, end: number) => {
        console.log("Boundaries saved:", { start, end });
    }, []);

    // Caption template selection handler
    const handleTemplateSelect = useCallback(
        (templateId: string) => {
            const template = templates?.find((t) => t.id === templateId);
            if (template) {
                const newStyle = { ...template.style, templateId };
                setCaptionStyle(newStyle);
                updateCaptionStyle.mutate({
                    clipId,
                    style: newStyle,
                });
            }
        },
        [templates, clipId, updateCaptionStyle]
    );

    // Caption style change handler
    const handleStyleChange = useCallback(
        (newStyle: CaptionStyle) => {
            setCaptionStyle(newStyle);
            updateCaptionStyle.mutate({
                clipId,
                style: newStyle,
            });
        },
        [clipId, updateCaptionStyle]
    );

    // Export handler
    const handleExport = useCallback(
        (options: ExportOptionsType) => {
            initiateExport.mutate(
                {
                    clipId,
                    options: {
                        format: options.format as "mp4" | "mov",
                        resolution: options.resolution as "720p" | "1080p" | "4k",
                        captionStyleId: captionData?.style?.id,
                    },
                },
                {
                    onSuccess: (data) => {
                        setActiveExportId(data.export.id);
                    },
                }
            );
        },
        [clipId, captionData?.style?.id, initiateExport]
    );

    // Export completion handler
    const handleExportComplete = useCallback((downloadUrl: string) => {
        console.log("Export complete:", downloadUrl);
    }, []);

    // Export error handler
    const handleExportError = useCallback((error: string) => {
        console.error("Export error:", error);
        setActiveExportId(null);
    }, []);

    // Loading state
    if (clipLoading || (clip?.videoId && videoLoading)) {
        return <ClipEditorLoading />;
    }

    // Error state
    if (clipError || videoError) {
        return (
            <ClipEditorError
                error={(clipError || videoError) as Error}
                onBack={handleBack}
            />
        );
    }

    // Not found state
    if (!clip) {
        return <ClipNotFound onBack={handleBack} />;
    }

    // Get video source URL and thumbnail
    const videoSrc = video?.storageUrl || video?.sourceUrl || "";
    const thumbnailUrl = (video?.metadata?.thumbnail as string) || undefined;
    const videoDuration = video?.duration || clip.duration || 60;

    // Get captions for preview
    const captions = captionData?.captions || [];

    // Credit cost (example: 5 credits per export)
    const creditCost = 5;
    const userCredits = creditBalance?.balance ?? 0;

    return (
        <div className="flex h-full flex-col">
            {/* Header with back button and clip title */}
            <div className="flex items-center gap-4 border-b px-4 py-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    aria-label="Go back"
                >
                    <IconArrowLeft className="size-5" />
                </Button>
                <h1 className="truncate text-lg font-semibold">
                    {clip.title || "Untitled Clip"}
                </h1>
            </div>

            {/* Tabs Navigation */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-1 flex-col overflow-hidden"
            >
                <div className="border-b px-4">
                    <TabsList className="h-12">
                        <TabsTrigger value="edit" className="gap-2">
                            <IconEdit className="size-4" />
                            <span className="hidden sm:inline">Edit</span>
                        </TabsTrigger>
                        <TabsTrigger value="captions" className="gap-2">
                            <IconTypography className="size-4" />
                            <span className="hidden sm:inline">Captions</span>
                        </TabsTrigger>
                        <TabsTrigger value="export" className="gap-2">
                            <IconDownload className="size-4" />
                            <span className="hidden sm:inline">Export</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Edit Tab Content */}
                <TabsContent value="edit" className="flex-1 overflow-auto">
                    <div className="flex flex-col gap-6 p-4 lg:flex-row">
                        {/* Main Editor Area */}
                        <div className="flex-1">
                            <ClipBoundaryEditor
                                clipId={clipId}
                                initialStart={clip.startTime}
                                initialEnd={clip.endTime}
                                videoDuration={videoDuration}
                                videoSrc={videoSrc}
                                videoPoster={thumbnailUrl}
                                onSave={handleBoundarySave}
                            />
                        </div>

                        {/* Aspect Ratio Sidebar */}
                        <div className="w-full shrink-0 lg:w-72">
                            <div className="rounded-lg border bg-card p-4">
                                <h3 className="mb-4 font-medium">Aspect Ratio</h3>
                                <AspectRatioSelector
                                    value={aspectRatio}
                                    onChange={setAspectRatio}
                                    previewUrl={thumbnailUrl}
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Captions Tab Content */}
                <TabsContent value="captions" className="flex-1 overflow-auto">
                    <div className="flex flex-col gap-6 p-4 lg:flex-row">
                        {/* Caption Preview */}
                        <div className="flex-1">
                            <div className="mb-4">
                                <h3 className="mb-2 font-medium">Preview</h3>
                                {videoSrc ? (
                                    <CaptionPreview
                                        videoUrl={videoSrc}
                                        captions={captions}
                                        style={captionStyle}
                                        currentTime={currentTime}
                                        onTimeUpdate={setCurrentTime}
                                        poster={thumbnailUrl}
                                        className="aspect-video w-full"
                                    />
                                ) : (
                                    <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted">
                                        <p className="text-sm text-muted-foreground">
                                            Video preview not available
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Caption Templates */}
                            <CaptionTemplatePicker
                                templates={templates ?? []}
                                selectedId={captionStyle.templateId}
                                onSelect={handleTemplateSelect}
                                isLoading={templatesLoading}
                            />
                        </div>

                        {/* Caption Style Panel Sidebar */}
                        <div className="w-full shrink-0 lg:w-80">
                            <div className="rounded-lg border bg-card p-4">
                                <CaptionStylePanel
                                    style={captionStyle}
                                    onChange={handleStyleChange}
                                    disabled={updateCaptionStyle.isPending}
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Export Tab Content */}
                <TabsContent value="export" className="flex-1 overflow-auto">
                    <div className="flex flex-col gap-6 p-4 lg:flex-row">
                        {/* Export Options */}
                        <div className="flex-1">
                            <ExportOptions
                                onExport={handleExport}
                                creditCost={creditCost}
                                userCredits={userCredits}
                                disabled={initiateExport.isPending || !!activeExportId}
                                captionStyleId={captionData?.style?.id}
                            />
                        </div>

                        {/* Export Progress Sidebar */}
                        <div className="w-full shrink-0 lg:w-80">
                            {activeExportId ? (
                                <ExportProgress
                                    exportId={activeExportId}
                                    onComplete={handleExportComplete}
                                    onError={handleExportError}
                                />
                            ) : (
                                <div className="rounded-lg border bg-card p-6 text-center">
                                    <IconDownload className="mx-auto size-12 text-muted-foreground" />
                                    <h3 className="mt-4 font-medium">Ready to Export</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Configure your export options and click &quot;Export Clip&quot; to begin.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
