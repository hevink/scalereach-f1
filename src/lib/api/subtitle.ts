/**
 * Subtitle/Caption download API functions
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type SubtitleFormat = "srt" | "vtt" | "txt" | "json";

/**
 * Download video transcript in specified format
 * Downloads directly in current tab without opening new window
 */
export function downloadVideoTranscript(videoId: string, format: SubtitleFormat = "srt") {
  const url = `${API_URL}/api/videos/${videoId}/transcript/download?format=${format}`;
  
  // Create a temporary link element and trigger download
  const link = document.createElement("a");
  link.href = url;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download clip captions in specified format
 * Downloads directly in current tab without opening new window
 */
export function downloadClipCaptions(clipId: string, format: SubtitleFormat = "srt") {
  const url = `${API_URL}/api/clips/${clipId}/captions/download?format=${format}`;
  
  // Create a temporary link element and trigger download
  const link = document.createElement("a");
  link.href = url;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
