"use client";

/**
 * Lazy-loaded components for code splitting
 * 
 * This module provides dynamically imported versions of heavy components
 * to improve initial page load performance.
 * 
 * @validates Requirements 35.1, 35.2 - Code splitting by route and lazy loading
 */

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// Loading Fallbacks
// ============================================================================

/**
 * Loading fallback for video player
 */
function VideoPlayerSkeleton() {
    return (
        <div className="relative aspect-video w-full rounded-lg bg-muted animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-16 rounded-full bg-muted-foreground/20" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-black/50 to-transparent" />
        </div>
    );
}

/**
 * Loading fallback for timeline editor
 */
function TimelineEditorSkeleton() {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-16 w-full rounded-lg" />
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
            </div>
        </div>
    );
}

/**
 * Loading fallback for transcript editor
 */
function TranscriptEditorSkeleton() {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-2">
                        <Skeleton className="h-5 w-16 shrink-0" />
                        <Skeleton className="h-5 flex-1" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Loading fallback for caption preview
 */
function CaptionPreviewSkeleton() {
    return (
        <div className="relative aspect-video w-full rounded-lg bg-muted animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="h-8 w-48" />
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <Skeleton className="h-6 w-64" />
            </div>
        </div>
    );
}

/**
 * Loading fallback for brand kit manager
 */
function BrandKitManagerSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-40 rounded-lg" />
                    <Skeleton className="h-40 rounded-lg" />
                    <Skeleton className="h-32 rounded-lg" />
                    <Skeleton className="h-48 rounded-lg" />
                </div>
            </div>
            <Skeleton className="aspect-9/16 max-h-[400px] rounded-lg" />
        </div>
    );
}

/**
 * Loading fallback for clip boundary editor
 */
function ClipBoundaryEditorSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            <VideoPlayerSkeleton />
            <TimelineEditorSkeleton />
            <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
    );
}

// ============================================================================
// Lazy-loaded Components
// ============================================================================

/**
 * Lazy-loaded VideoPlayer component
 * Uses ssr: false because it relies on browser-only APIs (HTMLVideoElement)
 */
export const LazyVideoPlayer = dynamic(
    () => import("@/components/video/video-player").then((mod) => mod.VideoPlayer),
    {
        loading: () => <VideoPlayerSkeleton />,
        ssr: false,
    }
);

/**
 * Lazy-loaded TimelineEditor component
 * Uses ssr: false because it uses mouse/touch event handlers
 */
export const LazyTimelineEditor = dynamic(
    () => import("@/components/clips/timeline-editor").then((mod) => mod.TimelineEditor),
    {
        loading: () => <TimelineEditorSkeleton />,
        ssr: false,
    }
);

/**
 * Lazy-loaded TranscriptEditor component
 */
export const LazyTranscriptEditor = dynamic(
    () => import("@/components/transcript/transcript-editor").then((mod) => mod.TranscriptEditor),
    {
        loading: () => <TranscriptEditorSkeleton />,
        ssr: false,
    }
);

/**
 * Lazy-loaded CaptionPreview component
 * Uses ssr: false because it contains video player
 */
export const LazyCaptionPreview = dynamic(
    () => import("@/components/captions/caption-preview").then((mod) => mod.CaptionPreview),
    {
        loading: () => <CaptionPreviewSkeleton />,
        ssr: false,
    }
);

/**
 * Lazy-loaded BrandKitManager component
 */
export const LazyBrandKitManager = dynamic(
    () => import("@/components/brand-kit/brand-kit-manager").then((mod) => mod.BrandKitManager),
    {
        loading: () => <BrandKitManagerSkeleton />,
        ssr: false,
    }
);

/**
 * Lazy-loaded ClipBoundaryEditor component
 * Uses ssr: false because it contains video player and timeline
 */
export const LazyClipBoundaryEditor = dynamic(
    () => import("@/components/clips/clip-boundary-editor").then((mod) => mod.ClipBoundaryEditor),
    {
        loading: () => <ClipBoundaryEditorSkeleton />,
        ssr: false,
    }
);

// ============================================================================
// Re-export loading skeletons for use elsewhere
// ============================================================================

export {
    VideoPlayerSkeleton,
    TimelineEditorSkeleton,
    TranscriptEditorSkeleton,
    CaptionPreviewSkeleton,
    BrandKitManagerSkeleton,
    ClipBoundaryEditorSkeleton,
};
