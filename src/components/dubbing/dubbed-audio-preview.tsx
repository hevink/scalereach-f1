"use client";

import { useRef } from "react";
import { IconPlayerPlay, IconPlayerPause, IconLoader2 } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDubbingPreview } from "@/hooks/useDubbing";

interface DubbedAudioPreviewProps {
  dubbingId: string;
}

export function DubbedAudioPreview({ dubbingId }: DubbedAudioPreviewProps) {
  const { data: preview, isLoading } = useDubbingPreview(dubbingId);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="size-4 animate-spin" />
        Loading preview...
      </div>
    );
  }

  if (!preview?.url) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={preview.url}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 h-7 text-xs"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <IconPlayerPause className="size-3" />
        ) : (
          <IconPlayerPlay className="size-3" />
        )}
        {isPlaying ? "Pause" : "Preview"}
      </Button>
    </div>
  );
}
