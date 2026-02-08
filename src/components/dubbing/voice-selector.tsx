"use client";

import { useState, useMemo } from "react";
import { IconSearch, IconPlayerPlay, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTTSVoices } from "@/hooks/useDubbing";
import type { TTSVoice } from "@/lib/api/dubbing";

interface VoiceSelectorProps {
  selectedVoiceId?: string;
  onSelect: (voice: TTSVoice) => void;
  language?: string;
  disabled?: boolean;
}

export function VoiceSelector({
  selectedVoiceId,
  onSelect,
  language,
  disabled = false,
}: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const { data: voices, isLoading } = useTTSVoices("elevenlabs", language);

  const filteredVoices = useMemo(() => {
    if (!voices) return [];
    if (!search) return voices;
    const lower = search.toLowerCase();
    return voices.filter(
      (v) =>
        v.name.toLowerCase().includes(lower) ||
        v.labels?.accent?.toLowerCase().includes(lower) ||
        v.labels?.gender?.toLowerCase().includes(lower)
    );
  }, [voices, search]);

  const selectedVoice = voices?.find((v) => v.voiceId === selectedVoiceId);

  const handlePreview = (e: React.MouseEvent, voice: TTSVoice) => {
    e.stopPropagation();
    if (!voice.previewUrl) return;

    setPreviewingId(voice.voiceId);
    const audio = new Audio(voice.previewUrl);
    audio.onended = () => setPreviewingId(null);
    audio.onerror = () => setPreviewingId(null);
    audio.play().catch(() => setPreviewingId(null));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button
          variant="outline"
          className="w-full justify-start text-sm"
          disabled={disabled}
        >
          {selectedVoice ? selectedVoice.name : "Select a voice..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search voices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredVoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No voices found
            </p>
          ) : (
            <div className="p-1">
              {filteredVoices.map((voice) => (
                <button
                  key={voice.voiceId}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-accent cursor-pointer ${selectedVoiceId === voice.voiceId ? "bg-accent" : ""
                    }`}
                  onClick={() => {
                    onSelect(voice);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{voice.name}</span>
                    {voice.labels && (
                      <span className="text-xs text-muted-foreground">
                        {[voice.labels.gender, voice.labels.accent, voice.labels.age]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </div>
                  {voice.previewUrl && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 shrink-0"
                      onClick={(e) => handlePreview(e, voice)}
                    >
                      {previewingId === voice.voiceId ? (
                        <IconLoader2 className="size-3.5 animate-spin" />
                      ) : (
                        <IconPlayerPlay className="size-3.5" />
                      )}
                    </Button>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
