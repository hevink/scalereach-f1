"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Caption } from "@/lib/api/captions";

// ============================================================================
// Types
// ============================================================================

export interface AdvancedTimelineProps {
    clipStartTime: number;
    clipEndTime: number;
    currentTime: number;
    isPlaying?: boolean;
    onSeek: (time: number) => void;
    onPlayPause?: () => void;
    onSkipForward?: () => void;
    onSkipBackward?: () => void;
    videoSrc?: string;
    captions?: Caption[];
    className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const VIDEO_TRACK_HEIGHT = 45;
const AUDIO_TRACK_HEIGHT = 24;
const LEFT_PADDING = 84;
const TIME_SCALE_HEIGHT = 20;

// ============================================================================
// Utility Functions
// ============================================================================

function formatTimeMMSS(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds)) return "00:00.00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

// ============================================================================
// Icons
// ============================================================================

function HideTimelineIcon() {
    return (
        <svg width="16" height="16" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <path d="M6 5H18C20.2091 5 22 6.79086 22 9V15C22 17.2091 20.2091 19 18 19H6C3.79086 19 2 17.2091 2 15V9C2 6.79086 3.79086 5 6 5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.5 10.75L12 13.25L9.5 10.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CropIcon() {
    return (
        <svg width="16" height="16" strokeWidth="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-90">
            <path d="M2 12H22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 4H4V7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 4H13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 4H20V7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 20H13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 20H4V17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 20H20V17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6L15.375 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SnapIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.75007 16.5039C10.1643 16.5039 10.5001 16.8397 10.5001 17.2539V19.2539C10.5 19.668 10.1642 20.0039 9.75007 20.0039C9.33595 20.0039 9.00017 19.668 9.00007 19.2539V17.2539C9.00007 16.8397 9.33589 16.5039 9.75007 16.5039Z" fill="currentColor" />
            <path d="M3.70906 17.0039C3.94668 16.6648 4.41473 16.5828 4.75398 16.8203C5.09301 17.0578 5.17563 17.525 4.93855 17.8643L3.79109 19.5029C3.5535 19.8422 3.08547 19.9251 2.74616 19.6875C2.40688 19.4499 2.32499 18.9819 2.56257 18.6426L3.70906 17.0039Z" fill="currentColor" />
            <path d="M14.7462 16.8203C15.0855 16.5827 15.5535 16.6656 15.7911 17.0049L16.9385 18.6426C17.176 18.9819 17.0932 19.4499 16.754 19.6875C16.4147 19.925 15.9466 19.8422 15.7091 19.5029L14.5626 17.8652C14.325 17.526 14.407 17.0579 14.7462 16.8203Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M14.5001 5C15.6025 5 16.3394 4.99028 16.9551 5.19922C18.0591 5.57396 18.9261 6.44097 19.3009 7.54492C19.5098 8.1607 19.5001 8.89754 19.5001 10C19.5001 11.1025 19.5098 11.8393 19.3009 12.4551C18.9261 13.559 18.0591 14.426 16.9551 14.8008C16.3394 15.0097 15.6025 15 14.5001 15H5.00007C3.89764 15 3.16076 15.0097 2.54499 14.8008C1.44106 14.426 0.574028 13.559 0.19929 12.4551C-0.00966613 11.8393 7.08931e-05 11.1024 7.08931e-05 10C7.08341e-05 8.89754 -0.00967179 8.1607 0.19929 7.54492C0.574029 6.44098 1.44106 5.57398 2.54499 5.19922C3.16076 4.99026 3.89764 5 5.00007 5H14.5001ZM5.00007 6.5C3.77566 6.5 3.34864 6.50977 3.02644 6.61914C2.36431 6.84402 1.84407 7.36423 1.61921 8.02637C1.50984 8.34857 1.50007 8.77556 1.50007 10C1.50007 11.2244 1.50985 11.6514 1.61921 11.9736C1.84407 12.6358 2.36431 13.156 3.02644 13.3809C3.34864 13.4902 3.77566 13.5 5.00007 13.5H9.00007V6.5H5.00007ZM10.5001 13.5H14.5001C15.7245 13.5 16.1515 13.4902 16.4737 13.3809C17.1359 13.156 17.6561 12.6358 17.8809 11.9736C17.9903 11.6514 18.0001 11.2245 18.0001 10C18.0001 8.77554 17.9903 8.34857 17.8809 8.02637C17.6561 7.36422 17.1359 6.844 16.4737 6.61914C16.1515 6.50979 15.7244 6.5 14.5001 6.5H10.5001V13.5Z" fill="currentColor" />
            <path d="M9.75007 0C10.1643 1.88801e-06 10.5001 0.335788 10.5001 0.75V2.75C10.5001 3.16421 10.1643 3.5 9.75007 3.5C9.33589 3.49996 9.00007 3.16419 9.00007 2.75V0.75C9.00007 0.33581 9.33589 3.8395e-05 9.75007 0Z" fill="currentColor" />
            <path d="M2.74616 0.316406C3.08547 0.078825 3.5535 0.161673 3.79109 0.500977L4.93855 2.13867C5.17611 2.47797 5.09326 2.94601 4.75398 3.18359C4.41467 3.42118 3.94664 3.33833 3.70906 2.99902L2.56257 1.36133C2.32501 1.02206 2.40695 0.554012 2.74616 0.316406Z" fill="currentColor" />
            <path d="M15.7091 0.500977C15.9466 0.161674 16.4147 0.0788235 16.754 0.316406C17.0933 0.553991 17.1761 1.02203 16.9385 1.36133L15.7911 2.99902C15.5535 3.33833 15.0855 3.42117 14.7462 3.18359C14.4069 2.94599 14.325 2.47794 14.5626 2.13867L15.7091 0.500977Z" fill="currentColor" />
        </svg>
    );
}

function SkipBackIcon() {
    return (
        <svg width="16" height="16" strokeWidth="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 7V17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17.0282 5.2672C17.4217 4.95657 18 5.23682 18 5.73813V18.2619C18 18.7632 17.4217 19.0434 17.0282 18.7328L9.09651 12.4709C8.79223 12.2307 8.79223 11.7693 9.09651 11.5291L17.0282 5.2672Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function PlayIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
            <path d="M6.90588 4.53682C6.50592 4.2998 6 4.58808 6 5.05299V18.947C6 19.4119 6.50592 19.7002 6.90588 19.4632L18.629 12.5162C19.0211 12.2838 19.0211 11.7162 18.629 11.4838L6.90588 4.53682Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function PauseIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
            <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="currentColor" />
            <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="currentColor" />
        </svg>
    );
}

function SkipForwardIcon() {
    return (
        <svg width="16" height="16" strokeWidth="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 7V17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.97179 5.2672C6.57832 4.95657 6 5.23682 6 5.73813V18.2619C6 18.7632 6.57832 19.0434 6.97179 18.7328L14.9035 12.4709C15.2078 12.2307 15.2078 11.7693 14.9035 11.5291L6.97179 5.2672Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function ZoomOutIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 17L21 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 11C3 15.4183 6.58172 19 11 19C13.213 19 15.2161 18.1015 16.6644 16.6493C18.1077 15.2022 19 13.2053 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 11L14 11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function ZoomInIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 11H11M14 11H11M11 11V8M11 11V14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 17L21 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 11C3 15.4183 6.58172 19 11 19C13.213 19 15.2161 18.1015 16.6644 16.6493C18.1077 15.2022 19 13.2053 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg width="20" height="20" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#FAFAFA">
            <path d="M6 12H12M18 12H12M12 12V6M12 12V18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ============================================================================
// Video Thumbnail Canvas
// ============================================================================

interface VideoThumbnailCanvasProps {
    videoSrc?: string;
    duration: number;
    clipStartTime: number;
    width: number;
    height: number;
}

function VideoThumbnailCanvas({ videoSrc, duration, clipStartTime, width, height }: VideoThumbnailCanvasProps) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !videoSrc || width <= 0 || duration <= 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let cancelled = false;
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.preload = "auto";

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = "#18181b";
        ctx.fillRect(0, 0, width, height);

        const generateThumbnails = async () => {
            setIsLoading(true);
            try {
                video.src = videoSrc;
                await new Promise<void>((resolve, reject) => {
                    video.onloadeddata = () => resolve();
                    video.onerror = () => reject();
                    setTimeout(() => reject(), 15000);
                });

                if (cancelled) return;

                const thumbWidth = 80;
                const thumbCount = Math.ceil(width / thumbWidth);
                const actualThumbWidth = width / thumbCount;
                const interval = duration / thumbCount;

                for (let i = 0; i < thumbCount; i++) {
                    if (cancelled) break;

                    const time = clipStartTime + (i * interval) + (interval / 2);
                    video.currentTime = Math.min(time, clipStartTime + duration - 0.1);

                    await new Promise<void>((resolve) => {
                        const onSeeked = () => {
                            video.removeEventListener("seeked", onSeeked);
                            const x = i * actualThumbWidth;
                            ctx.drawImage(video, x, 0, actualThumbWidth, height);
                            resolve();
                        };
                        video.addEventListener("seeked", onSeeked);
                        setTimeout(() => {
                            video.removeEventListener("seeked", onSeeked);
                            resolve();
                        }, 400);
                    });
                }
            } catch (error) {
                console.error("Thumbnail generation failed:", error);
            } finally {
                if (!cancelled) setIsLoading(false);
                video.src = "";
            }
        };

        generateThumbnails();

        return () => {
            cancelled = true;
            video.src = "";
        };
    }, [videoSrc, duration, clipStartTime, width, height]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width, height, display: "block" }}
            className={cn(isLoading && "animate-pulse")}
        />
    );
}

