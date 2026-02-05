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
    IconCheck,
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
import { AdvancedTimeline } from "@/components/clips/advanced-timeline";
import { KeyboardShortcutsModal, useKeyboardShortcutsModal } from "@/components/clips/keyboard-shortcuts-modal";
import { CaptionPanelTabs } from "@/components/captions/caption-panel-tabs";
import { VideoPlayer, type VideoPlayerRef } from "@/components/video/video-player";
import { TranscriptParagraphView } from "@/components/transcript/transcript-paragraph-view";
import { ExportOptions } from "@/components/export/export-options";
import { ExportProgress } from "@/components/export/export-progress";
import { useClip, useUpdateClipBoundaries } from "@/hooks/useClips";
import { useVideo } from "@/hooks/useVideo";
import { useCaptionStyle, useUpdateCaptionStyle, useUpdateCaptionText } from "@/hooks/useCaptions";
import { useInitiateExport } from "@/hooks/useExport";
import { useCreditBalance } from "@/hooks/useCredits";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { savePageScrollPosition } from "@/hooks/useScrollPosition";
import { useCaptionStylePresets } from "@/hooks/useCaptionStylePresets";
import { useKeyboardShortcuts, type KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import type { CaptionStyle, Caption, CaptionWord } from "@/lib/api/captions";
import type { ExportOptions as ExportOptionsType } from "@/lib/api/export";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// ============================================================================
// Auto-Save Retry Configuration
// ============================================================================

/**
 * Maximum number of retry attempts for auto-save operations
 * @validates Requirements 15.5 - Retry up to 3 times
 */
const AUTO_SAVE_MAX_RETRIES = 3;

/**
 * Base delay in milliseconds for exponential backoff (1s, 2s, 4s)
 * @validates Requirements 15.5 - Retry with exponential backoff
 */
const AUTO_SAVE_BASE_DELAY_MS = 1000;

/**
 * Helper function to perform auto-save with retry logic
 * Implements exponential backoff: 1s, 2s, 4s delays between retries
 * @validates Requirements 15.5 - Retry failed saves up to 3 times
 */
async function performAutoSaveWithRetry<T>(
    saveFn: () => Promise<T>,
    retryCountRef: React.MutableRefObject<number>,
    options: {
        onSuccess: () => void;
        onMaxRetriesExceeded: () => void;
        saveType: "caption text" | "caption style";
    }
): Promise<void> {
    const { onSuccess, onMaxRetriesExceeded, saveType } = options;

    try {
        await saveFn();
        // Reset retry counter on success
        retryCountRef.current = 0;
        onSuccess();
    } catch (error) {
        retryCountRef.current += 1;
        const attemptNumber = retryCountRef.current;

        // Log retry attempt
        // @validates Requirements 15.5 - Log retry attempts
        console.warn(
            `Auto-save ${saveType} failed (attempt ${attemptNumber}/${AUTO_SAVE_MAX_RETRIES}):`,
            error
        );

        if (attemptNumber < AUTO_SAVE_MAX_RETRIES) {
            // Calculate exponential backoff delay: 1s, 2s, 4s
            const delay = AUTO_SAVE_BASE_DELAY_MS * Math.pow(2, attemptNumber - 1);
            console.log(`Retrying auto-save ${saveType} in ${delay}ms...`);

            // Schedule retry with exponential backoff
            setTimeout(async () => {
                await performAutoSaveWithRetry(saveFn, retryCountRef, options);
            }, delay);
        } else {
            // Max retries exceeded
            // @validates Requirements 15.5 - Show error notification after max retries
            console.error(
                `Auto-save ${saveType} failed after ${AUTO_SAVE_MAX_RETRIES} attempts`
            );
            // Reset retry counter for next save attempt
            retryCountRef.current = 0;
            onMaxRetriesExceeded();
        }
    }
}

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
    showSavedIndicator: boolean;
    onExportClick: () => void;
    hasActiveExport: boolean;
    workspaceSlug: string;
    videoId?: string;
    videoTitle?: string;
}

/**
 * EditorHeader - Header component with back button, breadcrumbs, and export button
 * 
 * @validates Requirements 12.3 - Back button to return to clips page
 * @validates Requirements 12.4 - Breadcrumb navigation showing current location
 * @validates Requirements 15.3 - Display "Saved" indicator when auto-save completes
 */
