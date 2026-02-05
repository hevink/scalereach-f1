"use client";

import {
    IconClock,
    IconEdit,
    IconTextCaption,
    IconCheck,
    IconX,
} from "@tabler/icons-react";
import { useCallback, useId, useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { Caption } from "@/lib/api/captions";
import { cn } from "@/lib/utils";

/**
 * Format time in seconds to MM:SS.ms format
 */
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

/**
 * CaptionTextEditorProps interface
 *
 * @validates Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 */
export interface CaptionTextEditorProps {
    /** Array of caption segments to edit */
    captions: Caption[];
    /** Callback when captions change */
    onChange: (captions: Caption[]) => void;
    /** Additional className */
    className?: string;
    /** Whether the editor is disabled */
    disabled?: boolean;
    /** Currently playing time for highlighting active segment */
    currentTime?: number;
    /** Callback when a segment is clicked (for seeking) */
    onSegmentClick?: (startTime: number) => void;
}

/**
 * CaptionSegmentEditorProps interface
 */
interface CaptionSegmentEditorProps {
    caption: Caption;
    index: number;
    isActive: boolean;
    isEditing: boolean;
    onEdit: (text: string) => void;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onClick: () => void;
    disabled?: boolean;
    editValue: string;
    onEditValueChange: (value: string) => void;
}

/**
 * CaptionSegmentEditor Component
 *
 * Individual caption segment with inline editing support
 */
function CaptionSegmentEditor({
    caption,
    index,
    isActive,
    isEditing,
    onEdit,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onClick,
    disabled,
    editValue,
    onEditValueChange,
}: CaptionSegmentEditorProps) {
    const textareaId = useId();

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onCancelEdit();
            } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSaveEdit();
            }
        },
        [onCancelEdit, onSaveEdit]
    );

    const handleTextChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onEditValueChange(e.target.value);
        },
        [onEditValueChange]
    );

    return (
        <div
            className={cn(
                "group relative rounded-lg border transition-all",
                isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-muted-foreground/30",
                isEditing && "ring-2 ring-ring ring-offset-2",
                disabled && "opacity-50 pointer-events-none"
            )}
            data-segment-index={index}
            data-active={isActive}
        >
            {/* Timestamp Header */}
            <div
                className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2 border-b",
                    isActive ? "border-primary/20" : "border-border"
                )}
            >
                <button
                    type="button"
                    onClick={onClick}
                    disabled={disabled || isEditing}
                    className={cn(
                        "flex items-center gap-2 text-xs font-mono transition-colors",
                        "hover:text-primary focus-visible:outline-none focus-visible:text-primary",
                        isActive ? "text-primary" : "text-muted-foreground"
                    )}
                    aria-label={`Seek to ${formatTime(caption.startTime)}`}
                >
                    <IconClock className="size-3.5" aria-hidden="true" />
                    <span>
                        {formatTime(caption.startTime)} - {formatTime(caption.endTime)}
                    </span>
                </button>

                {!isEditing && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onStartEdit}
                        disabled={disabled}
                        className={cn(
                            "h-7 px-2 opacity-0 transition-opacity",
                            "group-hover:opacity-100 focus-visible:opacity-100"
                        )}
                        aria-label={`Edit caption segment ${index + 1}`}
                    >
                        <IconEdit className="size-3.5 mr-1" />
                        <span className="text-xs">Edit</span>
                    </Button>
                )}
            </div>

            {/* Caption Text Content */}
            <div className="p-3">
                {isEditing ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={textareaId} className="sr-only">
                                Caption text for segment {index + 1}
                            </Label>
                            <Textarea
                                id={textareaId}
                                value={editValue}
                                onChange={handleTextChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter caption text..."
                                className="min-h-[80px] text-sm resize-none"
                                disabled={disabled}
                                autoFocus
                                aria-describedby={`${textareaId}-hint`}
                            />
                            <p
                                id={`${textareaId}-hint`}
                                className="text-xs text-muted-foreground"
                            >
                                Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl+Enter</kbd> to save,{" "}
                                <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Esc</kbd> to cancel.
                                Line breaks are supported.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onCancelEdit}
                                disabled={disabled}
                                className="h-8"
                            >
                                <IconX className="size-4 mr-1" />
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={onSaveEdit}
                                disabled={disabled || !editValue.trim()}
                                className="h-8"
                            >
                                <IconCheck className="size-4 mr-1" />
                                Save
                            </Button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={onStartEdit}
                        disabled={disabled}
                        className={cn(
                            "w-full text-left text-sm whitespace-pre-wrap",
                            "hover:bg-muted/50 rounded p-1 -m-1 transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                            isActive ? "text-foreground" : "text-foreground/90"
                        )}
                        aria-label={`Edit caption: ${caption.text}`}
                    >
                        {caption.text || (
                            <span className="text-muted-foreground italic">Empty caption</span>
                        )}
                    </button>
                )}
            </div>

            {/* Word count indicator */}
            <div className="px-3 pb-2">
                <span className="text-xs text-muted-foreground">
                    {caption.words.length} words
                </span>
            </div>
        </div>
    );
}

