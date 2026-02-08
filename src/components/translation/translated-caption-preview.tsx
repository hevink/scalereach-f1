"use client";

import { useState } from "react";
import {
  IconLanguage,
  IconLoader2,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useClipTranslationLanguages,
  useTranslatedCaptions,
} from "@/hooks/useTranslations";

interface TranslatedCaptionPreviewProps {
  clipId: string;
  originalTranscript?: string;
}

export function TranslatedCaptionPreview({
  clipId,
  originalTranscript,
}: TranslatedCaptionPreviewProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>();

  const { data: languages, isLoading: languagesLoading } =
    useClipTranslationLanguages(clipId);

  const { data: translatedCaptions, isLoading: captionsLoading } =
    useTranslatedCaptions(clipId, selectedLanguage);

  if (languagesLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="size-3 animate-spin" />
        Loading translations...
      </div>
    );
  }

  if (!languages || languages.length === 0) {
    return null;
  }

  const translatedText = translatedCaptions?.words
    ?.map((w) => w.word)
    .join(" ");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <IconLanguage className="size-4 text-muted-foreground" />
        <Select
          value={selectedLanguage || "original"}
          onValueChange={(v) =>
            setSelectedLanguage(v === "original" ? undefined : (v || undefined))
          }
        >
          <SelectTrigger className="h-7 w-40 text-xs">
            <SelectValue placeholder="Original" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">Original</SelectItem>
            {languages.map((lang) => (
              <SelectItem key={lang.language} value={lang.language}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedLanguage && (
          <Badge variant="secondary" className="text-xs">
            Translated
          </Badge>
        )}
      </div>

      {selectedLanguage && (
        <div className="text-sm text-muted-foreground leading-relaxed">
          {captionsLoading ? (
            <div className="flex items-center gap-2">
              <IconLoader2 className="size-3 animate-spin" />
              Loading translated captions...
            </div>
          ) : translatedText ? (
            <p>{translatedText}</p>
          ) : (
            <p className="italic">No translated captions available.</p>
          )}
        </div>
      )}

      {!selectedLanguage && originalTranscript && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {originalTranscript}
        </p>
      )}
    </div>
  );
}
