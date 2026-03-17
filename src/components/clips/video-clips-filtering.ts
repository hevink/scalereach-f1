import type { ClipResponse } from "@/lib/api/clips";

export type VideoClipQuickFilter = "all" | "long" | "good" | "other";

export const LONG_CLIP_DURATION_SECONDS = 60;
export const GOOD_CLIP_SCORE_THRESHOLD = 70;

export function matchesVideoClipQuickFilter(
    clip: Pick<ClipResponse, "duration" | "viralityScore">,
    filter: VideoClipQuickFilter
): boolean {
    if (filter === "all") {
        return true;
    }

    if (filter === "long") {
        return clip.duration >= LONG_CLIP_DURATION_SECONDS;
    }

    if (filter === "good") {
        return clip.viralityScore >= GOOD_CLIP_SCORE_THRESHOLD;
    }

    return (
        clip.duration < LONG_CLIP_DURATION_SECONDS &&
        clip.viralityScore < GOOD_CLIP_SCORE_THRESHOLD
    );
}

export function filterVideoClips(
    clips: ClipResponse[],
    filter: VideoClipQuickFilter
): ClipResponse[] {
    return clips.filter((clip) => matchesVideoClipQuickFilter(clip, filter));
}

export function countVideoClipsByFilter(
    clips: ClipResponse[],
    filter: VideoClipQuickFilter
): number {
    return filterVideoClips(clips, filter).length;
}
