"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    IconPlayerPlay,
    IconPlayerPause,
    IconPlayerSkipBack,
    IconPlayerSkipForward,
    IconZoomIn,
    IconZoomOut,
    IconEye,
    IconEyeOff,
    IconPlus,
    IconTrash,
    IconCopy,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { Caption } from "@/lib/api/captions";

// ============================================================================
// Types
// ============================================================================

export interface ClipTimelineProps {
    /** Clip start time in seconds (relative to original video) */
    clipStartTime: number;
    /** Clip end time in seconds (relative to original video) */
    clipEndTime: number;
    /** Current playback time in seconds (relative to clip start) */
    currentTime: number;
    /** Whether video is currently playing */
    isPlaying?: boolean;
    /** Callback when user seeks to a new time */
    onSeek: (time: number) => void;
    /** Callback to play/pause */
    onPlayPause?: () => void;
    /** Callback to skip forward */
    onSkipForward?: () => void;
    /** Callback to skip backward */
    onSkipBackward?: () => void;
    /** Video source URL for generating thumbnails */
    videoSrc?: string;
    /** Video thumbnail frames (array of image URLs) - fallback if videoSrc not provided */
    thumbnails?: string[];
    /** Audio waveform data (normalized 0-1 values) */
    waveformData?: number[];
    /** Captions for the clip */
    captions?: Caption[];
    /** Additional className */
    className?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatTime(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds)) return "00:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// ============================================================================
// Timeline Header Component
// ============================================================================

interface TimelineHeaderProps {
    isVisible: boolean;
    onToggleVisibility: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
}

function TimelineHeader({ isVisible, onToggleVisibility, onDelete, onDuplicate }: TimelineHeaderProps) {
    return (
        <div className="flex items-center justify-between px-3 py-1 border-b border-zinc-800">
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1"
                    onClick={onToggleVisibility}
                >
                    {isVisible ? <IconEye className="size-3" /> : <IconEyeOff className="size-3" />}
                    <span className="text-[10px]">Hide timeline</span>
                </Button>
                <div className="h-3 w-px bg-zinc-700" />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                    <IconTrash className="size-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                    <IconCopy className="size-3" />
                </Button>
            </div>
        </div>
    );
}

// ============================================================================
// Playback Controls Component
// ============================================================================

interface PlaybackControlsProps {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    onPlayPause: () => void;
    onSkipBackward: () => void;
    onSkipForward: () => void;
}

function PlaybackControls({
    isPlaying,
    currentTime,
    duration,
    onPlayPause,
    onSkipBackward,
    onSkipForward,
}: PlaybackControlsProps) {
    return (
        <div className="flex items-center justify-center gap-1 py-1 border-b border-zinc-800">
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={onSkipBackward}
            >
                <IconPlayerSkipBack className="size-3" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={onPlayPause}
            >
                {isPlaying ? (
                    <IconPlayerPause className="size-3" />
                ) : (
                    <IconPlayerPlay className="size-3" />
                )}
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={onSkipForward}
            >
                <IconPlayerSkipForward className="size-3" />
            </Button>
            <div className="ml-3 text-xs font-mono text-zinc-300">
                {formatTime(currentTime)} <span className="text-zinc-500">/</span> {formatTime(duration)}
            </div>
        </div>
    );
}

// ============================================================================
// Time Ruler Component
// ============================================================================

interface TimeRulerProps {
    duration: number;
    zoomLevel: number;
    width: number;
}

