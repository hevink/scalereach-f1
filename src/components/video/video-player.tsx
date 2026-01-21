"use client";

import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    IconPlayerPlay,
    IconPlayerPause,
    IconVolume,
    IconVolumeOff,
    IconMaximize,
    IconMinimize,
    IconRewindBackward5,
    IconRewindForward5,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Caption, CaptionStyle } from "@/lib/api/captions";

// ============================================================================
// Types
// ============================================================================

export interface VideoPlayerProps {
    /** Video source URL */
    src: string;
    /** Poster image URL */
    poster?: string;
    /** Start time constraint for clip playback (seconds) */
    startTime?: number;
    /** End time constraint for clip playback (seconds) */
    endTime?: number;
    /** Captions to display */
    captions?: Caption[];
    /** Caption styling configuration */
    captionStyle?: CaptionStyle;
    /** Callback when playback time updates */
    onTimeUpdate?: (time: number) => void;
    /** Callback when video ends */
    onEnded?: () => void;
    /** Auto-play on mount */
    autoPlay?: boolean;
    /** Loop playback */
    loop?: boolean;
    /** Additional class names */
    className?: string;
    /** 
     * Preload strategy for faster playback start
     * - "auto": Browser decides (default for fast start)
     * - "metadata": Only load metadata
     * - "none": Don't preload
     * @validates Requirement 35.3 - Playback starts within 2 seconds
     */
    preload?: "auto" | "metadata" | "none";
    /**
     * Show full/expanded controls for modal use
     * When true, displays larger controls, hover overlay, and enhanced progress bar
     * @validates Requirements 3.5, 4.1-4.6
     */
    showFullControls?: boolean;
}

