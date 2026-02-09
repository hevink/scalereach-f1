"use client";

import * as React from "react";
import type { TimelineState, TimelineMarker, LoopRegion, Track } from "./types";
import { DEFAULT_TRACKS, MIN_ZOOM, MAX_ZOOM, MIN_TRACK_HEIGHT, MAX_TRACK_HEIGHT, MARKER_COLORS, TRACK_LABEL_WIDTH } from "./types";
import { timeToX as _timeToX, xToTime as _xToTime, getSnapPoint as _getSnapPoint, buildSnapTargets, generateId, clamp } from "./utils";

interface UseTimelineOptions {
    clipDuration: number;
    currentTime: number;
}

export function useTimeline({ clipDuration, currentTime }: UseTimelineOptions) {
    const [state, setState] = React.useState<TimelineState>({
        zoomLevel: 1,
        scrollLeft: 0,
        containerWidth: 1200,
        trackWidth: 1000,
        tracks: DEFAULT_TRACKS.map((t) => ({ ...t })),
        markers: [],
        loopRegion: null,
        snapEnabled: true,
        hoveredTime: null,
        playbackSpeed: 1,
    });

    // Compute track width from container width and zoom
    const baseWidth = state.containerWidth - TRACK_LABEL_WIDTH - 16;
    const trackWidth = Math.max(baseWidth, baseWidth * state.zoomLevel);

    // Snap targets (memoized)
    const snapTargets = React.useMemo(
        () => buildSnapTargets(state.markers, currentTime),
        [state.markers, currentTime],
    );

    // Coordinate helpers
    const timeToX = React.useCallback(
        (time: number) => _timeToX(time, clipDuration, trackWidth),
        [clipDuration, trackWidth],
    );

    const xToTime = React.useCallback(
        (x: number) => _xToTime(x, clipDuration, trackWidth),
        [clipDuration, trackWidth],
    );

    const getSnapPoint = React.useCallback(
        (time: number, thresholdPx?: number) => {
            if (!state.snapEnabled) return null;
            return _getSnapPoint(time, snapTargets, clipDuration, trackWidth, thresholdPx);
        },
        [state.snapEnabled, snapTargets, clipDuration, trackWidth],
    );

    // Actions
    const setZoom = React.useCallback((level: number) => {
        setState((s) => ({ ...s, zoomLevel: clamp(level, MIN_ZOOM, MAX_ZOOM) }));
    }, []);

    const setScrollLeft = React.useCallback((left: number) => {
        setState((s) => ({ ...s, scrollLeft: Math.max(0, left) }));
    }, []);

    const setContainerWidth = React.useCallback((width: number) => {
        setState((s) => ({ ...s, containerWidth: width }));
    }, []);

    const addMarker = React.useCallback((time: number, label?: string, color?: string) => {
        const marker: TimelineMarker = {
            id: generateId("marker"),
            time: clamp(time, 0, clipDuration),
            label,
            color: color || MARKER_COLORS[Math.floor(Math.random() * MARKER_COLORS.length)],
        };
        setState((s) => ({ ...s, markers: [...s.markers, marker] }));
    }, [clipDuration]);

    const removeMarker = React.useCallback((id: string) => {
        setState((s) => ({ ...s, markers: s.markers.filter((m) => m.id !== id) }));
    }, []);

    const updateMarker = React.useCallback((id: string, updates: Partial<Omit<TimelineMarker, "id">>) => {
        setState((s) => ({
            ...s,
            markers: s.markers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
    }, []);

    const setLoopRegion = React.useCallback((region: LoopRegion | null) => {
        setState((s) => ({ ...s, loopRegion: region }));
    }, []);

    const toggleTrackVisibility = React.useCallback((trackId: string) => {
        setState((s) => ({
            ...s,
            tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, visible: !t.visible } : t)),
        }));
    }, []);

    const toggleTrackLock = React.useCallback((trackId: string) => {
        setState((s) => ({
            ...s,
            tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t)),
        }));
    }, []);

    const toggleTrackMute = React.useCallback((trackId: string) => {
        setState((s) => ({
            ...s,
            tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
        }));
    }, []);

    const resizeTrack = React.useCallback((trackId: string, height: number) => {
        setState((s) => ({
            ...s,
            tracks: s.tracks.map((t) =>
                t.id === trackId ? { ...t, height: clamp(height, MIN_TRACK_HEIGHT, MAX_TRACK_HEIGHT) } : t,
            ),
        }));
    }, []);

    const setSnapEnabled = React.useCallback((enabled: boolean) => {
        setState((s) => ({ ...s, snapEnabled: enabled }));
    }, []);

    const setHoveredTime = React.useCallback((time: number | null) => {
        setState((s) => ({ ...s, hoveredTime: time }));
    }, []);

    const setPlaybackSpeed = React.useCallback((speed: number) => {
        setState((s) => ({ ...s, playbackSpeed: speed }));
    }, []);

    const getTrack = React.useCallback(
        (type: Track["type"]) => state.tracks.find((t) => t.type === type),
        [state.tracks],
    );

    return {
        state: { ...state, trackWidth },
        timeToX,
        xToTime,
        getSnapPoint,
        setZoom,
        setScrollLeft,
        setContainerWidth,
        addMarker,
        removeMarker,
        updateMarker,
        setLoopRegion,
        toggleTrackVisibility,
        toggleTrackLock,
        toggleTrackMute,
        resizeTrack,
        setSnapEnabled,
        setHoveredTime,
        setPlaybackSpeed,
        getTrack,
    };
}