// ============================================================================
// Audio Waveform Canvas
// ============================================================================

interface AudioWaveformCanvasProps {
    videoSrc?: string;
    duration: number;
    width: number;
    height: number;
}

function AudioWaveformCanvas({ videoSrc, duration, width, height }: AudioWaveformCanvasProps) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || width <= 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Background
        ctx.fillStyle = "#27272a";
        ctx.fillRect(0, 0, width, height);

        // Generate waveform (placeholder or real)
        const barWidth = 2;
        const gap = 2;
        const totalBarWidth = barWidth + gap;
        const barCount = Math.floor(width / totalBarWidth);
        const centerY = height / 2;

        // Generate random waveform data
        const waveform = Array.from({ length: barCount }, () => Math.random() * 0.8 + 0.1);

        ctx.fillStyle = "#52525b";
        waveform.forEach((value, i) => {
            const x = i * totalBarWidth;
            const barHeight = value * (height - 4);
            ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
        });

        // Try to extract real waveform
        if (videoSrc && duration > 0) {
            const extractWaveform = async () => {
                try {
                    const audioContext = new AudioContext();
                    const response = await fetch(videoSrc);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                    const channelData = audioBuffer.getChannelData(0);
                    const samplesPerBar = Math.floor(channelData.length / barCount);
                    const samples: number[] = [];

                    for (let i = 0; i < barCount; i++) {
                        const start = i * samplesPerBar;
                        const end = start + samplesPerBar;
                        let sum = 0;
                        for (let j = start; j < end; j++) {
                            sum += Math.abs(channelData[j] || 0);
                        }
                        samples.push(Math.min(1, (sum / samplesPerBar) * 5));
                    }

                    // Redraw with real data
                    ctx.fillStyle = "#27272a";
                    ctx.fillRect(0, 0, width, height);
                    ctx.fillStyle = "#52525b";

                    samples.forEach((value, i) => {
                        const x = i * totalBarWidth;
                        const barHeight = value * (height - 4);
                        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
                    });

                    audioContext.close();
                } catch {
                    // Keep placeholder waveform
                }
            };
            extractWaveform();
        }
    }, [videoSrc, duration, width, height]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width, height, display: "block" }}
        />
    );
}

