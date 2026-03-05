"use client";

import { useState } from "react";
import {
  IconX,
  IconCheck,
  IconBrandTiktok,
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandYoutube,
  IconBrandTwitter,
  IconCalendar,
  IconSend,
  IconHash,
  IconLoader2,
  IconClock,
} from "@tabler/icons-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DateTimeScrollPicker } from "@/components/ui/date-time-scroll-picker";
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
  tiktok: { label: "TikTok", icon: <IconBrandTiktok size={13} />, color: "text-white", bg: "bg-black" },
  instagram: { label: "Instagram", icon: <IconBrandInstagram size={13} />, color: "text-white", bg: "bg-gradient-to-br from-purple-500 to-pink-500" },
  facebook: { label: "Facebook", icon: <IconBrandFacebook size={13} />, color: "text-white", bg: "bg-blue-600" },
  youtube: { label: "YouTube", icon: <IconBrandYoutube size={13} />, color: "text-white", bg: "bg-red-500" },
  twitter: { label: "Twitter / X", icon: <IconBrandTwitter size={13} />, color: "text-white", bg: "bg-sky-500" },
  threads: { label: "Threads", icon: <svg width={13} height={13} viewBox="0 0 192 192" fill="currentColor"><path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.24-38.142 34.573.504 9.789 5.27 18.216 13.418 23.711 6.882 4.638 15.733 6.949 24.907 6.505 12.107-.585 21.592-5.072 28.18-13.333 5.005-6.275 8.13-14.38 9.467-24.56 5.672 3.428 9.904 7.894 12.44 13.248 4.313 9.108 4.566 24.063-3.462 32.091-7.065 7.065-15.556 10.123-28.468 10.217-14.327-.104-25.166-4.716-32.218-13.712C77.224 141.854 73.376 127.86 73.26 112c.116-15.86 3.964-29.854 11.44-41.566 7.052-8.996 17.891-13.608 32.218-13.712 14.44.106 25.384 4.77 32.524 13.862 3.472 4.422 6.098 9.88 7.865 16.268l14.47-3.992c-2.26-8.164-5.79-15.26-10.594-21.218-9.758-12.44-24.016-18.87-42.36-18.992h-.12c-18.216.122-32.383 6.558-42.12 19.126C68.091 77.372 63.49 93.57 63.36 112l.001.12c.13 18.43 4.731 34.628 13.283 46.776 9.737 12.568 23.904 18.998 42.12 19.104h.12c16.072-.113 27.438-4.546 36.768-14.352 11.736-12.348 11.39-27.756 5.852-39.464-3.972-8.394-10.908-15.186-20.1-19.68l.133.484ZM110.45 134.2c-10.16.588-20.72-3.98-21.26-14.46-.4-7.78 5.5-16.46 25.14-17.59 2.2-.127 4.35-.19 6.46-.19 6.27 0 12.14.59 17.49 1.72-1.99 24.78-14.68 29.93-27.83 30.52Z" /></svg>, color: "text-white", bg: "bg-black" },
};

