"use client";

import {
  IconVolume,
  IconLoader2,
  IconTrash,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDubbingsByVideo, useDeleteDubbing } from "@/hooks/useDubbing";
import { DubbingStatusBadge } from "./dubbing-status-badge";
import { DubbedAudioPreview } from "./dubbed-audio-preview";
import type { VoiceDubbing } from "@/lib/api/dubbing";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German",
  it: "Italian", pt: "Portuguese", nl: "Dutch", ja: "Japanese",
  ko: "Korean", zh: "Chinese", ru: "Russian", ar: "Arabic",
  hi: "Hindi", tr: "Turkish", pl: "Polish", cs: "Czech",
  sv: "Swedish", da: "Danish", nb: "Norwegian", fi: "Finnish",
  th: "Thai", vi: "Vietnamese", id: "Indonesian", ms: "Malay",
  uk: "Ukrainian", ro: "Romanian", hu: "Hungarian", el: "Greek",
};

function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

function DubbingItem({
  dubbing,
  videoId,
}: {
  dubbing: VoiceDubbing;
  videoId: string;
}) {
  const deleteDubbing = useDeleteDubbing();

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {getLanguageName(dubbing.targetLanguage)}
            </span>
            <DubbingStatusBadge
              status={dubbing.status}
              progress={dubbing.progress}
            />
          </div>
          <span className="text-xs text-muted-foreground truncate">
            {dubbing.voiceName || dubbing.voiceId} · {dubbing.audioMode}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {dubbing.status === "completed" && (
          <DubbedAudioPreview dubbingId={dubbing.id} />
        )}
        {dubbing.error && (
          <span
            className="text-xs text-destructive mr-1"
            title={dubbing.error}
          >
            {dubbing.error.slice(0, 30)}...
          </span>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={() =>
            deleteDubbing.mutate({ dubbingId: dubbing.id, videoId })
          }
          disabled={deleteDubbing.isPending}
        >
          <IconTrash className="size-4" />
        </Button>
      </div>
    </div>
  );
}

interface DubbingPanelProps {
  videoId: string;
}

export function DubbingPanel({ videoId }: DubbingPanelProps) {
  const { data: dubbings, isLoading } = useDubbingsByVideo(videoId);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <IconVolume className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Voice Dubbing</h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!dubbings || dubbings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <IconVolume className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Voice Dubbing</h3>
          <Badge variant="outline" className="text-xs">
            {dubbings.length}
          </Badge>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {dubbings.map((dubbing) => (
          <DubbingItem
            key={dubbing.id}
            dubbing={dubbing}
            videoId={videoId}
          />
        ))}
      </div>
    </div>
  );
}
