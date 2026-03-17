import { describe, expect, it } from "vitest";

import type { ClipResponse } from "@/lib/api/clips";
import {
    countVideoClipsByFilter,
    filterVideoClips,
    GOOD_CLIP_SCORE_THRESHOLD,
    LONG_CLIP_DURATION_SECONDS,
} from "./video-clips-filtering";

function createClip(overrides: Partial<ClipResponse>): ClipResponse {
    return {
        id: overrides.id ?? "clip-1",
        videoId: overrides.videoId ?? "video-1",
        title: overrides.title ?? "Clip",
        startTime: overrides.startTime ?? 0,
        endTime: overrides.endTime ?? 30,
        duration: overrides.duration ?? 30,
        transcript: overrides.transcript ?? "",
        viralityScore: overrides.viralityScore ?? 50,
        viralityReason: overrides.viralityReason ?? "",
        hooks: overrides.hooks ?? [],
        emotions: overrides.emotions ?? [],
        storageKey: overrides.storageKey ?? null,
        storageUrl: overrides.storageUrl ?? null,
        aspectRatio: overrides.aspectRatio ?? "9:16",
        favorited: overrides.favorited ?? false,
        status: overrides.status ?? "ready",
        errorMessage: overrides.errorMessage ?? null,
        createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
        updatedAt: overrides.updatedAt ?? "2026-01-01T00:00:00.000Z",
        ...overrides,
    };
}

describe("video clips quick filtering", () => {
    const shortOther = createClip({
        id: "other",
        duration: LONG_CLIP_DURATION_SECONDS - 1,
        viralityScore: GOOD_CLIP_SCORE_THRESHOLD - 1,
    });
    const longClip = createClip({
        id: "long",
        duration: LONG_CLIP_DURATION_SECONDS,
        viralityScore: 45,
    });
    const goodClip = createClip({
        id: "good",
        duration: 35,
        viralityScore: GOOD_CLIP_SCORE_THRESHOLD,
    });
    const longAndGoodClip = createClip({
        id: "long-good",
        duration: LONG_CLIP_DURATION_SECONDS + 15,
        viralityScore: GOOD_CLIP_SCORE_THRESHOLD + 20,
    });

    const clips = [shortOther, longClip, goodClip, longAndGoodClip];

    it("returns all clips for the all filter", () => {
        expect(filterVideoClips(clips, "all")).toEqual(clips);
    });

    it("returns clips that meet the long duration threshold", () => {
        expect(filterVideoClips(clips, "long").map((clip) => clip.id)).toEqual([
            "long",
            "long-good",
        ]);
    });

    it("returns clips that meet the good score threshold", () => {
        expect(filterVideoClips(clips, "good").map((clip) => clip.id)).toEqual([
            "good",
            "long-good",
        ]);
    });

    it("returns only clips that are neither long nor good for other", () => {
        expect(filterVideoClips(clips, "other").map((clip) => clip.id)).toEqual([
            "other",
        ]);
    });

    it("counts clips for each filter", () => {
        expect(countVideoClipsByFilter(clips, "all")).toBe(4);
        expect(countVideoClipsByFilter(clips, "long")).toBe(2);
        expect(countVideoClipsByFilter(clips, "good")).toBe(2);
        expect(countVideoClipsByFilter(clips, "other")).toBe(1);
    });
});
