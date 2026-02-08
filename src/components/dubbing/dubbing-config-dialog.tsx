"use client";

import { useState } from "react";
import { IconVolume, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { VoiceSelector } from "./voice-selector";
import { useStartDubbing } from "@/hooks/useDubbing";
import type { TTSVoice } from "@/lib/api/dubbing";

interface DubbingConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  translationId: string;
  videoId: string;
  targetLanguage: string;
}

export function DubbingConfigDialog({
  open,
  onOpenChange,
  translationId,
  videoId,
  targetLanguage,
}: DubbingConfigDialogProps) {
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice | null>(null);
  const [audioMode, setAudioMode] = useState<"duck" | "replace">("duck");
  const [duckVolume, setDuckVolume] = useState(0.15);
  const startDubbing = useStartDubbing();

  const handleStart = () => {
    if (!selectedVoice) return;

    startDubbing.mutate(
      {
        translationId,
        videoId,
        params: {
          voiceId: selectedVoice.voiceId,
          voiceName: selectedVoice.name,
          audioMode,
          duckVolume: audioMode === "duck" ? duckVolume : undefined,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedVoice(null);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconVolume className="size-5" />
            AI Voice Dubbing
          </DialogTitle>
          <DialogDescription>
            Generate AI voiceover for the translated audio track.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Voice Selection */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Voice</Label>
            <VoiceSelector
              selectedVoiceId={selectedVoice?.voiceId}
              onSelect={setSelectedVoice}
              language={targetLanguage}
            />
          </div>

          {/* Audio Mode */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Audio Mode</Label>
            <Select
              value={audioMode}
              onValueChange={(v) => setAudioMode(v as "duck" | "replace")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="duck">
                  <div className="flex flex-col">
                    <span>Duck (Recommended)</span>
                    <span className="text-xs text-muted-foreground">
                      Reduce original audio and overlay voice
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="replace">
                  <div className="flex flex-col">
                    <span>Replace</span>
                    <span className="text-xs text-muted-foreground">
                      Replace original audio entirely
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duck Volume Slider */}
          {audioMode === "duck" && (
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Original Audio Volume: {Math.round(duckVolume * 100)}%
              </Label>
              <Slider
                value={[duckVolume]}
                onValueChange={(value) => setDuckVolume(Array.isArray(value) ? value[0] : value)}
                min={0}
                max={0.5}
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                How loud the original audio should be behind the voiceover
              </p>
            </div>
          )}

          {startDubbing.isError && (
            <p className="text-sm text-destructive">
              {(startDubbing.error as any)?.response?.data?.error ||
                "Failed to start dubbing"}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={!selectedVoice || startDubbing.isPending}
            className="gap-2"
          >
            {startDubbing.isPending && (
              <IconLoader2 className="size-4 animate-spin" />
            )}
            Start Dubbing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
