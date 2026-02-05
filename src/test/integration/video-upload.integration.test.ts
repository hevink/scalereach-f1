/**
 * Integration Tests for Video Upload Flow
 *
 * Tests the complete video upload workflow including:
 * - YouTube URL validation and submission
 * - Direct file upload (multipart upload)
 * - Video status polling
 * - Error handling
 *
 * @validates Requirements 2.1, 2.2, 2.3 - Video Upload Flow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { api } from "@/lib/axios";
import { videoApi, type Video, type VideoInfo, type ValidateYouTubeResponse, type SubmitVideoResponse, type VideoStatusResponse } from "@/lib/api/video";
import { uploadApi, type InitUploadResponse, type CompleteUploadResponse } from "@/lib/api/upload";

// Mock axios
vi.mock("@/lib/axios", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// ============================================================================
// Test Data Factories
// ============================================================================

const createMockVideoInfo = (overrides?: Partial<VideoInfo>): VideoInfo => ({
  id: "dQw4w9WgXcQ",
  title: "Test Video Title",
  duration: 212,
  thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  channelName: "Test Channel",
  description: "Test video description",
  ...overrides,
});

const createMockVideo = (overrides?: Partial<Video>): Video => ({
  id: "video-123",
  projectId: null,
  userId: "user-456",
  sourceType: "youtube",
  sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  status: "pending",
  title: "Test Video",
  duration: 212,
  storageKey: null,
  storageUrl: null,
  transcript: null,
  errorMessage: null,
  metadata: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createMockInitUploadResponse = (overrides?: Partial<InitUploadResponse>): InitUploadResponse => ({
  uploadId: "upload-789",
  videoId: "video-123",
  storageKey: "uploads/user-456/video-123.mp4",
  totalParts: 3,
  chunkSize: 5 * 1024 * 1024, // 5MB
  partUrls: [
    { partNumber: 1, url: "https://s3.example.com/part1?signed=true" },
    { partNumber: 2, url: "https://s3.example.com/part2?signed=true" },
    { partNumber: 3, url: "https://s3.example.com/part3?signed=true" },
  ],
  ...overrides,
});

// ============================================================================
// YouTube URL Validation Tests
// ============================================================================

describe("Video Upload Flow - YouTube URL Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("validateYouTubeUrl", () => {
    it("should validate a correct YouTube URL and return video info", async () => {
      const mockResponse: ValidateYouTubeResponse = {
        valid: true,
        videoInfo: createMockVideoInfo(),
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      const result = await videoApi.validateYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

      expect(api.get).toHaveBeenCalledWith(
        "/api/videos/validate-youtube?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ"
      );
      expect(result.valid).toBe(true);
      expect(result.videoInfo).toBeDefined();
      expect(result.videoInfo?.title).toBe("Test Video Title");
    });

    it("should return invalid for malformed YouTube URLs", async () => {
      const mockResponse: ValidateYouTubeResponse = {
        valid: false,
        error: "Invalid YouTube URL format",
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      const result = await videoApi.validateYouTubeUrl("https://invalid-url.com");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid YouTube URL format");
    });

    it("should handle network errors gracefully", async () => {
      const networkError = new Error("Network Error");
      (networkError as Error & { code: string }).code = "NETWORK_ERROR";

      vi.mocked(api.get).mockRejectedValueOnce(networkError);

      await expect(videoApi.validateYouTubeUrl("https://www.youtube.com/watch?v=test")).rejects.toThrow("Network Error");
    });

    it("should properly encode special characters in URL", async () => {
      const mockResponse: ValidateYouTubeResponse = { valid: true };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      await videoApi.validateYouTubeUrl("https://www.youtube.com/watch?v=test&feature=share");

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dtest%26feature%3Dshare")
      );
    });
  });
});

// ============================================================================
// YouTube URL Submission Tests
// ============================================================================

describe("Video Upload Flow - YouTube URL Submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitYouTubeUrl", () => {
    it("should submit YouTube URL and return video object", async () => {
      const mockResponse: SubmitVideoResponse = {
        message: "Video submitted successfully",
        video: createMockVideo(),
        videoInfo: createMockVideoInfo(),
      };

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await videoApi.submitYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

      expect(api.post).toHaveBeenCalledWith("/api/videos/youtube", {
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        projectId: undefined,
        workspaceSlug: undefined,
        config: undefined,
      });
      expect(result.video).toBeDefined();
      expect(result.video.status).toBe("pending");
    });

    it("should submit with project ID when provided", async () => {
      const mockResponse: SubmitVideoResponse = {
        message: "Video submitted successfully",
        video: createMockVideo({ projectId: "project-123" }),
      };

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      await videoApi.submitYouTubeUrl(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "project-123"
      );

      expect(api.post).toHaveBeenCalledWith("/api/videos/youtube", {
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        projectId: "project-123",
        workspaceSlug: undefined,
        config: undefined,
      });
    });

    it("should submit with workspace slug when provided", async () => {
      const mockResponse: SubmitVideoResponse = {
        message: "Video submitted successfully",
        video: createMockVideo(),
      };

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      await videoApi.submitYouTubeUrl(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        undefined,
        "my-workspace"
      );

      expect(api.post).toHaveBeenCalledWith("/api/videos/youtube", {
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        projectId: undefined,
        workspaceSlug: "my-workspace",
        config: undefined,
      });
    });

    it("should submit with video processing config", async () => {
      const mockResponse: SubmitVideoResponse = {
        message: "Video submitted successfully",
        video: createMockVideo(),
      };

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const config = {
        skipClipping: false,
        clipModel: "ClipPro" as const,
        genre: "Podcast" as const,
        clipDurationMin: 30,
        clipDurationMax: 90,
        aspectRatio: "9:16" as const,
      };

      await videoApi.submitYouTubeUrl(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "project-123",
        "my-workspace",
        config
      );

      expect(api.post).toHaveBeenCalledWith("/api/videos/youtube", {
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        projectId: "project-123",
        workspaceSlug: "my-workspace",
        config,
      });
    });

    it("should handle duplicate video submission error", async () => {
      const error = new Error("Video already exists");
      (error as Error & { status: number; code: string }).status = 409;
      (error as Error & { status: number; code: string }).code = "DUPLICATE";

      vi.mocked(api.post).mockRejectedValueOnce(error);

      await expect(
        videoApi.submitYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
      ).rejects.toThrow("Video already exists");
    });
  });
});

// ============================================================================
// Direct File Upload Tests (Multipart)
// ============================================================================

describe("Video Upload Flow - Direct File Upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initUpload", () => {
    it("should initialize multipart upload and return upload details", async () => {
      const mockResponse = createMockInitUploadResponse();
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await uploadApi.initUpload(
        "test-video.mp4",
        15 * 1024 * 1024, // 15MB
        "video/mp4"
      );

      expect(api.post).toHaveBeenCalledWith("/api/upload/init", {
        filename: "test-video.mp4",
        fileSize: 15 * 1024 * 1024,
        contentType: "video/mp4",
        projectId: undefined,
      });
      expect(result.uploadId).toBe("upload-789");
      expect(result.partUrls).toHaveLength(3);
    });

    it("should initialize upload with project ID", async () => {
      const mockResponse = createMockInitUploadResponse();
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      await uploadApi.initUpload(
        "test-video.mp4",
        15 * 1024 * 1024,
        "video/mp4",
        "project-123"
      );

      expect(api.post).toHaveBeenCalledWith("/api/upload/init", {
        filename: "test-video.mp4",
        fileSize: 15 * 1024 * 1024,
        contentType: "video/mp4",
        projectId: "project-123",
      });
    });

    it("should handle file size limit exceeded error", async () => {
      const error = new Error("File size exceeds maximum allowed (2GB)");
      (error as Error & { status: number }).status = 413;

      vi.mocked(api.post).mockRejectedValueOnce(error);

      await expect(
        uploadApi.initUpload("large-video.mp4", 3 * 1024 * 1024 * 1024, "video/mp4")
      ).rejects.toThrow("File size exceeds maximum allowed");
    });
  });

  describe("getPartUrl", () => {
    it("should get presigned URL for a specific part", async () => {
      const mockResponse = { partNumber: 2, url: "https://s3.example.com/part2?signed=true" };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await uploadApi.getPartUrl("upload-789", "uploads/video.mp4", 2);

      expect(api.post).toHaveBeenCalledWith("/api/upload/part-url", {
        uploadId: "upload-789",
        storageKey: "uploads/video.mp4",
        partNumber: 2,
      });
      expect(result.url).toContain("s3.example.com");
    });
  });

  describe("listParts", () => {
    it("should list uploaded parts for resume functionality", async () => {
      const mockResponse = {
        uploadId: "upload-789",
        parts: [
          { partNumber: 1, etag: "etag-1" },
          { partNumber: 2, etag: "etag-2" },
        ],
        uploadedParts: 2,
      };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      const result = await uploadApi.listParts("upload-789", "uploads/video.mp4");

      expect(api.get).toHaveBeenCalledWith(
        "/api/upload/upload-789/parts?storageKey=uploads%2Fvideo.mp4"
      );
      expect(result.uploadedParts).toBe(2);
      expect(result.parts).toHaveLength(2);
    });
  });

  describe("completeUpload", () => {
    it("should complete multipart upload successfully", async () => {
      const mockResponse: CompleteUploadResponse = {
        message: "Upload completed successfully",
        videoId: "video-123",
        storageUrl: "https://cdn.example.com/videos/video-123.mp4",
      };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const parts = [
        { partNumber: 1, etag: "etag-1" },
        { partNumber: 2, etag: "etag-2" },
        { partNumber: 3, etag: "etag-3" },
      ];

      const result = await uploadApi.completeUpload(
        "upload-789",
        "video-123",
        "uploads/video.mp4",
        parts
      );

      expect(api.post).toHaveBeenCalledWith("/api/upload/complete", {
        uploadId: "upload-789",
        videoId: "video-123",
        storageKey: "uploads/video.mp4",
        parts,
      });
      expect(result.storageUrl).toContain("cdn.example.com");
    });

    it("should handle incomplete parts error", async () => {
      const error = new Error("Missing parts: 2, 3");
      (error as Error & { status: number }).status = 400;

      vi.mocked(api.post).mockRejectedValueOnce(error);

      await expect(
        uploadApi.completeUpload("upload-789", "video-123", "uploads/video.mp4", [
          { partNumber: 1, etag: "etag-1" },
        ])
      ).rejects.toThrow("Missing parts");
    });
  });

  describe("abortUpload", () => {
    it("should abort multipart upload and cleanup", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await uploadApi.abortUpload("upload-789", "uploads/video.mp4", "video-123");

      expect(api.post).toHaveBeenCalledWith("/api/upload/abort", {
        uploadId: "upload-789",
        storageKey: "uploads/video.mp4",
        videoId: "video-123",
      });
    });
  });
});

// ============================================================================
// Video Status Polling Tests
// ============================================================================

describe("Video Upload Flow - Status Polling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVideoStatus", () => {
    it("should return video status with job progress", async () => {
      const mockResponse: VideoStatusResponse = {
        video: createMockVideo({ status: "transcribing" }),
        job: {
          id: "job-123",
          progress: 45,
          state: "active",
        },
      };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      const result = await videoApi.getVideoStatus("video-123");

      expect(api.get).toHaveBeenCalledWith("/api/videos/video-123/status");
      expect(result.video.status).toBe("transcribing");
      expect(result.job?.progress).toBe(45);
    });

    it("should return completed status without job", async () => {
      const mockResponse: VideoStatusResponse = {
        video: createMockVideo({ status: "completed" }),
        job: null,
      };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      const result = await videoApi.getVideoStatus("video-123");

      expect(result.video.status).toBe("completed");
      expect(result.job).toBeNull();
    });

    it("should return failed status with error message", async () => {
      const mockResponse: VideoStatusResponse = {
        video: createMockVideo({
          status: "failed",
          errorMessage: "Transcription failed: Audio quality too low",
        }),
        job: null,
      };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

      const result = await videoApi.getVideoStatus("video-123");

      expect(result.video.status).toBe("failed");
      expect(result.video.errorMessage).toContain("Transcription failed");
    });
  });

  describe("getVideoById", () => {
    it("should fetch video details by ID", async () => {
      const mockVideo = createMockVideo({ status: "completed" });
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockVideo });

      const result = await videoApi.getVideoById("video-123");

      expect(api.get).toHaveBeenCalledWith("/api/videos/video-123");
      expect(result.id).toBe("video-123");
    });

    it("should handle video not found error", async () => {
      const error = new Error("Video not found");
      (error as Error & { status: number; code: string }).status = 404;
      (error as Error & { code: string }).code = "NOT_FOUND";

      vi.mocked(api.get).mockRejectedValueOnce(error);

      await expect(videoApi.getVideoById("nonexistent")).rejects.toThrow("Video not found");
    });
  });

  describe("deleteVideo", () => {
    it("should delete video successfully", async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

      await videoApi.deleteVideo("video-123");

      expect(api.delete).toHaveBeenCalledWith("/api/videos/video-123");
    });
  });
});

// ============================================================================
// Property-Based Tests
// ============================================================================

describe("Video Upload Flow - Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("YouTube URL validation properties", () => {
    it("should always encode URLs properly regardless of special characters", () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          async (url) => {
            vi.mocked(api.get).mockResolvedValueOnce({ data: { valid: false } });

            await videoApi.validateYouTubeUrl(url);

            const calledUrl = vi.mocked(api.get).mock.calls[0][0];
            expect(calledUrl).toContain(encodeURIComponent(url));
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe("Upload initialization properties", () => {
    it("should always send positive file sizes", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 2 * 1024 * 1024 * 1024 }), // Up to 2GB
          fc.constantFrom("video/mp4", "video/webm", "video/quicktime"),
          async (filename, fileSize, contentType) => {
            vi.mocked(api.post).mockResolvedValueOnce({ data: createMockInitUploadResponse() });

            await uploadApi.initUpload(filename, fileSize, contentType);

            const calledData = vi.mocked(api.post).mock.calls[0][1] as { fileSize: number };
            expect(calledData.fileSize).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

// ============================================================================
// End-to-End Flow Tests
// ============================================================================

describe("Video Upload Flow - E2E Scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should complete full YouTube upload flow: validate -> submit -> poll status", async () => {
    // Step 1: Validate YouTube URL
    const validateResponse: ValidateYouTubeResponse = {
      valid: true,
      videoInfo: createMockVideoInfo(),
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: validateResponse });

    const validation = await videoApi.validateYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(validation.valid).toBe(true);

    // Step 2: Submit YouTube URL
    const submitResponse: SubmitVideoResponse = {
      message: "Video submitted",
      video: createMockVideo({ status: "pending" }),
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: submitResponse });

    const submission = await videoApi.submitYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(submission.video.status).toBe("pending");

    // Step 3: Poll for status (simulating progress)
    const statusResponses: VideoStatusResponse[] = [
      { video: createMockVideo({ status: "downloading" }), job: { id: "job-1", progress: 25, state: "active" } },
      { video: createMockVideo({ status: "transcribing" }), job: { id: "job-1", progress: 50, state: "active" } },
      { video: createMockVideo({ status: "analyzing" }), job: { id: "job-1", progress: 75, state: "active" } },
      { video: createMockVideo({ status: "completed" }), job: null },
    ];

    for (const statusResponse of statusResponses) {
      vi.mocked(api.get).mockResolvedValueOnce({ data: statusResponse });
      const status = await videoApi.getVideoStatus(submission.video.id);

      if (status.video.status === "completed") {
        expect(status.job).toBeNull();
        break;
      }
    }
  });

  it("should complete full direct upload flow: init -> upload parts -> complete", async () => {
    // Step 1: Initialize upload
    const initResponse = createMockInitUploadResponse();
    vi.mocked(api.post).mockResolvedValueOnce({ data: initResponse });

    const init = await uploadApi.initUpload("video.mp4", 15 * 1024 * 1024, "video/mp4");
    expect(init.uploadId).toBeDefined();
    expect(init.partUrls.length).toBeGreaterThan(0);

    // Step 2: Simulate uploading parts (in real scenario, this would upload to S3)
    const uploadedParts = init.partUrls.map((part) => ({
      partNumber: part.partNumber,
      etag: `etag-${part.partNumber}`,
    }));

    // Step 3: Complete upload
    const completeResponse: CompleteUploadResponse = {
      message: "Upload completed",
      videoId: init.videoId,
      storageUrl: "https://cdn.example.com/video.mp4",
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: completeResponse });

    const complete = await uploadApi.completeUpload(
      init.uploadId,
      init.videoId,
      init.storageKey,
      uploadedParts
    );

    expect(complete.videoId).toBe(init.videoId);
    expect(complete.storageUrl).toBeDefined();
  });

  it("should handle upload abort and cleanup", async () => {
    // Initialize upload
    const initResponse = createMockInitUploadResponse();
    vi.mocked(api.post).mockResolvedValueOnce({ data: initResponse });

    const init = await uploadApi.initUpload("video.mp4", 15 * 1024 * 1024, "video/mp4");

    // Simulate user cancellation - abort upload
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

    await uploadApi.abortUpload(init.uploadId, init.storageKey, init.videoId);

    expect(api.post).toHaveBeenLastCalledWith("/api/upload/abort", {
      uploadId: init.uploadId,
      storageKey: init.storageKey,
      videoId: init.videoId,
    });
  });
});
