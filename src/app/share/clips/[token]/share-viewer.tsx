"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    IconDownload,
    IconVideo,
    IconFlame,
    IconFileText,
    IconWand,
    IconAlertCircle,
    IconClock,
    IconRuler2,
    IconSparkles,
    IconExternalLink,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
import { downloadClip, downloadAllClips } from "@/lib/download-utils";
import { analytics } from "@/lib/analytics";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    YouTubeIcon,
    TikTokIcon,
    InstagramIcon,
    LinkedInIcon,
    TwitterIcon,
    FacebookIcon,
} from "@/components/icons/platform-icons";

interface ShareViewerProps {
    token: string;
}

interface PublicClipData {
    id: string;
    title: string;
    duration: number;
    viralityScore: number;
    viralityReason: string;
    hooks: string[];
    recommendedPlatforms?: string[];
    transcript?: string;
    thumbnailUrl: string;
    storageUrl: string;
    aspectRatio: string;
}

interface PublicShareData {
    success: boolean;
    videoTitle: string;
    clipCount: number;
    thumbnailUrl: string;
    clips: PublicClipData[];
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getScoreBadge(score: number) {
    if (score >= 80) return { label: "High Viral", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
    if (score >= 60) return { label: "Medium", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
    return { label: "Low", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" };
}

// ── Branded Header ──────────────────────────────────────────────────────────
function BrandedHeader({ videoTitle, clipCount, onDownloadAll }: {
    videoTitle?: string;
    clipCount?: number;
    onDownloadAll?: () => void;
}) {
    return (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                {/* Top bar with logo */}
                <div className="flex items-center justify-between h-14">
                    <Link href="https://scalereach.ai" target="_blank" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Image src="/logo.svg" alt="ScaleReach" width={28} height={28} />
                        <span className="font-semibold text-base">scalereach</span>
                    </Link>
                    <Link
                        href="https://scalereach.ai"
                        target="_blank"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        Create your own clips
                        <IconExternalLink className="size-3" />
                    </Link>
                </div>

                {/* Video info bar */}
                {videoTitle && (
                    <div className="pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                        <div>
                            <h1 className="text-lg sm:text-xl font-semibold leading-tight">
                                {videoTitle}
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant="outline" className="gap-1 text-xs font-normal">
                                    <IconFlame className="size-3" />
                                    {clipCount} {clipCount === 1 ? "clip" : "clips"}
                                </Badge>
                                <Badge variant="outline" className="gap-1 text-xs font-normal">
                                    <IconSparkles className="size-3" />
                                    AI-detected viral moments
                                </Badge>
                            </div>
                        </div>
                        {onDownloadAll && clipCount && clipCount > 0 && (
                            <Button size="sm" className="gap-2 shrink-0" onClick={onDownloadAll}>
                                <IconDownload className="size-4" />
                                Download All ({clipCount})
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}

// ── Branded Footer ──────────────────────────────────────────────────────────
function BrandedFooter() {
    return (
        <footer className="border-t bg-muted/30 mt-auto">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Image src="/logo.svg" alt="ScaleReach" width={20} height={20} className="opacity-60" />
                        <span className="text-sm text-muted-foreground">
                            Powered by <span className="font-medium text-foreground">scalereach</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="https://scalereach.ai"
                            target="_blank"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Try ScaleReach free →
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ── Loading Skeleton ────────────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <BrandedHeader />
            <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
                <div className="mb-6">
                    <Skeleton className="h-7 w-80 mb-2" />
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-40 rounded-full" />
                    </div>
                </div>
                <div className="space-y-5">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card overflow-hidden">
                            <div className="px-5 py-3 border-b bg-muted/30">
                                <Skeleton className="h-5 w-64" />
                            </div>
                            <div className="p-4">
                                <div className="flex flex-col lg:flex-row gap-4">
                                    <Skeleton className="w-full lg:w-[220px] h-[380px] rounded-lg shrink-0" />
                                    <div className="flex-1 space-y-3">
                                        <Skeleton className="h-9 w-56 rounded-md" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <BrandedFooter />
        </div>
    );
}

// ── Error States ────────────────────────────────────────────────────────────
function ShareNotFound() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <BrandedHeader />
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="flex size-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                        <IconVideo className="size-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-lg font-semibold">Share Link Not Found</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        This share link doesn&apos;t exist or has been removed.
                    </p>
                    <Button className="mt-6">
                        <Link href="https://scalereach.ai">Try ScaleReach</Link>
                    </Button>
                </div>
            </div>
            <BrandedFooter />
        </div>
    );
}

function ShareError() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <BrandedHeader />
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
                        <IconAlertCircle className="size-8 text-destructive" />
                    </div>
                    <h2 className="text-lg font-semibold">Something went wrong</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Failed to load shared clips. Please try again later.
                    </p>
                </div>
            </div>
            <BrandedFooter />
        </div>
    );
}

// ── Clip Card ───────────────────────────────────────────────────────────────
const SHARE_PLATFORM_CONFIG: Record<string, { icon: React.ElementType; label: string; tooltip: string }> = {
    youtube_shorts: { icon: YouTubeIcon, label: "YT Shorts", tooltip: "YouTube Shorts" },
    instagram_reels: { icon: InstagramIcon, label: "Reels", tooltip: "Instagram Reels" },
    tiktok: { icon: TikTokIcon, label: "TikTok", tooltip: "TikTok" },
    linkedin: { icon: LinkedInIcon, label: "LinkedIn", tooltip: "LinkedIn" },
    twitter: { icon: TwitterIcon, label: "Twitter/X", tooltip: "Twitter / X" },
    facebook_reels: { icon: FacebookIcon, label: "FB Reels", tooltip: "Facebook Reels" },
};

interface ClipCardProps {
    clip: PublicClipData;
    index: number;
    onDownload: (clip: PublicClipData) => void;
}

function ClipCard({ clip, index, onDownload }: ClipCardProps) {
    const [activeTab, setActiveTab] = useState<"transcript" | "description">("transcript");
    const scoreBadge = getScoreBadge(clip.viralityScore);

    return (
        <div className="rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-sm">
            {/* Clip Title Bar */}
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
                <h3 className="font-semibold text-sm sm:text-base">
                    <span className="text-muted-foreground font-normal">#{index + 1}</span>{" "}
                    {clip.title}
                </h3>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn(
                                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold cursor-default",
                                    clip.viralityScore >= 90 ? "bg-emerald-500/15 text-emerald-500" :
                                        clip.viralityScore >= 70 ? "bg-amber-500/15 text-amber-500" :
                                            "bg-zinc-500/15 text-zinc-400"
                                )}>
                                    <IconFlame className="size-3.5" />
                                    {clip.viralityScore}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Virality Score — {clip.viralityScore >= 90 ? "High potential" : clip.viralityScore >= 70 ? "Good potential" : "Moderate potential"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                        <IconClock className="size-3" />
                        {formatDuration(clip.duration)}
                    </Badge>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
                    {/* Video Preview */}
                    <div className="shrink-0">
                        <div className="relative w-full lg:w-[220px] h-[380px] rounded-lg overflow-hidden bg-black">
                            {clip.storageUrl ? (
                                <video
                                    src={clip.storageUrl}
                                    poster={clip.thumbnailUrl}
                                    className="h-full w-full object-contain"
                                    controls
                                    preload="metadata"
                                />
                            ) : clip.thumbnailUrl ? (
                                <img
                                    src={clip.thumbnailUrl}
                                    alt={clip.title}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <IconVideo className="size-12 text-muted-foreground/30" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <div className="flex-1 min-w-0">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "transcript" | "description")}>
                            <TabsList className="mb-3">
                                <TabsTrigger value="transcript" className="gap-1.5 text-xs sm:text-sm">
                                    <IconFileText className="size-3.5" />
                                    Transcript
                                </TabsTrigger>
                                <TabsTrigger value="description" className="gap-1.5 text-xs sm:text-sm">
                                    <IconWand className="size-3.5" />
                                    Why This Goes Viral
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="transcript" className="mt-0">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {clip.transcript || "No transcript available."}
                                </p>
                            </TabsContent>

                            <TabsContent value="description" className="mt-0">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {clip.viralityReason || "No description available."}
                                </p>
                                {clip.hooks.length > 0 && (
                                    <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Key Hooks</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                            {clip.hooks.map((hook, i) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <span className="mt-1.5 size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                    <span className="text-xs text-foreground/80 leading-snug">{hook}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>

                        {/* Platform Chips */}
                        {clip.recommendedPlatforms && clip.recommendedPlatforms.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mt-4">
                                <TooltipProvider>
                                    {clip.recommendedPlatforms.map((platform) => {
                                        const config = SHARE_PLATFORM_CONFIG[platform];
                                        if (!config) return null;
                                        const Icon = config.icon;
                                        return (
                                            <Tooltip key={platform}>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 cursor-default">
                                                        <Icon className="size-4" />
                                                        <span className="text-xs font-medium">{config.label}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Best for {config.tooltip}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </TooltipProvider>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => onDownload(clip)}
                        disabled={!clip.storageUrl}
                    >
                        <IconDownload className="size-4" />
                        Download Clip
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        {clip.aspectRatio} · {formatDuration(clip.duration)}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ── Main Exported Component ─────────────────────────────────────────────────
export default function ShareViewer({ token }: ShareViewerProps) {
    const [shareData, setShareData] = useState<PublicShareData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchShareData() {
            try {
                const response = await api.get(`/api/share/${token}`);
                setShareData(response.data);
            } catch (err: any) {
                const status = err?.response?.status;
                if (status === 404) setError("not_found");
                else if (status === 410) setError("revoked");
                else if (status === 429) setError("rate_limit");
                else setError("unknown");
            } finally {
                setIsLoading(false);
            }
        }
        fetchShareData();
    }, [token]);

    const handleDownload = (clip: PublicClipData) => {
        analytics.clipDownloaded(clip.id);
        downloadClip(token, clip.id, clip.title);
    };

    const handleDownloadAll = () => {
        if (shareData) downloadAllClips(token, shareData.videoTitle);
    };

    if (isLoading) return <LoadingSkeleton />;
    if (error === "not_found" || error === "revoked") return <ShareNotFound />;
    if (error || !shareData) return <ShareError />;

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <BrandedHeader
                videoTitle={shareData.videoTitle}
                clipCount={shareData.clipCount}
                onDownloadAll={handleDownloadAll}
            />

            {/* Clips List */}
            <main className="flex-1">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                    {shareData.clips.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-muted/30 p-12">
                            <IconVideo className="size-10 text-muted-foreground" />
                            <div className="text-center">
                                <h3 className="font-medium">No Clips Available</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    No clips are available for this video yet.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {shareData.clips.map((clip, index) => (
                                <ClipCard
                                    key={clip.id}
                                    clip={clip}
                                    index={index}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <BrandedFooter />
        </div>
    );
}
