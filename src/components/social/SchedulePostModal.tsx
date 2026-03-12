"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  IconX,
  IconCheck,
  IconClock,
  IconVideo,
  IconUpload,
  IconPhoto,
  IconTrash,
  IconLoader2,
  IconHash,
} from "@tabler/icons-react";
import { FireIcon as FireAnimatedIcon } from "@/components/ui/fire-icon";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DateTimeScrollPicker } from "@/components/ui/date-time-scroll-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useSchedulePost } from "@/hooks/useScheduledPosts";
import { socialApi, type WorkspaceClip, type SocialMediaItem } from "@/lib/api/social";
import type { ClipResponse } from "@/lib/api/clips";
import {
  YouTubeIcon,
  TikTokIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedInIcon,
  FacebookIcon,
  ThreadsIcon,
} from "@/components/icons/platform-icons";
import { SocialAccountAvatar } from "@/components/social/social-account-avatar";

/* ─── Constants ─── */

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  instagram_reels: "IG Reels",
  facebook: "Facebook",
  facebook_reels: "FB Reels",
  youtube: "YouTube",
  youtube_shorts: "YT Shorts",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  threads: "Threads",
};

const PLATFORM_CHIP_STYLES: Record<string, string> = {
  tiktok: "bg-black/10 text-foreground dark:bg-white/10",
  instagram: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  instagram_reels: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  facebook: "bg-blue-600/10 text-blue-700 dark:text-blue-400",
  facebook_reels: "bg-blue-600/10 text-blue-700 dark:text-blue-400",
  youtube: "bg-red-500/10 text-red-600 dark:text-red-400",
  youtube_shorts: "bg-red-500/10 text-red-600 dark:text-red-400",
  twitter: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  linkedin: "bg-blue-600/10 text-blue-700 dark:text-blue-400",
  threads: "bg-black/10 text-foreground dark:bg-white/10",
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-black text-white",
  instagram: "bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 text-white",
  instagram_reels: "bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 text-white",
  facebook: "bg-blue-600 text-white",
  facebook_reels: "bg-blue-600 text-white",
  youtube: "bg-red-500 text-white",
  youtube_shorts: "bg-red-500 text-white",
  twitter: "bg-black text-white",
  linkedin: "bg-blue-600 text-white",
  threads: "bg-black text-white",
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  instagram_reels: InstagramIcon,
  facebook: FacebookIcon,
  facebook_reels: FacebookIcon,
  youtube: YouTubeIcon,
  youtube_shorts: YouTubeIcon,
  twitter: TwitterIcon,
  linkedin: LinkedInIcon,
  threads: ThreadsIcon,
};

/* ─── Helpers ─── */

