import type { VideoLite } from "@/lib/api/video";

/**
 * Demo videos shown to users who haven't uploaded any videos yet.
 * These are real processed videos that showcase ScaleReach's clip generation.
 *
 * BACKEND REQUIREMENT: The API endpoints GET /api/videos/:id and
 * GET /api/clips/video/:id must allow access to these video IDs
 * for any authenticated user (not just the owner).
 */

interface DemoVideoEntry {
  /** Internal ScaleReach video ID */
  id: string;
  /** YouTube video ID — used for thumbnail via i.ytimg.com */
  youtubeId: string;
  title: string;
}

const DEMO_VIDEO_ENTRIES: DemoVideoEntry[] = [
  {
    id: "sJXeIYTuhCy6sG5MbQKKv",
    youtubeId: "RdAKXJlMIZM",
    title: "🎬 Demo — See how ScaleReach works",
  },
  // Add more demo videos here:
  // {
  //   id: "another-scalereach-id",
  //   youtubeId: "dQw4w9WgXcQ",
  //   title: "🎙️ Demo — Podcast Clips",
  // },
];

export const DEMO_VIDEOS: VideoLite[] = DEMO_VIDEO_ENTRIES.map((entry) => ({
  id: entry.id,
  title: entry.title,
  duration: null,
  thumbnailUrl: `https://i.ytimg.com/vi/${entry.youtubeId}/maxresdefault.jpg`,
  status: "completed",
  sourceType: "youtube",
  sourceUrl: `https://www.youtube.com/watch?v=${entry.youtubeId}`,
  createdAt: new Date().toISOString(),
  expiresAt: null,
}));

const DEMO_VIDEO_IDS = new Set(DEMO_VIDEO_ENTRIES.map((v) => v.id));

/**
 * Check if a video ID is a demo video
 */
export function isDemoVideo(videoId: string): boolean {
  return DEMO_VIDEO_IDS.has(videoId);
}
