"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { CaptionWord, CaptionStyle } from "@/lib/api/captions";
import { cn } from "@/lib/utils";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VideoPreviewWithCaptionsProps {
  /** Video source URL */
  videoUrl: string;
  /** Caption words with timing */
  words: CaptionWord[];
  /** Caption style configuration */
  style: CaptionStyle | null;
  /** Callback when time updates */
  onTimeUpdate?: (time: number) => void;
  /** External time control (for syncing with timeline) */
  currentTime?: number;
  /** Callback to seek video */
  onSeek?: (time: number) => void;
  /** Additional class name */
  className?: string;
}

export function VideoPreviewWithCaptions({
  videoUrl,
  words,
  style,
  onTimeUpdate,
  currentTime: externalTime,
  onSeek,
  className,
}: VideoPreviewWithCaptionsProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [internalTime, setInternalTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentTime = externalTime ?? internalTime;

  // Find current word being spoken
  const currentWordId = useMemo(() => {
    const word = words.find((w) => currentTime >= w.start && currentTime <= w.end);
    return word?.id ?? null;
  }, [words, currentTime]);

  // Get visible words (window around current time)
  const visibleWords = useMemo(() => {
    if (words.length <= 12) return words;
    return words.filter(
      (w) => w.end >= currentTime - 3 && w.start <= currentTime + 3
    );
  }, [words, currentTime]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setInternalTime(time);
      onTimeUpdate?.(time);
    }
  }, [onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleSeek = useCallback(
    (value: number | readonly number[]) => {
      const time = Array.isArray(value) ? value[0] : value;
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setInternalTime(time);
      }
      onSeek?.(time);
    },
    [onSeek]
  );

  // Sync external time to video
  const handleExternalSeek = useCallback((time: number) => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - time) > 0.5) {
      videoRef.current.currentTime = time;
    }
  }, []);

  // Effect to sync external time
  if (externalTime !== undefined && videoRef.current) {
    const diff = Math.abs(videoRef.current.currentTime - externalTime);
    if (diff > 0.5) {
      videoRef.current.currentTime = externalTime;
    }
  }

  const position = style?.position || "bottom";
  const animation = style?.animation || "none";
  const isKaraoke = animation === "karaoke";
  const isWordByWord = animation === "word-by-word";
  const isBounce = animation === "bounce";
  const isFade = animation === "fade";

  // For word-by-word, only show words up to current (cumulative display)
  const displayWords = useMemo(() => {
    if (isWordByWord) {
      const currentIndex = words.findIndex((w) => w.id === currentWordId);
      if (currentIndex === -1) return [];
      // Show all words from start up to and including current word
      return words.slice(0, currentIndex + 1).filter((w) =>
        visibleWords.some((vw) => vw.id === w.id)
      );
    }
    return visibleWords;
  }, [isWordByWord, visibleWords, currentWordId, words]);

  return (
    <div className={cn("relative rounded-lg overflow-hidden bg-black", className)}>
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* Caption Overlay */}
      {words.length > 0 && style && (
        <div
          className={cn(
            "absolute inset-x-0 px-4 py-2 pointer-events-none",
            position === "top" && "top-4",
            position === "center" && "top-1/2 -translate-y-1/2",
            position === "bottom" && "bottom-12"
          )}
        >
          <div
            className="flex flex-wrap justify-center gap-x-2 gap-y-1 mx-auto"
            style={{
              textAlign: style.alignment || "center",
              maxWidth: `${style.maxWidth ?? 90}%`,
            }}
          >
            {displayWords.map((word) => {
              const isCurrent = word.id === currentWordId;
              const isPast = word.end < currentTime;
              const outlineWidth = style.outlineWidth ?? 3;
              const highlightScale = (style.highlightScale ?? 125) / 100;

              // Determine if word should be scaled based on animation type
              const shouldScale =
                (isKaraoke && isCurrent && style.highlightEnabled) ||
                (isWordByWord && isCurrent && style.highlightEnabled) ||
                (isBounce && isCurrent);

              const scaleMargin = shouldScale ? `0 ${Math.round((highlightScale - 1) * (style.fontSize || 24) * 0.5)}px` : "0 2px";

              // Build text shadow to match ASS rendering
              const textShadow = style.shadow
                ? `0 0 ${outlineWidth}px ${style.outlineColor || "#000000"},
                   0 0 ${outlineWidth * 2}px ${style.outlineColor || "#000000"},
                   2px 2px 4px rgba(0, 0, 0, 0.9)`
                : `0 0 ${outlineWidth}px ${style.outlineColor || "#000000"},
                   0 0 ${outlineWidth * 2}px ${style.outlineColor || "#000000"}`;

              // Determine color based on animation and highlight
              let wordColor = style.textColor || "#FFFFFF";
              if (isCurrent) {
                if ((isKaraoke || isWordByWord) && style.highlightEnabled && style.highlightColor) {
                  wordColor = style.highlightColor;
                } else if (isBounce && style.highlightEnabled && style.highlightColor) {
                  wordColor = style.highlightColor;
                }
              }

              // For bounce animation, calculate scale based on word timing
              let bounceScale = 1;
              if (isBounce && isCurrent) {
                const wordProgress = (currentTime - word.start) / (word.end - word.start);
                const bounceProgress = Math.min(wordProgress * 5, 1); // First 20% of word duration
                if (bounceProgress < 0.5) {
                  // Scale up (0 to 0.5)
                  bounceScale = 1 + (highlightScale - 1) * 0.92 * (bounceProgress * 2);
                } else {
                  // Scale down (0.5 to 1)
                  bounceScale = 1 + (highlightScale - 1) * 0.92 * (2 - bounceProgress * 2);
                }
              }

              // For fade animation, calculate opacity
              let fadeOpacity = 1;
              if (isFade) {
                if (isCurrent) {
                  const wordProgress = (currentTime - word.start) / (word.end - word.start);
                  fadeOpacity = Math.min(wordProgress * 5, 1); // Fade in over first 20%
                } else if (isPast) {
                  fadeOpacity = 1;
                } else {
                  fadeOpacity = 0;
                }
              }

              return (
                <span
                  key={word.id}
                  className={cn(
                    "inline-block",
                    (isKaraoke || isWordByWord || isBounce || isFade) && "transition-all duration-150"
                  )}
                  style={{
                    fontFamily: style.fontFamily || "sans-serif",
                    fontSize: `${style.fontSize || 24}px`,
                    fontWeight: 700,
                    margin: scaleMargin,
                    color: wordColor,
                    transform: isBounce && isCurrent
                      ? `scale(${bounceScale})`
                      : shouldScale
                        ? `scale(${highlightScale})`
                        : "scale(1)",
                    opacity: isFade ? fadeOpacity : (isPast && !isWordByWord ? 0.7 : 1),
                    WebkitTextStroke: style.outline
                      ? `${outlineWidth}px ${style.outlineColor || "#000000"}`
                      : undefined,
                    paintOrder: "stroke fill",
                    textShadow,
                    filter: isCurrent && style.glowEnabled
                      ? `drop-shadow(0 0 ${style.glowIntensity ?? 2}px ${style.glowColor || style.highlightColor || "#FFD700"})`
                      : undefined,
                    textTransform: style.textTransform === "uppercase" ? "uppercase" : "none",
                  }}
                >
                  {word.word}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />

          <span className="text-xs text-white tabular-nums min-w-[70px] text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
