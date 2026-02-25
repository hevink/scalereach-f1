"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { IconCheck, IconClock, IconX, IconVideo } from "@tabler/icons-react";
import { FireIcon as FireAnimatedIcon } from "@/components/ui/fire-icon";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { cn } from "@/lib/utils";
import { socialApi, type WorkspaceClip } from "@/lib/api/social";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useSchedulePost } from "@/hooks/useScheduledPosts";
import { useCalendarContext } from "./calendar-context";
import {
  YouTubeIcon,
  TikTokIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedInIcon,
} from "@/components/icons/platform-icons";

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  youtube_shorts: "YT Shorts",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
};

const PLATFORM_CHIP_STYLES: Record<string, string> = {
  tiktok: "bg-black/10 text-foreground dark:bg-white/10",
  instagram: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  youtube: "bg-red-500/10 text-red-600 dark:text-red-400",
  youtube_shorts: "bg-red-500/10 text-red-600 dark:text-red-400",
  twitter: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  linkedin: "bg-blue-600/10 text-blue-700 dark:text-blue-400",
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-black text-white",
  instagram: "bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 text-white",
  youtube: "bg-red-500 text-white",
  youtube_shorts: "bg-red-500 text-white",
  twitter: "bg-black text-white",
  linkedin: "bg-blue-600 text-white",
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  youtube_shorts: YouTubeIcon,
  twitter: TwitterIcon,
  linkedin: LinkedInIcon,
};

function PlatformChip({ platform }: { platform: string }) {
  const Icon = PLATFORM_ICONS[platform];
  const label = PLATFORM_LABELS[platform] ?? platform;
  const chipStyle = PLATFORM_CHIP_STYLES[platform] ?? "bg-muted text-muted-foreground";
  return (
    <span className={cn("flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", chipStyle)}>
      {Icon && <Icon className="size-2.5 shrink-0" />}
      {label}
    </span>
  );
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function hooksToHashtags(hooks: string[] | null): string[] {
  if (!hooks) return [];
  return hooks
    .flatMap((h) => h.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/))
    .filter((w) => w.length > 3)
    .slice(0, 6);
}

function ClipThumbnail({ clip }: { clip: WorkspaceClip }) {
  if (clip.thumbnailUrl) {
    return <img src={clip.thumbnailUrl} alt={clip.title || ""} className="absolute inset-0 size-full object-cover" />;
  }
  if (clip.storageUrl) {
    return (
      <video
        src={clip.storageUrl}
        className="absolute inset-0 size-full object-cover"
        preload="metadata"
        muted
        playsInline
        onLoadedMetadata={(e) => { (e.currentTarget as HTMLVideoElement).currentTime = 1; }}
      />
    );
  }
  return (
    <div className="flex size-full flex-col items-center justify-center gap-1 bg-muted/20">
      <IconVideo size={20} className="text-muted-foreground/30" />
    </div>
  );
}

interface Props {
  workspaceId: string;
}

