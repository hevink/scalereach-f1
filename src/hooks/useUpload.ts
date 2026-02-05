import { useState, useCallback, useRef, useEffect } from "react";
import { uploadApi, type InitUploadResponse } from "@/lib/api/upload";
import { useQueryClient } from "@tanstack/react-query";
import { videoKeys } from "./useVideo";

// Storage key for persisting upload state
const UPLOAD_STATE_KEY = "scalereach_pending_uploads";

export interface UploadProgress {
  uploadId: string;
  videoId: string;
  filename: string;
  totalSize: number;
  uploadedSize: number;
  percentage: number;
  speed: number; // bytes per second
  remainingTime: number; // seconds
  status: "pending" | "uploading" | "paused" | "completed" | "failed" | "processing";
  error?: string;
}

interface StoredUploadState {
  uploadId: string;
  videoId: string;
  storageKey: string;
  filename: string;
  fileSize: number;
  contentType: string;
  totalParts: number;
  chunkSize: number;
  uploadedParts: { partNumber: number; etag: string }[];
  createdAt: number;
}

interface UploadState extends StoredUploadState {
  file?: File;
  partUrls: { partNumber: number; url: string }[];
}

// Get stored uploads from localStorage
function getStoredUploads(): Record<string, StoredUploadState> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(UPLOAD_STATE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save upload state to localStorage
function saveUploadState(state: StoredUploadState) {
  if (typeof window === "undefined") return;
  try {
    const uploads = getStoredUploads();
    uploads[state.uploadId] = state;
    localStorage.setItem(UPLOAD_STATE_KEY, JSON.stringify(uploads));
  } catch (e) {
    console.error("Failed to save upload state:", e);
  }
}

// Remove upload state from localStorage
function removeUploadState(uploadId: string) {
  if (typeof window === "undefined") return;
  try {
    const uploads = getStoredUploads();
    delete uploads[uploadId];
    localStorage.setItem(UPLOAD_STATE_KEY, JSON.stringify(uploads));
  } catch (e) {
    console.error("Failed to remove upload state:", e);
  }
}

export function useUpload(workspaceId: string, projectId?: string) {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const uploadStates = useRef<Map<string, UploadState>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const speedTrackers = useRef<Map<string, { bytes: number; timestamp: number }[]>>(new Map());

  // Check for resumable uploads on mount
  useEffect(() => {
    const stored = getStoredUploads();
    const resumable: UploadProgress[] = [];

    for (const state of Object.values(stored)) {
      // Only show uploads from last 24 hours
      if (Date.now() - state.createdAt < 24 * 60 * 60 * 1000) {
        const uploadedSize = state.uploadedParts.length * state.chunkSize;
        resumable.push({
          uploadId: state.uploadId,
          videoId: state.videoId,
          filename: state.filename,
          totalSize: state.fileSize,
          uploadedSize: Math.min(uploadedSize, state.fileSize),
          percentage: Math.min((uploadedSize / state.fileSize) * 100, 99),
          speed: 0,
          remainingTime: 0,
          status: "paused",
        });
      } else {
        // Clean up old uploads
        removeUploadState(state.uploadId);
      }
    }

    if (resumable.length > 0) {
      setUploads(new Map(resumable.map((u) => [u.uploadId, u])));
    }
  }, []);

  // Calculate upload speed
  const updateSpeed = useCallback((uploadId: string, bytesUploaded: number) => {
    const now = Date.now();
    let tracker = speedTrackers.current.get(uploadId);
    
    if (!tracker) {
      tracker = [];
      speedTrackers.current.set(uploadId, tracker);
    }

    tracker.push({ bytes: bytesUploaded, timestamp: now });

    // Keep only last 5 seconds of data
    const cutoff = now - 5000;
    while (tracker.length > 0 && tracker[0].timestamp < cutoff) {
      tracker.shift();
    }

    if (tracker.length < 2) return 0;

    const oldest = tracker[0];
    const newest = tracker[tracker.length - 1];
    const timeDiff = (newest.timestamp - oldest.timestamp) / 1000;
    const bytesDiff = newest.bytes - oldest.bytes;

    return timeDiff > 0 ? bytesDiff / timeDiff : 0;
  }, []);

  // Upload a single chunk
  const uploadChunk = useCallback(
    async (
      file: File,
      partNumber: number,
      url: string,
      chunkSize: number,
      abortSignal: AbortSignal
    ): Promise<string> => {
      const start = (partNumber - 1) * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const response = await fetch(url, {
        method: "PUT",
        body: chunk,
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload part ${partNumber}: ${response.statusText}`);
      }

      const etag = response.headers.get("ETag");
      if (!etag) {
        throw new Error(`No ETag returned for part ${partNumber}`);
      }

      return etag.replace(/"/g, "");
    },
    []
  );

  // Start or resume upload
  const startUpload = useCallback(
    async (file: File) => {
      let state = uploadStates.current.get(file.name);
      let isResume = false;

      // Check if we have a stored state for this file
      const stored = getStoredUploads();
      const existingState = Object.values(stored).find(
        (s) => s.filename === file.name && s.fileSize === file.size
      );

      if (existingState) {
        // Resume existing upload
        isResume = true;
        
        // Get fresh presigned URLs
        const partUrls: { partNumber: number; url: string }[] = [];
        for (let i = existingState.uploadedParts.length + 1; i <= existingState.totalParts; i++) {
          const { url } = await uploadApi.getPartUrl(
            existingState.uploadId,
            existingState.storageKey,
            i
          );
          partUrls.push({ partNumber: i, url });
        }

        state = {
          ...existingState,
          file,
          partUrls,
        };
        uploadStates.current.set(existingState.uploadId, state);
      }

      if (!state) {
        // Initialize new upload
        const initResponse = await uploadApi.initUpload(
          file.name,
          file.size,
          file.type || "video/mp4",
          workspaceId,
          projectId
        );

        state = {
          uploadId: initResponse.uploadId,
          videoId: initResponse.videoId,
          storageKey: initResponse.storageKey,
          filename: file.name,
          fileSize: file.size,
          contentType: file.type || "video/mp4",
          totalParts: initResponse.totalParts,
          chunkSize: initResponse.chunkSize,
          uploadedParts: [],
          partUrls: initResponse.partUrls,
          file,
          createdAt: Date.now(),
        };

        uploadStates.current.set(state.uploadId, state);
        saveUploadState(state);
      }

      const uploadId = state.uploadId;
      const abortController = new AbortController();
      abortControllers.current.set(uploadId, abortController);

      // Initialize progress
      const initialUploaded = state.uploadedParts.length * state.chunkSize;
      setUploads((prev) => {
        const next = new Map(prev);
        next.set(uploadId, {
          uploadId,
          videoId: state!.videoId,
          filename: state!.filename,
          totalSize: state!.fileSize,
          uploadedSize: Math.min(initialUploaded, state!.fileSize),
          percentage: Math.min((initialUploaded / state!.fileSize) * 100, 99),
          speed: 0,
          remainingTime: 0,
          status: "uploading",
        });
        return next;
      });

      try {
        // Upload remaining parts
        const remainingParts = state.partUrls.filter(
          (p) => !state!.uploadedParts.some((up) => up.partNumber === p.partNumber)
        );

        for (const part of remainingParts) {
          if (abortController.signal.aborted) {
            throw new Error("Upload cancelled");
          }

          const etag = await uploadChunk(
            file,
            part.partNumber,
            part.url,
            state.chunkSize,
            abortController.signal
          );

          // Update state
          state.uploadedParts.push({ partNumber: part.partNumber, etag });
          saveUploadState(state);

          // Update progress
          const uploadedSize = Math.min(
            state.uploadedParts.length * state.chunkSize,
            state.fileSize
          );
          const speed = updateSpeed(uploadId, uploadedSize);
          const remaining = state.fileSize - uploadedSize;
          const remainingTime = speed > 0 ? remaining / speed : 0;

          setUploads((prev) => {
            const next = new Map(prev);
            next.set(uploadId, {
              uploadId,
              videoId: state!.videoId,
              filename: state!.filename,
              totalSize: state!.fileSize,
              uploadedSize,
              percentage: Math.min((uploadedSize / state!.fileSize) * 100, 99),
              speed,
              remainingTime,
              status: "uploading",
            });
            return next;
          });
        }

        // Complete upload
        await uploadApi.completeUpload(
          state.uploadId,
          state.videoId,
          state.storageKey,
          state.uploadedParts
        );

        // Clean up
        removeUploadState(uploadId);
        uploadStates.current.delete(uploadId);
        abortControllers.current.delete(uploadId);
        speedTrackers.current.delete(uploadId);

        // Update progress to completed then processing
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(uploadId, {
            uploadId,
            videoId: state!.videoId,
            filename: state!.filename,
            totalSize: state!.fileSize,
            uploadedSize: state!.fileSize,
            percentage: 100,
            speed: 0,
            remainingTime: 0,
            status: "processing",
          });
          return next;
        });

        // Invalidate video queries
        queryClient.invalidateQueries({ queryKey: videoKeys.all });

        return { uploadId, videoId: state.videoId };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        
        if (errorMessage !== "Upload cancelled") {
          setUploads((prev) => {
            const next = new Map(prev);
            const current = next.get(uploadId);
            if (current) {
              next.set(uploadId, {
                ...current,
                status: "failed",
                error: errorMessage,
              });
            }
            return next;
          });
        }

        throw error;
      }
    },
    [projectId, uploadChunk, updateSpeed, queryClient]
  );

  // Pause upload
  const pauseUpload = useCallback((uploadId: string) => {
    const controller = abortControllers.current.get(uploadId);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(uploadId);
    }

    setUploads((prev) => {
      const next = new Map(prev);
      const current = next.get(uploadId);
      if (current && current.status === "uploading") {
        next.set(uploadId, { ...current, status: "paused" });
      }
      return next;
    });
  }, []);

  // Resume upload (requires file to be re-selected)
  const resumeUpload = useCallback(
    async (uploadId: string, file: File) => {
      const stored = getStoredUploads()[uploadId];
      if (!stored) {
        throw new Error("Upload state not found");
      }

      if (file.name !== stored.filename || file.size !== stored.fileSize) {
        throw new Error("File does not match the original upload");
      }

      return startUpload(file);
    },
    [startUpload]
  );

  // Cancel upload
  const cancelUpload = useCallback(
    async (uploadId: string) => {
      // Abort ongoing upload
      const controller = abortControllers.current.get(uploadId);
      if (controller) {
        controller.abort();
        abortControllers.current.delete(uploadId);
      }

      // Get state
      const state = uploadStates.current.get(uploadId);
      const stored = getStoredUploads()[uploadId];
      const uploadState = state || stored;

      if (uploadState) {
        try {
          await uploadApi.abortUpload(
            uploadState.uploadId,
            uploadState.storageKey,
            uploadState.videoId
          );
        } catch (e) {
          console.error("Failed to abort upload on server:", e);
        }
      }

      // Clean up
      removeUploadState(uploadId);
      uploadStates.current.delete(uploadId);
      speedTrackers.current.delete(uploadId);

      setUploads((prev) => {
        const next = new Map(prev);
        next.delete(uploadId);
        return next;
      });

      // Invalidate video queries
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
    },
    [queryClient]
  );

  // Clear completed/failed uploads from UI
  const clearUpload = useCallback((uploadId: string) => {
    setUploads((prev) => {
      const next = new Map(prev);
      next.delete(uploadId);
      return next;
    });
  }, []);

  return {
    uploads: Array.from(uploads.values()),
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    clearUpload,
  };
}
