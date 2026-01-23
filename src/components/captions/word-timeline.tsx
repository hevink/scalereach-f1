"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { CaptionWord } from "@/lib/api/captions";
import { cn } from "@/lib/utils";

interface WordTimelineProps {
  words: CaptionWord[];
  duration: number;
  currentTime: number;
  selectedWordId: string | null;
  onWordSelect: (wordId: string) => void;
  onWordTimingChange: (wordId: string, start: number, end: number) => void;
  onSeek: (time: number) => void;
}

export function WordTimeline({
  words,
  duration,
  currentTime,
  selectedWordId,
  onWordSelect,
  onWordTimingChange,
  onSeek,
}: WordTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    wordId: string;
    edge: "start" | "end" | "move";
    initialX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);

  const timeToPosition = useCallback(
    (time: number) => {
      if (duration <= 0) return 0;
      return (time / duration) * 100;
    },
    [duration]
  );

  const positionToTime = useCallback(
    (clientX: number) => {
      if (!containerRef.current || duration <= 0) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      return (x / rect.width) * duration;
    },
    [duration]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, wordId: string, edge: "start" | "end" | "move") => {
      e.stopPropagation();
      const word = words.find((w) => w.id === wordId);
      if (!word) return;

      setDragging({
        wordId,
        edge,
        initialX: e.clientX,
        initialStart: word.start,
        initialEnd: word.end,
      });
      onWordSelect(wordId);
    },
    [words, onWordSelect]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return;

      const time = positionToTime(e.clientX);
      const word = words.find((w) => w.id === dragging.wordId);
      if (!word) return;

      let newStart = word.start;
      let newEnd = word.end;

      if (dragging.edge === "start") {
        newStart = Math.max(0, Math.min(time, word.end - 0.1));
      } else if (dragging.edge === "end") {
        newEnd = Math.min(duration, Math.max(time, word.start + 0.1));
      } else {
        const delta = time - positionToTime(dragging.initialX);
        newStart = Math.max(0, dragging.initialStart + delta);
        newEnd = Math.min(duration, dragging.initialEnd + delta);
        if (newStart < 0) {
          newEnd -= newStart;
          newStart = 0;
        }
        if (newEnd > duration) {
          newStart -= newEnd - duration;
          newEnd = duration;
        }
      }

      onWordTimingChange(dragging.wordId, Number(newStart.toFixed(3)), Number(newEnd.toFixed(3)));
    },
    [dragging, words, duration, positionToTime, onWordTimingChange]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragging) return;
      const time = positionToTime(e.clientX);
      onSeek(time);
    },
    [dragging, positionToTime, onSeek]
  );

  return (
    <div className="w-full space-y-2">
      <div
        ref={containerRef}
        className="relative h-16 bg-muted rounded-lg cursor-pointer overflow-hidden"
        onClick={handleTimelineClick}
      >
        {/* Time markers */}
        <div className="absolute inset-x-0 top-0 h-4 flex items-center px-1 text-[10px] text-muted-foreground">
          {Array.from({ length: Math.ceil(duration / 5) + 1 }, (_, i) => (
            <span
              key={i}
              className="absolute"
              style={{ left: `${timeToPosition(i * 5)}%` }}
            >
              {i * 5}s
            </span>
          ))}
        </div>

        {/* Words */}
        <div className="absolute inset-x-0 top-5 bottom-1 px-1">
          {words.map((word) => {
            const left = timeToPosition(word.start);
            const width = timeToPosition(word.end) - left;
            const isSelected = word.id === selectedWordId;
            const isCurrent = currentTime >= word.start && currentTime <= word.end;

            return (
              <div
                key={word.id}
                className={cn(
                  "absolute h-full rounded flex items-center justify-center text-xs font-medium cursor-move select-none",
                  isSelected
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1"
                    : isCurrent
                    ? "bg-primary/80 text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                style={{
                  left: `${left}%`,
                  width: `${Math.max(width, 2)}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onWordSelect(word.id);
                }}
                onMouseDown={(e) => handleMouseDown(e, word.id, "move")}
              >
                {/* Left resize handle */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleMouseDown(e, word.id, "start")}
                />

                <span className="truncate px-1">{word.word}</span>

                {/* Right resize handle */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50"
                  onMouseDown={(e) => handleMouseDown(e, word.id, "end")}
                />
              </div>
            );
          })}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
          style={{ left: `${timeToPosition(currentTime)}%` }}
        />
      </div>

      {/* Duration info */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{currentTime.toFixed(1)}s</span>
        <span>{duration.toFixed(1)}s</span>
      </div>
    </div>
  );
}
