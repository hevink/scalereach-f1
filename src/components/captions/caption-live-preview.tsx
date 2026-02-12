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
 * Matches the backend ASS rendering for consistent preview
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

  const animation = style.animation || "none";
  const isKaraoke = animation === "karaoke";
  const isWordByWord = animation === "word-by-word";
  const isBounce = animation === "bounce";
  const isFade = animation === "fade";
  const position = style.position || "bottom";
  const outlineWidth = style.outlineWidth ?? 3;
  const highlightScale = (style.highlightScale ?? 110) / 100;

  // Build text shadow to match ASS rendering
  const textShadow = style.shadow
    ? `0 0 ${outlineWidth}px ${style.outlineColor || "#000000"},
       0 0 ${outlineWidth * 2}px ${style.outlineColor || "#000000"},
       2px 2px 4px rgba(0, 0, 0, 0.9)`
    : `0 0 ${outlineWidth}px ${style.outlineColor || "#000000"},
       0 0 ${outlineWidth * 2}px ${style.outlineColor || "#000000"}`;

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
          maxWidth: `${style.maxWidth ?? 90}%`,
          margin: "0 auto",
        }}
      >
        {visibleWords.map((word, index) => {
          const isCurrent = word.id === currentWordId;
          const isPast = word.end < currentTime;

          // Calculate font size for preview (scaled down)
          const baseFontSize = Math.min((style.fontSize || 24) * 0.5, 24);

          // Determine if word should be scaled
          const shouldScale =
            ((isKaraoke || isWordByWord) && isCurrent && style.highlightEnabled) ||
            (isBounce && isCurrent);

          const scaleMargin = shouldScale ? `0 ${Math.round((highlightScale - 1) * baseFontSize * 0.5)}px` : "0 2px";

          // Determine color based on animation and highlight
          let wordColor = style.textColor || "#FFFFFF";
          if (isCurrent) {
            if ((isKaraoke || isWordByWord || isBounce) && style.highlightEnabled && style.highlightColor) {
              wordColor = style.highlightColor;
            }
          }

          // For bounce animation, calculate scale based on word timing
          let bounceScale = 1;
          if (isBounce && isCurrent) {
            const wordProgress = (currentTime - word.start) / (word.end - word.start);
            const bounceProgress = Math.min(wordProgress * 5, 1);
            if (bounceProgress < 0.5) {
              bounceScale = 1 + (highlightScale - 1) * 0.92 * (bounceProgress * 2);
            } else {
              bounceScale = 1 + (highlightScale - 1) * 0.92 * (2 - bounceProgress * 2);
            }
          }

          // For fade animation, calculate opacity
          let fadeOpacity = 1;
          if (isFade) {
            if (isCurrent) {
              const wordProgress = (currentTime - word.start) / (word.end - word.start);
              fadeOpacity = Math.min(wordProgress * 5, 1);
            } else if (isPast) {
              fadeOpacity = 1;
            } else {
              fadeOpacity = 0;
            }
          }

          // For word-by-word, hide future words
          if (isWordByWord && !isCurrent && !isPast) {
            return null;
          }

          return (
            <span
              key={word.id}
              className={cn(
                "transition-all duration-150 inline-block",
              )}
              style={{
                fontFamily: style.fontFamily || "sans-serif",
                fontSize: `${baseFontSize}px`,
                fontWeight: 700,
                margin: scaleMargin,
                color: wordColor,
                transform: isBounce && isCurrent
                  ? `scale(${bounceScale})`
                  : shouldScale
                    ? `scale(${highlightScale})`
                    : "scale(1)",
                opacity: isFade ? fadeOpacity : (isPast && !isWordByWord ? 0.6 : 1),
                textShadow,
                WebkitTextStroke: style.outline
                  ? `${Math.max(1, outlineWidth * 0.5)}px ${style.outlineColor || "#000000"}`
                  : undefined,
                paintOrder: "stroke fill",
                textTransform: style.textTransform === "uppercase" ? "uppercase" : "none",
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
