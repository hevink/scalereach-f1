"use client";

import { useMemo } from "react";
import { CaptionWord, CaptionStyle } from "@/lib/api/captions";
import { cn } from "@/lib/utils";

interface CaptionLivePreviewProps {
  words: CaptionWord[];
  style: CaptionStyle | null;
  currentTime: number;
  className?: string;
}

/**
 * Live preview of captions with word-by-word highlighting
 * Shows the karaoke effect - current word scales up (1.2x)
 */
export function CaptionLivePreview({
  words,
  style,
  currentTime,
  className,
}: CaptionLivePreviewProps) {
  // Find which word is currently being spoken
  const currentWordId = useMemo(() => {
    const word = words.find((w) => currentTime >= w.start && currentTime <= w.end);
    return word?.id ?? null;
  }, [words, currentTime]);

  // Get visible words (show a window of words around current time)
  const visibleWords = useMemo(() => {
    // Show words within ±2 seconds of current time, or all if few words
    if (words.length <= 10) return words;
    
    return words.filter(
      (w) => w.end >= currentTime - 2 && w.start <= currentTime + 2
    );
  }, [words, currentTime]);

  if (!style || words.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-24 bg-black/80 rounded-lg", className)}>
        <span className="text-white/50 text-sm">No captions</span>
      </div>
    );
  }

  const isKaraoke = style.animation === "karaoke" || style.animation === "word-by-word";
  const position = style.position || "bottom";

  return (
    <div
      className={cn(
        "relative h-24 bg-black/80 rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Caption container */}
      <div
        className={cn(
          "absolute inset-x-0 px-4 flex flex-wrap justify-center gap-x-2 gap-y-1",
          position === "top" && "top-2",
          position === "center" && "top-1/2 -translate-y-1/2",
          position === "bottom" && "bottom-2"
        )}
        style={{
          textAlign: style.alignment || "center",
        }}
      >
        {visibleWords.map((word) => {
          const isCurrent = word.id === currentWordId;
          const isPast = word.end < currentTime;

          return (
            <span
              key={word.id}
              className={cn(
                "transition-all duration-150 inline-block",
                style.shadow && "drop-shadow-lg"
              )}
              style={{
                fontFamily: style.fontFamily || "sans-serif",
                fontSize: `${Math.min((style.fontSize || 24) * 0.5, 24)}px`,
                color: isCurrent && style.highlightEnabled && style.highlightColor
                  ? style.highlightColor
                  : style.textColor || "#FFFFFF",
                transform: isKaraoke && isCurrent ? "scale(1.2)" : "scale(1)",
                opacity: isPast ? 0.6 : 1,
                WebkitTextStroke: style.outline
                  ? `1px ${style.outlineColor || "#000000"}`
                  : undefined,
              }}
            >
              {word.word}
            </span>
          );
        })}
      </div>

      {/* Time indicator */}
      <div className="absolute bottom-1 right-2 text-[10px] text-white/40">
        {currentTime.toFixed(1)}s
      </div>
    </div>
  );
}
