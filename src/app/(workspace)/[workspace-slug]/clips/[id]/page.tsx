"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    IconArrowLeft,
    IconAlertCircle,
    IconScissors,
    IconDownload,
    IconLoader,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EditingLayout } from "@/components/clips/editing-layout";
import type { ToolbarPanel } from "@/components/clips/editor-toolbar";
import { AdvancedTimeline } from "@/components/clips/advanced-timeline";
import { KeyboardShortcutsModal, useKeyboardShortcutsModal } from "@/components/clips/keyboard-shortcuts-modal";
import { CaptionPanelTabs } from "@/components/captions/caption-panel-tabs";
import { VideoCanvasEditor, type VideoCanvasEditorRef } from "@/components/video/video-canvas-editor";
import { TranscriptParagraphView } from "@/components/transcript/transcript-paragraph-view";
import { ExportOptions } from "@/components/export/export-options";
import { ExportProgress } from "@/components/export/export-progress";
import { useClip, useUpdateClipBoundaries } from "@/hooks/useClips";
import { useVideo } from "@/hooks/useVideo";
import { useCaptionStyle, useUpdateCaptionStyle, useUpdateCaptionText, useCaptionTemplates } from "@/hooks/useCaptions";
import { useInitiateExport } from "@/hooks/useExport";
import { useMinutesBalance } from "@/hooks/useMinutes";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { savePageScrollPosition } from "@/hooks/useScrollPosition";
import { useCaptionStylePresets } from "@/hooks/useCaptionStylePresets";
import { useKeyboardShortcuts, type KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import type { CaptionStyle, Caption, CaptionWord } from "@/lib/api/captions";
import type { ExportOptions as ExportOptionsType } from "@/lib/api/export";
import { analytics } from "@/lib/analytics";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

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
    x: 50,
    y: 85,
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

            {/* Content skeleton - 3 column layout */}
            <div className="flex flex-1 gap-4 p-4">
                {/* Left panel skeleton */}
                <div className="w-1/4">
                    <Skeleton className="h-full w-full rounded-lg" />
                </div>
                {/* Center panel skeleton */}
                <div className="flex-1">
                    <Skeleton className="aspect-video w-full rounded-lg" />
                </div>
                {/* Right panel skeleton */}
                <div className="w-1/4">
                    <Skeleton className="h-64 w-full rounded-lg" />
                </div>
            </div>

            {/* Timeline skeleton */}
            <div className="border-t p-4">
                <Skeleton className="h-24 w-full rounded-lg" />
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
// Header Component
// ============================================================================

interface EditorHeaderProps {
    title: string;
    onBack: () => void;
    isSaving: boolean;
    onExportClick: () => void;
    hasActiveExport: boolean;
    workspaceSlug: string;
    videoId?: string;
    videoTitle?: string;
    hasUnsavedChanges?: boolean;
    onSave?: () => void;
}

/**
 * EditorHeader - Header component with back button, breadcrumbs, and export button
 */
function EditorHeader({
    title,
    onBack,
    isSaving,
    onExportClick,
    hasActiveExport,
    workspaceSlug,
    videoId,
    videoTitle,
    hasUnsavedChanges = false,
    onSave,
}: EditorHeaderProps) {
    return (
        <div className="flex flex-col gap-2 px-4 py-3">
            {/* Breadcrumb Navigation */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink
                            render={
                                <Link href={`/${workspaceSlug}`}>
                                    Videos
                                </Link>
                            }
                        />
                    </BreadcrumbItem>
                    {videoId && (
                        <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    render={
                                        <Link href={`/${workspaceSlug}/videos/${videoId}/clips`}>
                                            {videoTitle || "Video"}
                                        </Link>
                                    }
                                />
                            </BreadcrumbItem>
                        </>
                    )}
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{title || "Clip"}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Main Header Row */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        aria-label="Go back to clips"
                    >
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <h1 className="truncate text-lg font-semibold">
                        {title || "Untitled Clip"}
                    </h1>
                    {/* Save status indicator */}
                    {isSaving && (
                        <Badge variant="secondary" className="gap-1">
                            <IconLoader className="size-3 animate-spin" />
                            Saving...
                        </Badge>
                    )}
                    {hasUnsavedChanges && !isSaving && (
                        <Badge variant="outline" className="gap-1 text-yellow-500 border-yellow-500">
                            Unsaved changes
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {hasUnsavedChanges && onSave && (
                        <Button
                            onClick={onSave}
                            variant="outline"
                            disabled={isSaving}
                            className="gap-2"
                        >
                            Save
                        </Button>
                    )}
                    <Button
                        onClick={onExportClick}
                        className="gap-2"
                    >
                        <IconDownload className="size-4" />
                        {hasUnsavedChanges ? "Save & Export" : "Export"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Export Dialog Component
// ============================================================================

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clipId: string;
    captionStyleId?: string;
    creditCost?: number;
    userCredits?: number;
    activeExportId: string | null;
    onExport: (options: ExportOptionsType) => void;
    onExportComplete: (downloadUrl: string) => void;
    onExportError: (error: string) => void;
    onReset: () => void;
    isExporting: boolean;
}

function ExportDialog({
    open,
    onOpenChange,
    clipId,
    captionStyleId,
    creditCost,
    userCredits,
    activeExportId,
    onExport,
    onExportComplete,
    onExportError,
    onReset,
    isExporting,
}: ExportDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Clip</DialogTitle>
                    <DialogDescription>
                        Configure settings and download your clip.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    {activeExportId ? (
                        <div className="flex flex-col gap-4">
                            <ExportProgress
                                exportId={activeExportId}
                                onComplete={onExportComplete}
                                onError={onExportError}
                            />
                            <Button
                                variant="outline"
                                onClick={onReset}
                                className="w-full rounded-xl"
                            >
                                Export Again
                            </Button>
                        </div>
                    ) : (
                        <ExportOptions
                            onExport={onExport}
                            creditCost={creditCost}
                            userCredits={userCredits}
                            disabled={isExporting}
                            captionStyleId={captionStyleId}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// Main Clip Editor Page Component
// ============================================================================

/**
 * ClipEditorPage - Advanced editing screen with EditingLayout
 * 
 * Layout:
 * - Desktop (≥1024px): 3-column layout with caption editor (left), video player (center), style panel (right), timeline (bottom)
 * - Mobile (<1024px): Stacked layout with video player at top
 * 
 * Features:
 * - Real-time caption editing with sync to video
 * - Caption style customization with viral-optimized fonts
 * - Timeline editor for clip boundary adjustments
 * - Export functionality with progress tracking
 * 
 * @validates Requirements 5.1-5.6 (Editing Screen Layout)
 */
export default function ClipEditorPage({ params }: ClipEditorPageProps) {
    const { "workspace-slug": slug, id: clipId } = use(params);
    const router = useRouter();

    // Keyboard shortcuts modal
    const { open: shortcutsModalOpen, setOpen: setShortcutsModalOpen } = useKeyboardShortcutsModal();

    // Refs
    const videoPlayerRef = useRef<VideoCanvasEditorRef>(null);

    // State
    const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeExportId, setActiveExportId] = useState<string | null>(null);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [clipBoundaries, setClipBoundaries] = useState<{ start: number; end: number } | null>(null);
    // Local captions state for optimistic UI updates during real-time editing
    const [localCaptions, setLocalCaptions] = useState<Caption[] | null>(null);
    // Track unsaved changes
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

    const [activeToolbarPanel, setActiveToolbarPanel] = useState<ToolbarPanel>(null);

    // Undo/redo state management for caption text edits
    const {
        state: captionUndoState,
        setState: setCaptionUndoState,
        undo: undoCaptionEdit,
        redo: redoCaptionEdit,
        canUndo,
        canRedo,
        clearHistory: clearCaptionHistory,
    } = useUndoRedo<{ segmentId: string; text: string } | null>({
        initialState: null,
        maxHistory: 50,
    });

    // Caption style presets hook
    // @validates Requirements 9.2, 9.4, 9.5 - Preset application and last used style persistence
    const {
        presets: defaultPresets,
        selectedPresetId,
        applyPreset,
        getLastUsedStyle,
        saveLastUsedStyle,
        clearSelectedPreset,
    } = useCaptionStylePresets();

    // Fetch caption templates from API
    const { data: apiTemplates, isLoading: templatesLoading } = useCaptionTemplates();

    // Convert API templates to preset format and merge with defaults
    const presets = useMemo(() => {
        if (!apiTemplates || apiTemplates.length === 0) {
            return defaultPresets;
        }

        // Convert API templates to CaptionStylePreset format
        return apiTemplates.map((template) => ({
            id: template.id,
            name: template.name,
            description: template.description || "",
            thumbnail: template.preview,
            style: template.style as CaptionStyle,
            tags: template.platform ? [template.platform.toLowerCase()] : [],
        }));
    }, [apiTemplates, defaultPresets]);

    // Track the currently selected preset ID in local state for UI updates
    const [currentPresetId, setCurrentPresetId] = useState<string | undefined>(selectedPresetId);

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

    // Fetch caption style for this clip
    const { data: captionData } = useCaptionStyle(clipId);

    // Fetch user minutes balance
    const { data: minutesBalance } = useMinutesBalance(workspace?.id);

    // Mutations
    const updateCaptionStyle = useUpdateCaptionStyle();
    const updateClipBoundaries = useUpdateClipBoundaries();
    const updateCaptionText = useUpdateCaptionText();
    const initiateExport = useInitiateExport();

    // Convert words from API to Caption[] format for VIDEO OVERLAY
    // Groups words into segments of max 5 words (matching backend ASS subtitle generation)
    // This is used for the video preview caption overlay
    const captionsForVideo = useMemo((): Caption[] => {
        const words = captionData?.words;
        if (!words || !Array.isArray(words) || words.length === 0) {
            return [];
        }

        const segments: Caption[] = [];
        let currentWords: CaptionWord[] = [];

        for (let i = 0; i < words.length; i++) {
            currentWords.push({
                id: words[i].id || `word-${i}`,
                word: words[i].word,
                start: words[i].start,
                end: words[i].end,
                highlight: words[i].highlight || false,
            });

            // Match backend: max 5 words per line, or break on sentence-ending punctuation
            if (/[.!?]$/.test(words[i].word) || currentWords.length >= 5 || i === words.length - 1) {
                segments.push({
                    id: `caption-${segments.length}`,
                    text: currentWords.map(w => w.word).join(" "),
                    startTime: currentWords[0].start,
                    endTime: currentWords[currentWords.length - 1].end,
                    words: currentWords,
                });
                currentWords = [];
            }
        }
        return segments;
    }, [captionData?.words]);

    // Convert words from API to Caption[] format for TRANSCRIPT PANEL
    // Groups words into sentence-based paragraphs for better readability
    // This is used for the left panel transcript editor
    const captionsForTranscript = useMemo((): Caption[] => {
        const words = captionData?.words;
        if (!words || !Array.isArray(words) || words.length === 0) {
            return [];
        }

        const segments: Caption[] = [];
        let currentWords: CaptionWord[] = [];

        for (let i = 0; i < words.length; i++) {
            currentWords.push({
                id: words[i].id || `word-${i}`,
                word: words[i].word,
                start: words[i].start,
                end: words[i].end,
                highlight: words[i].highlight || false,
            });

            // Break on sentence-ending punctuation for paragraph grouping
            if (/[.!?]$/.test(words[i].word) || i === words.length - 1) {
                segments.push({
                    id: `paragraph-${segments.length}`,
                    text: currentWords.map(w => w.word).join(" "),
                    startTime: currentWords[0].start,
                    endTime: currentWords[currentWords.length - 1].end,
                    words: currentWords,
                });
                currentWords = [];
            }
        }
        return segments;
    }, [captionData?.words]);

    // Initialize caption style from fetched data
    useState(() => {
        if (captionData?.style) {
            setCaptionStyle(captionData.style);
        }
    });

    // Initialize clip boundaries from fetched data
    useState(() => {
        if (clip) {
            setClipBoundaries({ start: clip.startTime, end: clip.endTime });
        }
    });

    /**
     * Initialize caption style from last used style or fetched data
     * @validates Requirements 9.5 - Save last used caption style as default for new clips
     */
    useEffect(() => {
        // If we have fetched caption data with style, use it
        if (captionData?.style) {
            setCaptionStyle(captionData.style);
            // Also set the template ID if available
            if (captionData.templateId) {
                setCurrentPresetId(captionData.templateId);
            }
            return;
        }

        // Otherwise, try to use the last used style as default
        const lastUsedStyle = getLastUsedStyle();
        if (lastUsedStyle) {
            setCaptionStyle(lastUsedStyle);
            return;
        }

        // If no saved style and we have API templates, use the first one
        if (apiTemplates && apiTemplates.length > 0) {
            const firstTemplate = apiTemplates[0];
            setCaptionStyle(firstTemplate.style as CaptionStyle);
            setCurrentPresetId(firstTemplate.id);
        }
    }, [captionData?.style, captionData?.templateId, getLastUsedStyle, apiTemplates]);

    // Sync selected preset ID from hook
    useEffect(() => {
        setCurrentPresetId(selectedPresetId);
    }, [selectedPresetId]);

    /**
     * Clear undo history when navigating away from the editing screen
     */
    useEffect(() => {
        return () => {
            clearCaptionHistory();
        };
    }, [clearCaptionHistory]);

    // Navigation handlers
    /**
     * Handle back navigation with unsaved changes check
     */
    const handleBack = useCallback(() => {
        if (hasUnsavedChanges) {
            setPendingNavigation(() => () => {
                // Save scroll position for the video clips page before navigating
                if (clip?.videoId) {
                    savePageScrollPosition(`video_clips_${clip.videoId}`);
                    router.push(`/${slug}/videos/${clip.videoId}/clips`);
                } else {
                    router.push(`/${slug}`);
                }
            });
            setShowUnsavedDialog(true);
        } else {
            // Save scroll position for the video clips page before navigating
            if (clip?.videoId) {
                savePageScrollPosition(`video_clips_${clip.videoId}`);
                router.push(`/${slug}/videos/${clip.videoId}/clips`);
            } else {
                router.push(`/${slug}`);
            }
        }
    }, [router, slug, clip?.videoId, hasUnsavedChanges]);

    // Video time update handler
    const handleTimeUpdate = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    // Play/pause toggle handler
    const handlePlayPause = useCallback(() => {
        if (videoPlayerRef.current) {
            if (isPlaying) {
                videoPlayerRef.current.pause();
            } else {
                videoPlayerRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying]);

    // Skip forward handler (5 seconds)
    const handleSkipForward = useCallback(() => {
        if (videoPlayerRef.current) {
            const clipDur = (clipBoundaries?.end ?? clip?.endTime ?? 0) - (clipBoundaries?.start ?? clip?.startTime ?? 0);
            const isRawClip = !!clip?.rawStorageUrl;
            const newTime = Math.min(currentTime + 5, clipDur);
            // When using raw clip, video starts at 0, so seek directly
            // When using full video, add the clip start time
            videoPlayerRef.current.seek(isRawClip ? newTime : newTime + (clipBoundaries?.start ?? clip?.startTime ?? 0));
        }
    }, [currentTime, clipBoundaries, clip]);

    // Skip backward handler (5 seconds)
    const handleSkipBackward = useCallback(() => {
        if (videoPlayerRef.current) {
            const isRawClip = !!clip?.rawStorageUrl;
            const newTime = Math.max(0, currentTime - 5);
            // When using raw clip, video starts at 0, so seek directly
            // When using full video, add the clip start time
            videoPlayerRef.current.seek(isRawClip ? newTime : newTime + (clipBoundaries?.start ?? clip?.startTime ?? 0));
        }
    }, [currentTime, clipBoundaries, clip]);

    // Segment click handler - seek video to timestamp
    const handleSegmentClick = useCallback((timestamp: number) => {
        videoPlayerRef.current?.seek(timestamp);
    }, []);

    /**
     * Handle caption edit for real-time sync with video overlay
     * Updates local captions state optimistically and saves immediately
     */
    const handleCaptionEdit = useCallback((segmentId: string, newText: string) => {
        // Get the current captions (either local state or from server)
        // Use transcript captions since editing happens in the transcript panel
        const currentCaptions = localCaptions ?? captionsForVideo;

        // Find the original text for undo history
        const originalCaption = currentCaptions.find((caption: Caption) => caption.id === segmentId);
        const originalText = originalCaption?.text ?? "";

        // Track the edit in undo history
        setCaptionUndoState({ segmentId, text: originalText });

        // Find the caption that matches the segment ID and update it optimistically
        const updatedCaptions = currentCaptions.map((caption: Caption) => {
            if (caption.id === segmentId) {
                return { ...caption, text: newText };
            }
            return caption;
        });

        // Update local state for immediate UI feedback
        setLocalCaptions(updatedCaptions);

        // Save immediately
        updateCaptionText.mutate({
            clipId,
            captionId: segmentId,
            text: newText,
        });
    }, [localCaptions, captionsForVideo, clipId, updateCaptionText, setCaptionUndoState]);

    /**
     * Handle manual style changes (not from preset selection)
     * Marks changes as unsaved instead of auto-saving
     */
    const handleStyleChange = useCallback(
        (newStyle: CaptionStyle | Partial<CaptionStyle>) => {
            // Merge with existing style for partial updates
            const mergedStyle = { ...captionStyle, ...newStyle } as CaptionStyle;

            // Update local state immediately for responsive UI
            setCaptionStyle(mergedStyle);

            // Mark as unsaved
            setHasUnsavedChanges(true);

            // Clear the selected preset since user is manually editing
            clearSelectedPreset();
            setCurrentPresetId(undefined);
        },
        [captionStyle, clearSelectedPreset]
    );

    /**
     * Handle preset selection
     * Marks changes as unsaved instead of auto-saving
     */
    const handlePresetSelect = useCallback(
        (presetId: string, presetStyle: CaptionStyle) => {
            // Apply the preset style immediately for responsive UI
            setCaptionStyle(presetStyle);
            setCurrentPresetId(presetId);

            // Mark as unsaved
            setHasUnsavedChanges(true);

            // Use the hook's applyPreset to handle localStorage persistence
            applyPreset(presetId);
        },
        [applyPreset]
    );

    // Timeline boundary change handler
    const handleBoundaryChange = useCallback(
        (startTime: number, endTime: number) => {
            setClipBoundaries({ start: startTime, end: endTime });
            updateClipBoundaries.mutate({
                clipId,
                boundaries: {
                    startTime,
                    endTime,
                },
            });
        },
        [clipId, updateClipBoundaries]
    );

    /**
     * Handle save action - saves all pending changes (caption style and clip boundaries)
     * Triggered by Ctrl+S / Cmd+S keyboard shortcut or Save & Export button
     * @validates Requirements 14.4 - Ctrl+S (or Cmd+S on Mac) saves all pending changes
     */
    const handleSave = useCallback(async () => {
        const promises: Promise<any>[] = [];

        // Save caption style if there are changes
        if (captionStyle) {
            promises.push(
                updateCaptionStyle.mutateAsync({
                    clipId,
                    style: captionStyle,
                    templateId: currentPresetId,
                })
            );

            // Save the style as last used
            saveLastUsedStyle(captionStyle, currentPresetId);
        }

        // Save clip boundaries if there are changes
        if (clipBoundaries) {
            promises.push(
                updateClipBoundaries.mutateAsync({
                    clipId,
                    boundaries: {
                        startTime: clipBoundaries.start,
                        endTime: clipBoundaries.end,
                    },
                })
            );
        }

        await Promise.all(promises);

        // Clear unsaved changes flag
        setHasUnsavedChanges(false);
    }, [clipId, captionStyle, currentPresetId, clipBoundaries, updateCaptionStyle, updateClipBoundaries, saveLastUsedStyle]);

    // Export handler
    const handleExport = useCallback(
        async (options: ExportOptionsType) => {
            // Track clip export
            analytics.clipExported({
                clipId,
                aspectRatio: "9:16",
                quality: options.resolution as string,
                withCaptions: !!currentPresetId,
            });

            // Save changes before exporting and wait for them to complete
            try {
                await handleSave();
            } catch (e) {
                console.error("Failed to save before export:", e);
                // Continue with export anyway — backend will use whatever is in DB
            }

            initiateExport.mutate(
                {
                    clipId,
                    options: {
                        format: options.format as "mp4" | "mov",
                        resolution: options.resolution as "720p" | "1080p" | "4k",
                        captionStyleId: currentPresetId ?? undefined,
                    },
                },
                {
                    onSuccess: (data) => {
                        setActiveExportId(data.export.clipId || clipId);
                    },
                }
            );
        },
        [clipId, currentPresetId, initiateExport, handleSave]
    );

    // Export completion handler — keep progress view so user can see download button
    const handleExportComplete = useCallback((downloadUrl: string) => {
        console.log("Export complete:", downloadUrl);
        // Don't clear activeExportId — ExportProgress shows the completed state with download button
    }, []);

    // Export error handler — keep progress view so user can see error and retry
    const handleExportError = useCallback((error: string) => {
        console.error("Export error:", error);
        // Don't clear activeExportId — ExportProgress shows the error with retry option
    }, []);

    /**
     * Handle Escape key - close export dialog or exit fullscreen
     * @validates Requirements 14.5 - Escape exits fullscreen mode or closes modals
     */
    const handleEscape = useCallback(() => {
        // Close export dialog if open
        if (exportDialogOpen) {
            setExportDialogOpen(false);
            return;
        }

        // Exit fullscreen if in fullscreen mode
        if (document.fullscreenElement) {
            document.exitFullscreen().catch((err) => {
                console.error("Error exiting fullscreen:", err);
            });
        }
    }, [exportDialogOpen]);

    /**
     * Handle undo action - restores the previous caption text state
     * Updates local captions and triggers auto-save for the restored text
     * @validates Requirements 19.2 - Undo last caption edit with Ctrl+Z
     */
    const handleUndo = useCallback(() => {
        if (!canUndo) return;

        // Get the current captions before undo
        const currentCaptions = localCaptions ?? captionsForVideo;

        // Perform undo - this will update captionUndoState to the previous state
        undoCaptionEdit();

        // The undo state now contains the previous caption state
        // We need to apply it to the local captions
        // Note: The state update from undoCaptionEdit is async, so we use the current state
        // The effect below will handle applying the undone state
    }, [canUndo, localCaptions, captionsForVideo, undoCaptionEdit]);

    /**
     * Handle redo action - restores the next caption text state
     */
    const handleRedo = useCallback(() => {
        if (!canRedo) return;
        redoCaptionEdit();
    }, [canRedo, redoCaptionEdit]);

    /**
     * Effect to apply undo/redo state changes to local captions
     * When captionUndoState changes (from undo/redo), update the local captions and save
     */
    useEffect(() => {
        if (captionUndoState === null) return;

        const { segmentId, text } = captionUndoState;

        // Get the current captions
        const currentCaptions = localCaptions ?? captionsForVideo;

        // Update the caption with the undone/redone text
        const updatedCaptions = currentCaptions.map((caption: Caption) => {
            if (caption.id === segmentId) {
                return { ...caption, text };
            }
            return caption;
        });

        // Update local state
        setLocalCaptions(updatedCaptions);

        // Save immediately
        updateCaptionText.mutate({
            clipId,
            captionId: segmentId,
            text,
        });
    }, [captionUndoState, localCaptions, captionsForVideo, clipId, updateCaptionText]);

    /**
     * Global keyboard shortcuts for the editing screen
     * @validates Requirements 14.4 - Ctrl+S / Cmd+S for save
     * @validates Requirements 14.5 - Escape for close modal/exit fullscreen
     * @validates Requirements 19.2 - Ctrl+Z / Cmd+Z for undo
     * @validates Requirements 19.3 - Ctrl+Shift+Z / Cmd+Shift+Z for redo
     */
    const globalShortcuts: KeyboardShortcut[] = useMemo(() => [
        {
            // Ctrl+S for Windows/Linux
            key: "s",
            modifiers: { ctrl: true },
            handler: handleSave,
            preventDefault: true, // Prevent browser save dialog
            description: "Save all changes",
            allowInInput: false, // Don't trigger when editing text
        },
        {
            // Cmd+S for Mac
            key: "s",
            modifiers: { meta: true },
            handler: handleSave,
            preventDefault: true, // Prevent browser save dialog
            description: "Save all changes",
            allowInInput: false, // Don't trigger when editing text
        },
        {
            key: "Escape",
            handler: handleEscape,
            preventDefault: false, // Allow default Escape behavior for other elements
            description: "Close modal or exit fullscreen",
            allowInInput: true, // Escape should work even in inputs
        },
        // Undo shortcuts
        // @validates Requirements 19.2 - Ctrl+Z / Cmd+Z for undo
        {
            // Ctrl+Z for Windows/Linux
            key: "z",
            modifiers: { ctrl: true },
            handler: handleUndo,
            preventDefault: true, // Prevent browser undo
            description: "Undo caption edit",
            allowInInput: false, // Don't trigger when editing text in input fields
        },
        {
            // Cmd+Z for Mac
            key: "z",
            modifiers: { meta: true },
            handler: handleUndo,
            preventDefault: true, // Prevent browser undo
            description: "Undo caption edit",
            allowInInput: false, // Don't trigger when editing text in input fields
        },
        // Redo shortcuts
        // @validates Requirements 19.3 - Ctrl+Shift+Z / Cmd+Shift+Z for redo
        {
            // Ctrl+Shift+Z for Windows/Linux
            key: "z",
            modifiers: { ctrl: true, shift: true },
            handler: handleRedo,
            preventDefault: true, // Prevent browser redo
            description: "Redo caption edit",
            allowInInput: false, // Don't trigger when editing text in input fields
        },
        {
            // Cmd+Shift+Z for Mac
            key: "z",
            modifiers: { meta: true, shift: true },
            handler: handleRedo,
            preventDefault: true, // Prevent browser redo
            description: "Redo caption edit",
            allowInInput: false, // Don't trigger when editing text in input fields
        },
    ], [handleSave, handleEscape, handleUndo, handleRedo]);

    // Register global keyboard shortcuts
    // @validates Requirements 14.4, 14.5 - Keyboard shortcuts for editing
    useKeyboardShortcuts(globalShortcuts, { enabled: true });

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

    // Create the clip object for TimelineEditor with current boundaries
    const clipWithBoundaries = {
        ...clip,
        startTime: clipBoundaries?.start ?? clip.startTime,
        endTime: clipBoundaries?.end ?? clip.endTime,
    };

    // Get video source URL for editing
    // Priority:
    // 1. rawStorageUrl (clip without captions) - best for editing
    // 2. Original video with clip time range - fallback for old clips
    // Note: We DON'T use clip.storageUrl because it has captions baked in
    const videoSrc = clip.rawStorageUrl || video?.storageUrl || video?.sourceUrl || "";

    // Determine if we're using the raw clip or the full video
    // If using full video, we need to constrain playback to clip boundaries
    const isUsingRawClip = !!clip.rawStorageUrl;

    // When using raw clip, video starts at 0 (it's already trimmed)
    // When using full video, we need to use the clip's original boundaries
    const videoStartTime = isUsingRawClip ? 0 : clipWithBoundaries.startTime;
    const videoEndTime = isUsingRawClip ? (clipWithBoundaries.endTime - clipWithBoundaries.startTime) : clipWithBoundaries.endTime;
    const clipDuration = clipWithBoundaries.endTime - clipWithBoundaries.startTime;

    const thumbnailUrl = (video?.metadata?.thumbnail as string) || undefined;
    const videoDuration = video?.duration || clip.duration || 60;

    // Captions for video overlay (5 words per line, matching backend)
    const videoCaptions = localCaptions && localCaptions.length > 0 ? localCaptions : captionsForVideo;

    // Captions for transcript panel (sentence-based paragraphs)
    const transcriptCaptions = captionsForTranscript;

    // Determine if saving is in progress (includes caption text auto-save)
    // @validates Requirements 13.2 - Show saving indicator during save operations
    const isSaving = updateCaptionStyle.isPending || updateClipBoundaries.isPending || updateCaptionText.isPending;

    return (
        <>
            <EditingLayout
                className="h-screen"
                activeToolbarPanel={activeToolbarPanel}
                onToolbarPanelChange={setActiveToolbarPanel}
                header={
                    <EditorHeader
                        title={clip.title || "Untitled Clip"}
                        onBack={handleBack}
                        isSaving={isSaving}
                        onExportClick={() => setExportDialogOpen(true)}
                        hasActiveExport={!!activeExportId}
                        workspaceSlug={slug}
                        videoId={clip.videoId}
                        videoTitle={video?.title ?? undefined}
                        hasUnsavedChanges={hasUnsavedChanges}
                        onSave={handleSave}
                    />
                }
            >
                {{
                    /* Left Panel: Caption Editor (Paragraph View) */
                    captionEditor: (
                        <div className="h-full">
                            {video?.id ? (
                                <TranscriptParagraphView
                                    segments={transcriptCaptions.map((c) => ({
                                        id: c.id,
                                        text: c.text,
                                        startTime: c.startTime,
                                        endTime: c.endTime,
                                        words: c.words.map((w) => ({
                                            word: w.word,
                                            start: w.start,
                                            end: w.end,
                                            confidence: 1,
                                        })),
                                    }))}
                                    currentTime={currentTime}
                                    onWordClick={handleSegmentClick}
                                    onTextEdit={handleCaptionEdit}
                                    highlightCurrent
                                    className="h-full"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full bg-zinc-900">
                                    <p className="text-sm text-zinc-500">
                                        No video available for transcript
                                    </p>
                                </div>
                            )}
                        </div>
                    ),

                    /* Center Panel: Video Canvas Editor with Caption Overlay */
                    videoPlayer: (
                        <div className="flex flex-col gap-4 h-full">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Preview
                            </h2>
                            {videoSrc ? (
                                <VideoCanvasEditor
                                    ref={videoPlayerRef as React.Ref<VideoCanvasEditorRef>}
                                    src={videoSrc}
                                    startTime={videoStartTime}
                                    endTime={videoEndTime}
                                    captions={videoCaptions}
                                    captionStyle={captionStyle}
                                    onCaptionStyleChange={handleStyleChange}
                                    onTimeUpdate={handleTimeUpdate}
                                    aspectRatio="9:16"
                                    className="flex-1 rounded-lg overflow-hidden"
                                />
                            ) : (
                                <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted">
                                    <p className="text-sm text-muted-foreground">
                                        Video preview not available
                                    </p>
                                </div>
                            )}
                        </div>
                    ),

                    /* Right Panel: Caption Style Panel */
                    stylePanel: (
                        <CaptionPanelTabs
                            style={captionStyle}
                            onChange={handleStyleChange}
                            disabled={updateCaptionStyle.isPending}
                            presets={presets}
                            selectedPresetId={currentPresetId}
                            onPresetSelect={handlePresetSelect}
                        />
                    ),

                    /* Bottom Panel: Timeline Editor */
                    timeline: (
                        <AdvancedTimeline
                            clipStartTime={videoStartTime}
                            clipEndTime={videoEndTime}
                            currentTime={currentTime}
                            isPlaying={isPlaying}
                            onSeek={(time) => videoPlayerRef.current?.seek(time + videoStartTime)}
                            onPlayPause={handlePlayPause}
                            onSkipForward={handleSkipForward}
                            onSkipBackward={handleSkipBackward}
                            videoSrc={videoSrc}
                            className="w-full"
                        />
                    ),
                }}
            </EditingLayout>

            {/* Export Dialog */}
            <ExportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                clipId={clipId}
                captionStyleId={captionData?.templateId ?? undefined}
                activeExportId={activeExportId}
                onExport={handleExport}
                onExportComplete={handleExportComplete}
                onExportError={handleExportError}
                onReset={() => setActiveExportId(null)}
                isExporting={initiateExport.isPending}
            />

            {/* Keyboard Shortcuts Modal */}
            <KeyboardShortcutsModal
                open={shortcutsModalOpen}
                onOpenChange={setShortcutsModalOpen}
            />

            {/* Unsaved Changes Dialog */}
            <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unsaved Changes</DialogTitle>
                        <DialogDescription>
                            You have unsaved changes. Do you want to save them before leaving?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowUnsavedDialog(false);
                                setHasUnsavedChanges(false);
                                if (pendingNavigation) {
                                    pendingNavigation();
                                    setPendingNavigation(null);
                                }
                            }}
                        >
                            Discard Changes
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowUnsavedDialog(false);
                                setPendingNavigation(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                handleSave();
                                setShowUnsavedDialog(false);
                                // Wait for save to complete before navigating
                                setTimeout(() => {
                                    if (pendingNavigation) {
                                        pendingNavigation();
                                        setPendingNavigation(null);
                                    }
                                }, 500);
                            }}
                        >
                            Save & Leave
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
