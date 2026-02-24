"use client";

import { IconFlame, IconMoodSmile, IconBulb, IconBrandYoutube } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClipResponse, RecommendedPlatform } from "@/lib/api/clips";

interface ClipInfoPanelProps {
    clip: ClipResponse;
}

const PLATFORM_LABELS: Record<RecommendedPlatform, string> = {
    youtube_shorts: "YouTube Shorts",
    instagram_reels: "Instagram Reels",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    twitter: "Twitter/X",
    facebook_reels: "Facebook Reels",
};

function ScoreBar({ score }: { score: number }) {
    const color = score >= 90 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-zinc-500";
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Virality Score</span>
                <span className={cn(
                    "text-sm font-bold",
                    score >= 90 ? "text-emerald-400" : score >= 70 ? "text-amber-400" : "text-zinc-400"
                )}>{score}/100</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
            </div>
        </div>
    );
}

export function ClipInfoPanel({ clip }: ClipInfoPanelProps) {
    return (
        <div className="space-y-5">
            {clip.viralityScore != null && <ScoreBar score={clip.viralityScore} />}

            {clip.viralityReason && (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <IconBulb className="size-3.5" />
                        Why it's viral
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">{clip.viralityReason}</p>
                </div>
            )}

            {clip.hooks && clip.hooks.length > 0 && (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <IconFlame className="size-3.5" />
                        Hooks
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {clip.hooks.map((hook, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-300 border-zinc-700">
                                {hook}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {clip.emotions && clip.emotions.length > 0 && (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <IconMoodSmile className="size-3.5" />
                        Emotions
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {clip.emotions.map((emotion, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] border-zinc-700 text-zinc-300">
                                {emotion}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {clip.recommendedPlatforms && clip.recommendedPlatforms.length > 0 && (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <IconBrandYoutube className="size-3.5" />
                        Best platforms
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {clip.recommendedPlatforms.map((platform) => (
                            <Badge key={platform} variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-300 border-zinc-700">
                                {PLATFORM_LABELS[platform] || platform}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-1.5">
                <span className="text-xs text-zinc-400">Duration</span>
                <p className="text-sm text-zinc-300 font-mono">
                    {Math.floor(clip.duration / 60)}:{(clip.duration % 60).toString().padStart(2, "0")}
                </p>
            </div>
        </div>
    );
}
