import { afterEach, describe, expect, it, vi } from "vitest";

import {
    clearActiveClipVideo,
    registerActiveClipVideo,
    resetActiveClipVideoForTests,
} from "./glass-video-player";

describe("GlassVideoPlayer", () => {
    afterEach(() => {
        resetActiveClipVideoForTests();
        vi.restoreAllMocks();
    });

    it("pauses the previously playing video when another one starts", () => {
        const firstPause = vi.fn();
        const secondPause = vi.fn();

        const firstVideo = { pause: firstPause } as unknown as HTMLVideoElement;
        const secondVideo = { pause: secondPause } as unknown as HTMLVideoElement;

        registerActiveClipVideo(firstVideo);
        registerActiveClipVideo(secondVideo);

        expect(firstPause).toHaveBeenCalledTimes(1);
        expect(secondPause).not.toHaveBeenCalled();
    });

    it("clears the active video only when the same video pauses or ends", () => {
        const firstVideo = { pause: vi.fn() } as unknown as HTMLVideoElement;
        const secondVideo = { pause: vi.fn() } as unknown as HTMLVideoElement;

        registerActiveClipVideo(firstVideo);
        clearActiveClipVideo(secondVideo);
        registerActiveClipVideo(secondVideo);

        expect(firstVideo.pause).toHaveBeenCalledTimes(1);
    });
});