export interface VideoPlayerRef {
    play: () => void;
    pause: () => void;
    seek: (time: number) => void;
    getCurrentTime: () => number;
    getDuration: () => number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format seconds to MM:SS or HH:MM:SS format
 */
function formatTime(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get the current caption based on playback time
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
 * Get the current word being spoken based on playback time
 */
function getCurrentWordIndex(caption: Caption, currentTime: number): number {
    return caption.words.findIndex(
        (word) => currentTime >= word.startTime && currentTime <= word.endTime
    );
}

// ============================================================================
// Caption Overlay Component
// ============================================================================

interface CaptionOverlayProps {
    caption: Caption | null;
    style?: CaptionStyle;
    currentTime: number;
}

/**
 * CaptionOverlay - Renders captions over the video
 * Memoized for efficient rendering during playback
 * 
 * @validates Requirement 35.3 - Efficient caption rendering
 */
const CaptionOverlay = React.memo(function CaptionOverlay({ caption, style, currentTime }: CaptionOverlayProps) {
    if (!caption) return null;

    const defaultStyle: CaptionStyle = {
        fontFamily: "Inter",
        fontSize: 24,
        textColor: "#FFFFFF",
        backgroundColor: "#000000",
        backgroundOpacity: 70,
        position: "bottom",
        alignment: "center",
        animation: "none",
        highlightEnabled: false,
        shadow: true,
        outline: false,
    };

    const mergedStyle = { ...defaultStyle, ...style };
    const currentWordIndex = getCurrentWordIndex(caption, currentTime);

    // Position classes
    const positionClasses = {
        top: "top-4",
        center: "top-1/2 -translate-y-1/2",
        bottom: "bottom-12",
    };

    // Alignment classes
    const alignmentClasses = {
        left: "text-left",
        center: "text-center",
        right: "text-right",
    };

    // Build text shadow style
    const textShadow = mergedStyle.shadow
        ? "2px 2px 4px rgba(0, 0, 0, 0.8)"
        : "none";

    // Render words with animation and highlighting
    const renderWords = () => {
        return caption.words.map((word, index) => {
            const isCurrentWord = index === currentWordIndex;
            const isPastWord = index < currentWordIndex;
            const shouldHighlight =
                word.highlight ||
                (mergedStyle.highlightEnabled && isCurrentWord);

            let wordClassName = "inline-block mx-0.5 transition-all duration-150";
            let wordStyle: React.CSSProperties = {};

            // Apply animation styles
            switch (mergedStyle.animation) {
                case "word-by-word":
                    wordClassName += isPastWord || isCurrentWord ? " opacity-100" : " opacity-30";
                    break;
                case "karaoke":
                    if (isCurrentWord) {
                        wordStyle.color = mergedStyle.highlightColor || "#FFD700";
                        wordStyle.transform = "scale(1.1)";
                    } else if (isPastWord) {
                        wordStyle.color = mergedStyle.highlightColor || "#FFD700";
                    }
                    break;
                case "bounce":
                    if (isCurrentWord) {
                        wordClassName += " animate-bounce";
                    }
                    break;
                case "fade":
                    wordClassName += isPastWord || isCurrentWord ? " opacity-100" : " opacity-0";
                    break;
                default:
                    break;
            }

            // Apply highlight color
            if (shouldHighlight && mergedStyle.animation !== "karaoke") {
                wordStyle.backgroundColor = mergedStyle.highlightColor || "#FFD700";
                wordStyle.color = "#000000";
                wordStyle.padding = "0 4px";
                wordStyle.borderRadius = "2px";
            }

            return (
                <span key={`${word.word}-${index}`} className={wordClassName} style={wordStyle}>
                    {word.word}
                </span>
            );
        });
    };

    return (
        <div
            className={cn(
                "absolute left-0 right-0 px-4 pointer-events-none z-10",
                positionClasses[mergedStyle.position],
                alignmentClasses[mergedStyle.alignment]
            )}
        >
            <div
                className="inline-block px-3 py-2 rounded-md max-w-[90%]"
                style={{
                    fontFamily: mergedStyle.fontFamily,
                    fontSize: `${mergedStyle.fontSize}px`,
                    color: mergedStyle.textColor,
                    backgroundColor: mergedStyle.backgroundColor
                        ? `${mergedStyle.backgroundColor}${Math.round(mergedStyle.backgroundOpacity * 2.55)
                            .toString(16)
                            .padStart(2, "0")}`
                        : "transparent",
                    textShadow,
                    WebkitTextStroke: mergedStyle.outline
                        ? `1px ${mergedStyle.outlineColor || "#000"}`
                        : undefined,
                }}
            >
                {mergedStyle.animation === "none" ? caption.text : renderWords()}
            </div>
        </div>
    );
});

// ============================================================================
// Control Button Component
// ============================================================================

interface ControlButtonProps {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    className?: string;
    disabled?: boolean;
}

function ControlButton({
    onClick,
    icon,
    label,
    shortcut,
    className,
    disabled,
}: ControlButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onClick}
                    disabled={disabled}
                    className={cn(
                        "text-white hover:bg-white/20 hover:text-white focus-visible:ring-white/50",
                        className
                    )}
                    aria-label={label}
                >
                    {icon}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                {label}
                {shortcut && (
                    <span className="ml-2 text-muted-foreground">({shortcut})</span>
                )}
            </TooltipContent>
        </Tooltip>
    );
}

