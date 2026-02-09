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
  const isKaraoke = style?.highlightEnabled;

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
            className="flex flex-wrap justify-center gap-x-2 gap-y-1"
            style={{ textAlign: style.alignment || "center" }}
          >
            {visibleWords.map((word) => {
              const isCurrent = word.id === currentWordId;
              const isPast = word.end < currentTime;
              const outlineWidth = style.outlineWidth ?? 3;
              const highlightScale = (style.highlightScale ?? 125) / 100;
              const isScaled = isKaraoke && isCurrent;
              const scaleMargin = isScaled ? `0 ${Math.round((highlightScale - 1) * (style.fontSize || 24) * 0.5)}px` : "0 2px";

              // Build text shadow to match ASS rendering
              const textShadow = style.shadow
                ? `0 0 ${outlineWidth}px ${style.outlineColor || "#000000"},
                   0 0 ${outlineWidth * 2}px ${style.outlineColor || "#000000"},
                   2px 2px 4px rgba(0, 0, 0, 0.9)`
                : `0 0 ${outlineWidth}px ${style.outlineColor || "#000000"},
                   0 0 ${outlineWidth * 2}px ${style.outlineColor || "#000000"}`;

              return (
                <span
                  key={word.id}
                  className="transition-all duration-150 inline-block"
                  style={{
                    fontFamily: style.fontFamily || "sans-serif",
                    fontSize: `${style.fontSize || 24}px`,
                    fontWeight: 700,
                    margin: scaleMargin,
                    color:
                      isCurrent && isKaraoke && style.highlightColor
                        ? style.highlightColor
                        : style.textColor || "#FFFFFF",
                    transform: isKaraoke && isCurrent ? `scale(${highlightScale})` : "scale(1)",
                    opacity: isPast ? 0.7 : 1,
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