// ============================================================================
// Video Track Scrubber - Click and drag to seek
// ============================================================================

interface VideoTrackScrubberProps {
    videoSrc?: string;
    duration: number;
    clipStartTime: number;
    width: number;
    height: number;
    onSeek: (time: number) => void;
}

function VideoTrackScrubber({ videoSrc, duration, clipStartTime, width, height, onSeek }: VideoTrackScrubberProps) {
    const trackRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const calculateTimeFromEvent = React.useCallback((clientX: number) => {
        if (!trackRef.current || duration <= 0) return 0;

        const rect = trackRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / width));
        return percentage * duration;
    }, [width, duration]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Don't start drag on resize handles
        if ((e.target as HTMLElement).closest("[data-no-seek]")) return;

        e.preventDefault();
        setIsDragging(true);
        const time = calculateTimeFromEvent(e.clientX);
        onSeek(time);
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const time = calculateTimeFromEvent(e.clientX);
            onSeek(time);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, calculateTimeFromEvent, onSeek]);

    return (
        <div
            ref={trackRef}
            className={cn(
                "relative mt-1 rounded overflow-hidden border-[1.5px] border-white cursor-pointer select-none",
                isDragging && "cursor-grabbing"
            )}
            style={{ width, height }}
            onMouseDown={handleMouseDown}
            data-no-seek
        >
            {/* Left resize handle */}
            <div className="absolute left-0 top-0 bottom-0 w-4 z-10 cursor-col-resize flex items-center justify-center" data-no-seek>
                <svg width="16" height="16" viewBox="0 0 17 16" fill="none">
                    <path d="M11.17 14V2M5.97 14V2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </div>

            {/* Thumbnails */}
            <VideoThumbnailCanvas
                videoSrc={videoSrc}
                duration={duration}
                clipStartTime={clipStartTime}
                width={width}
                height={height}
            />

            {/* Right resize handle */}
            <div className="absolute right-0 top-0 bottom-0 w-4 z-10 cursor-col-resize flex items-center justify-center" data-no-seek>
                <svg width="16" height="16" viewBox="0 0 17 16" fill="none">
                    <path d="M11.17 14V2M5.97 14V2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </div>
        </div>
    );
}