function TimeRuler({ duration, zoomLevel, width }: TimeRulerProps) {
    const effectiveWidth = width * zoomLevel;
    const interval = Math.max(5, Math.floor(30 / zoomLevel)); // Adjust interval based on zoom
    const markerCount = Math.ceil(duration / interval);

    return (
        <div className="relative h-4 bg-zinc-900 border-b border-zinc-800">
            {Array.from({ length: markerCount + 1 }).map((_, i) => {
                const time = i * interval;
                if (time > duration) return null;
                const left = (time / duration) * 100;

                return (
                    <div
                        key={i}
                        className="absolute top-0 flex flex-col items-center"
                        style={{ left: `${left}%` }}
                    >
                        <div className="h-1.5 w-px bg-zinc-600" />
                        <span className="text-[8px] text-zinc-500 font-mono">
                            {Math.floor(time)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// Thumbnail Track Component
// ============================================================================

interface ThumbnailTrackProps {
    videoSrc?: string;
    thumbnails: string[];
    duration: number;
    currentTime: number;
    clipStartTime: number;
    onSeek: (time: number) => void;
    captions?: Caption[];
}

const THUMBNAIL_COUNT = 20;

function ThumbnailTrack({ videoSrc, thumbnails, duration, currentTime, clipStartTime, onSeek, captions }: ThumbnailTrackProps) {
    const trackRef = React.useRef<HTMLDivElement>(null);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const [generatedThumbnails, setGeneratedThumbnails] = React.useState<string[]>([]);
    const [isGenerating, setIsGenerating] = React.useState(false);

    // Generate thumbnails from video source
    React.useEffect(() => {
        if (!videoSrc || thumbnails.length > 0 || isGenerating) return;

        const generateThumbnails = async () => {
            setIsGenerating(true);
            const video = document.createElement("video");
            video.crossOrigin = "anonymous";
            video.muted = true;
            video.preload = "metadata";

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                setIsGenerating(false);
                return;
            }

            video.src = videoSrc;
            videoRef.current = video;
            canvasRef.current = canvas;

            try {
                await new Promise<void>((resolve, reject) => {
                    video.onloadedmetadata = () => resolve();
                    video.onerror = () => reject(new Error("Failed to load video"));
                    setTimeout(() => reject(new Error("Video load timeout")), 10000);
                });

                // Set canvas size for thumbnails (small for performance)
                canvas.width = 160;
                canvas.height = 90;

                const thumbs: string[] = [];
                const interval = duration / THUMBNAIL_COUNT;

                for (let i = 0; i < THUMBNAIL_COUNT; i++) {
                    const time = clipStartTime + (i * interval);

                    await new Promise<void>((resolve) => {
                        video.currentTime = time;
                        video.onseeked = () => {
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            thumbs.push(canvas.toDataURL("image/jpeg", 0.6));
                            resolve();
                        };
                        // Timeout fallback
                        setTimeout(resolve, 500);
                    });
                }

                setGeneratedThumbnails(thumbs);
            } catch (error) {
                console.error("Failed to generate thumbnails:", error);
            } finally {
                setIsGenerating(false);
                video.src = "";
            }
        };

        generateThumbnails();

        return () => {
            if (videoRef.current) {
                videoRef.current.src = "";
            }
        };
    }, [videoSrc, thumbnails.length, duration, clipStartTime, isGenerating]);

    // Use provided thumbnails, generated thumbnails, or placeholders
    const displayThumbnails = thumbnails.length > 0
        ? thumbnails
        : generatedThumbnails.length > 0
            ? generatedThumbnails
            : Array.from({ length: THUMBNAIL_COUNT }).map(() => "");

    const handleClick = (e: React.MouseEvent) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const time = percentage * duration;
        onSeek(Math.max(0, Math.min(duration, time)));
    };

    const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="relative">
            {/* Thumbnail strip */}
            <div
                ref={trackRef}
                className="relative h-11 bg-zinc-800 cursor-pointer overflow-hidden"
                onClick={handleClick}
            >
                <div className="flex h-full">
                    {displayThumbnails.map((thumb, i) => (
                        <div
                            key={i}
                            className="shrink-0 h-full border-r border-zinc-700/30 relative overflow-hidden"
                            style={{ width: `${100 / displayThumbnails.length}%` }}
                        >
                            {thumb ? (
                                <img
                                    src={thumb}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-700/50 flex items-center justify-center">
                                    {isGenerating ? (
                                        <div className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse" />
                                    ) : (
                                        <span className="text-[6px] text-zinc-500">F{i + 1}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Caption markers */}
                {captions?.map((caption) => {
                    const left = (caption.startTime / duration) * 100;
                    const width = ((caption.endTime - caption.startTime) / duration) * 100;
                    return (
                        <div
                            key={caption.id}
                            className="absolute bottom-0 h-0.5 bg-green-500/70"
                            style={{ left: `${left}%`, width: `${width}%` }}
                        />
                    );
                })}

                {/* Playhead */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
                    style={{ left: `${playheadPosition}%` }}
                >
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-sm rotate-45" />
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Waveform Track Component
// ============================================================================

interface WaveformTrackProps {
    waveformData: number[];
    duration: number;
    currentTime: number;
}

function WaveformTrack({ waveformData, duration, currentTime }: WaveformTrackProps) {
    // Generate placeholder waveform if none provided
    const displayData = waveformData.length > 0
        ? waveformData
        : Array.from({ length: 100 }).map(() => Math.random() * 0.5 + 0.1);

    const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="relative h-5 bg-zinc-900 overflow-hidden">
            {/* Waveform bars */}
            <div className="flex items-center justify-center h-full gap-px px-1">
                {displayData.map((value, i) => (
                    <div
                        key={i}
                        className="flex-1 bg-zinc-600 rounded-sm min-w-px"
                        style={{ height: `${value * 100}%` }}
                    />
                ))}
            </div>

            {/* Playhead line */}
            <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/50 pointer-events-none"
                style={{ left: `${playheadPosition}%` }}
            />
        </div>
    );
}

// ============================================================================
// Zoom Controls Component
// ============================================================================

interface ZoomControlsProps {
    zoomLevel: number;
    onZoomChange: (level: number) => void;
}

function ZoomControls({ zoomLevel, onZoomChange }: ZoomControlsProps) {
    return (
        <div className="flex items-center gap-1 px-3 py-1 border-t border-zinc-800">
            <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => onZoomChange(Math.max(0.5, zoomLevel - 0.25))}
            >
                <IconZoomOut className="size-3" />
            </Button>
            <Slider
                value={[zoomLevel]}
                min={0.5}
                max={3}
                step={0.25}
                onValueChange={(value) => {
                    const newValue = Array.isArray(value) ? value[0] : value;
                    onZoomChange(newValue);
                }}
                className="w-20"
            />
            <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => onZoomChange(Math.min(3, zoomLevel + 0.25))}
            >
                <IconZoomIn className="size-3" />
            </Button>
        </div>
    );
}

// ============================================================================
// Main ClipTimeline Component
// ============================================================================

export function ClipTimeline({
    clipStartTime,
    clipEndTime,
    currentTime,
    isPlaying = false,
    onSeek,
    onPlayPause,
    onSkipForward,
    onSkipBackward,
    videoSrc,
    thumbnails = [],
    waveformData = [],
    captions = [],
    className,
}: ClipTimelineProps) {
    const [isVisible, setIsVisible] = React.useState(true);
    const [zoomLevel, setZoomLevel] = React.useState(1);

    // Calculate clip duration (only show clip portion, not full video)
    const clipDuration = clipEndTime - clipStartTime;

    // Adjust current time to be relative to clip start
    const relativeCurrentTime = Math.max(0, Math.min(clipDuration, currentTime));

    if (!isVisible) {
        return (
            <div className={cn("bg-zinc-900 border-t border-zinc-800", className)}>
                <div className="flex items-center justify-between px-3 py-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1"
                        onClick={() => setIsVisible(true)}
                    >
                        <IconEye className="size-3" />
                        <span className="text-[10px]">Show timeline</span>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("bg-zinc-900 border-t border-zinc-800 flex flex-col", className)}>
            {/* Header */}
            <TimelineHeader
                isVisible={isVisible}
                onToggleVisibility={() => setIsVisible(false)}
            />

            {/* Playback Controls */}
            <PlaybackControls
                isPlaying={isPlaying}
                currentTime={relativeCurrentTime}
                duration={clipDuration}
                onPlayPause={onPlayPause || (() => { })}
                onSkipBackward={onSkipBackward || (() => onSeek(Math.max(0, relativeCurrentTime - 5)))}
                onSkipForward={onSkipForward || (() => onSeek(Math.min(clipDuration, relativeCurrentTime + 5)))}
            />

            {/* Time Ruler */}
            <TimeRuler
                duration={clipDuration}
                zoomLevel={zoomLevel}
                width={800}
            />

            {/* Add Track Button */}
            <div className="flex items-center px-2 py-0.5 border-b border-zinc-800">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-zinc-500 hover:text-white hover:bg-zinc-800"
                >
                    <IconPlus className="size-2.5" />
                </Button>
            </div>

            {/* Thumbnail Track */}
            <ThumbnailTrack
                videoSrc={videoSrc}
                thumbnails={thumbnails}
                duration={clipDuration}
                currentTime={relativeCurrentTime}
                clipStartTime={clipStartTime}
                onSeek={onSeek}
                captions={captions}
            />

            {/* Waveform Track */}
            <WaveformTrack
                waveformData={waveformData}
                duration={clipDuration}
                currentTime={relativeCurrentTime}
            />

            {/* Add Track Button (bottom) */}
            <div className="flex items-center justify-end px-2 py-0.5 border-t border-zinc-800">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-zinc-500 hover:text-white hover:bg-zinc-800"
                >
                    <IconPlus className="size-2.5" />
                </Button>
            </div>

            {/* Zoom Controls */}
            <ZoomControls
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
            />
        </div>
    );
}

export default ClipTimeline;
