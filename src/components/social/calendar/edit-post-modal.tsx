"use client";

import { useState, useEffect } from "react";
import { parseISO } from "date-fns";
import { IconX, IconLoader2 } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { cn } from "@/lib/utils";
import { useUpdatePost, useCancelPost } from "@/hooks/useScheduledPosts";
import { useCalendarContext } from "./calendar-context";
import { PLATFORM_LABELS } from "./helpers";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

interface Props {
    workspaceId: string;
}

export function EditPostModal({ workspaceId }: Props) {
    const { editPost, closeEditModal } = useCalendarContext();
    const updatePost = useUpdatePost(workspaceId);
    const cancelPost = useCancelPost(workspaceId);

    const [caption, setCaption] = useState("");
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [hashtagInput, setHashtagInput] = useState("");
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);

    useEffect(() => {
        if (editPost) {
            setCaption(editPost.caption ?? "");
            setHashtags(editPost.hashtags ?? []);
            setHashtagInput("");
            setScheduledDate(editPost.scheduledAt ? parseISO(editPost.scheduledAt) : undefined);
        }
    }, [editPost]);

    if (!editPost) return null;

    const scheduledAt = scheduledDate?.toISOString();

    function addHashtag(tag?: string) {
        const t = (tag ?? hashtagInput).trim().replace(/^#/, "");
        if (t && !hashtags.includes(t)) setHashtags((p) => [...p, t]);
        if (!tag) setHashtagInput("");
    }

    async function handleSave() {
        await updatePost.mutateAsync({ id: editPost!.id, caption, hashtags, scheduledAt });
        closeEditModal();
    }

    async function handleCancel() {
        await cancelPost.mutateAsync(editPost!.id);
        closeEditModal();
    }

    const platformLabel = PLATFORM_LABELS[editPost.platform] ?? editPost.platform;

    return (
        <Dialog open={!!editPost} onOpenChange={(o) => !o && closeEditModal()}>
            <DialogContent className="max-w-lg gap-0 p-0 overflow-hidden [&>button]:hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                        <DialogTitle className="text-base font-semibold">Edit Post</DialogTitle>
                        <p className="mt-0.5 text-xs text-muted-foreground">{platformLabel}</p>
                    </div>
                    <button
                        type="button"
                        onClick={closeEditModal}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <IconX size={16} />
                    </button>
                </div>

                <div className="flex flex-col gap-5 p-5">
                    {/* Date & Time */}
                    {editPost.postType === "scheduled" && (
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
                    )}

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

                {/* Footer */}
                <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-4">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCancel}
                        disabled={cancelPost.isPending || updatePost.isPending}
                    >
                        {cancelPost.isPending ? <IconLoader2 size={14} className="animate-spin" /> : "Cancel Post"}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updatePost.isPending || cancelPost.isPending}
                        className="min-w-24"
                    >
                        {updatePost.isPending ? <><IconLoader2 size={14} className="animate-spin" /> Saving...</> : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
