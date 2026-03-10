"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    IconArrowLeft,
    IconAlertCircle,
    IconScissors,
    IconDownload,
    IconLoader,
    IconDeviceMobile,
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
import { useClip, useUpdateClipBoundaries, useUpdateClip } from "@/hooks/useClips";
import { useVideo } from "@/hooks/useVideo";
import { useCaptionStyle, useUpdateCaptionStyle, useCaptionTemplates, captionKeys } from "@/hooks/useCaptions";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useInitiateExport } from "@/hooks/useExport";
import { useSmartCropStatus, useTriggerSmartCrop } from "@/hooks/useSmartCrop";
import { useMinutesBalance } from "@/hooks/useMinutes";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { savePageScrollPosition } from "@/hooks/useScrollPosition";
import { useCaptionStylePresets } from "@/hooks/useCaptionStylePresets";
import { useKeyboardShortcuts, type KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import type { CaptionStyle, Caption, CaptionWord } from "@/lib/api/captions";
import { captionsApi } from "@/lib/api/captions";
import { analytics } from "@/lib/analytics";
import { videoConfigApi } from "@/lib/api/video-config";
import { toast } from "sonner";
import { ClipInfoPanel } from "@/components/clips/clip-info-panel";
import { TextOverlayPanel, type TextOverlay } from "@/components/clips/text-overlay-panel";
import { BackgroundStylePanel } from "@/components/clips/background-style-panel";
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
    clipId?: string;
    clipStatus?: string;
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
    clipId,
    clipStatus,
}: EditorHeaderProps) {
    const { data: smartCrop } = useSmartCropStatus(clipId || "", !!clipId && (clipStatus === "ready" || clipStatus === "exported"));
    const { mutate: triggerSmartCrop, isPending: isTriggering } = useTriggerSmartCrop(clipId || "");

    const isClipReady = clipStatus === "ready" || clipStatus === "exported";
    const scStatus = smartCrop?.status || "not_started";
    const scProcessing = scStatus === "pending" || scStatus === "processing";
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
    const queryClient = useQueryClient();

    // Keyboard shortcuts modal
    const { open: shortcutsModalOpen, setOpen: setShortcutsModalOpen } = useKeyboardShortcutsModal();

    // Refs
    const videoPlayerRef = useRef<VideoCanvasEditorRef>(null);

    // State
    const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [clipBoundaries, setClipBoundaries] = useState<{ start: number; end: number } | null>(null);
    // Local edited words — single source of truth for caption edits
    // Both video overlay and transcript panel derive from this
    const [localWords, setLocalWords] = useState<CaptionWord[] | null>(null);
    // Local transcript captions state (paragraph-grouped) for inline editing
    const [localTranscriptCaptions, setLocalTranscriptCaptions] = useState<Caption[] | null>(null);
    // Track unsaved changes — granular per concern
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [dirtyWords, setDirtyWords] = useState(false);
    const [dirtyStyle, setDirtyStyle] = useState(false);
    const [dirtyBoundaries, setDirtyBoundaries] = useState(false);
    const [dirtyOverlays, setDirtyOverlays] = useState(false);
    const [isSavingWords, setIsSavingWords] = useState(false);
    const [isSavingAll, setIsSavingAll] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

    const [activeToolbarPanel, setActiveToolbarPanel] = useState<ToolbarPanel>(null);

    // Text overlay state
    const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);

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
    const { data: captionData, isLoading: captionLoading } = useCaptionStyle(clipId);

    // Fetch video config for background style
    const { data: videoConfigData } = useQuery({
        queryKey: ["video-config", clip?.videoId],
        queryFn: () => videoConfigApi.getConfig(clip!.videoId),
        enabled: !!clip?.videoId,
    });
    const [backgroundStyle, setBackgroundStyle] = useState<string>("black");
    const [aspectRatio, setAspectRatio] = useState<"9:16" | "1:1" | "16:9">("9:16");
    const [videoScale, setVideoScale] = useState<number>(125);
    const [dirtyBackground, setDirtyBackground] = useState(false);
    const [dirtyAspectRatio, setDirtyAspectRatio] = useState(false);
    const [dirtyVideoScale, setDirtyVideoScale] = useState(false);

    // Sync background style, aspect ratio, and video scale from video config
    useEffect(() => {
        if (videoConfigData?.config?.backgroundStyle) {
            setBackgroundStyle(videoConfigData.config.backgroundStyle);
        }
        if (videoConfigData?.config?.aspectRatio) {
            setAspectRatio(videoConfigData.config.aspectRatio);
        }
        if (videoConfigData?.config?.videoScale) {
            setVideoScale(videoConfigData.config.videoScale);
        }
    }, [videoConfigData]);

    const handleBackgroundStyleChange = useCallback((style: string) => {
        setBackgroundStyle(style);
        setDirtyBackground(true);
        setHasUnsavedChanges(true);
    }, []);

    const handleAspectRatioChange = useCallback((ratio: "9:16" | "1:1" | "16:9") => {
        setAspectRatio(ratio);
        setDirtyAspectRatio(true);
        setHasUnsavedChanges(true);
    }, []);

    const handleVideoScaleChange = useCallback((scale: number) => {
        setVideoScale(scale);
        setDirtyVideoScale(true);
        setHasUnsavedChanges(true);
    }, []);

    // Fetch user minutes balance
    const { data: minutesBalance } = useMinutesBalance(workspace?.id);

    // Mutations
    const updateCaptionStyle = useUpdateCaptionStyle();
    const updateClipBoundaries = useUpdateClipBoundaries();
    const updateClip = useUpdateClip();
    const initiateExport = useInitiateExport();

    // Convert words from API to Caption[] format for VIDEO OVERLAY
    // Groups words into segments of max 5 words (matching backend ASS subtitle generation)
    // This is used for the video preview caption overlay
    const captionsForVideo = useMemo((): Caption[] => {
        const words = localWords ?? captionData?.words;
        if (!words || !Array.isArray(words) || words.length === 0) {
            return [];
        }

        const wordsPerLine = captionStyle?.wordsPerLine ?? 5;
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

            // Break on sentence-ending punctuation, max words per line, or last word
            if (/[.!?,;:]$/.test(words[i].word) || currentWords.length >= wordsPerLine || i === words.length - 1) {
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
    }, [localWords, captionData?.words, captionStyle?.wordsPerLine]);

    // Convert words from API to Caption[] format for TRANSCRIPT PANEL
    // Groups words into sentence-based paragraphs for better readability
    // This is used for the left panel transcript editor
    const captionsForTranscript = useMemo((): Caption[] => {
        const words = localWords ?? captionData?.words;
        if (!words || !Array.isArray(words) || words.length === 0) {
            return [];
        }

        // Check if any words have sentence-ending punctuation
        const hasPunctuation = words.some(w => /[.!?]$/.test(w.word));

        const segments: Caption[] = [];
        let currentWords: CaptionWord[] = [];

        // Threshold for detecting a natural pause between words (in seconds)
        const PAUSE_THRESHOLD = 0.7;
        // Max words per paragraph when no punctuation is available
        const MAX_WORDS_PER_PARAGRAPH = 20;

        for (let i = 0; i < words.length; i++) {
            currentWords.push({
                id: words[i].id || `word-${i}`,
                word: words[i].word,
                start: words[i].start,
                end: words[i].end,
                highlight: words[i].highlight || false,
            });

            const isLastWord = i === words.length - 1;
            const hasSentenceEnd = /[.!?]$/.test(words[i].word);

            // Detect a timing gap to the next word (natural pause in speech)
            const hasTimingGap = !isLastWord &&
                currentWords.length >= 5 &&
                (words[i + 1].start - words[i].end) >= PAUSE_THRESHOLD;

            // Break on: sentence punctuation, timing gap (when no punctuation), word count limit, or last word
            const shouldBreak = hasPunctuation
                ? (hasSentenceEnd || isLastWord)
                : (hasTimingGap || currentWords.length >= MAX_WORDS_PER_PARAGRAPH || isLastWord);

            if (shouldBreak) {
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
    }, [localWords, captionData?.words]);

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

    // Initialize text overlays from fetched data, injecting introTitle as a text overlay if present
    // Use a ref to only run once after both captionData and clip are loaded
    const textOverlaysInitialized = useRef(false);
    useEffect(() => {
        if (!captionData || !clip) return;
        if (textOverlaysInitialized.current) return;
        textOverlaysInitialized.current = true;

        const saved = captionData.textOverlays ?? [];
        const hasIntroOverlay = saved.some((o) => o.id === "intro-title");

        // If introTitle exists on the clip and isn't already a text overlay, inject it
        if (clip.introTitle && !hasIntroOverlay) {
            const introOverlay = {
                id: "intro-title",
                text: clip.introTitle,
                x: 50,
                y: 20,
                fontSize: 36,
                fontFamily: "Inter",
                fontWeight: 600,
                lineHeight: 1.2,
                color: "#000000",
                backgroundColor: "#FFFFFF",
                backgroundOpacity: 100,
                borderRadius: 12,
                maxWidth: 80,
                startTime: 0,
                endTime: 3,
            };
            setTextOverlays([introOverlay, ...saved.map((o) => ({ ...o, borderRadius: o.borderRadius ?? 4 }))]);
        } else {
            // Always set from saved (even empty array) so deletions are reflected
            setTextOverlays(saved.map((o) => ({ ...o, borderRadius: o.borderRadius ?? 4 })));
        }
    }, [captionData, clip]);

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
     * Updates the underlying words so both video overlay and transcript re-derive correctly
     */
    const handleCaptionEdit = useCallback((segmentId: string, newText: string) => {
        const currentTranscript = localTranscriptCaptions ?? captionsForTranscript;
        const editedSegment = currentTranscript.find((c: Caption) => c.id === segmentId);
        if (!editedSegment || editedSegment.words.length === 0) return;

        setCaptionUndoState({ segmentId, text: editedSegment.text });

        const currentWords = localWords ?? captionData?.words ?? [];
        const newWordTexts = newText.split(/\s+/).filter(Boolean);
        if (newWordTexts.length === 0) return;

        const firstWordStart = editedSegment.words[0].start;
        const lastWordEnd = editedSegment.words[editedSegment.words.length - 1].end;
        const segmentWordCount = editedSegment.words.length;

        // Match by word id first, fall back to timing (within 10ms tolerance)
        let startIdx = currentWords.findIndex((w) => w.id === editedSegment.words[0].id);
        if (startIdx === -1) {
            startIdx = currentWords.findIndex((w) => Math.abs(w.start - firstWordStart) < 0.01);
        }
        if (startIdx === -1) return;

        const totalDuration = lastWordEnd - firstWordStart;
        const minDuration = 0.05; // backend requires end > start
        const wordDuration = Math.max(totalDuration / newWordTexts.length, minDuration);

        const replacementWords: CaptionWord[] = newWordTexts.map((word, i) => ({
            id: `edited-${Date.now()}-${startIdx + i}`,
            word,
            start: Number((firstWordStart + i * wordDuration).toFixed(3)),
            end: Number((firstWordStart + (i + 1) * wordDuration).toFixed(3)),
            highlight: false,
        }));

        const updatedTranscript = currentTranscript.map((caption: Caption) =>
            caption.id === segmentId
                ? { ...caption, text: newText, words: replacementWords }
                : caption
        );
        setLocalTranscriptCaptions(updatedTranscript);

        const updatedWords = [
            ...currentWords.slice(0, startIdx),
            ...replacementWords,
            ...currentWords.slice(startIdx + segmentWordCount),
        ];
        setLocalWords(updatedWords);
        setDirtyWords(true);
        setHasUnsavedChanges(true);
    }, [localWords, captionData?.words, localTranscriptCaptions, captionsForTranscript, setCaptionUndoState]);

    /**
     * Handle manual style changes (not from preset selection)
     */
    const handleStyleChange = useCallback(
        (newStyle: CaptionStyle | Partial<CaptionStyle>) => {
            setCaptionStyle((prev) => ({ ...prev, ...newStyle } as CaptionStyle));
            setDirtyStyle(true);
            setHasUnsavedChanges(true);
            clearSelectedPreset();
            setCurrentPresetId(undefined);
        },
        [clearSelectedPreset]
    );

    /**
     * Handle text overlay changes
     */
    const handleTextOverlayChange = useCallback((overlays: TextOverlay[]) => {
        setTextOverlays(overlays);
        setDirtyOverlays(true);
        setHasUnsavedChanges(true);
    }, []);

    /**
     * Handle text overlay drag/resize on video preview
     */
    const handleTextOverlayDrag = useCallback((id: string, updates: { x?: number; y?: number; fontSize?: number; maxWidth?: number; text?: string }) => {
        setTextOverlays((prev) =>
            prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
        );
        setDirtyOverlays(true);
        setHasUnsavedChanges(true);
    }, []);

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
            setDirtyStyle(true);
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
     * Handle save action - saves all pending changes (caption style, words, and clip boundaries)
     * Triggered by Ctrl+S / Cmd+S keyboard shortcut or Save & Export button
     * @validates Requirements 14.4 - Ctrl+S (or Cmd+S on Mac) saves all pending changes
     */
    const handleSave = useCallback(async () => {
        if (isSavingAll) return;
        setIsSavingAll(true);
        setIsSavingWords(true);

        let anyError: string | null = null;

        // 1. Save caption words only if edited
        if (dirtyWords && localWords !== null && localWords.length > 0) {
            try {
                await captionsApi.updateCaptionWords(clipId, localWords);
            } catch (err: any) {
                console.error("[ClipEditor] updateCaptionWords failed:", err);
                anyError = err?.message || "Failed to save transcript";
            }
        }

        // 2. Save caption style only if changed
        if (dirtyStyle && captionStyle) {
            try {
                await updateCaptionStyle.mutateAsync({
                    clipId,
                    style: captionStyle,
                    templateId: currentPresetId,
                });
                saveLastUsedStyle(captionStyle, currentPresetId);
            } catch (err: any) {
                console.error("[ClipEditor] updateCaptionStyle failed:", err);
                anyError = anyError ?? (err?.message || "Failed to save style");
            }
        }

        // 3. Save text overlays only if changed
        if (dirtyOverlays) {
            try {
                await captionsApi.updateTextOverlays(clipId, textOverlays.map((o) => ({
                    ...o,
                    fontFamily: o.fontFamily ?? "Inter",
                    fontWeight: o.fontWeight ?? 600,
                    lineHeight: o.lineHeight ?? 1.2,
                    animation: "none" as const,
                })));
            } catch (err: any) {
                console.error("[ClipEditor] updateTextOverlays failed:", err);
                anyError = anyError ?? (err?.message || "Failed to save overlays");
            }

            // Sync intro-title if overlays changed
            const introOverlay = textOverlays.find((o) => o.id === "intro-title");
            const newIntroTitle = introOverlay ? introOverlay.text : "";
            if (newIntroTitle !== (clip?.introTitle ?? "")) {
                try {
                    await updateClip.mutateAsync({ clipId, data: { introTitle: newIntroTitle } });
                } catch (err: any) {
                    console.error("[ClipEditor] updateClip introTitle failed:", err);
                }
            }
        }

        // 4. Save background style, aspect ratio, and video scale if changed
        if ((dirtyBackground || dirtyAspectRatio || dirtyVideoScale) && clip?.videoId) {
            try {
                const configUpdate: Record<string, any> = {};
                if (dirtyBackground) configUpdate.backgroundStyle = backgroundStyle;
                if (dirtyAspectRatio) configUpdate.aspectRatio = aspectRatio;
                if (dirtyVideoScale) configUpdate.videoScale = videoScale;
                await videoConfigApi.updateConfig(clip.videoId, configUpdate);
                queryClient.invalidateQueries({ queryKey: ["video-config", clip.videoId] });
            } catch (err: any) {
                console.error("[ClipEditor] updateVideoConfig failed:", err);
                anyError = anyError ?? (err?.message || "Failed to save video config");
            }
        }

        setIsSavingAll(false);
        setIsSavingWords(false);

        if (anyError) {
            toast.error(`Save failed: ${anyError}`);
        } else {
            // Clear local edits so component re-derives from fresh server data
            setLocalWords(null);
            setLocalTranscriptCaptions(null);
            setDirtyWords(false);
            setDirtyStyle(false);
            setDirtyBoundaries(false);
            setDirtyOverlays(false);
            setDirtyBackground(false);
            setDirtyAspectRatio(false);
            setDirtyVideoScale(false);
            setHasUnsavedChanges(false);
            // Invalidate caption cache so next read gets the saved words
            queryClient.invalidateQueries({ queryKey: captionKeys.byClip(clipId) });
            toast.success("Changes saved");
        }
    }, [isSavingAll, clipId, captionStyle, currentPresetId, localWords, textOverlays, clip, dirtyWords, dirtyStyle, dirtyOverlays, dirtyBackground, dirtyAspectRatio, dirtyVideoScale, backgroundStyle, aspectRatio, videoScale, updateCaptionStyle, updateClip, saveLastUsedStyle, queryClient]);

    // Save, trigger export job, then redirect to clips page
    const handleSaveAndGoToClips = useCallback(async () => {
        try {
            await handleSave();
        } catch (e) {
            console.error("Failed to save:", e);
        }

        initiateExport.mutate(
            {
                clipId,
                options: {
                    captionStyleId: currentPresetId ?? undefined,
                },
            },
            {
                onSettled: () => {
                    if (clip?.videoId) {
                        router.push(`/${slug}/videos/${clip.videoId}/clips`);
                    } else {
                        router.push(`/${slug}`);
                    }
                },
            }
        );
    }, [handleSave, initiateExport, clipId, currentPresetId, clip?.videoId, router, slug]);

    /**
     * Handle Escape key - close export dialog or exit fullscreen
     * @validates Requirements 14.5 - Escape exits fullscreen mode or closes modals
     */
    const handleEscape = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch((err) => {
                console.error("Error exiting fullscreen:", err);
            });
        }
    }, []);

    /**
     * Handle undo action - restores the previous caption text state
     * @validates Requirements 19.2 - Undo last caption edit with Ctrl+Z
     */
    const handleUndo = useCallback(() => {
        if (!canUndo) return;
        undoCaptionEdit();
        // captionUndoState will now hold the previous state — apply it
        // We read via refs to get the latest values synchronously
        const undoState = captionUndoState;
        if (!undoState) return;
        const { segmentId, text } = undoState;
        const currentTranscript = localTranscriptCaptionsRef.current ?? captionsForTranscriptRef.current;
        const editedSegment = currentTranscript.find((c: Caption) => c.id === segmentId);
        if (!editedSegment) return;
        setLocalTranscriptCaptions(currentTranscript.map((c: Caption) =>
            c.id === segmentId ? { ...c, text } : c
        ));
        const currentWords = localWordsRef.current ?? captionDataWordsRef.current ?? [];
        const newWords = text.split(/\s+/).filter(Boolean);
        const firstWordStart = editedSegment.words[0]?.start ?? 0;
        const lastWordEnd = editedSegment.words[editedSegment.words.length - 1]?.end ?? 0;
        const startIdx = currentWords.findIndex((w) => Math.abs(w.start - firstWordStart) < 0.01);
        if (startIdx !== -1) {
            const totalDuration = lastWordEnd - firstWordStart;
            const wordDuration = newWords.length > 0 ? Math.max(totalDuration / newWords.length, 0.05) : 0.05;
            const replacementWords: CaptionWord[] = newWords.map((word, i) => ({
                id: `undo-${Date.now()}-${startIdx + i}`,
                word,
                start: Number((firstWordStart + i * wordDuration).toFixed(3)),
                end: Number((firstWordStart + (i + 1) * wordDuration).toFixed(3)),
                highlight: false,
            }));
            setLocalWords([
                ...currentWords.slice(0, startIdx),
                ...replacementWords,
                ...currentWords.slice(startIdx + editedSegment.words.length),
            ]);
        }
        setDirtyWords(true);
        setHasUnsavedChanges(true);
    }, [canUndo, undoCaptionEdit, captionUndoState]);
    const handleRedo = useCallback(() => {
        if (!canRedo) return;
        redoCaptionEdit();
    }, [canRedo, redoCaptionEdit]);

    // Refs to hold latest values for use inside effects without causing re-runs
    const localWordsRef = useRef(localWords);
    const localTranscriptCaptionsRef = useRef(localTranscriptCaptions);
    const captionsForTranscriptRef = useRef(captionsForTranscript);
    const captionDataWordsRef = useRef(captionData?.words);
    useEffect(() => { localWordsRef.current = localWords; }, [localWords]);
    useEffect(() => { localTranscriptCaptionsRef.current = localTranscriptCaptions; }, [localTranscriptCaptions]);
    useEffect(() => { captionsForTranscriptRef.current = captionsForTranscript; }, [captionsForTranscript]);
    useEffect(() => { captionDataWordsRef.current = captionData?.words; }, [captionData?.words]);

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
    // 1. Split screen ON → always use rawStorageUrl (has gameplay composition baked in by FFmpeg)
    // 2. Smart crop ON + smartCropStorageUrl ready → use face-tracked video (fills frame, no background needed)
    // 3. Raw clip available → use it (trimmed video with background baked in by FFmpeg)
    // 4. Original source video storageUrl → canvas renders background style live
    //    Note: storageUrl may be audio-only (.m4a) for YouTube downloads, so prefer rawStorageUrl
    // 5. Fallback → empty (no playable source)
    const splitScreenEnabled = videoConfigData?.config?.enableSplitScreen ?? false;
    const smartCropEnabled = videoConfigData?.config?.enableSmartCrop ?? false;
    const smartCropReady = smartCropEnabled && clip.smartCropStatus === "done" && !!clip.smartCropStorageUrl;

    let videoSrc: string;
    let isUsingRawClip: boolean;

    if (splitScreenEnabled && clip.rawStorageUrl) {
        // Split screen — rawStorageUrl has the gameplay composition baked in, use it directly
        videoSrc = clip.rawStorageUrl;
        isUsingRawClip = true; // trimmed clip, starts at 0
    } else if (smartCropReady) {
        // Face-tracked video — already 9:16, fills the frame
        videoSrc = clip.smartCropStorageUrl!;
        isUsingRawClip = true; // trimmed clip, starts at 0
    } else if (clip.rawStorageUrl) {
        // Raw clip is available — always prefer it since video.storageUrl may be audio-only (.m4a)
        videoSrc = clip.rawStorageUrl;
        isUsingRawClip = true; // trimmed clip, starts at 0
    } else if (video?.storageUrl && !video.storageUrl.endsWith(".m4a")) {
        // Original source video (only if it's actually a video file, not audio-only)
        videoSrc = video.storageUrl;
        isUsingRawClip = false; // full video, use clip boundaries
    } else {
        // No playable video source available
        videoSrc = "";
        isUsingRawClip = false;
    }

    // Debug: log resolved video source
    console.log("[ClipEditor] Video source resolved:", {
        videoSrc: videoSrc?.substring(0, 120),
        isUsingRawClip,
        splitScreenEnabled,
        smartCropEnabled,
        smartCropReady,
        clipRawUrl: !!clip.rawStorageUrl,
        clipSmartCropUrl: !!clip.smartCropStorageUrl,
        clipSmartCropStatus: clip.smartCropStatus,
        videoStorageUrl: !!video?.storageUrl,
        videoSourceUrl: !!video?.sourceUrl,
        clipStatus: clip.status,
    });

    // When using original source (full video), constrain playback to clip boundaries
    // When using raw/smart-crop clip, video starts at 0 (already trimmed)
    const videoStartTime = isUsingRawClip ? 0 : clipWithBoundaries.startTime;
    const videoEndTime = isUsingRawClip ? (clipWithBoundaries.endTime - clipWithBoundaries.startTime) : clipWithBoundaries.endTime;

    // Captions for video overlay — derived from localWords (or server data) via captionsForVideo useMemo
    const videoCaptions = captionsForVideo;

    // Captions for transcript panel (sentence-based paragraphs)
    const transcriptCaptions = localTranscriptCaptions ?? captionsForTranscript;

    // Determine if saving is in progress (includes caption text auto-save)
    // @validates Requirements 13.2 - Show saving indicator during save operations
    const isSaving = updateCaptionStyle.isPending || updateClipBoundaries.isPending || isSavingWords || isSavingAll;

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
                        onExportClick={handleSaveAndGoToClips}
                        hasActiveExport={false}
                        workspaceSlug={slug}
                        videoId={clip.videoId}
                        videoTitle={video?.title ?? undefined}
                        hasUnsavedChanges={hasUnsavedChanges}
                        onSave={handleSave}
                        clipId={clip.id}
                        clipStatus={clip.status}
                    />
                }
            >
                {{
                    /* Left Panel: Caption Editor (Paragraph View) */
                    captionEditor: (
                        <div className="h-full">
                            {captionLoading ? (
                                <div className="flex items-center justify-center h-full bg-zinc-900">
                                    <div className="flex flex-col items-center gap-2">
                                        <IconLoader className="size-6 animate-spin text-zinc-400" />
                                        <p className="text-sm text-zinc-500">Loading transcript...</p>
                                    </div>
                                </div>
                            ) : video?.id ? (
                                <TranscriptParagraphView
                                    segments={transcriptCaptions.map((c) => ({
                                        id: c.id,
                                        text: c.text,
                                        startTime: c.startTime,
                                        endTime: c.endTime,
                                        words: c.words.map((w) => ({
                                            id: w.id,
                                            word: w.word,
                                            start: w.start,
                                            end: w.end,
                                            confidence: 1,
                                        })),
                                    }))}
                                    currentTime={currentTime}
                                    onWordClick={handleSegmentClick}
                                    onSegmentEdit={handleCaptionEdit}
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
                        <div className="flex flex-col gap-2 h-full">
                            {/* Preview toolbar — aspect ratio + layout controls */}
                            <div className="flex items-center gap-3 px-1">
                                {/* Aspect ratio pills — hidden for split screen (composition is baked in) */}
                                {!splitScreenEnabled && (
                                    <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg p-0.5">
                                        {(["9:16", "1:1", "16:9"] as const).map((r) => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => handleAspectRatioChange(r)}
                                                className={cn(
                                                    "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                                                    aspectRatio === r
                                                        ? "bg-zinc-700 text-white shadow-sm"
                                                        : "text-zinc-400 hover:text-zinc-200"
                                                )}
                                            >
                                                {r === "9:16" && <IconDeviceMobile className="size-3" />}
                                                {r === "1:1" && <span className="size-3 border border-current rounded-[2px]" />}
                                                {r === "16:9" && <span className="w-4 h-2.5 border border-current rounded-[2px]" />}
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Split screen indicator */}
                                {splitScreenEnabled && (
                                    <div className="flex items-center gap-1.5 text-[11px] text-primary">
                                        <span className="size-3 border border-current rounded-[2px] flex flex-col"><span className="flex-1 border-b border-current" /></span>
                                        Split Screen
                                    </div>
                                )}

                                {/* Layout: Fit / Scale indicator — hidden for 16:9 and split screen */}
                                {aspectRatio !== "16:9" && !splitScreenEnabled && (
                                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                                        <span>Layout:</span>
                                        <select
                                            value={videoScale}
                                            onChange={(e) => handleVideoScaleChange(Number(e.target.value))}
                                            className="bg-zinc-800/60 border border-zinc-700 rounded-md px-2 py-1 text-[11px] text-zinc-200 outline-none cursor-pointer"
                                        >
                                            <option value={100}>Fit</option>
                                            <option value={110}>1.1x</option>
                                            <option value={125}>1.25x</option>
                                            <option value={150}>1.5x</option>
                                            <option value={175}>1.75x</option>
                                            <option value={200}>2x Fill</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            {videoSrc ? (
                                <VideoCanvasEditor
                                    ref={videoPlayerRef as any}
                                    src={videoSrc}
                                    startTime={videoStartTime}
                                    endTime={videoEndTime}
                                    captions={videoCaptions}
                                    captionStyle={captionStyle}
                                    onCaptionStyleChange={handleStyleChange}
                                    onTimeUpdate={handleTimeUpdate}
                                    textOverlays={textOverlays.map((o) => ({
                                        ...o,
                                        fontFamily: o.fontFamily ?? "Inter",
                                        animation: "none",
                                    }))}
                                    onTextOverlayChange={handleTextOverlayDrag}
                                    aspectRatio={aspectRatio}
                                    backgroundStyle={backgroundStyle as any}
                                    videoScale={videoScale}
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

                    /* Right Panel: Clip Info */
                    clipInfoPanel: (
                        <ClipInfoPanel clip={clip} />
                    ),

                    /* Right Panel: Text Overlay */
                    textOverlayPanel: (
                        <TextOverlayPanel
                            overlays={textOverlays}
                            onChange={handleTextOverlayChange}
                            clipDuration={videoEndTime - videoStartTime}
                            currentTime={currentTime}
                        />
                    ),

                    /* Right Panel: Background Style */
                    backgroundPanel: splitScreenEnabled ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                            <span className="text-xs text-zinc-400">
                                Background style is not available for split screen clips. The gameplay video is composited during generation.
                            </span>
                        </div>
                    ) : (
                        <BackgroundStylePanel
                            value={backgroundStyle as any}
                            onChange={handleBackgroundStyleChange}
                            aspectRatio={aspectRatio}
                            userPlan={workspace?.plan || "free"}
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
                            textOverlays={textOverlays.map((o) => ({
                                id: o.id,
                                text: o.text,
                                startTime: o.startTime,
                                endTime: o.endTime,
                                color: o.color,
                            }))}
                            onTextOverlayClick={() => setActiveToolbarPanel("text-overlay")}
                            onTextOverlayTimeChange={(id, startTime, endTime) => {
                                setTextOverlays((prev) =>
                                    prev.map((o) => (o.id === id ? { ...o, startTime, endTime } : o))
                                );
                                setDirtyOverlays(true);
                                setHasUnsavedChanges(true);
                            }}
                            className="w-full"
                        />
                    ),
                }}
            </EditingLayout>

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
                                setDirtyWords(false);
                                setDirtyStyle(false);
                                setDirtyBoundaries(false);
                                setDirtyOverlays(false);
                                setLocalWords(null);
                                setLocalTranscriptCaptions(null);
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
