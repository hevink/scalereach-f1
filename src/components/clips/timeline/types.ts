// ============================================================================
// Track Types
// ============================================================================

export type TrackType = "video" | "audio";

export interface Track {
    id: string;
    type: TrackType;
    height: number;
    visible: boolean;
    locked: boolean;
    muted: boolean;
}

// ============================================================================
// Marker & Loop
// ============================================================================

export interface TimelineMarker {
    id: string;
    time: number;
    label?: string;
    color: string;
}

export interface LoopRegion {
    inPoint: number;
    outPoint: number;
    enabled: boolean;
}

// ============================================================================
// Snap
// ============================================================================

export interface SnapTarget {
    time: number;
    label: string;
}

// ============================================================================
// Timeline State
// ============================================================================

export interface TimelineState {
    zoomLevel: number;
    scrollLeft: number;
    containerWidth: number;
    trackWidth: number;
    tracks: Track[];
    markers: TimelineMarker[];
    loopRegion: LoopRegion | null;
    snapEnabled: boolean;
    hoveredTime: number | null;
    playbackSpeed: number;
}

// ============================================================================
// Timeline Context
// ============================================================================

export interface TimelineContextValue {
    // State
    state: TimelineState;
    // Clip data
    clipStartTime: number;
    clipEndTime: number;
    clipDuration: number;
    currentTime: number;
    isPlaying: boolean;
    videoSrc?: string;
    // Coordinate math
    timeToX: (time: number) => number;
    xToTime: (x: number) => number;
    getSnapPoint: (time: number, threshold?: number) => number | null;
    // Actions
    setZoom: (level: number) => void;
    setScrollLeft: (left: number) => void;
    setContainerWidth: (width: number) => void;
    addMarker: (time: number, label?: string, color?: string) => void;
    removeMarker: (id: string) => void;
    updateMarker: (id: string, updates: Partial<Omit<TimelineMarker, "id">>) => void;
    setLoopRegion: (region: LoopRegion | null) => void;
    toggleTrackVisibility: (trackId: string) => void;
    toggleTrackLock: (trackId: string) => void;
    toggleTrackMute: (trackId: string) => void;
    resizeTrack: (trackId: string, height: number) => void;
    setSnapEnabled: (enabled: boolean) => void;
    setHoveredTime: (time: number | null) => void;
    setPlaybackSpeed: (speed: number) => void;
    // Callbacks (from parent)
    onSeek: (time: number) => void;
    onPlayPause?: () => void;
    onSkipForward?: () => void;
    onSkipBackward?: () => void;
    // Refs
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

// ============================================================================
// Props
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
    className?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const VIDEO_TRACK_HEIGHT = 48;
export const AUDIO_TRACK_HEIGHT = 48;
export const TIME_RULER_HEIGHT = 24;
export const TRACK_LABEL_WIDTH = 80;
export const MINIMAP_HEIGHT = 24;
export const TOOLBAR_HEIGHT = 40;
export const MIN_TRACK_HEIGHT = 20;
export const MAX_TRACK_HEIGHT = 120;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 6;
export const SNAP_THRESHOLD_PX = 8;

export const DEFAULT_TRACKS: Track[] = [
    { id: "video", type: "video", height: VIDEO_TRACK_HEIGHT, visible: true, locked: false, muted: false },
    { id: "audio", type: "audio", height: AUDIO_TRACK_HEIGHT, visible: true, locked: false, muted: false },
];

export const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export const MARKER_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899",
] as const;
