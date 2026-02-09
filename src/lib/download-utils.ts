/**
 * Download Utility Functions
 * Handles clip downloads with error handling and progress feedback
 * 
 * Validates: Requirements 8.1, 8.2, 8.4, 8.7, 9.1, 9.2, 9.3, 9.4, 9.6
 */

import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Download a single clip
 */
export async function downloadClip(
  token: string,
  clipId: string,
  clipTitle: string
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/share/${token}/download/${clipId}`);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    // For redirects, the browser will handle the download
    if (response.redirected || response.type === "opaqueredirect") {
      toast.success("Download started!");
      return;
    }

    // For direct downloads, create a blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeFilename(clipTitle)}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success("Download complete!");
  } catch (error) {
    console.error("Download failed:", error);
    toast.error("Download failed", {
      description: "Please try again or contact support if the issue persists.",
      action: {
        label: "Retry",
        onClick: () => downloadClip(token, clipId, clipTitle),
      },
    });
  }
}

/**
 * Download all clips as a ZIP archive
 */
export async function downloadAllClips(
  token: string,
  videoTitle: string
): Promise<void> {
  const toastId = toast.loading("Preparing download...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/share/${token}/download/batch`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Download failed");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeFilename(videoTitle)}-clips.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success("Download complete!", { id: toastId });
  } catch (error: any) {
    console.error("Batch download failed:", error);
    toast.error("Download failed", {
      id: toastId,
      description: error.message || "Please try downloading clips individually.",
      action: {
        label: "Retry",
        onClick: () => downloadAllClips(token, videoTitle),
      },
    });
  }
}

/**
 * Sanitize filename for safe downloads
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9-_]/g, "_");
}
