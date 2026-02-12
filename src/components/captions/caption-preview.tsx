"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconPlayerPlay, IconPlayerPause, IconRefresh } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Caption, CaptionStyle, CaptionWord } from "@/lib/api/captions";

// ============================================================================
// Types
// ============================================================================

/**
 * CaptionPreviewProps interface
 *
 * @validates Requirements 17.1, 17.2, 17.3, 17.4, 17.5
 */
export interface CaptionPreviewProps {
    /** Video source URL */
    videoUrl: string;
    /** Captions to display */
    captions: Caption[];
    /** Caption styling configuration */
    style: CaptionStyle;
    /** Current playback time (seconds) - for external sync */
    currentTime: number;
    /** Callback when playback time updates */
    onTimeUpdate?: (time: number) => void;
    /** Additional class names */
    className?: string;
    /** Whether to show playback controls */
    showControls?: boolean;
    /** Poster image URL */
    poster?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Debounce delay for style updates (ms) - Requirement 17.2 */
const STYLE_UPDATE_DEBOUNCE_MS = 100;

/** Maximum delay for preview updates - Requirement 17.2 */
const MAX_PREVIEW_UPDATE_MS = 500;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format seconds to MM:SS format
 */
function formatTime(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get the current caption based on playback time
 * @validates Requirement 17.3
 */
function getCurrentCaption(
    captions: Caption[],
    currentTime: number
): Caption | null {
    return (
        captions.find(
            (caption) =>
                currentTime >= caption.startTime && currentTime <= caption.endTime
        ) || null
    );
}

/**
 * Get the current word index being spoken based on playback time
 * @validates Requirement 17.3, 17.5
 */
function getCurrentWordIndex(caption: Caption, currentTime: number): number {
    return caption.words.findIndex(
        (word) => currentTime >= word.start && currentTime <= word.end
    );
}

// ============================================================================
// Caption Overlay Component
// ============================================================================

interface CaptionOverlayProps {
    caption: Caption | null;
    style: CaptionStyle;
    currentTime: number;
    scaleFactor: number;
}

/**
 * CaptionOverlay Component
 *
 * Renders styled captions with animations and highlighting
 * Matches the backend ASS rendering for consistent preview
 * @validates Requirements 17.1, 17.4, 17.5
 */
function CaptionOverlay({ caption, style, currentTime, scaleFactor }: CaptionOverlayProps) {
    if (!caption) return null;

    const currentWordIndex = getCurrentWordIndex(caption, currentTime);

    // Position classes
    const positionClasses = {
        top: "top-4",
        center: "top-1/2 -translate-y-1/2",
        bottom: "bottom-8",
    };

    // Alignment classes
    const alignmentClasses = {
        left: "text-left items-start",
        center: "text-center items-center",
        right: "text-right items-end",
    };

    // Build text shadow style - match ASS rendering with stronger shadow
    const outlineWidth = Math.round((style.outlineWidth ?? 3) * scaleFactor);
    const textShadow = style.shadow
        ? `0 0 ${outlineWidth}px ${style.outlineColor || "#000000"},
           0 0 ${outlineWidth * 2}px ${style.outlineColor || "#000000"},
           2px 2px 4px rgba(0, 0, 0, 0.9)`
        : `0 0 ${outlineWidth}px ${style.outlineColor || "#000000"},
           0 0 ${outlineWidth * 2}px ${style.outlineColor || "#000000"}`;

    // Build background color with opacity
    const backgroundColor = style.backgroundColor
        ? `${style.backgroundColor}${Math.round(style.backgroundOpacity * 2.55)
            .toString(16)
            .padStart(2, "0")}`
        : "transparent";

    // Highlight scale from style or default to 125%
    const highlightScale = (style.highlightScale ?? 110) / 100;

    /**
     * Render words with animation and highlighting
     * Matches backend ASS rendering
     * @validates Requirements 17.4, 17.5
     */
    const renderWords = () => {
        return caption.words.map((word, index) => {
            const isCurrentWord = index === currentWordIndex;
            const isPastWord = index < currentWordIndex;
            const shouldHighlight = style.highlightEnabled && isCurrentWord;

            let wordClassName = "inline-block transition-all duration-150";
            const isScaled = (style.highlightEnabled && isCurrentWord) ||
                (style.animation === "karaoke" && isCurrentWord) ||
                (style.animation === "word-by-word" && isCurrentWord && style.highlightEnabled) ||
                (style.animation === "bounce" && isCurrentWord);
            const scaleMargin = isScaled ? `0 ${Math.round((highlightScale - 1) * Math.round((style.fontSize || 24) * scaleFactor) * 0.5)}px` : "0 2px";
            const wordStyle: React.CSSProperties = {
                textShadow,
                margin: scaleMargin,
                WebkitTextStroke: style.outline
                    ? `${outlineWidth}px ${style.outlineColor || "#000000"}`
                    : undefined,
                paintOrder: "stroke fill",
            };

            // Apply animation styles - Requirement 17.4
            switch (style.animation) {
                case "word-by-word":
                    if (isCurrentWord && style.highlightEnabled) {
                        wordStyle.color = style.highlightColor || "#FFD700";
                        wordStyle.transform = `scale(${highlightScale})`;
                    }
                    // Hide future words in word-by-word mode
                    if (!isPastWord && !isCurrentWord) {
                        return null;
                    }
                    wordClassName += " opacity-100";
                    break;
                case "karaoke":
                    if (isCurrentWord) {
                        wordStyle.color = style.highlightColor || "#FFD700";
                        wordStyle.transform = `scale(${highlightScale})`;
                    }
                    break;
                case "bounce":
                    if (isCurrentWord) {
                        // Calculate bounce scale based on word timing
                        const wordProgress = (currentTime - word.start) / (word.end - word.start);
                        const bounceProgress = Math.min(wordProgress * 5, 1);
                        let bounceScale = 1;
                        if (bounceProgress < 0.5) {
                            bounceScale = 1 + (highlightScale - 1) * 0.92 * (bounceProgress * 2);
                        } else {
                            bounceScale = 1 + (highlightScale - 1) * 0.92 * (2 - bounceProgress * 2);
                        }
                        wordStyle.transform = `scale(${bounceScale})`;
                        if (style.highlightEnabled) {
                            wordStyle.color = style.highlightColor || "#FFD700";
                        }
                    }
                    break;
                case "fade":
                    // Calculate fade opacity
                    if (isCurrentWord) {
                        const wordProgress = (currentTime - word.start) / (word.end - word.start);
                        const fadeOpacity = Math.min(wordProgress * 5, 1);
                        wordStyle.opacity = fadeOpacity;
                    } else if (isPastWord) {
                        wordStyle.opacity = 1;
                    } else {
                        wordStyle.opacity = 0;
                    }
                    break;
                default:
                    break;
            }

            // Apply highlight for non-animated highlight
            if (shouldHighlight && style.animation !== "karaoke" && style.animation !== "word-by-word" && style.animation !== "bounce") {
                wordStyle.color = style.highlightColor || "#FFD700";
                wordStyle.transform = `scale(${highlightScale})`;
            }

            return (
                <span
                    key={`${word.word}-${index}`}
                    className={wordClassName}
                    style={wordStyle}
                >
                    {word.word}
                </span>
            );
        });
    };

    return (
        <div
            className={cn(
                "absolute left-0 right-0 px-4 pointer-events-none z-10 flex flex-col",
                positionClasses[style.position ?? "bottom"],
                alignmentClasses[style.alignment ?? "center"]
            )}
            data-testid="caption-overlay"
        >
            <div
                className="inline-block px-3 py-2 rounded-md"
                style={{
                    fontFamily: style.fontFamily,
                    fontSize: `${Math.round((style.fontSize || 24) * scaleFactor)}px`,
                    fontWeight: 700,
                    color: style.textColor,
                    backgroundColor,
                    textShadow,
                    WebkitTextStroke: style.outline
                        ? `${outlineWidth}px ${style.outlineColor || "#000"}`
                        : undefined,
                    paintOrder: "stroke fill",
                    textTransform: style.textTransform === "uppercase" ? "uppercase" : "none",
                    maxWidth: `${style.maxWidth ?? 90}%`,
                }}
            >
                {style.animation === "none" ? caption.text : renderWords()}
            </div>
        </div>
    );
}

// ============================================================================
// CaptionPreview Component
// ============================================================================

/**
 * CaptionPreview Component
 *
 * A live preview component that displays video with styled captions overlay.
 * Features:
 * - Live preview panel showing video with captions (Requirement 17.1)
 * - Updates preview within 500ms of style changes (Requirement 17.2)
 * - Synchronizes caption display with video playback (Requirement 17.3)
 * - Displays animations in preview when enabled (Requirement 17.4)
 * - Displays word highlighting in preview when enabled (Requirement 17.5)
 *
 * @example
 * ```tsx
 * const [currentTime, setCurrentTime] = useState(0);
 *
 * <CaptionPreview
 *   videoUrl="https://example.com/video.mp4"
 *   captions={captions}
 *   style={captionStyle}
 *   currentTime={currentTime}
 *   onTimeUpdate={setCurrentTime}
 * />
 * ```
 *
 * @validates Requirements 17.1, 17.2, 17.3, 17.4, 17.5
 */
export function CaptionPreview({
    videoUrl,
    captions,
    style,
    currentTime,
    onTimeUpdate,
    className,
    showControls = true,
    poster,
}: CaptionPreviewProps) {
    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const styleUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastStyleUpdateRef = useRef<number>(Date.now());

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [internalTime, setInternalTime] = useState(currentTime);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [debouncedStyle, setDebouncedStyle] = useState(style);
    const [containerHeight, setContainerHeight] = useState(0);

    // Track container height to scale font sizes relative to the 854px design space
    const DESIGN_HEIGHT = 700;
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height);
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const scaleFactor = containerHeight > 0 ? containerHeight / DESIGN_HEIGHT : 1;

    // Use internal time for playback sync, external time for seeking
    const effectiveTime = isPlaying ? internalTime : currentTime;

    // Current caption based on effective time - Requirement 17.3
    const currentCaption = useMemo(
        () => getCurrentCaption(captions, effectiveTime),
        [captions, effectiveTime]
    );

    // ========================================================================
    // Style Debouncing - Requirement 17.2
    // ========================================================================

    useEffect(() => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastStyleUpdateRef.current;

        // Clear any pending timeout
        if (styleUpdateTimeoutRef.current) {
            clearTimeout(styleUpdateTimeoutRef.current);
        }

        // If we're within the debounce window, schedule an update
        if (timeSinceLastUpdate < STYLE_UPDATE_DEBOUNCE_MS) {
            styleUpdateTimeoutRef.current = setTimeout(() => {
                setDebouncedStyle(style);
                lastStyleUpdateRef.current = Date.now();
            }, Math.min(STYLE_UPDATE_DEBOUNCE_MS, MAX_PREVIEW_UPDATE_MS - timeSinceLastUpdate));
        } else {
            // Update immediately if enough time has passed
            setDebouncedStyle(style);
            lastStyleUpdateRef.current = now;
        }

        return () => {
            if (styleUpdateTimeoutRef.current) {
                clearTimeout(styleUpdateTimeoutRef.current);
            }
        };
    }, [style]);

