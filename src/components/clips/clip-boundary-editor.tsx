"use client";

import * as React from "react";
import { IconDeviceFloppy, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VideoPlayer, type VideoPlayerRef } from "@/components/video/video-player";
import { TimelineEditor, validateClipDuration } from "./timeline-editor";
import { useUpdateClipBoundaries } from "@/hooks/useClips";
import { analytics } from "@/lib/analytics";
import type { ClipResponse } from "@/lib/api/clips";

// ============================================================================
// Types
// ============================================================================

/**
 * ClipBoundaryEditorProps interface
 * 
 * @validates Requirements 10.1, 10.8
 */
export interface ClipBoundaryEditorProps {
    /** The clip ID being edited */
    clipId: string;
    /** Initial start time in seconds */
    initialStart: number;
    /** Initial end time in seconds */
    initialEnd: number;
    /** Total video duration in seconds */
    videoDuration: number;
    /** Callback when boundaries are saved */
    onSave: (start: number, end: number) => void;
    /** Video source URL for preview */
    videoSrc?: string;
    /** Video poster image URL */
    videoPoster?: string;
    /** Optional waveform URL for timeline visualization */
    waveformUrl?: string;
    /** Additional className */
    className?: string;
}

// ============================================================================
// ClipBoundaryEditor Component
// ============================================================================

/**
 * ClipBoundaryEditor Component
 * 
 * A container component that combines the TimelineEditor with VideoPlayer
 * for editing clip boundaries. Syncs playback with timeline position and
 * provides save functionality with API integration.
 * 
 * Features:
 * - Combines timeline editor with video player (Requirement 10.1)
 * - Syncs playback with timeline position
 * - Save button with API integration (Requirement 10.8)
 * - Real-time preview of clip boundaries
 * - Toast notifications for save success/failure
 * 
 * @example
 * ```tsx
 * <ClipBoundaryEditor
 *   clipId="clip-123"
 *   initialStart={10}
 *   initialEnd={30}
 *   videoDuration={300}
 *   videoSrc="/videos/source.mp4"
 *   onSave={(start, end) => console.log('Saved:', start, end)}
 * />
 * ```
 * 
 * @validates Requirements 10.1, 10.8
 */
export function ClipBoundaryEditor({
    clipId,
    initialStart,
    initialEnd,
    videoDuration,
    onSave,
    videoSrc,
    videoPoster,
    waveformUrl,
    className,
}: ClipBoundaryEditorProps) {
    // Refs
    const videoPlayerRef = React.useRef<VideoPlayerRef>(null);

    // State for current boundaries
    const [startTime, setStartTime] = React.useState(initialStart);
    const [endTime, setEndTime] = React.useState(initialEnd);
    const [hasChanges, setHasChanges] = React.useState(false);

    // API mutation hook
    const updateBoundaries = useUpdateClipBoundaries();

    // Create a mock clip object for TimelineEditor
    const clipForTimeline: ClipResponse = React.useMemo(
        () => ({
            id: clipId,
            videoId: "",
            title: "",
            startTime,
            endTime,
            duration: endTime - startTime,
            transcript: "",
            viralityScore: 0,
            viralityReason: "",
            hooks: [],
            emotions: [],
            storageKey: null,
            storageUrl: null,
            aspectRatio: null,
            favorited: false,
            status: "detected",
            errorMessage: null,
            createdAt: "",
            updatedAt: "",
        }),
        [clipId, startTime, endTime]
    );

    // Sync with initial values when they change
    React.useEffect(() => {
        setStartTime(initialStart);
        setEndTime(initialEnd);
        setHasChanges(false);
    }, [initialStart, initialEnd]);

    // Handle timeline boundary changes
    const handleTimelineChange = React.useCallback(
        (newStart: number, newEnd: number) => {
            setStartTime(newStart);
            setEndTime(newEnd);
            setHasChanges(
                newStart !== initialStart || newEnd !== initialEnd
            );

            // Seek video player to the new start position when boundaries change
            if (videoPlayerRef.current) {
                videoPlayerRef.current.seek(newStart);
            }
        },
        [initialStart, initialEnd]
    );

    // Handle video time update - sync with timeline
    const handleVideoTimeUpdate = React.useCallback(
        (currentTime: number) => {
            // If video reaches end of clip, loop back to start
            if (currentTime >= endTime && videoPlayerRef.current) {
                videoPlayerRef.current.seek(startTime);
            }
        },
        [startTime, endTime]
    );

    // Handle save
    const handleSave = React.useCallback(async () => {
        // Validate boundaries before saving
        const validation = validateClipDuration(startTime, endTime);
        if (!validation.isValid) {
            toast.error("Invalid clip duration", {
                description: validation.error,
            });
            return;
        }

        try {
            await updateBoundaries.mutateAsync({
                clipId,
                boundaries: {
                    startTime,
                    endTime,
                },
            });

            toast.success("Clip boundaries saved", {
                description: `Duration: ${Math.round(endTime - startTime)}s`,
            });

            analytics.clipEdited(clipId, "boundaries");
            setHasChanges(false);
            onSave(startTime, endTime);
        } catch (error) {
            toast.error("Failed to save clip boundaries", {
                description:
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred",
            });
        }
    }, [clipId, startTime, endTime, updateBoundaries, onSave]);

    // Validation state
    const validation = validateClipDuration(startTime, endTime);

    return (
        <div
            className={cn("flex flex-col gap-6", className)}
            data-slot="clip-boundary-editor"
        >
            {/* Video Player Section */}
            {videoSrc && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                    <VideoPlayer
                        ref={videoPlayerRef}
                        src={videoSrc}
                        poster={videoPoster}
                        startTime={startTime}
                        endTime={endTime}
                        onTimeUpdate={handleVideoTimeUpdate}
                        loop
                        className="h-full w-full"
                    />
                </div>
            )}

            {/* Timeline Editor Section */}
            <TimelineEditor
                clipId={clipId}
                clipData={{
                    startTime,
                    endTime,
                    duration: endTime - startTime,
                }}
                captions={[]}
                currentTime={startTime}
                onSeek={() => { }}
                onBoundaryChange={handleTimelineChange}
            />

            {/* Save Button Section */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {hasChanges ? (
                        <span className="text-yellow-600 dark:text-yellow-400">
                            Unsaved changes
                        </span>
                    ) : (
                        <span>No changes</span>
                    )}
                </div>

                <Button
                    onClick={handleSave}
                    disabled={
                        !hasChanges ||
                        !validation.isValid ||
                        updateBoundaries.isPending
                    }
                    className="min-w-[120px]"
                >
                    {updateBoundaries.isPending ? (
                        <>
                            <IconLoader2 className="mr-2 size-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <IconDeviceFloppy className="mr-2 size-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

export default ClipBoundaryEditor;