function EditorHeader({
    title,
    onBack,
    isSaving,
    showSavedIndicator,
    onExportClick,
    hasActiveExport,
    workspaceSlug,
    videoId,
    videoTitle,
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
                    {/* @validates Requirements 13.2 - Show saving indicator during save operations */}
                    {/* @validates Requirements 15.3 - Display "Saved" indicator when auto-save completes */}
                    {isSaving && (
                        <Badge variant="secondary" className="gap-1">
                            <IconLoader className="size-3 animate-spin" />
                            Saving...
                        </Badge>
                    )}
                    {!isSaving && showSavedIndicator && (
                        <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <IconCheck className="size-3" />
                            Saved
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={onExportClick}
                        disabled={hasActiveExport}
                        className="gap-2"
                    >
                        {hasActiveExport ? (
                            <>
                                <IconLoader className="size-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <IconDownload className="size-4" />
                                Export
                            </>
                        )}
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
    creditCost: number;
    userCredits: number;
    activeExportId: string | null;
    onExport: (options: ExportOptionsType) => void;
    onExportComplete: (downloadUrl: string) => void;
    onExportError: (error: string) => void;
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
    isExporting,
}: ExportDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Export Clip</DialogTitle>
                    <DialogDescription>
                        Configure your export settings and download your clip.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {activeExportId ? (
                        <ExportProgress
                            exportId={activeExportId}
                            onComplete={onExportComplete}
                            onError={onExportError}
                        />
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
    const videoPlayerRef = useRef<VideoPlayerRef>(null);

    // State
    const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeExportId, setActiveExportId] = useState<string | null>(null);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [clipBoundaries, setClipBoundaries] = useState<{ start: number; end: number } | null>(null);
    // Local captions state for optimistic UI updates during real-time editing
    // @validates Requirements 6.3 - Real-time caption edit sync
    const [localCaptions, setLocalCaptions] = useState<Caption[] | null>(null);

    // Undo/redo state management for caption text edits
    // @validates Requirements 19.1 - Maintain undo history for caption text edits
    // @validates Requirements 19.2 - Undo last caption edit with Ctrl+Z
    // @validates Requirements 19.3 - Redo last undone edit with Ctrl+Shift+Z
    // @validates Requirements 19.4 - Support up to 50 undo/redo operations
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

    // Auto-save state for caption text edits
    // @validates Requirements 15.1 - Auto-save caption text after 2 seconds of inactivity
    // @validates Requirements 15.3 - Display "Saved" indicator when auto-save completes
    const [captionsDirty, setCaptionsDirty] = useState(false);
    const [showSavedIndicator, setShowSavedIndicator] = useState(false);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const savedIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-save state for caption style changes
    // @validates Requirements 15.2 - Auto-save caption style after 2 seconds of inactivity
    // @validates Requirements 15.3 - Display "Saved" indicator when auto-save completes
    const [styleDirty, setStyleDirty] = useState(false);
    const styleAutoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-save retry state
    // @validates Requirements 15.5 - Retry failed saves up to 3 times
    const captionTextRetryCountRef = useRef<number>(0);
    const captionStyleRetryCountRef = useRef<number>(0);

    // Unsaved changes warning dialog state
    // @validates Requirements 15.4 - Display "Unsaved changes" warning on navigation attempt
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
    const pendingNavigationRef = useRef<(() => void) | null>(null);

    // Caption style presets hook
    // @validates Requirements 9.2, 9.4, 9.5 - Preset application and last used style persistence
    const {
        presets,
        selectedPresetId,
        applyPreset,
        getLastUsedStyle,
        saveLastUsedStyle,
        clearSelectedPreset,
    } = useCaptionStylePresets();

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

    // Fetch user credits
    const { data: creditBalance } = useCreditBalance(workspace?.id);

    // Mutations
    const updateCaptionStyle = useUpdateCaptionStyle();
    const updateClipBoundaries = useUpdateClipBoundaries();
    const updateCaptionText = useUpdateCaptionText();
    const initiateExport = useInitiateExport();

    // Initialize caption style from fetched data
    useState(() => {
        if (captionData?.style?.config) {
            setCaptionStyle(captionData.style.config);
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
        // If we have fetched caption data, use it
        if (captionData?.style?.config) {
            setCaptionStyle(captionData.style.config);
            return;
        }

        // Otherwise, try to use the last used style as default
        const lastUsedStyle = getLastUsedStyle();
        if (lastUsedStyle) {
            setCaptionStyle(lastUsedStyle);
        }
    }, [captionData?.style?.config, getLastUsedStyle]);

    // Sync selected preset ID from hook
    useEffect(() => {
        setCurrentPresetId(selectedPresetId);
    }, [selectedPresetId]);

    /**
     * Cleanup auto-save timeouts on component unmount
     * Prevents memory leaks and stale timeout callbacks
     */
    useEffect(() => {
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
            if (savedIndicatorTimeoutRef.current) {
                clearTimeout(savedIndicatorTimeoutRef.current);
            }
            if (styleAutoSaveTimeoutRef.current) {
                clearTimeout(styleAutoSaveTimeoutRef.current);
            }
        };
    }, []);

    /**
     * Clear undo history when navigating away from the editing screen
     * @validates Requirements 19.5 - Clear undo history when navigating away
     */
    useEffect(() => {
        return () => {
            clearCaptionHistory();
        };
    }, [clearCaptionHistory]);

    /**
     * Browser beforeunload event handler for unsaved changes warning
     * Shows browser's native confirmation dialog when user tries to close/refresh with unsaved changes
     * @validates Requirements 15.4 - Display "Unsaved changes" warning on navigation attempt
     */
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (captionsDirty || styleDirty) {
                // Standard way to trigger the browser's confirmation dialog
                event.preventDefault();
                // For older browsers
                event.returnValue = "";
                return "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [captionsDirty, styleDirty]);

    // Navigation handlers
    /**
     * Handle back navigation with scroll position preservation
     * Shows unsaved changes warning if there are pending changes
     * @validates Requirements 12.2 - Preserve user's position when navigating back
     * @validates Requirements 12.3 - Back button to return to clips page
     * @validates Requirements 12.5 - Update browser URL on navigation
     * @validates Requirements 15.4 - Display "Unsaved changes" warning on navigation attempt
     */
    const handleBack = useCallback(() => {
        // Check for unsaved changes before navigating
        if (captionsDirty || styleDirty) {
            // Store the navigation action to execute after user confirms
            pendingNavigationRef.current = () => {
                // Save scroll position for the video clips page before navigating
                if (clip?.videoId) {
                    savePageScrollPosition(`video_clips_${clip.videoId}`);
                    router.push(`/${slug}/videos/${clip.videoId}/clips`);
                } else {
                    router.push(`/${slug}`);
                }
            };
            // Show the unsaved changes dialog
            setShowUnsavedChangesDialog(true);
            return;
        }

        // No unsaved changes, navigate directly
        // Save scroll position for the video clips page before navigating
        if (clip?.videoId) {
            // Save scroll position with video ID as key so it can be restored
            savePageScrollPosition(`video_clips_${clip.videoId}`);
            router.push(`/${slug}/videos/${clip.videoId}/clips`);
        } else {
            router.push(`/${slug}`);
        }
    }, [router, slug, clip?.videoId, captionsDirty, styleDirty]);

    /**
     * Handle save and navigate - saves all pending changes then navigates
     * @validates Requirements 15.4 - Provide save option in unsaved changes warning
     */
    const handleSaveAndNavigate = useCallback(() => {
        // Save caption style if there are changes
        if (captionStyle) {
            updateCaptionStyle.mutate({
                clipId,
                style: captionStyle,
            });
        }

        // Save clip boundaries if there are changes
        if (clipBoundaries) {
            updateClipBoundaries.mutate({
                clipId,
                boundaries: {
                    startTime: clipBoundaries.start,
                    endTime: clipBoundaries.end,
                },
            });
        }

        // Clear dirty states
        setCaptionsDirty(false);
        setStyleDirty(false);

        // Close the dialog
        setShowUnsavedChangesDialog(false);

        // Execute the pending navigation
        if (pendingNavigationRef.current) {
            pendingNavigationRef.current();
            pendingNavigationRef.current = null;
        }
    }, [clipId, captionStyle, clipBoundaries, updateCaptionStyle, updateClipBoundaries]);

    /**
     * Handle discard and navigate - discards changes and navigates
     * @validates Requirements 15.4 - Provide discard option in unsaved changes warning
     */
    const handleDiscardAndNavigate = useCallback(() => {
        // Clear dirty states without saving
        setCaptionsDirty(false);
        setStyleDirty(false);

        // Close the dialog
        setShowUnsavedChangesDialog(false);

        // Execute the pending navigation
        if (pendingNavigationRef.current) {
            pendingNavigationRef.current();
            pendingNavigationRef.current = null;
        }
    }, []);

    /**
     * Handle cancel navigation - stays on the page
     * @validates Requirements 15.4 - Provide cancel option in unsaved changes warning
     */
    const handleCancelNavigation = useCallback(() => {
        // Close the dialog and clear pending navigation
        setShowUnsavedChangesDialog(false);
        pendingNavigationRef.current = null;
    }, []);

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
            const newTime = Math.min(
                currentTime + 5,
                (clipBoundaries?.end ?? clip?.endTime ?? 0) - (clipBoundaries?.start ?? clip?.startTime ?? 0)
            );
            videoPlayerRef.current.seek(newTime + (clipBoundaries?.start ?? clip?.startTime ?? 0));
        }
    }, [currentTime, clipBoundaries, clip]);

    // Skip backward handler (5 seconds)
    const handleSkipBackward = useCallback(() => {
        if (videoPlayerRef.current) {
            const newTime = Math.max(0, currentTime - 5);
            videoPlayerRef.current.seek(newTime + (clipBoundaries?.start ?? clip?.startTime ?? 0));
        }
    }, [currentTime, clipBoundaries, clip]);

    // Segment click handler - seek video to timestamp
    const handleSegmentClick = useCallback((timestamp: number) => {
        videoPlayerRef.current?.seek(timestamp);
    }, []);

    /**
     * Handle caption edit for real-time sync with video overlay
     * Updates local captions state optimistically for immediate UI feedback
     * Triggers auto-save after 2 seconds of inactivity with retry logic
     * Tracks edit in undo history for undo/redo functionality
     * @validates Requirements 6.3 - Real-time caption edit sync
     * @validates Requirements 15.1 - Auto-save caption text after 2 seconds of inactivity
     * @validates Requirements 15.5 - Retry failed saves up to 3 times
     * @validates Requirements 19.1 - Maintain undo history for caption text edits
     */
    const handleCaptionEdit = useCallback((segmentId: string, newText: string) => {
        // Get the current captions (either local state or from server)
        const currentCaptions = localCaptions ?? captionData?.captions ?? [];

        // Find the original text for undo history
        const originalCaption = currentCaptions.find((caption) => caption.id === segmentId);
        const originalText = originalCaption?.text ?? "";

        // Track the edit in undo history (store the previous state)
        // @validates Requirements 19.1 - Maintain undo history for caption text edits
        setCaptionUndoState({ segmentId, text: originalText });

        // Find the caption that matches the segment ID and update it optimistically
        const updatedCaptions = currentCaptions.map((caption) => {
            // Match by ID - the segmentId from TranscriptEditor corresponds to caption ID
            if (caption.id === segmentId) {
                return {
                    ...caption,
                    text: newText,
                };
            }
            return caption;
        });

        // Update local state for immediate UI feedback (optimistic update)
        setLocalCaptions(updatedCaptions);

        // Mark captions as dirty (unsaved changes)
        setCaptionsDirty(true);

        // Hide the "Saved" indicator when new edits are made
        setShowSavedIndicator(false);
        if (savedIndicatorTimeoutRef.current) {
            clearTimeout(savedIndicatorTimeoutRef.current);
            savedIndicatorTimeoutRef.current = null;
        }

        // Clear any existing auto-save timeout
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        // Reset retry counter when user makes a new edit
        captionTextRetryCountRef.current = 0;

        /**
         * Debounced auto-save after 2 seconds of inactivity with retry logic
         * @validates Requirements 15.1 - Auto-save caption text after 2 seconds of inactivity
         * @validates Requirements 15.5 - Retry failed saves up to 3 times
         */
        autoSaveTimeoutRef.current = setTimeout(() => {
            // Create a promise-based save function for retry logic
            const saveFn = () =>
                new Promise<void>((resolve, reject) => {
                    updateCaptionText.mutate(
                        {
                            clipId,
                            captionId: segmentId,
                            text: newText,
                        },
                        {
                            onSuccess: () => resolve(),
                            onError: (error) => reject(error),
                        }
                    );
                });

            // Perform auto-save with retry logic
            performAutoSaveWithRetry(saveFn, captionTextRetryCountRef, {
                saveType: "caption text",
                onSuccess: () => {
                    // Mark captions as clean (saved)
                    setCaptionsDirty(false);

                    /**
                     * Show "Saved" indicator for 3 seconds after successful save
                     * @validates Requirements 15.3 - Display "Saved" indicator when auto-save completes
                     */
                    setShowSavedIndicator(true);

                    // Hide the "Saved" indicator after 3 seconds
                    savedIndicatorTimeoutRef.current = setTimeout(() => {
                        setShowSavedIndicator(false);
                    }, 3000);
                },
                onMaxRetriesExceeded: () => {
                    /**
                     * Show error notification after max retries
                     * @validates Requirements 15.5 - Show error notification after max retries
                     */
                    toast.error("Failed to save caption changes", {
                        description: "Please check your connection and try again.",
                    });
                    // Keep captions marked as dirty so user knows changes aren't saved
                },
            });
        }, 2000); // 2 second debounce for auto-save
    }, [localCaptions, captionData?.captions, clipId, updateCaptionText, setCaptionUndoState]);

    // Caption style change handler
    /**
     * Handle manual style changes (not from preset selection)
     * Clears the selected preset when user manually edits style
     * Uses debounced auto-save after 2 seconds of inactivity with retry logic
     * @validates Requirements 9.4 - Allow editing after preset application
     * @validates Requirements 15.2 - Auto-save caption style after 2 seconds of inactivity
     * @validates Requirements 15.3 - Display "Saved" indicator when auto-save completes
     * @validates Requirements 15.5 - Retry failed saves up to 3 times
     */
    const handleStyleChange = useCallback(
        (newStyle: CaptionStyle | Partial<CaptionStyle>) => {
            // Merge with existing style for partial updates
            const mergedStyle = { ...captionStyle, ...newStyle } as CaptionStyle;

            // Update local state immediately for responsive UI
            setCaptionStyle(mergedStyle);

            // Clear the selected preset since user is manually editing
            // @validates Requirements 9.4 - Allow users to modify preset styles after application
            clearSelectedPreset();
            setCurrentPresetId(undefined);

            // Save the style as last used (without preset association)
            // @validates Requirements 9.5 - Save last used caption style as default
            saveLastUsedStyle(mergedStyle);

            // Mark style as dirty (unsaved changes)
            setStyleDirty(true);

            // Hide the "Saved" indicator when new edits are made
            setShowSavedIndicator(false);
            if (savedIndicatorTimeoutRef.current) {
                clearTimeout(savedIndicatorTimeoutRef.current);
                savedIndicatorTimeoutRef.current = null;
            }

            // Clear any existing auto-save timeout
            if (styleAutoSaveTimeoutRef.current) {
                clearTimeout(styleAutoSaveTimeoutRef.current);
            }

            // Reset retry counter when user makes a new edit
            captionStyleRetryCountRef.current = 0;

            /**
             * Debounced auto-save after 2 seconds of inactivity with retry logic
             * @validates Requirements 15.2 - Auto-save caption style after 2 seconds of inactivity
             * @validates Requirements 15.5 - Retry failed saves up to 3 times
             */
            styleAutoSaveTimeoutRef.current = setTimeout(() => {
                // Create a promise-based save function for retry logic
                const saveFn = () =>
                    new Promise<void>((resolve, reject) => {
                        updateCaptionStyle.mutate(
                            {
                                clipId,
                                style: mergedStyle,
                            },
                            {
                                onSuccess: () => resolve(),
                                onError: (error) => reject(error),
                            }
                        );
                    });

                // Perform auto-save with retry logic
                performAutoSaveWithRetry(saveFn, captionStyleRetryCountRef, {
                    saveType: "caption style",
                    onSuccess: () => {
                        // Mark style as clean (saved)
                        setStyleDirty(false);

                        /**
                         * Show "Saved" indicator for 3 seconds after successful save
                         * @validates Requirements 15.3 - Display "Saved" indicator when auto-save completes
                         */
                        setShowSavedIndicator(true);

                        // Hide the "Saved" indicator after 3 seconds
                        savedIndicatorTimeoutRef.current = setTimeout(() => {
                            setShowSavedIndicator(false);
                        }, 3000);
                    },
                    onMaxRetriesExceeded: () => {
                        /**
                         * Show error notification after max retries
                         * @validates Requirements 15.5 - Show error notification after max retries
                         */
                        toast.error("Failed to save caption style", {
                            description: "Please check your connection and try again.",
                        });
                        // Keep style marked as dirty so user knows changes aren't saved
                    },
                });
            }, 2000); // 2 second debounce for auto-save
        },
        [clipId, updateCaptionStyle, clearSelectedPreset, saveLastUsedStyle]
    );

    /**
     * Handle preset selection
     * Applies all style properties from the selected preset
     * Uses debounced auto-save after 2 seconds of inactivity with retry logic
     * @validates Requirements 9.2 - Apply all style properties from selected preset
     * @validates Requirements 9.5 - Save last used caption style as default
     * @validates Requirements 15.2 - Auto-save caption style after 2 seconds of inactivity
     * @validates Requirements 15.3 - Display "Saved" indicator when auto-save completes
     * @validates Requirements 15.5 - Retry failed saves up to 3 times
     */
    const handlePresetSelect = useCallback(
        (presetId: string, presetStyle: CaptionStyle) => {
            // Apply the preset style immediately for responsive UI
            setCaptionStyle(presetStyle);
            setCurrentPresetId(presetId);

            // Use the hook's applyPreset to handle localStorage persistence
            applyPreset(presetId);

            // Mark style as dirty (unsaved changes)
            setStyleDirty(true);

            // Hide the "Saved" indicator when new edits are made
            setShowSavedIndicator(false);
            if (savedIndicatorTimeoutRef.current) {
                clearTimeout(savedIndicatorTimeoutRef.current);
                savedIndicatorTimeoutRef.current = null;
            }

            // Clear any existing auto-save timeout
            if (styleAutoSaveTimeoutRef.current) {
                clearTimeout(styleAutoSaveTimeoutRef.current);
            }

            // Reset retry counter when user makes a new selection
            captionStyleRetryCountRef.current = 0;

            /**
             * Debounced auto-save after 2 seconds of inactivity with retry logic
             * @validates Requirements 15.2 - Auto-save caption style after 2 seconds of inactivity
             * @validates Requirements 15.5 - Retry failed saves up to 3 times
             */
            styleAutoSaveTimeoutRef.current = setTimeout(() => {
                // Create a promise-based save function for retry logic
                const saveFn = () =>
                    new Promise<void>((resolve, reject) => {
                        updateCaptionStyle.mutate(
                            {
                                clipId,
                                style: presetStyle,
                            },
                            {
                                onSuccess: () => resolve(),
                                onError: (error) => reject(error),
                            }
                        );
                    });

                // Perform auto-save with retry logic
                performAutoSaveWithRetry(saveFn, captionStyleRetryCountRef, {
                    saveType: "caption style",
                    onSuccess: () => {
                        // Mark style as clean (saved)
                        setStyleDirty(false);

                        /**
                         * Show "Saved" indicator for 3 seconds after successful save
                         * @validates Requirements 15.3 - Display "Saved" indicator when auto-save completes
                         */
                        setShowSavedIndicator(true);

                        // Hide the "Saved" indicator after 3 seconds
                        savedIndicatorTimeoutRef.current = setTimeout(() => {
                            setShowSavedIndicator(false);
                        }, 3000);
                    },
                    onMaxRetriesExceeded: () => {
                        /**
                         * Show error notification after max retries
                         * @validates Requirements 15.5 - Show error notification after max retries
                         */
                        toast.error("Failed to save caption style", {
                            description: "Please check your connection and try again.",
                        });
                        // Keep style marked as dirty so user knows changes aren't saved
                    },
                });
            }, 2000); // 2 second debounce for auto-save
        },
        [clipId, updateCaptionStyle, applyPreset]
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
                        setActiveExportId(data.export.clipId || clipId);
                    },
                }
            );
        },
        [clipId, captionData?.style?.id, initiateExport]
    );

    // Export completion handler
    const handleExportComplete = useCallback((downloadUrl: string) => {
        console.log("Export complete:", downloadUrl);
        setActiveExportId(null);
    }, []);

    // Export error handler
    const handleExportError = useCallback((error: string) => {
        console.error("Export error:", error);
        setActiveExportId(null);
    }, []);

    /**
     * Handle save action - saves all pending changes (caption style and clip boundaries)
     * Triggered by Ctrl+S / Cmd+S keyboard shortcut
     * @validates Requirements 14.4 - Ctrl+S (or Cmd+S on Mac) saves all pending changes
     */
    const handleSave = useCallback(() => {
        // Save caption style if there are changes
        if (captionStyle) {
            updateCaptionStyle.mutate({
                clipId,
                style: captionStyle,
            });
        }

        // Save clip boundaries if there are changes
        if (clipBoundaries) {
            updateClipBoundaries.mutate({
                clipId,
                boundaries: {
                    startTime: clipBoundaries.start,
                    endTime: clipBoundaries.end,
                },
            });
        }
    }, [clipId, captionStyle, clipBoundaries, updateCaptionStyle, updateClipBoundaries]);

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
        const currentCaptions = localCaptions ?? captionData?.captions ?? [];

        // Perform undo - this will update captionUndoState to the previous state
        undoCaptionEdit();

        // The undo state now contains the previous caption state
        // We need to apply it to the local captions
        // Note: The state update from undoCaptionEdit is async, so we use the current state
        // The effect below will handle applying the undone state
    }, [canUndo, localCaptions, captionData?.captions, undoCaptionEdit]);

    /**
     * Handle redo action - restores the next caption text state
     * Updates local captions and triggers auto-save for the restored text
     * @validates Requirements 19.3 - Redo last undone edit with Ctrl+Shift+Z
     */
    const handleRedo = useCallback(() => {
        if (!canRedo) return;

        // Perform redo - this will update captionUndoState to the next state
        redoCaptionEdit();

        // The effect below will handle applying the redone state
    }, [canRedo, redoCaptionEdit]);

    /**
     * Effect to apply undo/redo state changes to local captions
     * When captionUndoState changes (from undo/redo), update the local captions
     * @validates Requirements 19.2 - Update UI after undo
     * @validates Requirements 19.3 - Update UI after redo
     */
    useEffect(() => {
        if (captionUndoState === null) return;

        const { segmentId, text } = captionUndoState;

        // Get the current captions
        const currentCaptions = localCaptions ?? captionData?.captions ?? [];

        // Update the caption with the undone/redone text
        const updatedCaptions = currentCaptions.map((caption) => {
            if (caption.id === segmentId) {
                return {
                    ...caption,
                    text,
                };
            }
            return caption;
        });

        // Update local state
        setLocalCaptions(updatedCaptions);

        // Mark captions as dirty (unsaved changes)
        setCaptionsDirty(true);

        // Hide the "Saved" indicator
        setShowSavedIndicator(false);
        if (savedIndicatorTimeoutRef.current) {
            clearTimeout(savedIndicatorTimeoutRef.current);
            savedIndicatorTimeoutRef.current = null;
        }

        // Clear any existing auto-save timeout
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        // Reset retry counter
        captionTextRetryCountRef.current = 0;

        // Trigger auto-save after 2 seconds
        autoSaveTimeoutRef.current = setTimeout(() => {
            const saveFn = () =>
                new Promise<void>((resolve, reject) => {
                    updateCaptionText.mutate(
                        {
                            clipId,
                            captionId: segmentId,
                            text,
                        },
                        {
                            onSuccess: () => resolve(),
                            onError: (error) => reject(error),
                        }
                    );
                });

            performAutoSaveWithRetry(saveFn, captionTextRetryCountRef, {
                saveType: "caption text",
                onSuccess: () => {
                    setCaptionsDirty(false);
                    setShowSavedIndicator(true);
                    savedIndicatorTimeoutRef.current = setTimeout(() => {
                        setShowSavedIndicator(false);
                    }, 3000);
                },
                onMaxRetriesExceeded: () => {
                    toast.error("Failed to save caption changes", {
                        description: "Please check your connection and try again.",
                    });
                },
            });
        }, 2000);
    }, [captionUndoState, localCaptions, captionData?.captions, clipId, updateCaptionText]);

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

    // Get video source URL and thumbnail
    // Use clip's storageUrl if available (generated clip), otherwise fall back to original video
    const videoSrc = clip.storageUrl || video?.storageUrl || video?.sourceUrl || "";
    const thumbnailUrl = (video?.metadata?.thumbnail as string) || undefined;
    const videoDuration = video?.duration || clip.duration || 60;

    // Get captions for preview - use local captions for real-time sync, fallback to server data
    // @validates Requirements 6.3 - Real-time caption edit sync with optimistic UI updates
    // Convert words to Caption format for VideoPlayer
    const captions = (() => {
        if (localCaptions && localCaptions.length > 0) return localCaptions;
        if (captionData?.captions && captionData.captions.length > 0) return captionData.captions;

        // Convert words array to Caption format if available
        const words = (captionData as any)?.words;
        if (words && Array.isArray(words) && words.length > 0) {
            const segments: Caption[] = [];
            let currentWords: CaptionWord[] = [];

            for (let i = 0; i < words.length; i++) {
                currentWords.push({
                    id: `word-${i}`,
                    word: words[i].word,
                    start: words[i].start,
                    end: words[i].end,
                    highlight: false,
                });

                if (/[.!?]$/.test(words[i].word) || currentWords.length >= 10 || i === words.length - 1) {
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
        }

        return [];
    })();

    // Credit cost (example: 5 credits per export)
    const creditCost = 5;
    const userCredits = creditBalance?.balance ?? 0;

    // Determine if saving is in progress (includes caption text auto-save)
    // @validates Requirements 13.2 - Show saving indicator during save operations
    const isSaving = updateCaptionStyle.isPending || updateClipBoundaries.isPending || updateCaptionText.isPending;

    // Create the clip object for TimelineEditor with current boundaries
    const clipWithBoundaries = {
        ...clip,
        startTime: clipBoundaries?.start ?? clip.startTime,
        endTime: clipBoundaries?.end ?? clip.endTime,
    };

    return (
        <>
            <EditingLayout
                className="h-screen"
                header={
                    <EditorHeader
                        title={clip.title || "Untitled Clip"}
                        onBack={handleBack}
                        isSaving={isSaving}
                        showSavedIndicator={showSavedIndicator}
                        onExportClick={() => setExportDialogOpen(true)}
                        hasActiveExport={!!activeExportId}
                        workspaceSlug={slug}
                        videoId={clip.videoId}
                        videoTitle={video?.title ?? undefined}
                    />
                }
            >
                {{
                    /* Left Panel: Caption Editor (Paragraph View) */
                    captionEditor: (
                        <div className="h-full">
                            {video?.id ? (
                                <TranscriptParagraphView
                                    segments={captions.map((c) => ({
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

                    /* Center Panel: Video Player with Caption Overlay */
                    videoPlayer: (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Preview
                            </h2>
                            {videoSrc ? (
                                <VideoPlayer
                                    ref={videoPlayerRef}
                                    src={videoSrc}
                                    poster={thumbnailUrl}
                                    startTime={clipWithBoundaries.startTime}
                                    endTime={clipWithBoundaries.endTime}
                                    captions={captions}
                                    captionStyle={captionStyle}
                                    onCaptionStyleChange={handleStyleChange}
                                    onTimeUpdate={handleTimeUpdate}
                                    showFullControls
                                    className="aspect-video w-full rounded-lg overflow-hidden"
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
                            clipStartTime={clipWithBoundaries.startTime}
                            clipEndTime={clipWithBoundaries.endTime}
                            currentTime={currentTime - clipWithBoundaries.startTime}
                            isPlaying={isPlaying}
                            onSeek={(time) => videoPlayerRef.current?.seek(time + clipWithBoundaries.startTime)}
                            onPlayPause={handlePlayPause}
                            onSkipForward={handleSkipForward}
                            onSkipBackward={handleSkipBackward}
                            videoSrc={videoSrc}
                            captions={captions}
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
                captionStyleId={captionData?.style?.id}
                creditCost={creditCost}
                userCredits={userCredits}
                activeExportId={activeExportId}
                onExport={handleExport}
                onExportComplete={handleExportComplete}
                onExportError={handleExportError}
                isExporting={initiateExport.isPending}
            />

            {/* Unsaved Changes Warning Dialog */}
            {/* @validates Requirements 15.4 - Display "Unsaved changes" warning on navigation attempt */}
            <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Would you like to save them before leaving?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelNavigation}>
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            variant="outline"
                            onClick={handleDiscardAndNavigate}
                        >
                            Discard
                        </Button>
                        <AlertDialogAction onClick={handleSaveAndNavigate}>
                            Save
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Keyboard Shortcuts Modal */}
            <KeyboardShortcutsModal
                open={shortcutsModalOpen}
                onOpenChange={setShortcutsModalOpen}
            />
        </>
    );
}