    // ========================================================================
    // Video Event Handlers
    // ========================================================================

    const handleLoadedMetadata = useCallback(() => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setIsLoading(false);
        }
    }, []);

    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setInternalTime(time);
            onTimeUpdate?.(time);
        }
    }, [onTimeUpdate]);

    const handlePlay = useCallback(() => {
        setIsPlaying(true);
    }, []);

    const handlePause = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const handleWaiting = useCallback(() => {
        setIsLoading(true);
    }, []);

    const handleCanPlay = useCallback(() => {
        setIsLoading(false);
    }, []);

    const handleEnded = useCallback(() => {
        setIsPlaying(false);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
        }
    }, []);

    // ========================================================================
    // Control Handlers
    // ========================================================================

    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    }, [isPlaying]);

    const handleRestart = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
        }
    }, []);

    // ========================================================================
    // Sync external currentTime to video - Requirement 17.3
    // ========================================================================

    useEffect(() => {
        if (videoRef.current && !isPlaying) {
            // Only sync when not playing to avoid conflicts
            const diff = Math.abs(videoRef.current.currentTime - currentTime);
            if (diff > 0.5) {
                videoRef.current.currentTime = currentTime;
                setInternalTime(currentTime);
            }
        }
    }, [currentTime, isPlaying]);

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative bg-black rounded-lg overflow-hidden",
                className
            )}
            data-testid="caption-preview"
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={videoUrl}
                poster={poster}
                className="w-full h-full object-contain"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                onPause={handlePause}
                onWaiting={handleWaiting}
                onCanPlay={handleCanPlay}
                onEnded={handleEnded}
                onClick={togglePlay}
                playsInline
                muted
            />

            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {/* Caption Overlay - Requirements 17.1, 17.4, 17.5 */}
            <CaptionOverlay
                caption={currentCaption}
                style={debouncedStyle}
                currentTime={effectiveTime}
                scaleFactor={scaleFactor}
            />

            {/* Play/Pause Overlay (center) */}
            {!isPlaying && !isLoading && showControls && (
                <button
                    className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
                    onClick={togglePlay}
                    aria-label="Play video"
                >
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <IconPlayerPlay className="w-7 h-7 text-black ml-0.5" />
                    </div>
                </button>
            )}

            {/* Minimal Controls Bar */}
            {showControls && (
                <div
                    className={cn(
                        "absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-3 py-2 transition-opacity duration-300",
                        isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
                    )}
                >
                    <div className="flex items-center justify-between gap-2">
                        {/* Play/Pause Button */}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={togglePlay}
                            className="text-white hover:bg-white/20 hover:text-white"
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? (
                                <IconPlayerPause className="w-4 h-4" />
                            ) : (
                                <IconPlayerPlay className="w-4 h-4" />
                            )}
                        </Button>

                        {/* Time Display */}
                        <span className="text-white text-xs tabular-nums flex-1 text-center">
                            {formatTime(effectiveTime)} / {formatTime(duration)}
                        </span>

                        {/* Restart Button */}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={handleRestart}
                            className="text-white hover:bg-white/20 hover:text-white"
                            aria-label="Restart"
                        >
                            <IconRefresh className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Preview Label */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs font-medium">
                Preview
            </div>
        </div>
    );
}

export default CaptionPreview;