// ============================================================================
// Time Scale Canvas
// ============================================================================

interface TimeScaleCanvasProps {
    duration: number;
    width: number;
}

function TimeScaleCanvas({ duration, width }: TimeScaleCanvasProps) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || width <= 0 || duration <= 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = TIME_SCALE_HEIGHT * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, TIME_SCALE_HEIGHT);

        const pixelsPerSecond = width / duration;
        let interval = 1;
        if (pixelsPerSecond < 15) interval = 10;
        else if (pixelsPerSecond < 30) interval = 5;
        else if (pixelsPerSecond < 60) interval = 2;

        ctx.font = "10px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";

        for (let t = 0; t <= duration; t += interval) {
            const x = (t / duration) * width;
            const isMajor = t % (interval * 2) === 0 || interval >= 5;

            ctx.fillStyle = "#52525b";
            ctx.fillRect(x, 0, 1, isMajor ? 6 : 3);

            if (isMajor) {
                ctx.fillStyle = "#71717a";
                ctx.fillText(t.toString(), x, 16);
            }
        }
    }, [duration, width]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width, height: TIME_SCALE_HEIGHT, display: "block" }}
        />
    );
}


// ============================================================================
// Playhead Component - Handle at top, line extends down
// ============================================================================

interface PlayheadProps {
    currentTime: number;
    duration: number;
    trackWidth: number;
    totalHeight: number;
    onSeek: (time: number) => void;
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

function Playhead({ currentTime, duration, trackWidth, totalHeight, onSeek, scrollContainerRef }: PlayheadProps) {
    const [isDragging, setIsDragging] = React.useState(false);
    const position = duration > 0 ? (currentTime / duration) * trackWidth : 0;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const container = scrollContainerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const scrollLeft = container.scrollLeft;
            const x = e.clientX - rect.left + scrollLeft - LEFT_PADDING;
            const time = Math.max(0, Math.min(duration, (x / trackWidth) * duration));
            onSeek(time);
        };

        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, duration, trackWidth, onSeek, scrollContainerRef]);

    return (
        <div
            className="absolute z-30 pointer-events-none"
            style={{
                left: LEFT_PADDING + position,
                top: 0,
                transform: "translateX(-50%)",
                height: totalHeight,
            }}
        >
            {/* Handle - sits on top of time scale */}
            <div
                className={cn(
                    "relative w-[11px] h-[20px] bg-background border border-white rounded pointer-events-auto",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                )}
                style={{ left: "50%", transform: "translateX(-50%)", marginTop: -6 }}
                onMouseDown={handleMouseDown}
            />
            {/* Vertical line extending down */}
            <div
                className="w-px bg-white mx-auto"
                style={{ height: totalHeight - 14 }}
            />
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function AdvancedTimeline({
    clipStartTime,
    clipEndTime,
    currentTime,
    isPlaying = false,
    onSeek,
    onPlayPause,
    onSkipForward,
    onSkipBackward,
    videoSrc,
    captions = [],
    className,
}: AdvancedTimelineProps) {
    const [isVisible, setIsVisible] = React.useState(true);
    const [zoomLevel, setZoomLevel] = React.useState(1);
    const [snapEnabled, setSnapEnabled] = React.useState(true);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = React.useState(1200);

    const clipDuration = clipEndTime - clipStartTime;
    const relativeCurrentTime = Math.max(0, Math.min(clipDuration, currentTime));

    const baseWidth = containerWidth - LEFT_PADDING - 84;
    const trackWidth = Math.max(baseWidth, baseWidth * zoomLevel);

    // Total height of tracks area (time scale + fill label + video + gap + audio + padding)
    const tracksAreaHeight = TIME_SCALE_HEIGHT + 16 + VIDEO_TRACK_HEIGHT + 4 + AUDIO_TRACK_HEIGHT + 12;

    React.useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };
        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Auto-scroll to keep playhead visible
    React.useEffect(() => {
        if (!scrollRef.current || !isPlaying) return;

        const playheadX = (relativeCurrentTime / clipDuration) * trackWidth + LEFT_PADDING;
        const scrollLeft = scrollRef.current.scrollLeft;
        const visibleWidth = containerWidth;

        if (playheadX > scrollLeft + visibleWidth - 150 || playheadX < scrollLeft + 100) {
            scrollRef.current.scrollTo({
                left: Math.max(0, playheadX - visibleWidth / 2),
                behavior: "smooth",
            });
        }
    }, [relativeCurrentTime, trackWidth, containerWidth, isPlaying, clipDuration]);

    // Click to seek
    const handleTimelineClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-no-seek]")) return;

        const container = scrollRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const scrollLeft = container.scrollLeft;
        const x = e.clientX - rect.left + scrollLeft - LEFT_PADDING;

        if (x < 0 || x > trackWidth) return;

        const time = Math.max(0, Math.min(clipDuration, (x / trackWidth) * clipDuration));
        onSeek(time);
    };

    if (!isVisible) {
        return (
            <div className={cn("bg-background border-t border-zinc-800", className)}>
                <div className="flex h-10 items-center px-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-white gap-2"
                        onClick={() => setIsVisible(true)}
                    >
                        <HideTimelineIcon />
                        Show timeline
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={cn("bg-background", className)}>
            {/* Header */}
            <div className="flex h-14 items-center justify-between px-6 border-b border-zinc-800">
                {/* Left tools */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-white gap-2 h-8 px-2"
                        onClick={() => setIsVisible(false)}
                    >
                        <HideTimelineIcon />
                        <span className="text-xs">Hide timeline</span>
                    </Button>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                                    <CropIcon />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Crop</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" disabled>
                                    <TrashIcon />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-8 w-8", snapEnabled ? "text-white bg-accent" : "text-zinc-400 hover:text-white")}
                                    onClick={() => setSnapEnabled(!snapEnabled)}
                                >
                                    <SnapIcon />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Snap Editing</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Center playback controls */}
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white hover:bg-accent"
                            onClick={onSkipBackward || (() => onSeek(Math.max(0, relativeCurrentTime - 5)))}
                        >
                            <SkipBackIcon />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white hover:bg-accent"
                            onClick={onPlayPause}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white hover:bg-accent"
                            onClick={onSkipForward || (() => onSeek(Math.min(clipDuration, relativeCurrentTime + 5)))}
                        >
                            <SkipForwardIcon />
                        </Button>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono ml-3">
                        <span className="text-white w-[55px]">{formatTimeMMSS(relativeCurrentTime)}</span>
                        <span className="text-zinc-500">/</span>
                        <span className="text-zinc-500">{formatTimeMMSS(clipDuration)}</span>
                    </div>
                </div>

                {/* Right zoom controls */}
                <div className="flex items-center gap-2 border-l border-zinc-700 pl-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-white"
                        onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                    >
                        <ZoomOutIcon />
                    </Button>
                    <Slider
                        value={[zoomLevel]}
                        min={0.5}
                        max={3}
                        step={0.125}
                        onValueChange={(v) => {
                            const val = Array.isArray(v) ? v[0] : v;
                            setZoomLevel(val);
                        }}
                        className="w-[100px]"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-white"
                        onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                    >
                        <ZoomInIcon />
                    </Button>
                </div>
            </div>

            {/* Timeline scroll area */}
            <div
                ref={scrollRef}
                className="overflow-x-auto overflow-y-hidden relative"
                onClick={handleTimelineClick}
            >
                <div style={{ width: trackWidth + LEFT_PADDING + 84, minWidth: containerWidth }}>
                    {/* Time scale row */}
                    <div className="relative" style={{ height: TIME_SCALE_HEIGHT, paddingLeft: LEFT_PADDING }}>
                        <TimeScaleCanvas duration={clipDuration} width={trackWidth} />
                    </div>

                    {/* Tracks container - relative for playhead positioning */}
                    <div className="relative" style={{ paddingBottom: 12 }}>
                        {/* Playhead - positioned from top of this container */}
                        <Playhead
                            currentTime={relativeCurrentTime}
                            duration={clipDuration}
                            trackWidth={trackWidth}
                            totalHeight={tracksAreaHeight - TIME_SCALE_HEIGHT}
                            onSeek={onSeek}
                            scrollContainerRef={scrollRef}
                        />

                        {/* Intro placeholder */}
                        <div
                            className="absolute flex items-center justify-center"
                            style={{ left: 8, top: 16 + 4, width: LEFT_PADDING - 16, height: VIDEO_TRACK_HEIGHT }}
                            data-no-seek
                        >
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center justify-center w-[68px] h-[45px] rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 cursor-pointer hover:border-zinc-500 transition-colors">
                                            <PlusIcon />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Add intro</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* Main tracks */}
                        <div style={{ marginLeft: LEFT_PADDING }}>
                            {/* Fill label */}
                            <div
                                className="h-4 flex items-center px-2 rounded-sm border border-zinc-700/50 bg-white/5"
                                style={{ width: trackWidth }}
                            >
                                <span className="text-[10px] text-zinc-400 font-medium">Fill</span>
                            </div>

                            {/* Video track - clickable/draggable for scrubbing */}
                            <VideoTrackScrubber
                                videoSrc={videoSrc}
                                duration={clipDuration}
                                clipStartTime={clipStartTime}
                                width={trackWidth}
                                height={VIDEO_TRACK_HEIGHT}
                                onSeek={onSeek}
                            />

                            {/* Audio waveform */}
                            <div className="mt-1 rounded overflow-hidden" style={{ width: trackWidth, height: AUDIO_TRACK_HEIGHT }}>
                                <AudioWaveformCanvas
                                    videoSrc={videoSrc}
                                    duration={clipDuration}
                                    width={trackWidth}
                                    height={AUDIO_TRACK_HEIGHT}
                                />
                            </div>
                        </div>

                        {/* Outro placeholder */}
                        <div
                            className="absolute flex items-center justify-center"
                            style={{ left: LEFT_PADDING + trackWidth + 8, top: 16 + 4, width: 76, height: VIDEO_TRACK_HEIGHT }}
                            data-no-seek
                        >
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center justify-center w-[68px] h-[45px] rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 cursor-pointer hover:border-zinc-500 transition-colors">
                                            <PlusIcon />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Add outro</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdvancedTimeline;
