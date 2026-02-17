"use client";

import { useState } from "react";
import { IconLoader2 } from "@tabler/icons-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Download04Icon,
    Edit02Icon,
    Share01Icon,
    SparklesIcon,
    Video01Icon,
    FireIcon,
    SubtitleIcon,
    MagicWand01Icon,
    FavouriteIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ClipResponse, RecommendedPlatform } from "@/lib/api/clips";
import { UpgradeDialog } from "@/components/pricing/upgrade-dialog";
import {
    YouTubeIcon,
    TikTokIcon,
    InstagramIcon,
    LinkedInIcon,
    TwitterIcon,
    FacebookIcon,
} from "@/components/icons/platform-icons";

export interface ClipCardProps {
    clip: ClipResponse;
    index: number;
    onEdit: (clipId: string) => void;
    onFavorite: (e: React.MouseEvent, clipId: string) => void;
    onDownload: (clip: ClipResponse) => void;
    onShare: (clip: ClipResponse) => void;
    userPlan: "free" | "starter" | "pro" | "agency";
    workspaceSlug: string;
}

const PLATFORM_CONFIG: Record<RecommendedPlatform, { icon: React.ElementType; label: string; tooltip: string }> = {
    youtube_shorts: { icon: YouTubeIcon, label: "YT Shorts", tooltip: "YouTube Shorts" },
    instagram_reels: { icon: InstagramIcon, label: "Reels", tooltip: "Instagram Reels" },
    tiktok: { icon: TikTokIcon, label: "TikTok", tooltip: "TikTok" },
    linkedin: { icon: LinkedInIcon, label: "LinkedIn", tooltip: "LinkedIn" },
    twitter: { icon: TwitterIcon, label: "Twitter/X", tooltip: "Twitter / X" },
    facebook_reels: { icon: FacebookIcon, label: "FB Reels", tooltip: "Facebook Reels" },
};

