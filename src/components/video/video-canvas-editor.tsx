"use client";

import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    useMemo,
} from "react";
import { cn } from "@/lib/utils";
import type { Caption, CaptionStyle, CaptionWord } from "@/lib/api/captions";

// ============================================================================
// Types
// ============================================================================

export interface VideoCanvasEditorProps {
    /** Video source URL */
    src: string;
    /** Start time constraint for clip playback (seconds) */
    startTime?: number;
    /** End time constraint for clip playback (seconds) */
    endTime?: number;
    /** Captions to display */
    captions?: Caption[];
    /** Caption styling configuration */
    captionStyle?: CaptionStyle;
    /** Callback when caption style changes */
    onCaptionStyleChange?: (style: Partial<CaptionStyle>) => void;
    /** Callback when playback time updates */
    onTimeUpdate?: (time: number) => void;
    /** Aspect ratio: 9:16 (vertical), 16:9 (horizontal), 1:1 (square) */
    aspectRatio?: "9:16" | "16:9" | "1:1";
    /** Additional class names */
    className?: string;
}

export interface VideoCanvasEditorRef {
    play: () => void;
    pause: () => void;
    seek: (time: number) => void;
    getCurrentTime: () => number;
    getDuration: () => number;
}

interface Layer {
    id: string;
    type: "fill" | "caption";
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

// ============================================================================
// Constants
// ============================================================================

const ASPECT_RATIOS = {
    "9:16": { width: 9, height: 16 },
    "16:9": { width: 16, height: 9 },
    "1:1": { width: 1, height: 1 },
};

// ============================================================================
// Moveable Layer Component
// ============================================================================

interface MoveableLayerProps {
    layer: Layer;
    isSelected: boolean;
    onSelect: () => void;
    onMove: (x: number, y: number) => void;
    onResize: (width: number, height: number) => void;
    children?: React.ReactNode;
    containerScale: number;
}

function MoveableLayer({
    layer,
    isSelected,
    onSelect,
    onMove,
    onResize,
    children,
    containerScale,
}: MoveableLayerProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [layerStart, setLayerStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setLayerStart({ x: layer.x, y: layer.y });
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const dx = (e.clientX - dragStart.x) / containerScale;
            const dy = (e.clientY - dragStart.y) / containerScale;
            onMove(layerStart.x + dx, layerStart.y + dy);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragStart, layerStart, onMove, containerScale]);

    return (
        <div className="editor-transform">
            {/* Layer target area */}
            <div
                className={cn(
                    "absolute cursor-move",
                    layer.type === "fill" && "Fill-target-0",
                    layer.type === "caption" && "caption-on-canvas"
                )}
                style={{
                    top: layer.y,
                    left: layer.x,
                    width: layer.width,
                    height: layer.height,
                    transform: `rotate(${layer.rotation}deg)`,
                }}
                onMouseDown={handleMouseDown}
            >
                {children}
            </div>

            {/* Selection border - Moveable control box */}
            <div
                className={cn(
                    "moveable-control-box",
                    isSelected ? "opacity-100" : "opacity-0"
                )}
                style={{
                    position: "absolute",
                    display: "block",
                    visibility: "visible",
                    transform: `translate3d(${layer.x}px, ${layer.y}px, 0px)`,
                    "--zoom": 1,
                    "--zoompx": "1px",
                } as React.CSSProperties}
                data-able-snappable="true"
                data-able-draggable="true"
            >
                {/* Top border */}
                <div
                    className="moveable-line moveable-direction"
                    style={{
                        transform: `translateY(-50%) translate(-0.5px, 0px) rotate(0rad) scaleY(1)`,
                        width: layer.width + 1,
                        height: 1,
                        background: isSelected ? "#4f8cff" : "transparent",
                        position: "absolute",
                        top: 0,
                        left: 0,
                    }}
                />
                {/* Right border */}
                <div
                    className="moveable-line moveable-direction"
                    style={{
                        transform: `translateY(-50%) translate(${layer.width}px, -0.5px) rotate(90deg) scaleY(1)`,
                        width: layer.height + 1,
                        height: 1,
                        background: isSelected ? "#4f8cff" : "transparent",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        transformOrigin: "0 0",
                    }}
                />
                {/* Bottom border */}
                <div
                    className="moveable-line moveable-direction"
                    style={{
                        transform: `translateY(-50%) translate(${layer.width + 0.5}px, ${layer.height}px) rotate(180deg) scaleY(1)`,
                        width: layer.width + 1,
                        height: 1,
                        background: isSelected ? "#4f8cff" : "transparent",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        transformOrigin: "0 0",
                    }}
                />
                {/* Left border */}
                <div
                    className="moveable-line moveable-direction"
                    style={{
                        transform: `translateY(-50%) translate(0px, ${layer.height + 0.5}px) rotate(270deg) scaleY(1)`,
                        width: layer.height + 1,
                        height: 1,
                        background: isSelected ? "#4f8cff" : "transparent",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        transformOrigin: "0 0",
                    }}
                />
            </div>
        </div>
    );
}