export function CreatePostFromCalendarModal({ workspaceId }: Props) {
  const { createModalDate, closeCreateModal } = useCalendarContext();

  const [step, setStep] = useState<"clip" | "details">("clip");
  const [selectedClip, setSelectedClip] = useState<WorkspaceClip | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (createModalDate) {
      setStep("clip");
      setSelectedClip(null);
      setSelectedAccountId("");
      setCaption("");
      setHashtags([]);
      setHashtagInput("");
      setScheduledDate(createModalDate);
    }
  }, [createModalDate]);

  useEffect(() => {
    if (selectedClip) {
      setCaption(selectedClip.title || "");
      setHashtags(hooksToHashtags(selectedClip.hooks));
    }
  }, [selectedClip]);

  const scheduledAt = scheduledDate?.toISOString() ?? "";

  const { data: clips = [], isLoading: loadingClips } = useQuery({
    queryKey: ["social", "workspace-clips", workspaceId],
    queryFn: () => socialApi.listWorkspaceClips(workspaceId),
    enabled: !!workspaceId && !!createModalDate,
  });

  const { data: accounts = [] } = useSocialAccounts(workspaceId);
  const schedulePost = useSchedulePost(workspaceId);

  function addHashtag(tag?: string) {
    const t = (tag ?? hashtagInput).trim().replace(/^#/, "");
    if (t && !hashtags.includes(t)) setHashtags((p) => [...p, t]);
    if (!tag) setHashtagInput("");
  }

  async function handleSubmit() {
    if (!selectedClip || !selectedAccountId) return;
    await schedulePost.mutateAsync({
      workspaceId,
      clipId: selectedClip.id,
      socialAccountId: selectedAccountId,
      postType: scheduledAt ? "scheduled" : "immediate",
      caption,
      hashtags,
      scheduledAt: scheduledAt || undefined,
    });
    closeCreateModal();
  }

  const open = !!createModalDate;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeCreateModal()}>
      <DialogContent className="!max-w-3xl gap-0 p-0 overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center border-b px-5 py-3.5">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-sm font-semibold leading-none">Schedule Post</DialogTitle>
            {createModalDate && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {format(createModalDate, "EEEE, MMMM d, yyyy")}
              </p>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs">
            <div className={cn(
              "flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
              step === "clip" ? "bg-primary text-primary-foreground" : "bg-emerald-500 text-white"
            )}>
              {step === "details" ? <IconCheck size={10} strokeWidth={3} /> : "1"}
            </div>
            <span className={cn("transition-colors", step === "clip" ? "font-medium text-foreground" : "text-muted-foreground")}>
              Pick clip
            </span>
            <div className={cn("h-px w-4 rounded-full transition-colors", step === "details" ? "bg-primary" : "bg-border")} />
            <div className={cn(
              "flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
              step === "details" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              2
            </div>
            <span className={cn("transition-colors", step === "details" ? "font-medium text-foreground" : "text-muted-foreground")}>
              Details
            </span>
          </div>

          <div className="flex flex-1 justify-end">
            <button
              type="button"
              onClick={closeCreateModal}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <IconX size={15} />
            </button>
          </div>
        </div>

        {/* Step 1 — Clip picker */}
        {step === "clip" && (
          <div className="flex flex-col gap-3 p-5">
            {loadingClips ? (
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-border">
                    <div className="aspect-[3/4] animate-pulse bg-muted/60" />
                    <div className="p-2 flex flex-col gap-1.5">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-muted/60" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted/40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : clips.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-muted-foreground">
                <IconVideo size={32} className="opacity-30" />
                <p className="text-sm">No ready clips in this workspace yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-h-[520px] overflow-y-auto p-1">
                {clips.map((clip) => {
                  const isSelected = selectedClip?.id === clip.id;
                  return (
                    <button
                      key={clip.id}
                      type="button"
                      onClick={() => setSelectedClip(clip)}
                      className={cn(
                        "group relative flex flex-col rounded-xl border text-left transition-all duration-150",
                        isSelected
                          ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : "border-border hover:border-primary/50 hover:shadow-sm"
                      )}
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-xl bg-muted/30">
                        <ClipThumbnail clip={clip} />
                        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/20 to-transparent px-2 pb-2 pt-8">
                          <div className="flex items-center justify-between">
                            {clip.score > 0 ? (
                              <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-400 drop-shadow">
                                <FireAnimatedIcon />{clip.score}
                              </span>
                            ) : <span />}
                            {clip.duration && (
                              <span className="flex items-center gap-0.5 rounded bg-black/50 px-1 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
                                <IconClock size={10} />{formatDuration(clip.duration)}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary shadow-lg">
                            <IconCheck size={11} className="text-primary-foreground" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "flex flex-col gap-1 overflow-hidden rounded-b-xl p-2 transition-colors duration-150",
                        isSelected ? "bg-primary/5" : "bg-card group-hover:bg-muted/20"
                      )}>
                        <p className="line-clamp-2 text-[11px] font-medium leading-tight text-foreground/90">
                          {clip.title || "Untitled clip"}
                        </p>
                        {clip.recommendedPlatforms && clip.recommendedPlatforms.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {clip.recommendedPlatforms.slice(0, 3).map((p) => (
                              <PlatformChip key={p} platform={p} />
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-3">
              <p className="text-xs text-muted-foreground">
                {selectedClip
                  ? <span className="font-medium text-foreground">{selectedClip.title || "Untitled clip"}</span>
                  : "Select a clip to continue"
                }
              </p>
              <Button size="sm" disabled={!selectedClip} onClick={() => setStep("details")}>
                Continue →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Details */}
        {step === "details" && selectedClip && (
          <div className="flex divide-x">
            {/* Left: clip preview */}
            <div className="flex w-44 shrink-0 flex-col gap-2.5 p-4">
              <div className="relative aspect-9/16 w-full overflow-hidden rounded-xl bg-muted/40">
                <ClipThumbnail clip={selectedClip} />
              </div>
              <p className="line-clamp-3 text-xs font-medium leading-snug text-foreground">
                {selectedClip.title || <span className="italic text-muted-foreground">Untitled clip</span>}
              </p>
              {selectedClip.recommendedPlatforms && selectedClip.recommendedPlatforms.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedClip.recommendedPlatforms.slice(0, 3).map((p) => (
                    <PlatformChip key={p} platform={p} />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setStep("clip")}
                className="text-left text-[11px] text-muted-foreground underline hover:text-foreground"
              >
                Change clip
              </button>
            </div>

            {/* Right: form */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 max-h-[540px]">
              {/* Account */}
              <div className="flex flex-col gap-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Post to</Label>
                {accounts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No connected accounts. Connect one from the Social page.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {accounts.map((acc) => {
                      const Icon = PLATFORM_ICONS[acc.platform];
                      const isSelected = selectedAccountId === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setSelectedAccountId(acc.id)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all text-left",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
                          )}
                        >
                          {Icon && (
                            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg p-1", PLATFORM_COLORS[acc.platform] || "bg-muted")}>
                              <Icon className="size-4" />
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold">{acc.accountName}</p>
                            <p className="text-[11px] text-muted-foreground">{PLATFORM_LABELS[acc.platform] || acc.platform}</p>
                          </div>
                          {isSelected && (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <IconCheck size={11} strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="flex flex-col gap-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date & Time</Label>
                <DateTimePicker
                  value={scheduledDate}
                  onChange={setScheduledDate}
                  granularity="minute"
                  placeholder="Pick date & time"
                  disablePast
                />
              </div>

              {/* Caption */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Caption</Label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  placeholder="Write a caption..."
                  className="resize-none text-sm"
                />
              </div>

              {/* Hashtags */}
              <div className="flex flex-col gap-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hashtags</Label>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {hashtags.map((tag) => (
                      <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        #{tag}
                        <button type="button" onClick={() => setHashtags((p) => p.filter((t) => t !== tag))} className="opacity-60 hover:opacity-100">
                          <IconX size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    placeholder="Add hashtag..."
                    className="text-sm"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => addHashtag()}>Add</Button>
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between border-t pt-3">
                <button
                  type="button"
                  onClick={() => setStep("clip")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ← Back
                </button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!selectedAccountId || !scheduledAt || schedulePost.isPending}
                  className="min-w-28"
                >
                  {schedulePost.isPending ? "Scheduling..." : "Schedule Post"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
