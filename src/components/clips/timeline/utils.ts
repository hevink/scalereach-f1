import type { SnapTarget } from "./types";
import { SNAP_THRESHOLD_PX } from "./types";

// ============================================================================
// Time Formatting
// ============================================================================

export function formatTime(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds)) return "00:00.00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

export function parseTime(input: string): number | null {
    // Accepts MM:SS.ms or SS.ms or just SS
    const trimmed = input.trim();

    // MM:SS.ms
    const full = trimmed.match(/^(\d+):(\d{1,2})\.(\d{1,2})$/);
    if (full) {
        return parseInt(full[1]) * 60 + parseInt(full[2]) + parseInt(full[3].padEnd(2, "0")) / 100;
    }

    // MM:SS
    const minSec = trimmed.match(/^(\d+):(\d{1,2})$/);
    if (minSec) {
        return parseInt(minSec[1]) * 60 + parseInt(minSec[2]);
    }

    // SS.ms
    const secMs = trimmed.match(/^(\d+)\.(\d{1,2})$/);
    if (secMs) {
        return parseInt(secMs[1]) + parseInt(secMs[2].padEnd(2, "0")) / 100;
    }

    // Just seconds
    const justSec = trimmed.match(/^(\d+)$/);
    if (justSec) {
        return parseInt(justSec[1]);
    }

    return null;
}

// ============================================================================
// Coordinate Math
// ============================================================================

export function timeToX(time: number, duration: number, trackWidth: number): number {
    if (duration <= 0) return 0;
    return (time / duration) * trackWidth;
}

export function xToTime(x: number, duration: number, trackWidth: number): number {
    if (trackWidth <= 0) return 0;
    return Math.max(0, Math.min(duration, (x / trackWidth) * duration));
}

// ============================================================================
// Snap Logic
// ============================================================================

export function getSnapPoint(
    time: number,
    snapTargets: SnapTarget[],
    duration: number,
    trackWidth: number,
    thresholdPx: number = SNAP_THRESHOLD_PX,
): number | null {
    if (snapTargets.length === 0 || trackWidth <= 0) return null;

    const pixelsPerSecond = trackWidth / duration;
    const thresholdTime = thresholdPx / pixelsPerSecond;

    let closest: { time: number; distance: number } | null = null;

    for (const target of snapTargets) {
        const distance = Math.abs(target.time - time);
        if (distance <= thresholdTime && (!closest || distance < closest.distance)) {
            closest = { time: target.time, distance };
        }
    }

    return closest?.time ?? null;
}

export function buildSnapTargets(
    markers: { time: number }[],
    playheadTime: number,
): SnapTarget[] {
    const targets: SnapTarget[] = [];

    // Markers
    for (const marker of markers) {
        targets.push({ time: marker.time, label: "Marker" });
    }

    // Playhead
    targets.push({ time: playheadTime, label: "Playhead" });

    return targets;
}

// ============================================================================
// Time Ruler Intervals
// ============================================================================

export function getTimeInterval(pixelsPerSecond: number): { major: number; minor: number } {
    if (pixelsPerSecond >= 200) return { major: 1, minor: 0.1 };
    if (pixelsPerSecond >= 100) return { major: 1, minor: 0.25 };
    if (pixelsPerSecond >= 60) return { major: 2, minor: 0.5 };
    if (pixelsPerSecond >= 30) return { major: 5, minor: 1 };
    if (pixelsPerSecond >= 15) return { major: 10, minor: 2 };
    return { major: 15, minor: 5 };
}

// ============================================================================
// Clamp
// ============================================================================

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// ============================================================================
// Generate ID
// ============================================================================

let idCounter = 0;
export function generateId(prefix: string = "tl"): string {
    return `${prefix}_${Date.now()}_${++idCounter}`;
}
