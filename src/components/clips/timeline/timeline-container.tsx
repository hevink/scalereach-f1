"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { AdvancedTimelineProps, TimelineContextValue } from "./types";
import { TRACK_LABEL_WIDTH, TIME_RULER_HEIGHT, MINIMAP_HEIGHT } from "./types";
import { useTimeline } from "./use-timeline";
import { useTimelineKeyboard } from "./use-timeline-keyboard";
import { TimeRuler } from "./time-ruler";
import { Playhead } from "./playhead";
import { TrackLabel } from "./track-label";
import { VideoTrack } from "./video-track";
import { AudioTrack } from "./audio-track";
import { Minimap } from "./minimap";
import { PlaybackControls } from "./playback-controls";
import { Toolbar } from "./toolbar";
import { LoopRegionOverlay } from "./loop-region";
import { Marker } from "./marker";
import { TrackResizer } from "./track-resizer";
import { ContextMenu } from "./context-menu";

// ============================================================================
// React Context
// ============================================================================

export const TimelineContext = React.createContext<TimelineContextValue | null>(null);

export function useTimelineContext() {
    const ctx = React.useContext(TimelineContext);
    if (!ctx) throw new Error("useTimelineContext must be used within TimelineContainer");
    return ctx;
}

// ============================================================================
// Timeline Container
// ============================================================================