// ============================================================================
// Video Canvas Editor Component
// ============================================================================

export const VideoCanvasEditor = forwardRef<VideoCanvasEditorRef, VideoCanvasEditorProps>(
    function VideoCanvasEditor(
        {
            src,
            startTime = 0,
            endTime,
            captions = [],
            captionStyle,
            onCaptionStyleChange,
            onTimeUpdate,
            aspectRatio = "9:16",
            className,
        },
        ref
    ) {
        const containerRef = useRef<HTMLDivElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const videoRef = useRef<HTMLVideoElement>(null);
        const animationRef = useRef<number>(0);

        const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
        const [canvasSize, setCanvasSize] = useState({ width: 480, height: 854 });
        const [currentTime, setCurrentTime] = useState(startTime);
        const [duration, setDuration] = useState(0);
        const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
        const [layers, setLayers] = useState<Layer[]>([]);

        // Calculate aspect ratio dimensions
        const ratio = ASPECT_RATIOS[aspectRatio];
        const aspectValue = ratio.width / ratio.height;

        // Calculate canvas display size to fit container
        const displaySize = React.useMemo(() => {
            if (containerSize.width === 0 || containerSize.height === 0) {
                return { width: 265, height: 471 };
            }

            const containerAspect = containerSize.width / containerSize.height;
            let width: number;
            let height: number;

            if (aspectValue > containerAspect) {
                // Canvas is wider than container
                width = containerSize.width * 0.6;
                height = width / aspectValue;
            } else {
                // Canvas is taller than container
                height = containerSize.height * 0.8;
                width = height * aspectValue;
            }

            return { width, height };
        }, [containerSize, aspectValue]);

        const containerScale = displaySize.width / canvasSize.width;

        // Initialize layers
        useEffect(() => {
            const fillLayer: Layer = {
                id: "fill-0",
                type: "fill",
                x: 0,
                y: 0,
                width: canvasSize.width * 0.78,
                height: canvasSize.height * 0.78,
                rotation: 0,
            };

            setLayers([fillLayer]);
        }, [canvasSize]);

        // Add caption layer when caption is active - use relative time since captions have relative timing
        useEffect(() => {
            const relativeTime = currentTime - startTime;
            const currentCaption = captions.find(
                (c) => relativeTime >= c.startTime && relativeTime <= c.endTime
            );

            if (currentCaption) {
                setLayers((prev) => {
                    const hasCaption = prev.some((l) => l.type === "caption");
                    if (hasCaption) return prev;

                    return [
                        ...prev,
                        {
                            id: "caption-0",
                            type: "caption",
                            x: canvasSize.width * 0.1,
                            y: canvasSize.height * 0.75,
                            width: canvasSize.width * 0.8,
                            height: 60,
                            rotation: 0,
                        },
                    ];
                });
            }
        }, [currentTime, startTime, captions, canvasSize]);

        // Measure container
        useEffect(() => {
            const updateSize = () => {
                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    setContainerSize({ width: rect.width, height: rect.height });
                }
            };

            updateSize();
            const observer = new ResizeObserver(updateSize);
            if (containerRef.current) observer.observe(containerRef.current);
            return () => observer.disconnect();
        }, []);

        // Render video to canvas
        useEffect(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            let isRendering = true;

            const render = () => {
                if (!isRendering) return;

                if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                    // Calculate crop to fit aspect ratio
                    const videoAspect = video.videoWidth / video.videoHeight;
                    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;

                    if (videoAspect > aspectValue) {
                        // Video is wider, crop sides
                        sw = video.videoHeight * aspectValue;
                        sx = (video.videoWidth - sw) / 2;
                    } else {
                        // Video is taller, crop top/bottom
                        sh = video.videoWidth / aspectValue;
                        sy = (video.videoHeight - sh) / 2;
                    }

                    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
                }

                animationRef.current = requestAnimationFrame(render);
            };

            // Start rendering when video has loaded data
            const handleCanPlay = () => {
                render();
            };

            video.addEventListener("canplay", handleCanPlay);

            // Also start rendering immediately in case video is already loaded
            if (video.readyState >= 2) {
                render();
            }

            return () => {
                isRendering = false;
                cancelAnimationFrame(animationRef.current);
                video.removeEventListener("canplay", handleCanPlay);
            };
        }, [aspectValue, src]);

        // Video event handlers
        const handleLoadedMetadata = useCallback(() => {
            if (videoRef.current) {
                setDuration(videoRef.current.duration);
                videoRef.current.currentTime = startTime;
            }
        }, [startTime]);

        const handleTimeUpdate = useCallback(() => {
            if (videoRef.current) {
                const time = videoRef.current.currentTime;
                setCurrentTime(time);
                onTimeUpdate?.(time);

                // Loop video when it reaches the end
                if (endTime && time >= endTime) {
                    videoRef.current.currentTime = startTime;
                    videoRef.current.play();
                }
            }
        }, [endTime, startTime, onTimeUpdate]);

        // Imperative handle
        useImperativeHandle(ref, () => ({
            play: () => videoRef.current?.play(),
            pause: () => videoRef.current?.pause(),
            seek: (time: number) => {
                if (videoRef.current) {
                    videoRef.current.currentTime = Math.max(startTime, Math.min(time, endTime ?? duration));
                }
            },
            getCurrentTime: () => videoRef.current?.currentTime ?? 0,
            getDuration: () => videoRef.current?.duration ?? 0,
        }));

        // Layer handlers
        const handleLayerMove = useCallback((layerId: string, x: number, y: number) => {
            setLayers((prev) =>
                prev.map((l) => (l.id === layerId ? { ...l, x, y } : l))
            );
        }, []);

        const handleLayerResize = useCallback((layerId: string, width: number, height: number) => {
            setLayers((prev) =>
                prev.map((l) => (l.id === layerId ? { ...l, width, height } : l))
            );
        }, []);

        const handleContainerClick = useCallback(() => {
            setSelectedLayerId(null);
        }, []);

        // Get current caption - use relative time (currentTime - startTime) since captions have relative timing
        const relativeTime = currentTime - startTime;
        const currentCaption = captions.find(
            (c) => relativeTime >= c.startTime && relativeTime <= c.endTime
        );

        // Find the currently highlighted word within the caption
        const currentWordIndex = useMemo(() => {
            if (!currentCaption?.words) return -1;
            return currentCaption.words.findIndex(
                (w) => relativeTime >= w.start && relativeTime <= w.end
            );
        }, [currentCaption, relativeTime]);

        // Render caption text with word-by-word highlighting
        const renderCaptionText = useCallback(() => {
            if (!currentCaption) return null;

            // If no words array or highlight not enabled, show plain text
            if (!currentCaption.words?.length || !captionStyle?.highlightEnabled) {
                return <span>{currentCaption.text}</span>;
            }

            const highlightColor = captionStyle?.highlightColor || "#FFFF00";
            const textColor = captionStyle?.textColor || "#FFFFFF";
            const outlineColor = captionStyle?.outlineColor || "#000000";
            const scaledOutlineWidth = Math.max(2, Math.round(containerScale * 3));

            // Render each word with highlighting for the current word
            return currentCaption.words.map((word, index) => {
                const isHighlighted = index === currentWordIndex;

                // Glow effect for highlighted word
                const glowShadow = isHighlighted
                    ? `0 0 ${10 * containerScale}px ${highlightColor}, 0 0 ${20 * containerScale}px ${highlightColor}40`
                    : "none";

                return (
                    <span
                        key={word.id || index}
                        style={{
                            color: isHighlighted ? highlightColor : textColor,
                            transform: isHighlighted ? "scale(1.2)" : "scale(1)",
                            display: "inline-block",
                            transition: "transform 0.1s ease-out, color 0.1s ease-out",
                            marginRight: `${4 * containerScale}px`,
                            textShadow: glowShadow,
                            WebkitTextStroke: `${scaledOutlineWidth}px ${outlineColor}`,
                            paintOrder: "stroke fill",
                        }}
                    >
                        {word.word}
                    </span>
                );
            });
        }, [currentCaption, currentWordIndex, captionStyle, containerScale]);

        return (
            <div
                id="edit-video-area"
                ref={containerRef}
                className={cn("w-full h-full relative bg-background overflow-hidden flex items-center justify-center", className)}
                onClick={handleContainerClick}
            >
                {/* Hidden video element - positioned off-screen but still loads */}
                <video
                    ref={videoRef}
                    src={src}
                    className="absolute w-px h-px opacity-0 pointer-events-none"
                    style={{ left: -9999, top: -9999 }}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    muted
                    playsInline
                    preload="auto"
                />

                {/* Centered canvas wrapper */}
                <div
                    className="relative"
                    style={{
                        width: displaySize.width,
                        height: displaySize.height,
                    }}
                >
                    {/* Main canvas */}
                    <canvas
                        id="video-render-nx-v2"
                        ref={canvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        className="absolute inset-0 bg-black border border-border"
                        style={{
                            width: displaySize.width,
                            height: displaySize.height,
                        }}
                    />

                    {/* Layers container */}
                    <div
                        className="absolute inset-0"
                        style={{
                            width: displaySize.width,
                            height: displaySize.height,
                        }}
                    >
                        {layers.filter(l => l.type !== "caption").map((layer) => (
                            <MoveableLayer
                                key={layer.id}
                                layer={{
                                    ...layer,
                                    x: layer.x * containerScale,
                                    y: layer.y * containerScale,
                                    width: layer.width * containerScale,
                                    height: layer.height * containerScale,
                                }}
                                isSelected={selectedLayerId === layer.id}
                                onSelect={() => setSelectedLayerId(layer.id)}
                                onMove={(x, y) => handleLayerMove(layer.id, x / containerScale, y / containerScale)}
                                onResize={(w, h) => handleLayerResize(layer.id, w / containerScale, h / containerScale)}
                                containerScale={containerScale}
                            />
                        ))}
                    </div>

                    {/* Caption overlay - always visible when there's a caption */}
                    {currentCaption && (
                        <div
                            className="absolute left-0 right-0 flex justify-center pointer-events-none z-20"
                            style={{
                                bottom: captionStyle?.position === "top"
                                    ? "auto"
                                    : captionStyle?.position === "center"
                                        ? "50%"
                                        : `${displaySize.height * 0.1}px`,
                                top: captionStyle?.position === "top"
                                    ? `${displaySize.height * 0.1}px`
                                    : "auto",
                                transform: captionStyle?.position === "center" ? "translateY(50%)" : "none",
                            }}
                        >
                            <div
                                className="text-center max-w-[90%] flex flex-wrap justify-center items-center gap-1"
                                style={{
                                    fontFamily: captionStyle?.fontFamily || "Inter",
                                    fontSize: `${(captionStyle?.fontSize || 24) * containerScale}px`,
                                    fontWeight: "bold",
                                    color: captionStyle?.textColor || "#FFFFFF",
                                    textShadow: captionStyle?.shadow
                                        ? "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000"
                                        : "none",
                                    WebkitTextStroke: captionStyle?.outline
                                        ? `${Math.max(2, Math.round(containerScale * 3))}px ${captionStyle?.outlineColor || "#000000"}`
                                        : "none",
                                    paintOrder: "stroke fill",
                                    backgroundColor: captionStyle?.backgroundColor && (captionStyle?.backgroundOpacity ?? 0) > 0
                                        ? `${captionStyle.backgroundColor}${Math.round(((captionStyle.backgroundOpacity ?? 0) / 100) * 255).toString(16).padStart(2, "0")}`
                                        : "transparent",
                                    borderRadius: "4px",
                                    padding: `${4 * containerScale}px ${12 * containerScale}px`,
                                    lineHeight: 1.3,
                                }}
                            >
                                {renderCaptionText()}
                            </div>
                        </div>
                    )}

                    {/* Transform overlay */}
                    <div
                        id="render-transform-overlay"
                        className="pointer-events-none absolute inset-0 z-30"
                        style={{
                            width: displaySize.width,
                            height: displaySize.height,
                        }}
                    />
                </div>
            </div>
        );
    }
);

export default VideoCanvasEditor;
