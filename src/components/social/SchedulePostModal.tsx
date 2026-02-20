"use client";

import { useState } from "react";
import {
  IconX,
  IconCheck,
  IconBrandTiktok,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBrandTwitter,
  IconCalendar,
  IconSend,
  IconHash,
  IconLoader2,
} from "@tabler/icons-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useSchedulePost } from "@/hooks/useScheduledPosts";
import type { ClipResponse } from "@/lib/api/clips";

interface SchedulePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clip: ClipResponse;
  workspaceId: string;
  workspaceSlug: string;
}

const PLATFORM_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  tiktok:    { label: "TikTok",      icon: <IconBrandTiktok size={13} />,    color: "text-white", bg: "bg-black" },
  instagram: { label: "Instagram",   icon: <IconBrandInstagram size={13} />, color: "text-white", bg: "bg-gradient-to-br from-purple-500 to-pink-500" },
  youtube:   { label: "YouTube",     icon: <IconBrandYoutube size={13} />,   color: "text-white", bg: "bg-red-500" },
  twitter:   { label: "Twitter / X", icon: <IconBrandTwitter size={13} />,   color: "text-white", bg: "bg-sky-500" },
};

export function SchedulePostModal({
  open,
  onOpenChange,
  clip,
  workspaceId,
}: SchedulePostModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [caption, setCaption] = useState(clip.title || "");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [postType, setPostType] = useState<"immediate" | "scheduled">("scheduled");
  const [scheduledAt, setScheduledAt] = useState("");

  const { data: accounts = [], isLoading } = useSocialAccounts(workspaceId);
  const schedulePost = useSchedulePost(workspaceId);

  function addHashtag() {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) setHashtags((p) => [...p, tag]);
    setHashtagInput("");
  }

  async function handleSubmit() {
    if (!selectedAccountId) return;
    await schedulePost.mutateAsync({
      workspaceId,
      clipId: clip.id,
      socialAccountId: selectedAccountId,
      postType,
      caption,
      hashtags,
      scheduledAt: postType === "scheduled" ? scheduledAt : undefined,
    });
    onOpenChange(false);
  }

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const canSubmit = !!selectedAccountId && !schedulePost.isPending && (postType === "immediate" || !!scheduledAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <DialogTitle className="text-base font-semibold">Schedule Post</DialogTitle>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{clip.title || "Untitled clip"}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="flex">
          {/* Left: clip preview */}
          <div className="flex w-44 shrink-0 flex-col gap-3 border-r bg-muted/20 p-4">
            <div className="relative aspect-9/16 w-full overflow-hidden rounded-xl bg-muted shadow-sm">
              {clip.thumbnailUrl ? (
                <img src={clip.thumbnailUrl} alt={clip.title || ""} className="absolute inset-0 size-full object-cover" />
              ) : clip.storageUrl ? (
                <video
                  src={clip.storageUrl}
                  className="absolute inset-0 size-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                  onLoadedMetadata={(e) => { (e.currentTarget as HTMLVideoElement).currentTime = 1; }}
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <span className="text-[10px] text-muted-foreground/40">No preview</span>
                </div>
              )}
            </div>
            <p className="line-clamp-3 text-xs font-medium leading-snug text-foreground">
              {clip.title || <span className="italic text-muted-foreground">Untitled clip</span>}
            </p>
            {clip.duration && (
              <span className="text-[11px] text-muted-foreground">{Math.round(clip.duration)}s</span>
            )}
          </div>

          {/* Right: form */}
          <div className="flex flex-1 flex-col overflow-y-auto max-h-[520px]">
            <div className="flex flex-col gap-5 p-5">

              {/* Account selector */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Post to</p>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IconLoader2 size={13} className="animate-spin" /> Loading accounts...
                  </div>
                ) : accounts.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    No connected accounts. Go to Social → Connected Accounts to add one.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {accounts.map((acc) => {
                      const meta = PLATFORM_META[acc.platform];
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
                          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", meta?.bg || "bg-muted", meta?.color || "")}>
                            {meta?.icon || acc.platform[0].toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold">{acc.accountName}</p>
                            <p className="text-[11px] text-muted-foreground">{meta?.label || acc.platform}</p>
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

              {/* When to post */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">When to post</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["immediate", "scheduled"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPostType(type)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all",
                        postType === type
                          ? "border-primary bg-primary/8 text-primary"
                          : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {type === "immediate" ? <IconSend size={14} /> : <IconCalendar size={14} />}
                      {type === "immediate" ? "Post now" : "Schedule"}
                    </button>
                  ))}
                </div>
                {postType === "scheduled" && (
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="text-sm"
                  />
                )}
              </div>

              {/* Caption */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Caption</p>
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
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hashtags</p>
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
                  <div className="relative flex-1">
                    <IconHash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      placeholder="Add hashtag..."
                      className="pl-8 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addHashtag} className="shrink-0">
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto border-t bg-muted/20 px-5 py-4">
              {selectedAccount && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Posting to <span className="font-medium text-foreground">{selectedAccount.accountName}</span> on <span className="font-medium text-foreground">{PLATFORM_META[selectedAccount.platform]?.label || selectedAccount.platform}</span>
                </p>
              )}
              <Button className="w-full gap-2" onClick={handleSubmit} disabled={!canSubmit}>
                {schedulePost.isPending ? (
                  <><IconLoader2 size={15} className="animate-spin" /> Scheduling...</>
                ) : postType === "immediate" ? (
                  <><IconSend size={15} /> Post Now</>
                ) : (
                  <><IconCalendar size={15} /> Schedule Post</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