export function TimelineContainer({
    clipStartTime,
    clipEndTime,
    currentTime,
    isPlaying = false,
    onSeek,
    onPlayPause,
    onSkipForward,
    onSkipBackward,
    videoSrc,
    className,
}: AdvancedTimelineProps) {
    const [isVisible, setIsVisible] = React.useState(true);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const clipDuration = clipEndTime - clipStartTime;
    const relativeCurrentTime = Math.max(0, Math.min(clipDuration, currentTime));

    const timeline = useTimeline({ clipDuration, currentTime: relativeCurrentTime });
    const { state, timeToX, xToTime, getSnapPoint } = timeline;

    // Measure container width
    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(() => {
            timeline.setContainerWidth(el.clientWidth);
        });
        observer.observe(el);
        timeline.setContainerWidth(el.clientWidth);
        return () => observer.disconnect();
    }, []);

    // Auto-scroll to keep playhead visible during playback
    React.useEffect(() => {
        if (!scrollRef.current || !isPlaying) return;
        const playheadX = timeToX(relativeCurrentTime) + TRACK_LABEL_WIDTH;
        const scrollLeft = scrollRef.current.scrollLeft;
        const visibleWidth = state.containerWidth;

        if (playheadX > scrollLeft + visibleWidth - 150 || playheadX < scrollLeft + 100) {
            scrollRef.current.scrollTo({
                left: Math.max(0, playheadX - visibleWidth / 2),
                behavior: "smooth",
            });
        }
    }, [relativeCurrentTime, isPlaying, state.containerWidth, timeToX]);

    // Ctrl+Scroll to zoom
    React.useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.25 : 0.25;
                timeline.setZoom(state.zoomLevel + delta);
            }
        };

        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [state.zoomLevel, timeline.setZoom]);

    // Keyboard shortcuts
    useTimelineKeyboard({
        onSeek,
        onPlayPause,
        currentTime: relativeCurrentTime,
        clipDuration,
        isPlaying,
        zoomLevel: state.zoomLevel,
        setZoom: timeline.setZoom,
        addMarker: timeline.addMarker,
        setLoopRegion: timeline.setLoopRegion,
        loopRegion: state.loopRegion,
        playbackSpeed: state.playbackSpeed,
        setPlaybackSpeed: timeline.setPlaybackSpeed,
    });

    // Click on timeline area to seek
    const handleTimelineClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-no-seek]")) return;

        const container = scrollRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const scrollLeft = container.scrollLeft;
        const x = e.clientX - rect.left + scrollLeft - TRACK_LABEL_WIDTH;

        if (x < 0 || x > state.trackWidth) return;
        const time = xToTime(x);
        onSeek(time);
    };

    // Context menu
    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    // Build context value
    const contextValue: TimelineContextValue = {
        state: { ...state, trackWidth: timeline.state.trackWidth },
        clipStartTime,
        clipEndTime,
        clipDuration,
        currentTime: relativeCurrentTime,
        isPlaying,
        videoSrc,
        timeToX: timeline.timeToX,
        xToTime: timeline.xToTime,
        getSnapPoint: timeline.getSnapPoint,
        setZoom: timeline.setZoom,
        setScrollLeft: timeline.setScrollLeft,
        setContainerWidth: timeline.setContainerWidth,
        addMarker: timeline.addMarker,
        removeMarker: timeline.removeMarker,
        updateMarker: timeline.updateMarker,
        setLoopRegion: timeline.setLoopRegion,
        toggleTrackVisibility: timeline.toggleTrackVisibility,
        toggleTrackLock: timeline.toggleTrackLock,
        toggleTrackMute: timeline.toggleTrackMute,
        resizeTrack: timeline.resizeTrack,
        setSnapEnabled: timeline.setSnapEnabled,
        setHoveredTime: timeline.setHoveredTime,
        setPlaybackSpeed: timeline.setPlaybackSpeed,
        onSeek,
        onPlayPause,
        onSkipForward,
        onSkipBackward,
        scrollContainerRef: scrollRef,
    };

    // Track data
    const videoTrack = state.tracks.find((t) => t.type === "video");
    const audioTrack = state.tracks.find((t) => t.type === "audio");

    const totalTracksHeight =
        (videoTrack?.visible ? videoTrack.height : 0) +
        (audioTrack?.visible ? audioTrack.height : 0) +
        16; // padding

    if (!isVisible) {
        return (
            <div className={cn("bg-background border-t border-zinc-800", className)}>
                <div className="flex h-10 items-center px-6">
                    <button
                        className="text-xs text-zinc-400 hover:text-white flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                        onClick={() => setIsVisible(true)}
                    >
                        <svg width="16" height="16" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 5H18C20.2091 5 22 6.79086 22 9V15C22 17.2091 20.2091 19 18 19H6C3.79086 19 2 17.2091 2 15V9C2 6.79086 3.79086 5 6 5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M14.5 13.25L12 10.75L9.5 13.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Show timeline
                    </button>
                </div>
            </div>
        );
    }

    return (
        <TimelineContext.Provider value={contextValue}>
            <div ref={containerRef} className={cn("bg-background flex flex-col select-none", className)}>
                {/* Toolbar */}
                <Toolbar onHide={() => setIsVisible(false)} />

                {/* Minimap */}
                <Minimap />

                {/* Scrollable timeline area */}
                <div
                    ref={scrollRef}
                    className="overflow-x-auto overflow-y-hidden relative"
                    onClick={handleTimelineClick}
                    onContextMenu={handleContextMenu}
                >
                    <div style={{ width: state.trackWidth + TRACK_LABEL_WIDTH + 16, minWidth: state.containerWidth }}>
                        {/* Time ruler row */}
                        <div className="flex">
                            <div style={{ width: TRACK_LABEL_WIDTH, flexShrink: 0 }} />
                            <div className="relative" style={{ height: TIME_RULER_HEIGHT }}>
                                <TimeRuler />
                            </div>
                        </div>

                        {/* Tracks area */}
                        <div className="relative" style={{ paddingBottom: 8 }}>
                            {/* Playhead */}
                            <Playhead totalHeight={totalTracksHeight + TIME_RULER_HEIGHT} />

                            {/* Loop region */}
                            {state.loopRegion?.enabled && (
                                <LoopRegionOverlay totalHeight={totalTracksHeight} />
                            )}

                            {/* Markers */}
                            {state.markers.map((marker) => (
                                <Marker key={marker.id} marker={marker} totalHeight={totalTracksHeight} />
                            ))}

                            {/* Video track */}
                            {videoTrack?.visible && (
                                <div className="flex">
                                    <TrackLabel track={videoTrack} />
                                    <VideoTrack track={videoTrack} />
                                </div>
                            )}

                            {/* Track resizer between video and audio */}
                            {videoTrack?.visible && audioTrack?.visible && (
                                <TrackResizer trackId="video" />
                            )}

                            {/* Audio track */}
                            {audioTrack?.visible && (
                                <div className="flex">
                                    <TrackLabel track={audioTrack} />
                                    <AudioTrack track={audioTrack} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Playback controls */}
                <PlaybackControls />

                {/* Context menu */}
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                    />
                )}
            </div>
        </TimelineContext.Provider>
    );
}