/**
 * CaptionTextEditor Component
 *
 * A comprehensive editor for caption text segments:
 * - Display editable text for each caption segment (Requirement 16.1)
 * - Preserve original timing when editing text (Requirement 16.2)
 * - Support adding line breaks within caption segments (Requirement 16.3)
 * - Update preview immediately on text modification (Requirement 16.4)
 * - Persist changes via API (Requirement 16.5 - handled by parent via onChange)
 *
 * @example
 * ```tsx
 * const [captions, setCaptions] = useState<Caption[]>([]);
 *
 * <CaptionTextEditor
 *   captions={captions}
 *   onChange={(newCaptions) => setCaptions(newCaptions)}
 *   currentTime={videoCurrentTime}
 *   onSegmentClick={(time) => videoRef.current?.seek(time)}
 * />
 * ```
 *
 * @validates Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 */
export function CaptionTextEditor({
    captions,
    onChange,
    className,
    disabled = false,
    currentTime = 0,
    onSegmentClick,
}: CaptionTextEditorProps) {
    // Track which segment is being edited
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    // Track the current edit value
    const [editValue, setEditValue] = useState<string>("");

    // Find the active segment based on current playback time
    const activeSegmentIndex = useMemo(() => {
        return captions.findIndex(
            (caption) =>
                currentTime >= caption.startTime && currentTime <= caption.endTime
        );
    }, [captions, currentTime]);

    // Start editing a segment
    const handleStartEdit = useCallback(
        (index: number) => {
            if (disabled) return;
            setEditingIndex(index);
            setEditValue(captions[index].text);
        },
        [captions, disabled]
    );

    // Cancel editing
    const handleCancelEdit = useCallback(() => {
        setEditingIndex(null);
        setEditValue("");
    }, []);

    // Save the edited text - Requirement 16.2: Preserve original timing
    const handleSaveEdit = useCallback(
        (index: number) => {
            if (editingIndex === null || !editValue.trim()) return;

            const updatedCaptions = captions.map((caption, i) => {
                if (i === index) {
                    // Preserve all timing information, only update text
                    // Requirement 16.2: Preserve original timing
                    return {
                        ...caption,
                        text: editValue.trim(),
                        // Keep words array with original timing
                        // The words array timing is preserved even when text changes
                    };
                }
                return caption;
            });

            // Requirement 16.4: Update preview immediately
            onChange(updatedCaptions);
            setEditingIndex(null);
            setEditValue("");
        },
        [captions, editingIndex, editValue, onChange]
    );

    // Handle segment click for seeking
    const handleSegmentClick = useCallback(
        (startTime: number) => {
            if (onSegmentClick) {
                onSegmentClick(startTime);
            }
        },
        [onSegmentClick]
    );

    // Handle edit value change - Requirement 16.3: Support line breaks
    const handleEditValueChange = useCallback((value: string) => {
        // Allow line breaks in the text
        setEditValue(value);
    }, []);

    if (captions.length === 0) {
        return (
            <div
                className={cn(
                    "flex flex-col items-center justify-center gap-3 p-8 rounded-lg border border-dashed border-border bg-muted/30",
                    className
                )}
                role="status"
                aria-label="No captions available"
            >
                <IconTextCaption className="size-10 text-muted-foreground" />
                <div className="text-center">
                    <p className="font-medium text-foreground">No captions available</p>
                    <p className="text-sm text-muted-foreground">
                        Captions will appear here once the video is processed.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <section
            aria-label="Caption text editor"
            className={cn("flex flex-col gap-4", className)}
            data-slot="caption-text-editor"
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <IconTextCaption className="size-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Caption Text</span>
                </div>
                <span className="text-xs text-muted-foreground">
                    {captions.length} segment{captions.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Caption Segments List */}
            <ScrollArea className="h-[400px] pr-4">
                <div className="flex flex-col gap-3">
                    {captions.map((caption, index) => (
                        <CaptionSegmentEditor
                            key={caption.id}
                            caption={caption}
                            index={index}
                            isActive={activeSegmentIndex === index}
                            isEditing={editingIndex === index}
                            onEdit={(text) => {
                                const updatedCaptions = captions.map((c, i) =>
                                    i === index ? { ...c, text } : c
                                );
                                onChange(updatedCaptions);
                            }}
                            onStartEdit={() => handleStartEdit(index)}
                            onCancelEdit={handleCancelEdit}
                            onSaveEdit={() => handleSaveEdit(index)}
                            onClick={() => handleSegmentClick(caption.startTime)}
                            disabled={disabled}
                            editValue={editValue}
                            onEditValueChange={handleEditValueChange}
                        />
                    ))}
                </div>
            </ScrollArea>

            {/* Help Text */}
            <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-muted-foreground text-xs">
                    <span className="font-medium text-foreground">Tip:</span>{" "}
                    Click on a timestamp to seek to that position in the video.
                    Edit caption text to correct errors or improve wording.
                    Original timing is preserved when you edit text.
                </p>
            </div>
        </section>
    );
}

export default CaptionTextEditor;