export function ClipCard({ clip, index, onEdit, onFavorite, onDownload, onShare, userPlan, workspaceSlug }: ClipCardProps) {
    const [activeTab, setActiveTab] = useState<"transcript" | "description">("transcript");
    const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);
    const isGenerating = clip.status === "generating" || clip.status === "detected";
    const isFreePlan = userPlan === "free";

    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            {/* Clip Title */}
            <div className="px-4 sm:px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
                <h3 className="font-semibold text-sm sm:text-base truncate mr-2">
                    <span className="text-muted-foreground">#{index + 1}</span>{" "}
                    {clip.title}
                </h3>
                <TooltipProvider>
                    {clip.viralityScore != null && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn(
                                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold cursor-default",
                                    clip.viralityScore >= 90 ? "bg-emerald-500/15 text-emerald-500" :
                                        clip.viralityScore >= 70 ? "bg-amber-500/15 text-amber-500" :
                                            "bg-zinc-500/15 text-zinc-400"
                                )}>
                                    <HugeiconsIcon icon={FireIcon} size={14} color="currentColor" />
                                    {clip.viralityScore}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Virality Score — {clip.viralityScore >= 90 ? "High potential" : clip.viralityScore >= 70 ? "Good potential" : "Moderate potential"}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </TooltipProvider>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
                    {/* Video Preview */}
                    <div className="shrink-0">
                        <div className="relative w-full lg:w-[230px] h-[300px] sm:h-[400px] rounded-lg overflow-hidden bg-black">
                            {isGenerating ? (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                                    <IconLoader2 className="size-8 animate-spin text-primary" />
                                    <span className="text-xs text-muted-foreground">Generating clip...</span>
                                </div>
                            ) : clip.storageUrl ? (
                                <video
                                    src={clip.storageUrl}
                                    poster={clip.thumbnailUrl}
                                    className="h-full w-full object-contain"
                                    controls
                                />
                            ) : clip.thumbnailUrl ? (
                                <img
                                    src={clip.thumbnailUrl}
                                    alt={clip.title}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <HugeiconsIcon icon={Video01Icon} size={48} color="#a1a1aa" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <div className="h-full">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "transcript" | "description")}>
                            <TabsList className="mb-3">
                                <TabsTrigger value="transcript" className="gap-1.5">
                                    <HugeiconsIcon icon={SubtitleIcon} size={16} color="currentColor" />
                                    Transcript
                                </TabsTrigger>
                                <TabsTrigger value="description" className="gap-1.5">
                                    <HugeiconsIcon icon={MagicWand01Icon} size={16} color="currentColor" />
                                    Why This Goes Viral
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="transcript" className="mt-0 relative">
                                <div className="max-h-[18rem] overflow-y-auto">
                                    <p className="text-sm text-muted-foreground leading-relaxed pb-6">
                                        {clip.transcript || "No transcript available."}
                                    </p>
                                </div>
                                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                            </TabsContent>

                            <TabsContent value="description" className="mt-0 relative">
                                <div className="max-h-[18rem] overflow-y-auto">
                                    <div className="pb-6">
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {clip.viralityReason || "No auto-description available."}
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
                                    </div>
                                </div>
                                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                            </TabsContent>
                        </Tabs>

                        {/* Platform Chips */}
                        {clip.recommendedPlatforms && clip.recommendedPlatforms.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                                <TooltipProvider>
                                    {clip.recommendedPlatforms.map((platform) => {
                                        const config = PLATFORM_CONFIG[platform];
                                        if (!config) return null;
                                        const Icon = config.icon;
                                        return (
                                            <Tooltip key={platform}>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 sm:gap-1.5 rounded-full border bg-muted/40 px-2 sm:px-3 py-1 sm:py-1.5 cursor-default">
                                                        <Icon className="size-3.5 sm:size-4" />
                                                        <span className="text-[11px] sm:text-xs font-medium">{config.label}</span>
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

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Button
                            size="sm"
                            className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2.5 sm:px-3"
                            onClick={() => onDownload(clip)}
                            disabled={!clip.storageUrl || isGenerating}
                        >
                            <HugeiconsIcon icon={Download04Icon} size={16} color="currentColor" />
                            <span className="hidden sm:inline">Download</span>
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2.5 sm:px-3"
                            disabled={isGenerating}
                            onClick={() => {
                                if (isFreePlan) {
                                    setUpgradeFeature("Remove watermark");
                                } else {
                                    // TODO: handle remove watermark for paid users
                                }
                            }}
                        >
                            <HugeiconsIcon icon={SparklesIcon} size={16} color="currentColor" />
                            <span className="hidden sm:inline">Remove watermark</span>
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2.5 sm:px-3"
                            onClick={() => {
                                if (isFreePlan) {
                                    setUpgradeFeature("Edit");
                                } else {
                                    onEdit(clip.id);
                                }
                            }}
                            disabled={isGenerating}
                        >
                            <HugeiconsIcon icon={Edit02Icon} size={16} color="currentColor" />
                            <span className="hidden sm:inline">Edit</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                                "size-8 sm:size-9",
                                clip.favorited && "text-red-500 hover:text-red-600"
                            )}
                            onClick={(e) => onFavorite(e, clip.id)}
                        >
                            <HugeiconsIcon icon={FavouriteIcon} size={18} color={clip.favorited ? "#ef4444" : "currentColor"} />
                        </Button>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 sm:size-9"
                            onClick={() => onShare(clip)}
                        >
                            <HugeiconsIcon icon={Share01Icon} size={18} color="currentColor" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Upgrade Dialog for free plan users */}
            <UpgradeDialog
                open={upgradeFeature !== null}
                onOpenChange={(open) => {
                    if (!open) setUpgradeFeature(null);
                }}
                workspaceSlug={workspaceSlug}
                feature={upgradeFeature || ""}
            />
        </div>
    );
}
