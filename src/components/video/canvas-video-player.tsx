"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { IconPlayerPlay, IconPlayerPause } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import type { CaptionStyle, Caption } from "@/lib/api/captions";

interface CanvasVideoPlayerProps {
  src: string;
  captions: Caption[];
  captionStyle: CaptionStyle;
  onCaptionStyleChange: (style: Partial<CaptionStyle>) => void;
  className?: string;
}

export function CanvasVideoPlayer({
  src,
  captions,
  captionStyle,
  onCaptionStyleChange,
  className,
}: CanvasVideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Caption position (percentage)
  const [captionPos, setCaptionPos] = useState({ x: 50, y: 85 });
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0, fontSize: 32 });
  
  // Store refs for values needed in animation loop
  const captionsRef = useRef(captions);
  const captionStyleRef = useRef(captionStyle);
  const captionPosRef = useRef(captionPos);
  const currentTimeRef = useRef(currentTime);
  const isDraggingRef = useRef(isDragging);
  const isResizingRef = useRef(isResizing);

  // Update refs when values change
  useEffect(() => { captionsRef.current = captions; }, [captions]);
  useEffect(() => { captionStyleRef.current = captionStyle; }, [captionStyle]);
  useEffect(() => { captionPosRef.current = captionPos; }, [captionPos]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);
  useEffect(() => { isResizingRef.current = isResizing; }, [isResizing]);

  // Animation loop - no dependencies, uses refs
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      if (!video.paused) {
        setCurrentTime(video.currentTime);
      }

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get current caption
      const time = currentTimeRef.current;
      let text = "";
      for (const caption of captionsRef.current) {
        if (time >= caption.startTime && time <= caption.endTime) {
          text = caption.text;
          break;
        }
      }

      // Draw caption
      if (text) {
        const style = captionStyleRef.current;
        const pos = captionPosRef.current;
        const fontSize = style.fontSize || 32;
        
        ctx.font = `bold ${fontSize}px ${style.fontFamily || "Inter"}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const x = (pos.x / 100) * canvas.width;
        const y = (pos.y / 100) * canvas.height;

        // Background
        if (style.backgroundColor) {
          const metrics = ctx.measureText(text);
          const padding = 12;
          ctx.fillStyle = style.backgroundColor;
          ctx.globalAlpha = (style.backgroundOpacity || 70) / 100;
          ctx.fillRect(
            x - metrics.width / 2 - padding,
            y - fontSize / 2 - padding / 2,
            metrics.width + padding * 2,
            fontSize + padding
          );
          ctx.globalAlpha = 1;
        }

        // Shadow
        if (style.shadow) {
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        }

        // Text
        ctx.fillStyle = style.textColor || "#FFFFFF";
        ctx.fillText(text.toUpperCase(), x, y);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // Selection border
        if (isDraggingRef.current || isResizingRef.current) {
          const metrics = ctx.measureText(text);
          const hw = metrics.width / 2 + 20;
          const hh = fontSize / 2 + 10;
          
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(x - hw, y - hh, hw * 2, hh * 2);
          ctx.setLineDash([]);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  // Video metadata
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration);
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("ended", () => setIsPlaying(false));
    
    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleSeek = useCallback((value: number | readonly number[]) => {
    const video = videoRef.current;
    if (video) {
      const time = Array.isArray(value) ? value[0] : value;
      video.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const formatTime = (s: number) => {
    if (!isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Mouse handlers
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Check if clicking on caption
    const time = currentTimeRef.current;
    let text = "";
    for (const caption of captionsRef.current) {
      if (time >= caption.startTime && time <= caption.endTime) {
        text = caption.text;
        break;
      }
    }
    if (!text) return;

    const style = captionStyleRef.current;
    const pos = captionPosRef.current;
    const fontSize = style.fontSize || 32;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.font = `bold ${fontSize}px ${style.fontFamily || "Inter"}`;
    const metrics = ctx.measureText(text);

    const cx = (pos.x / 100) * canvas.width;
    const cy = (pos.y / 100) * canvas.height;
    const hw = metrics.width / 2 + 20;
    const hh = fontSize / 2 + 10;

    // Check corners for resize
    const corners = [[cx - hw, cy - hh], [cx + hw, cy - hh], [cx - hw, cy + hh], [cx + hw, cy + hh]];
    for (const [hx, hy] of corners) {
      if (Math.abs(mx - hx) < 20 && Math.abs(my - hy) < 20) {
        setIsResizing(true);
        dragStart.current = { x: e.clientY, y: 0, posX: 0, posY: 0, fontSize };
        e.stopPropagation();
        return;
      }
    }

    // Check caption area for drag
    if (mx >= cx - hw && mx <= cx + hw && my >= cy - hh && my <= cy + hh) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y, fontSize };
      e.stopPropagation();
    }
  }, []);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      if (isDragging) {
        const deltaX = ((e.clientX - dragStart.current.x) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStart.current.y) / rect.height) * 100;
        setCaptionPos({
          x: Math.max(10, Math.min(90, dragStart.current.posX + deltaX)),
          y: Math.max(10, Math.min(95, dragStart.current.posY + deltaY)),
        });
      }

      if (isResizing) {
        const deltaY = dragStart.current.x - e.clientY;
        const newSize = Math.max(16, Math.min(72, dragStart.current.fontSize + deltaY * 0.3));
        onCaptionStyleChange({ fontSize: Math.round(newSize) });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, onCaptionStyleChange]);

  return (
    <div ref={containerRef} className={cn("relative bg-black rounded-lg overflow-hidden", className)}>
      <video ref={videoRef} src={src} className="hidden" playsInline preload="auto" />
      
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        onMouseDown={handleCanvasMouseDown}
        onClick={() => { if (!isDragging && !isResizing) togglePlay(); }}
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="text-white hover:text-white/80">
            {isPlaying ? <IconPlayerPause size={24} /> : <IconPlayerPlay size={24} />}
          </button>
          
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          
          <span className="text-white text-sm tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Play overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
            <IconPlayerPlay size={32} className="text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}