// ============================================================================
// Video Player Component
// ============================================================================

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
    function VideoPlayer(
        {
            src,
            poster,
            startTime = 0,
            endTime,
            captions = [],
            captionStyle,
            onTimeUpdate,
            onEnded,
            autoPlay = false,
            loop = false,
            className,
            preload = "auto", // Default to auto for fast playback start (Requirement 35.3)
            showFullControls = false, // Enhanced controls for modal use
        },
        ref
    ) {
        // Refs
        const videoRef = useRef<HTMLVideoElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const progressBarRef = useRef<HTMLDivElement>(null);

        // State
        const [isPlaying, setIsPlaying] = useState(false);
        const [currentTime, setCurrentTime] = useState(startTime);
        const [duration, setDuration] = useState(0);
        const [volume, setVolume] = useState(1);
        const [isMuted, setIsMuted] = useState(false);
        const [isFullscreen, setIsFullscreen] = useState(false);
        const [showControls, setShowControls] = useState(true);
        const [isLoading, setIsLoading] = useState(true);
        const [isHovering, setIsHovering] = useState(false);
        const [isDraggingProgress, setIsDraggingProgress] = useState(false);
        const [hoverTime, setHoverTime] = useState<number | null>(null);
        const [hoverPosition, setHoverPosition] = useState<number>(0);

        // Computed values
        const effectiveEndTime = endTime ?? duration;
        const effectiveDuration = effectiveEndTime - startTime;
        const relativeTime = currentTime - startTime;
        const progress = effectiveDuration > 0 ? (relativeTime / effectiveDuration) * 100 : 0;

        // Current caption
        const currentCaption = useMemo(
            () => getCurrentCaption(captions, currentTime),
            [captions, currentTime]
        );

        // ========================================================================
        // Imperative Handle
        // ========================================================================

        useImperativeHandle(ref, () => ({
            play: () => {
                videoRef.current?.play();
            },
            pause: () => {
                videoRef.current?.pause();
            },
            seek: (time: number) => {
                if (videoRef.current) {
                    const clampedTime = Math.max(startTime, Math.min(time, effectiveEndTime));
                    videoRef.current.currentTime = clampedTime;
                }
            },
            getCurrentTime: () => {
                return videoRef.current?.currentTime ?? 0;
            },
            getDuration: () => {
                return videoRef.current?.duration ?? 0;
            },
        }));

        // ========================================================================
        // Video Event Handlers
        // ========================================================================

        const handleLoadedMetadata = useCallback(() => {
            if (videoRef.current) {
                setDuration(videoRef.current.duration);
                videoRef.current.currentTime = startTime;
                setIsLoading(false);
            }
        }, [startTime]);

        const handleTimeUpdate = useCallback(() => {
            if (videoRef.current) {
                const time = videoRef.current.currentTime;
                setCurrentTime(time);
                onTimeUpdate?.(time);

                // Check if we've reached the end time constraint
                if (endTime && time >= endTime) {
                    if (loop) {
                        videoRef.current.currentTime = startTime;
                    } else {
                        videoRef.current.pause();
                        setIsPlaying(false);
                        onEnded?.();
                    }
                }
            }
        }, [endTime, loop, onEnded, onTimeUpdate, startTime]);

        const handleEnded = useCallback(() => {
            if (loop) {
                if (videoRef.current) {
                    videoRef.current.currentTime = startTime;
                    videoRef.current.play();
                }
            } else {
                setIsPlaying(false);
                onEnded?.();
            }
        }, [loop, onEnded, startTime]);

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

        // ========================================================================
        // Control Handlers
        // ========================================================================

        const togglePlay = useCallback(() => {
            if (videoRef.current) {
                if (isPlaying) {
                    videoRef.current.pause();
                } else {
                    // If at end, restart from beginning
                    if (currentTime >= effectiveEndTime) {
                        videoRef.current.currentTime = startTime;
                    }
                    videoRef.current.play();
                }
            }
        }, [isPlaying, currentTime, effectiveEndTime, startTime]);

        const handleSeek = useCallback(
            (value: number | readonly number[]) => {
                const seekValue = Array.isArray(value) ? value[0] : value;
                if (videoRef.current) {
                    const newTime = startTime + (seekValue / 100) * effectiveDuration;
                    videoRef.current.currentTime = newTime;
                }
            },
            [startTime, effectiveDuration]
        );

        /**
         * Handle progress bar mouse/touch events for drag-to-seek
         * @validates Requirement 4.4 - Progress bar for seeking
         */
        const calculateTimeFromPosition = useCallback(
            (clientX: number): number => {
                if (!progressBarRef.current) return startTime;
                const rect = progressBarRef.current.getBoundingClientRect();
                const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                return startTime + position * effectiveDuration;
            },
            [startTime, effectiveDuration]
        );

        const handleProgressBarMouseDown = useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                e.preventDefault();
                setIsDraggingProgress(true);
                const newTime = calculateTimeFromPosition(e.clientX);
                if (videoRef.current) {
                    videoRef.current.currentTime = newTime;
                }
            },
            [calculateTimeFromPosition]
        );

        const handleProgressBarMouseMove = useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                if (!progressBarRef.current) return;
                const rect = progressBarRef.current.getBoundingClientRect();
                const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const time = startTime + position * effectiveDuration;
                setHoverTime(time);
                setHoverPosition(position * 100);
            },
            [startTime, effectiveDuration]
        );

        const handleProgressBarMouseLeave = useCallback(() => {
            setHoverTime(null);
        }, []);

        // Global mouse move/up handlers for drag-to-seek
        useEffect(() => {
            if (!isDraggingProgress) return;

            const handleMouseMove = (e: MouseEvent) => {
                const newTime = calculateTimeFromPosition(e.clientX);
                if (videoRef.current) {
                    videoRef.current.currentTime = newTime;
                }
            };

            const handleMouseUp = () => {
                setIsDraggingProgress(false);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }, [isDraggingProgress, calculateTimeFromPosition]);

        const handleVolumeChange = useCallback((value: number | readonly number[]) => {
            const volumeValue = Array.isArray(value) ? value[0] : value;
            const newVolume = volumeValue / 100;
            if (videoRef.current) {
                videoRef.current.volume = newVolume;
                setVolume(newVolume);
                setIsMuted(newVolume === 0);
            }
        }, []);

        const toggleMute = useCallback(() => {
            if (videoRef.current) {
                const newMuted = !isMuted;
                videoRef.current.muted = newMuted;
                setIsMuted(newMuted);
            }
        }, [isMuted]);

        const seekForward = useCallback(() => {
            if (videoRef.current) {
                const newTime = Math.min(currentTime + 5, effectiveEndTime);
                videoRef.current.currentTime = newTime;
            }
        }, [currentTime, effectiveEndTime]);

        const seekBackward = useCallback(() => {
            if (videoRef.current) {
                const newTime = Math.max(currentTime - 5, startTime);
                videoRef.current.currentTime = newTime;
            }
        }, [currentTime, startTime]);

        const toggleFullscreen = useCallback(async () => {
            if (!containerRef.current) return;

            try {
                if (!document.fullscreenElement) {
                    await containerRef.current.requestFullscreen();
                    setIsFullscreen(true);
                } else {
                    await document.exitFullscreen();
                    setIsFullscreen(false);
                }
            } catch (error) {
                console.error("Fullscreen error:", error);
            }
        }, []);

        // ========================================================================
        // Keyboard Shortcuts
        // ========================================================================

        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                // Only handle if the video player container is focused or no input is focused
                const activeElement = document.activeElement;
                const isInputFocused =
                    activeElement instanceof HTMLInputElement ||
                    activeElement instanceof HTMLTextAreaElement ||
                    activeElement?.getAttribute("contenteditable") === "true";

                if (isInputFocused) return;

                // Check if the event target is within our container
                if (!containerRef.current?.contains(e.target as Node)) return;

                switch (e.key) {
                    case " ": // Space - Play/Pause
                        e.preventDefault();
                        togglePlay();
                        break;
                    case "ArrowLeft": // Left Arrow - Seek backward 5s
                        e.preventDefault();
                        seekBackward();
                        break;
                    case "ArrowRight": // Right Arrow - Seek forward 5s
                        e.preventDefault();
                        seekForward();
                        break;
                    case "m": // M - Toggle mute
                    case "M":
                        e.preventDefault();
                        toggleMute();
                        break;
                    case "f": // F - Toggle fullscreen
                    case "F":
                        e.preventDefault();
                        toggleFullscreen();
                        break;
                }
            };

            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }, [togglePlay, seekBackward, seekForward, toggleMute, toggleFullscreen]);

        // ========================================================================
        // Fullscreen Change Handler
        // ========================================================================

        useEffect(() => {
            const handleFullscreenChange = () => {
                setIsFullscreen(!!document.fullscreenElement);
            };

            document.addEventListener("fullscreenchange", handleFullscreenChange);
            return () =>
                document.removeEventListener("fullscreenchange", handleFullscreenChange);
        }, []);

        // ========================================================================
        // Controls Visibility
        // ========================================================================

        const showControlsTemporarily = useCallback(() => {
            setShowControls(true);
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            if (isPlaying) {
                controlsTimeoutRef.current = setTimeout(() => {
                    setShowControls(false);
                }, 3000);
            }
        }, [isPlaying]);

        const handleMouseMove = useCallback(() => {
            showControlsTemporarily();
        }, [showControlsTemporarily]);

        const handleMouseLeave = useCallback(() => {
            if (isPlaying) {
                setShowControls(false);
            }
            setIsHovering(false);
        }, [isPlaying]);

        const handleMouseEnter = useCallback(() => {
            setIsHovering(true);
            showControlsTemporarily();
        }, [showControlsTemporarily]);

        // Show controls when paused
        useEffect(() => {
            if (!isPlaying) {
                setShowControls(true);
                if (controlsTimeoutRef.current) {
                    clearTimeout(controlsTimeoutRef.current);
                }
            }
        }, [isPlaying]);

        // Cleanup timeout on unmount
        useEffect(() => {
            return () => {
                if (controlsTimeoutRef.current) {
                    clearTimeout(controlsTimeoutRef.current);
                }
            };
        }, []);

        // ========================================================================
        // Auto-play
        // ========================================================================

        useEffect(() => {
            if (autoPlay && videoRef.current) {
                videoRef.current.play().catch(() => {
                    // Auto-play was prevented, user interaction required
                    console.log("Auto-play prevented by browser");
                });
            }
        }, [autoPlay]);

        // ========================================================================
        // Render
        // ========================================================================

        return (
            <TooltipProvider>
                <div
                    ref={containerRef}
                    className={cn(
                        "relative bg-black rounded-lg overflow-hidden group focus:outline-none",
                        isFullscreen && "rounded-none",
                        className
                    )}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onMouseEnter={handleMouseEnter}
                    tabIndex={0}
                    role="application"
                    aria-label="Video player"
                    data-testid="video-player"
                    data-show-full-controls={showFullControls}
                >
                    {/* Video Element */}
                    {/* @validates Requirement 35.3 - Playback starts within 2 seconds */}
                    <video
                        ref={videoRef}
                        src={src}
                        poster={poster}
                        preload={preload}
                        className="w-full h-full object-contain"
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleEnded}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onWaiting={handleWaiting}
                        onCanPlay={handleCanPlay}
                        onClick={togglePlay}
                        playsInline
                    />

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50" role="status" aria-label="Loading video">
                            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                            <span className="sr-only">Loading video...</span>
                        </div>
                    )}

                    {/* Caption Overlay */}
                    <CaptionOverlay
                        caption={currentCaption}
                        style={captionStyle}
                        currentTime={currentTime}
                    />

                    {/* Play/Pause Overlay (center) - Shows when paused or on hover with showFullControls */}
                    {/* @validates Requirements 4.1, 4.5 - Play/pause functionality */}
                    {((!isPlaying && !isLoading) || (showFullControls && isHovering && !isLoading)) && (
                        <button
                            className={cn(
                                "absolute inset-0 flex items-center justify-center transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                                !isPlaying ? "bg-black/30" : "bg-black/20 opacity-0 hover:opacity-100"
                            )}
                            onClick={togglePlay}
                            aria-label={isPlaying ? "Pause video" : "Play video"}
                            data-testid="play-pause-overlay"
                        >
                            <div className={cn(
                                "rounded-full bg-white/90 flex items-center justify-center transition-transform hover:scale-110",
                                showFullControls ? "w-20 h-20" : "w-16 h-16"
                            )}>
                                {isPlaying ? (
                                    <IconPlayerPause className={cn(
                                        "text-black",
                                        showFullControls ? "w-10 h-10" : "w-8 h-8"
                                    )} aria-hidden="true" />
                                ) : (
                                    <IconPlayerPlay className={cn(
                                        "text-black ml-1",
                                        showFullControls ? "w-10 h-10" : "w-8 h-8"
                                    )} aria-hidden="true" />
                                )}
                            </div>
                        </button>
                    )}

                    {/* Controls Bar */}
                    {/* @validates Requirement 4.6 - Controls accessible via keyboard */}
                    <div
                        className={cn(
                            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300",
                            showFullControls ? "px-5 py-4" : "px-4 py-3",
                            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}
                        data-testid="controls-bar"
                    >
                        {/* Progress Bar with enhanced seek functionality */}
                        {/* @validates Requirement 4.4 - Progress bar for seeking */}
                        <div className="mb-2 relative">
                            {/* Time tooltip on hover */}
                            {hoverTime !== null && (
                                <div
                                    className="absolute -top-8 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none z-20"
                                    style={{ left: `${hoverPosition}%` }}
                                    data-testid="progress-time-tooltip"
                                >
                                    {formatTime(hoverTime - startTime)}
                                </div>
                            )}
                            {/* Enhanced progress bar with drag-to-seek */}
                            <div
                                ref={progressBarRef}
                                className={cn(
                                    "relative cursor-pointer",
                                    showFullControls && "py-1"
                                )}
                                onMouseDown={handleProgressBarMouseDown}
                                onMouseMove={handleProgressBarMouseMove}
                                onMouseLeave={handleProgressBarMouseLeave}
                                role="slider"
                                aria-label="Seek"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={Math.round(progress)}
                                aria-valuetext={`${formatTime(relativeTime)} of ${formatTime(effectiveDuration)}`}
                                tabIndex={0}
                                data-testid="progress-bar"
                            >
                                <Slider
                                    value={[progress]}
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    onValueChange={handleSeek}
                                    className={cn(
                                        "cursor-pointer pointer-events-none",
                                        "[&_[data-slot=slider-track]]:bg-white/30 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white",
                                        showFullControls
                                            ? "[&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-thumb]]:size-4 hover:[&_[data-slot=slider-track]]:h-2.5"
                                            : "[&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-thumb]]:size-3 hover:[&_[data-slot=slider-track]]:h-1.5"
                                    )}
                                    aria-hidden="true"
                                />
                            </div>
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center justify-between">
                            {/* Left Controls */}
                            <div className="flex items-center gap-1">
                                {/* Play/Pause */}
                                {/* @validates Requirement 4.1 - Play/pause button */}
                                <ControlButton
                                    onClick={togglePlay}
                                    icon={isPlaying
                                        ? <IconPlayerPause className={cn(showFullControls ? "w-6 h-6" : "w-5 h-5")} />
                                        : <IconPlayerPlay className={cn(showFullControls ? "w-6 h-6" : "w-5 h-5")} />
                                    }
                                    label={isPlaying ? "Pause" : "Play"}
                                    shortcut="Space"
                                />

                                {/* Skip Backward */}
                                <ControlButton
                                    onClick={seekBackward}
                                    icon={<IconRewindBackward5 className={cn(showFullControls ? "w-5 h-5" : "w-4 h-4")} />}
                                    label="Rewind 5s"
                                    shortcut="←"
                                />

                                {/* Skip Forward */}
                                <ControlButton
                                    onClick={seekForward}
                                    icon={<IconRewindForward5 className={cn(showFullControls ? "w-5 h-5" : "w-4 h-4")} />}
                                    label="Forward 5s"
                                    shortcut="→"
                                />

                                {/* Volume - Enhanced for modal use */}
                                {/* @validates Requirement 4.2 - Volume control with mute toggle */}
                                <div className="flex items-center gap-1 ml-2 group/volume">
                                    <ControlButton
                                        onClick={toggleMute}
                                        icon={
                                            isMuted || volume === 0 ? (
                                                <IconVolumeOff className={cn(showFullControls ? "w-6 h-6" : "w-5 h-5")} />
                                            ) : (
                                                <IconVolume className={cn(showFullControls ? "w-6 h-6" : "w-5 h-5")} />
                                            )
                                        }
                                        label={isMuted ? "Unmute" : "Mute"}
                                        shortcut="M"
                                    />
                                    <div className={cn(
                                        "hidden sm:block transition-all duration-200",
                                        showFullControls ? "w-24" : "w-20 group-hover/volume:w-24"
                                    )}>
                                        <Slider
                                            value={[isMuted ? 0 : volume * 100]}
                                            min={0}
                                            max={100}
                                            step={1}
                                            onValueChange={handleVolumeChange}
                                            className={cn(
                                                "cursor-pointer [&_[data-slot=slider-track]]:bg-white/30 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white",
                                                showFullControls
                                                    ? "[&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-thumb]]:size-4"
                                                    : "[&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-thumb]]:size-3"
                                            )}
                                            aria-label="Volume"
                                            data-testid="volume-slider"
                                        />
                                    </div>
                                </div>

                                {/* Time Display */}
                                {/* @validates Requirement 4.3 - Current time and total duration display */}
                                <span
                                    className={cn(
                                        "text-white ml-3 tabular-nums",
                                        showFullControls ? "text-base" : "text-sm"
                                    )}
                                    data-testid="time-display"
                                >
                                    {formatTime(relativeTime)} / {formatTime(effectiveDuration)}
                                </span>
                            </div>

                            {/* Right Controls */}
                            <div className="flex items-center gap-1">
                                {/* Fullscreen */}
                                {/* @validates Requirement 4.5 - Fullscreen toggle */}
                                <ControlButton
                                    onClick={toggleFullscreen}
                                    icon={
                                        isFullscreen ? (
                                            <IconMinimize className={cn(showFullControls ? "w-6 h-6" : "w-5 h-5")} />
                                        ) : (
                                            <IconMaximize className={cn(showFullControls ? "w-6 h-6" : "w-5 h-5")} />
                                        )
                                    }
                                    label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                                    shortcut="F"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        );
    }
);

export default VideoPlayer;