function PlatformChip({ platform }: { platform: string }) {
  const Icon = PLATFORM_ICONS[platform];
  const label = PLATFORM_LABELS[platform] ?? platform;
  return (
    <span className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      {Icon && <Icon className="size-3 shrink-0" />}
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

/* ─── Props ─── */

interface SchedulePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clip?: ClipResponse;
  workspaceId: string;
  workspaceSlug?: string;
}

/* ─── Component ─── */

export function SchedulePostModal({
  open,
  onOpenChange,
  clip,
  workspaceId,
}: SchedulePostModalProps) {
  const [step, setStep] = useState<"clip" | "details">("clip");
  const [selectedClip, setSelectedClip] = useState<WorkspaceClip | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);

  // Per-platform customization state
  const [customizePerPlatform, setCustomizePerPlatform] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<string>("all");
  const [perPlatformCaptions, setPerPlatformCaptions] = useState<Record<string, string>>({});
  const [perPlatformHashtags, setPerPlatformHashtags] = useState<Record<string, string[]>>({});
  const [perPlatformHashtagInputs, setPerPlatformHashtagInputs] = useState<Record<string, string>>({});

  // Custom upload state
  const [sourceTab, setSourceTab] = useState<"clip" | "upload">("clip");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadMediaType, setUploadMediaType] = useState<"video" | "image" | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; storageKey: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Media library state
  const [mediaLibrary, setMediaLibrary] = useState<SocialMediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);

  const { data: accounts = [] } = useSocialAccounts(workspaceId);
  const schedulePost = useSchedulePost(workspaceId);

  const { data: clips = [], isLoading: loadingClips } = useQuery({
    queryKey: ["social", "workspace-clips", workspaceId],
    queryFn: () => socialApi.listWorkspaceClips(workspaceId),
    enabled: !!workspaceId && open,
  });

  // Fetch media library
  const fetchMedia = useCallback(async () => {
    if (!workspaceId) return;
    setLoadingMedia(true);
    try {
      const items = await socialApi.listMedia(workspaceId);
      setMediaLibrary(items);
    } catch {
      // silent
    } finally {
      setLoadingMedia(false);
    }
  }, [workspaceId]);

  // Load media library when switching to upload tab
  useEffect(() => {
    if (open && sourceTab === "upload") {
      fetchMedia();
    }
  }, [open, sourceTab, fetchMedia]);

  // If opened with a clip prop, skip step 1 and go straight to details
  useEffect(() => {
    if (open && clip) {
      const asWorkspaceClip: WorkspaceClip = {
        id: clip.id,
        title: clip.title,
        thumbnailUrl: clip.thumbnailUrl || null,
        storageUrl: clip.storageUrl || null,
        score: clip.viralityScore,
        duration: clip.duration,
        aspectRatio: clip.aspectRatio,
        hooks: clip.hooks,
        recommendedPlatforms: clip.recommendedPlatforms || null,
      };
      setSelectedClip(asWorkspaceClip);
      setSourceTab("clip");
      setCaption(clip.title || "");
      setHashtags(hooksToHashtags(clip.hooks));
      setStep("details");
    }
  }, [open, clip]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep("clip");
      setSelectedClip(null);
      setSelectedAccountIds(new Set());
      setCaption("");
      setHashtags([]);
      setHashtagInput("");
      setScheduledDate(undefined);
      setSourceTab("clip");
      setCustomizePerPlatform(false);
      setActiveContentTab("all");
      setPerPlatformCaptions({});
      setPerPlatformHashtags({});
      setPerPlatformHashtagInputs({});
      removeUploadFile();
    }
  }, [open]);

  // When selecting a clip in step 1
  useEffect(() => {
    if (selectedClip) {
      setCaption(selectedClip.title || "");
      setHashtags(hooksToHashtags(selectedClip.hooks));
    }
  }, [selectedClip]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    const isVideo = selectedFile.type.startsWith("video/");
    const isImage = selectedFile.type.startsWith("image/");
    if (!isVideo && !isImage) return;

    setUploadFile(selectedFile);
    setUploadMediaType(isVideo ? "video" : "image");
    setUploadPreview(URL.createObjectURL(selectedFile));
    setUploadState("uploading");
    setUploadProgress(0);

    try {
      const { uploadUrl, storageKey, publicUrl } = await socialApi.getMediaUploadUrl(
        workspaceId, selectedFile.name, selectedFile.type
      );
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", selectedFile.type);
        xhr.send(selectedFile);
      });
      setUploadedMedia({ url: publicUrl, storageKey });
      setUploadState("done");
      // Refresh media library so the new upload appears
      fetchMedia();
      // Auto-select the newly uploaded media but clear the upload preview
      // so the drop zone reappears for another upload
      const newMedia = { url: publicUrl, storageKey };
      setTimeout(() => {
        if (uploadPreview) URL.revokeObjectURL(uploadPreview);
        setUploadFile(null);
        setUploadPreview(null);
        setUploadState("idle");
        setUploadProgress(0);
        // Keep uploadedMedia and uploadMediaType set so "Continue" works
        setUploadedMedia(newMedia);
      }, 800); // brief delay so user sees the success checkmark
    } catch {
      setUploadState("error");
    }
  }, [workspaceId]);

  function removeUploadFile() {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadMediaType(null);
    setUploadState("idle");
    setUploadProgress(0);
    setUploadedMedia(null);
  }

  function selectFromLibrary(item: SocialMediaItem) {
    // Clear any active upload preview
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadState("idle");
    setUploadProgress(0);
    // Set the selected media for scheduling
    setUploadMediaType(item.mediaType);
    setUploadedMedia({ url: item.url, storageKey: item.storageKey });
  }

  async function deleteFromLibrary(item: SocialMediaItem) {
    setDeletingMediaId(item.id);
    try {
      await socialApi.deleteMedia(item.id);
      setMediaLibrary((prev) => prev.filter((m) => m.id !== item.id));
      // If this was the selected one, clear it
      if (uploadedMedia?.storageKey === item.storageKey) {
        removeUploadFile();
      }
    } catch {
      // silent
    } finally {
      setDeletingMediaId(null);
    }
  }

  function toggleAccount(id: string) {
    setSelectedAccountIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedAccountIds.size === accounts.length) {
      setSelectedAccountIds(new Set());
    } else {
      setSelectedAccountIds(new Set(accounts.map((a) => a.id)));
    }
  }

  function addHashtag(tag?: string) {
    const t = (tag ?? hashtagInput).trim().replace(/^#/, "");
    if (t && !hashtags.includes(t)) setHashtags((p) => [...p, t]);
    if (!tag) setHashtagInput("");
  }

  function addPlatformHashtag(accountId: string, tag?: string) {
    const input = perPlatformHashtagInputs[accountId] || "";
    const t = (tag ?? input).trim().replace(/^#/, "");
    const current = perPlatformHashtags[accountId] || [];
    if (t && !current.includes(t)) {
      setPerPlatformHashtags((p) => ({ ...p, [accountId]: [...current, t] }));
    }
    if (!tag) setPerPlatformHashtagInputs((p) => ({ ...p, [accountId]: "" }));
  }

  function removePlatformHashtag(accountId: string, tag: string) {
    setPerPlatformHashtags((p) => ({
      ...p,
      [accountId]: (p[accountId] || []).filter((t) => t !== tag),
    }));
  }

  function getCaptionForAccount(accountId: string): string {
    if (customizePerPlatform && perPlatformCaptions[accountId] !== undefined) {
      return perPlatformCaptions[accountId];
    }
    return caption;
  }

  function getHashtagsForAccount(accountId: string): string[] {
    if (customizePerPlatform && perPlatformHashtags[accountId] !== undefined) {
      return perPlatformHashtags[accountId];
    }
    return hashtags;
  }

  // Get selected accounts for tab rendering
  const selectedAccounts = accounts.filter((a) => selectedAccountIds.has(a.id));

  const scheduledAt = scheduledDate?.toISOString() ?? "";

  async function handleSubmit() {
    if (sourceTab === "clip") {
      if (!selectedClip || selectedAccountIds.size === 0) return;
      const promises = Array.from(selectedAccountIds).map((accountId) =>
        schedulePost.mutateAsync({
          workspaceId,
          clipId: selectedClip.id,
          socialAccountId: accountId,
          postType: scheduledAt ? "scheduled" : "immediate",
          caption: getCaptionForAccount(accountId),
          hashtags: getHashtagsForAccount(accountId),
          scheduledAt: scheduledAt || undefined,
        })
      );
      await Promise.all(promises);
    } else {
      if (!uploadedMedia || selectedAccountIds.size === 0) return;
      const promises = Array.from(selectedAccountIds).map((accountId) =>
        schedulePost.mutateAsync({
          workspaceId,
          socialAccountId: accountId,
          postType: scheduledAt ? "scheduled" : "immediate",
          caption: getCaptionForAccount(accountId),
          hashtags: getHashtagsForAccount(accountId),
          scheduledAt: scheduledAt || undefined,
          mediaUrl: uploadedMedia.url,
          mediaType: uploadMediaType || "video",
          mediaStorageKey: uploadedMedia.storageKey,
        })
      );
      await Promise.all(promises);
    }
    onOpenChange(false);
  }

  async function handlePostNow() {
    if (sourceTab === "clip") {
      if (!selectedClip || selectedAccountIds.size === 0) return;
      const promises = Array.from(selectedAccountIds).map((accountId) =>
        schedulePost.mutateAsync({
          workspaceId,
          clipId: selectedClip.id,
          socialAccountId: accountId,
          postType: "immediate",
          caption: getCaptionForAccount(accountId),
          hashtags: getHashtagsForAccount(accountId),
        })
      );
      await Promise.all(promises);
    } else {
      if (!uploadedMedia || selectedAccountIds.size === 0) return;
      const promises = Array.from(selectedAccountIds).map((accountId) =>
        schedulePost.mutateAsync({
          workspaceId,
          socialAccountId: accountId,
          postType: "immediate",
          caption: getCaptionForAccount(accountId),
          hashtags: getHashtagsForAccount(accountId),
          mediaUrl: uploadedMedia.url,
          mediaType: uploadMediaType || "video",
          mediaStorageKey: uploadedMedia.storageKey,
        })
      );
      await Promise.all(promises);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "gap-0 p-0 overflow-hidden [&>button]:hidden",
        step === "details" && sourceTab === "upload" && uploadMediaType === "image"
          ? "max-w-4xl!"
          : "max-w-3xl!"
      )}>
        {/* Header */}
        <div className="flex items-center border-b px-5 py-3.5">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-sm font-semibold leading-none">Schedule Post</DialogTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
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
              Pick source
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
              onClick={() => onOpenChange(false)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <IconX size={15} />
            </button>
          </div>
        </div>

        {/* Step 1 - Source picker */}
        {step === "clip" && (
          <div className="flex flex-col gap-3 p-5">
            {/* Tab switcher */}
            <div className="flex gap-1 rounded-lg bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setSourceTab("clip")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                  sourceTab === "clip" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <IconVideo size={15} /> From Clips
              </button>
              <button
                type="button"
                onClick={() => setSourceTab("upload")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                  sourceTab === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <IconUpload size={15} /> Upload Media
              </button>
            </div>

            {sourceTab === "clip" ? (
              <>
                {loadingClips ? (
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-border">
                        <div className="aspect-4/5 animate-pulse bg-muted/60" />
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
                    {clips.map((c) => {
                      const isSelected = selectedClip?.id === c.id;
                      const platforms = c.recommendedPlatforms || [];
                      const visiblePlatforms = platforms.slice(0, 3);
                      const extraCount = platforms.length - 3;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedClip(c)}
                          className={cn(
                            "group relative flex flex-col rounded-xl border text-left transition-all duration-150",
                            isSelected
                              ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                              : "border-border hover:border-primary/50 hover:shadow-sm"
                          )}
                        >
                          <div className="relative aspect-4/5 w-full overflow-hidden rounded-t-xl bg-muted/30">
                            <ClipThumbnail clip={c} />
                            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/20 to-transparent px-2 pb-2 pt-8">
                              <div className="flex items-center justify-between">
                                {c.score > 0 ? (
                                  <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-400 drop-shadow">
                                    <FireAnimatedIcon />{c.score}
                                  </span>
                                ) : <span />}
                                {c.duration && (
                                  <span className="flex items-center gap-0.5 rounded bg-black/50 px-1 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
                                    <IconClock size={10} />{formatDuration(c.duration)}
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
                            "flex flex-col gap-1.5 overflow-hidden rounded-b-xl px-2 py-2 transition-colors duration-150",
                            isSelected ? "bg-primary/5" : "bg-card group-hover:bg-muted/20"
                          )}>
                            <p className="line-clamp-2 text-[11px] font-medium leading-tight text-foreground/90">
                              {c.title || "Untitled clip"}
                            </p>
                            {visiblePlatforms.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                {visiblePlatforms.map((p) => (
                                  <PlatformChip key={p} platform={p} />
                                ))}
                                {extraCount > 0 && (
                                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    +{extraCount}
                                  </span>
                                )}
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
                      : "Select a clip to continue"}
                  </p>
                  <Button size="sm" disabled={!selectedClip} onClick={() => setStep("details")}>
                    Continue →
                  </Button>
                </div>
              </>
            ) : (
              /* Upload tab */
              <>
                {!uploadFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed transition-all",
                      isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/20"
                    )}
                  >
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                      <IconUpload size={24} className="text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Drop your file here</p>
                      <p className="text-xs text-muted-foreground">or click to browse</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
                      <span className="flex items-center gap-1"><IconVideo size={13} /> MP4, MOV, WebM</span>
                      <span className="flex items-center gap-1"><IconPhoto size={13} /> JPG, PNG, WebP</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl bg-black">
                      {uploadMediaType === "video" ? (
                        <video src={uploadPreview || ""} className="absolute inset-0 size-full object-contain" muted playsInline loop autoPlay />
                      ) : (
                        <img src={uploadPreview || ""} alt="Preview" className="absolute inset-0 size-full object-contain" />
                      )}
                      {uploadState === "uploading" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-sm">
                          <IconLoader2 size={24} className="animate-spin text-white" />
                          <div className="w-2/3">
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                          <p className="text-xs text-white/80">{uploadProgress}%</p>
                        </div>
                      )}
                      {uploadState === "done" && (
                        <div className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                          <IconCheck size={13} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                      {uploadState === "error" && (
                        <div className="absolute inset-x-2 bottom-2 rounded-lg bg-red-500/90 px-2 py-1.5 text-center text-[11px] text-white">Upload failed. Try again.</div>
                      )}
                      <button
                        type="button"
                        onClick={removeUploadFile}
                        className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-sm transition-colors hover:bg-red-500 hover:text-white"
                      >
                        <IconTrash size={12} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{uploadFile.name} · {(uploadFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                )}

                <div className="flex items-center justify-between border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    {uploadedMedia
                      ? <span className="font-medium text-foreground">{uploadFile?.name || "Media selected"}</span>
                      : "Upload or select media to continue"}
                  </p>
                  <Button size="sm" disabled={!uploadedMedia} onClick={() => setStep("details")}>
                    Continue →
                  </Button>
                </div>

                {/* Previously uploaded media library */}
                {loadingMedia ? (
                  <div className="flex items-center justify-center py-6">
                    <IconLoader2 size={18} className="animate-spin text-muted-foreground" />
                  </div>
                ) : mediaLibrary.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your Media Library</p>
                    <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-2">
                      {mediaLibrary.map((item) => {
                        const isActive = uploadedMedia?.storageKey === item.storageKey;
                        const isDeleting = deletingMediaId === item.id;
                        return (
                          <div key={item.id} className="group relative">
                            <button
                              type="button"
                              onClick={() => !isDeleting && selectFromLibrary(item)}
                              disabled={isDeleting}
                              className={cn(
                                "relative aspect-square w-full overflow-hidden rounded-lg bg-muted transition-all",
                                isDeleting && "opacity-50 pointer-events-none",
                                isActive
                                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                  : "hover:ring-2 hover:ring-primary/50"
                              )}
                            >
                              {item.mediaType === "video" ? (
                                <video src={item.url} className="absolute inset-0 size-full object-cover" preload="metadata" muted />
                              ) : (
                                <img src={item.url} alt={item.filename} className="absolute inset-0 size-full object-cover" />
                              )}
                              <div className="absolute bottom-0.5 left-0.5">
                                {item.mediaType === "video" ? (
                                  <IconVideo size={10} className="text-white drop-shadow" />
                                ) : (
                                  <IconPhoto size={10} className="text-white drop-shadow" />
                                )}
                              </div>
                              {isActive && (
                                <div className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary shadow">
                                  <IconCheck size={9} className="text-primary-foreground" strokeWidth={3} />
                                </div>
                              )}
                              {isDeleting && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
                                  <IconLoader2 size={16} className="animate-spin text-white" />
                                </div>
                              )}
                            </button>
                            {!isDeleting && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); deleteFromLibrary(item); }}
                                className="absolute -top-1 -right-1 hidden group-hover:flex size-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm"
                              >
                                <IconTrash size={10} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2 - Details */}
        {step === "details" && (selectedClip || (sourceTab === "upload" && uploadedMedia)) && (
          <div className="flex divide-x">
            {/* Left: preview */}
            <div className={cn(
              "flex shrink-0 flex-col gap-2.5 p-4",
              sourceTab === "upload" && uploadMediaType === "image" ? "w-72" : "w-44"
            )}>
              {sourceTab === "clip" && selectedClip ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted/40">
                    {uploadMediaType === "video" ? (
                      <video src={uploadPreview || uploadedMedia?.url || ""} className="absolute inset-0 size-full object-contain" muted playsInline loop autoPlay />
                    ) : (
                      <img src={uploadPreview || uploadedMedia?.url || ""} alt="Preview" className="absolute inset-0 size-full object-contain" />
                    )}
                  </div>
                  <p className="line-clamp-3 text-xs font-medium leading-snug text-foreground">
                    {uploadFile?.name || "Custom media"}
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={() => setStep("clip")}
                className="text-left text-[11px] text-muted-foreground underline hover:text-foreground"
              >
                Change source
              </button>
            </div>

            {/* Right: form */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 max-h-[540px]">
              {/* Account */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Post to</Label>
                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      {selectedAccountIds.size === accounts.length ? "Deselect all" : "Select all"}
                    </button>
                  )}
                </div>
                {accounts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No connected accounts. Connect one from the Social page.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {accounts.map((acc) => {
                      const Icon = PLATFORM_ICONS[acc.platform];
                      const isSelected = selectedAccountIds.has(acc.id);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => toggleAccount(acc.id)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all text-left",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
                          )}
                        >
                          <SocialAccountAvatar
                            avatarUrl={acc.avatarUrl}
                            accountName={acc.accountName}
                            platform={acc.platform}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold">{acc.accountName}</p>
                            <p className="text-[11px] text-muted-foreground">{PLATFORM_LABELS[acc.platform] || acc.platform}{acc.accountHandle ? ` · @${acc.accountHandle}` : ""}</p>
                          </div>
                          <span className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          )}>
                            {isSelected && <IconCheck size={11} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="flex flex-col gap-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date & Time</Label>
                <DateTimeScrollPicker value={scheduledDate} onChange={setScheduledDate} />
              </div>

              {/* Caption & Hashtags - with per-platform customization */}
              {selectedAccountIds.size > 1 && (
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Content</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomizePerPlatform((v) => !v);
                      if (!customizePerPlatform) setActiveContentTab("all");
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
                      customizePerPlatform
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                    {customizePerPlatform ? "Customizing per platform" : "Customize per platform"}
                  </button>
                </div>
              )}

              {customizePerPlatform && selectedAccountIds.size > 1 ? (
                <div className="flex flex-col gap-3">
                  {/* Platform tabs */}
                  <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted/40 p-1">
                    <button
                      type="button"
                      onClick={() => setActiveContentTab("all")}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all",
                        activeContentTab === "all"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <IconHash size={12} />
                      All Platforms
                    </button>
                    {selectedAccounts.map((acc) => {
                      const Icon = PLATFORM_ICONS[acc.platform];
                      const hasCustom = perPlatformCaptions[acc.id] !== undefined || perPlatformHashtags[acc.id] !== undefined;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setActiveContentTab(acc.id)}
                          className={cn(
                            "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all",
                            activeContentTab === acc.id
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {Icon && <Icon className="size-3" />}
                          {acc.accountName}
                          {hasCustom && (
                            <span className="size-1.5 rounded-full bg-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Content for active tab */}
                  {activeContentTab === "all" ? (
                    <div className="flex flex-col gap-3">
                      <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 px-3 py-2">
                        <p className="text-[11px] text-muted-foreground">
                          Default caption & hashtags for all platforms. Switch to a specific platform tab to override.
                        </p>
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
                    </div>
                  ) : (
                    (() => {
                      const acc = accounts.find((a) => a.id === activeContentTab);
                      if (!acc) return null;
                      const Icon = PLATFORM_ICONS[acc.platform];
                      const platformCaption = perPlatformCaptions[acc.id];
                      const platformTags = perPlatformHashtags[acc.id];
                      const hasCustomCaption = platformCaption !== undefined;
                      const hasCustomTags = platformTags !== undefined;
                      const inputVal = perPlatformHashtagInputs[acc.id] || "";
                      return (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 px-3 py-2">
                            {Icon && (
                              <span className={cn("flex size-5 shrink-0 items-center justify-center rounded p-0.5", PLATFORM_COLORS[acc.platform] || "bg-muted")}>
                                <Icon className="size-3" />
                              </span>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                              Custom content for <span className="font-semibold text-foreground">{acc.accountName}</span>. Leave empty to use the default.
                            </p>
                          </div>
                          {/* Caption */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Caption</Label>
                              {hasCustomCaption && (
                                <button
                                  type="button"
                                  onClick={() => setPerPlatformCaptions((p) => { const n = { ...p }; delete n[acc.id]; return n; })}
                                  className="text-[10px] text-muted-foreground hover:text-foreground"
                                >
                                  Reset to default
                                </button>
                              )}
                            </div>
                            <Textarea
                              value={hasCustomCaption ? platformCaption : caption}
                              onChange={(e) => setPerPlatformCaptions((p) => ({ ...p, [acc.id]: e.target.value }))}
                              rows={3}
                              placeholder={caption || "Write a caption..."}
                              className={cn("resize-none text-sm", hasCustomCaption && "border-primary/30 bg-primary/5")}
                            />
                            {!hasCustomCaption && (
                              <p className="text-[10px] text-muted-foreground">Using default caption. Type to customize.</p>
                            )}
                          </div>
                          {/* Hashtags */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hashtags</Label>
                              {hasCustomTags && (
                                <button
                                  type="button"
                                  onClick={() => setPerPlatformHashtags((p) => { const n = { ...p }; delete n[acc.id]; return n; })}
                                  className="text-[10px] text-muted-foreground hover:text-foreground"
                                >
                                  Reset to default
                                </button>
                              )}
                            </div>
                            {(hasCustomTags ? platformTags : hashtags).length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {(hasCustomTags ? platformTags : hashtags).map((tag) => (
                                  <span key={tag} className={cn(
                                    "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                                    hasCustomTags ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                  )}>
                                    #{tag}
                                    {hasCustomTags ? (
                                      <button type="button" onClick={() => removePlatformHashtag(acc.id, tag)} className="opacity-60 hover:opacity-100">
                                        <IconX size={10} />
                                      </button>
                                    ) : null}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Input
                                value={inputVal}
                                onChange={(e) => setPerPlatformHashtagInputs((p) => ({ ...p, [acc.id]: e.target.value }))}
                                placeholder="Add hashtag..."
                                className={cn("text-sm", hasCustomTags && "border-primary/30")}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (!hasCustomTags) {
                                      // Initialize with defaults + new tag
                                      const t = inputVal.trim().replace(/^#/, "");
                                      if (t) {
                                        setPerPlatformHashtags((p) => ({ ...p, [acc.id]: [...hashtags, t] }));
                                        setPerPlatformHashtagInputs((p) => ({ ...p, [acc.id]: "" }));
                                      }
                                    } else {
                                      addPlatformHashtag(acc.id);
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (!hasCustomTags) {
                                    const t = inputVal.trim().replace(/^#/, "");
                                    if (t) {
                                      setPerPlatformHashtags((p) => ({ ...p, [acc.id]: [...hashtags, t] }));
                                      setPerPlatformHashtagInputs((p) => ({ ...p, [acc.id]: "" }));
                                    }
                                  } else {
                                    addPlatformHashtag(acc.id);
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                            {!hasCustomTags && (
                              <p className="text-[10px] text-muted-foreground">Using default hashtags. Add one to customize.</p>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              ) : (
                <>
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
                </>
              )}

              {/* Submit */}
              <div className="flex items-center justify-between border-t pt-3">
                <button
                  type="button"
                  onClick={() => { if (!clip) setStep("clip"); else onOpenChange(false); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ← Back
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePostNow}
                    disabled={selectedAccountIds.size === 0 || schedulePost.isPending}
                  >
                    {schedulePost.isPending ? "Posting..." : "Post Now"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={selectedAccountIds.size === 0 || !scheduledAt || schedulePost.isPending}
                    className="min-w-28"
                  >
                    {schedulePost.isPending ? "Scheduling..." : "Schedule Post"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