export function SchedulePostModal({
  open,
  onOpenChange,
  clip,
  workspaceId,
}: SchedulePostModalProps) {
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const [caption, setCaption] = useState(clip.title || "");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>(() =>
    (clip.hooks || [])
      .flatMap((h) => h.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/))
      .filter((w) => w.length > 3)
      .slice(0, 6)
  );
  const [postType, setPostType] = useState<"immediate" | "scheduled">("scheduled");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const { data: accounts = [], isLoading } = useSocialAccounts(workspaceId);
  const schedulePost = useSchedulePost(workspaceId);

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

  function addHashtag() {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) setHashtags((p) => [...p, tag]);
    setHashtagInput("");
  }

  async function handleSubmit() {
    setSubmitAttempted(true);
    if (selectedAccountIds.size === 0) return;
    if (postType === "scheduled" && !scheduledDate) return;

    const promises = Array.from(selectedAccountIds).map((accountId) =>
      schedulePost.mutateAsync({
        workspaceId,
        clipId: clip.id,
        socialAccountId: accountId,
        postType,
        caption,
        hashtags,
        scheduledAt: postType === "scheduled" ? scheduledDate?.toISOString() : undefined,
      })
    );

    await Promise.all(promises);
    onOpenChange(false);
  }

  const selectedAccounts = accounts.filter((a) => selectedAccountIds.has(a.id));
  const canSubmit =
    selectedAccountIds.size > 0 &&
    !schedulePost.isPending &&
    (postType === "immediate" || !!scheduledDate);

  // Step management
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl gap-0 p-0 overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-base font-semibold">Schedule Post</DialogTitle>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className={cn(
                "flex items-center gap-1.5",
                step === 1 ? "text-primary" : "text-emerald-500"
              )}>
                {step > 1 ? <IconCheck size={13} className="text-emerald-500" /> : <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>}
                Pick clip
              </span>
              <span className="text-muted-foreground/40">—</span>
              <span className={cn(
                "flex items-center gap-1.5",
                step === 2 ? "text-primary" : "text-muted-foreground"
              )}>
                <span className={cn(
                  "flex size-4 items-center justify-center rounded-full text-[10px] font-bold",
                  step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>2</span>
                Details
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <IconX size={16} />
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Left: clip preview */}
          <div className="flex w-52 shrink-0 flex-col gap-3 border-r bg-muted/20 p-4">
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-muted shadow-sm">
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
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-xs text-primary hover:underline text-left"
            >
              Change clip
            </button>
          </div>

          {/* Right: form */}
          <div className="flex flex-1 flex-col overflow-y-auto max-h-[520px]">
            <div className="flex flex-col gap-5 p-5">

              {/* Account selector — multi-select */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Post to</p>
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
                          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full overflow-hidden bg-muted">
                            {acc.avatarUrl ? (
                              <img src={acc.avatarUrl} alt={acc.accountName} className="size-full object-cover" />
                            ) : (
                              <span className={cn("flex size-full items-center justify-center rounded-full", meta?.bg || "bg-muted", meta?.color || "")}>
                                {meta?.icon || acc.platform[0].toUpperCase()}
                              </span>
                            )}
                            <span className={cn("absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-background", meta?.bg || "bg-muted", meta?.color || "")}>
                              {meta?.icon ? <span className="scale-[0.7]">{meta.icon}</span> : null}
                            </span>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold">{acc.accountName}</p>
                            <p className="text-[11px] text-muted-foreground">{meta?.label || acc.platform}</p>
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
                {submitAttempted && selectedAccountIds.size === 0 && accounts.length > 0 && (
                  <p className="text-xs text-red-500">Please select at least one account</p>
                )}
              </div>

              {/* Date & Time */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date & Time</p>
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
                      {type === "immediate" ? <IconSend size={14} /> : <IconClock size={14} />}
                      {type === "immediate" ? "Post now" : "Schedule"}
                    </button>
                  ))}
                </div>
                {postType === "scheduled" && (
                  <DateTimeScrollPicker value={scheduledDate} onChange={setScheduledDate} />
                )}
                {submitAttempted && postType === "scheduled" && !scheduledDate && (
                  <p className="text-xs text-red-500">Please pick a date and time</p>
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
                  <Button type="button" variant="outline" onClick={addHashtag}>
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto border-t bg-muted/20 px-5 py-4">
              {selectedAccounts.length > 0 && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Posting to{" "}
                  {selectedAccounts.length === 1 ? (
                    <>
                      <span className="font-medium text-foreground">{selectedAccounts[0].accountName}</span>
                      {" on "}
                      <span className="font-medium text-foreground">{PLATFORM_META[selectedAccounts[0].platform]?.label || selectedAccounts[0].platform}</span>
                    </>
                  ) : (
                    <span className="font-medium text-foreground">{selectedAccounts.length} accounts</span>
                  )}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  ← Back
                </Button>
                <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={!canSubmit}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
