"use client";

import { useState } from "react";
import {
  IconLanguage,
  IconLoader2,
  IconTrash,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconVolume,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useTranslations,
  useStartTranslation,
  useDeleteTranslation,
} from "@/hooks/useTranslations";
import { LanguageSelector } from "./language-selector";
import { DubbingConfigDialog } from "@/components/dubbing/dubbing-config-dialog";
import type { VideoTranslation } from "@/lib/api/translations";

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

function TranslationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
          <IconCheck className="size-3" />
          Completed
        </Badge>
      );
    case "translating":
      return (
        <Badge variant="secondary" className="gap-1">
          <IconLoader2 className="size-3 animate-spin" />
          Translating
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1">
          <IconClock className="size-3" />
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <IconAlertCircle className="size-3" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function TranslationItem({
  translation,
  videoId,
  onDub,
}: {
  translation: VideoTranslation;
  videoId: string;
  onDub: (translation: VideoTranslation) => void;
}) {
  const deleteTranslation = useDeleteTranslation();

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {getLanguageName(translation.targetLanguage)}
        </span>
        <TranslationStatusBadge status={translation.status} />
        {translation.characterCount && (
          <span className="text-xs text-muted-foreground">
            {translation.characterCount.toLocaleString()} chars
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {translation.error && (
          <span className="text-xs text-destructive mr-2" title={translation.error}>
            {translation.error.slice(0, 40)}...
          </span>
        )}
        {translation.status === "completed" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={() => onDub(translation)}
          >
            <IconVolume className="size-3" />
            Dub
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={() =>
            deleteTranslation.mutate({
              translationId: translation.id,
              videoId,
            })
          }
          disabled={deleteTranslation.isPending}
        >
          <IconTrash className="size-4" />
        </Button>
      </div>
    </div>
  );
}

interface TranslationPanelProps {
  videoId: string;
  sourceLanguage?: string;
  disabled?: boolean;
}

export function TranslationPanel({
  videoId,
  sourceLanguage,
  disabled = false,
}: TranslationPanelProps) {
  const { data: translations, isLoading } = useTranslations(videoId);
  const startTranslation = useStartTranslation();
  const [dubbingTarget, setDubbingTarget] = useState<VideoTranslation | null>(null);

  const completedLanguages = (translations || [])
    .filter((t) => t.status !== "failed")
    .map((t) => t.targetLanguage);

  const handleStartTranslation = (targetLanguage: string) => {
    startTranslation.mutate({ videoId, targetLanguage });
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <IconLanguage className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Translations</h3>
          {sourceLanguage && (
            <Badge variant="outline" className="text-xs">
              Source: {getLanguageName(sourceLanguage)}
            </Badge>
          )}
        </div>
        <LanguageSelector
          sourceLanguage={sourceLanguage}
          disabledLanguages={completedLanguages}
          onSelect={handleStartTranslation}
          disabled={disabled || startTranslation.isPending}
        />
      </div>

      <div className="p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !translations || translations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No translations yet. Click &quot;Translate&quot; to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {translations.map((translation) => (
              <TranslationItem
                key={translation.id}
                translation={translation}
                videoId={videoId}
                onDub={setDubbingTarget}
              />
            ))}
          </div>
        )}

        {startTranslation.isError && (
          <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
            <IconAlertCircle className="size-4" />
            <span>
              {(startTranslation.error as any)?.message || "Failed to start translation"}
            </span>
          </div>
        )}
      </div>

      {dubbingTarget && (
        <DubbingConfigDialog
          open={!!dubbingTarget}
          onOpenChange={(open) => !open && setDubbingTarget(null)}
          translationId={dubbingTarget.id}
          videoId={videoId}
          targetLanguage={dubbingTarget.targetLanguage}
        />
      )}
    </div>
  );
}
