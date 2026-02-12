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
import type { Caption, CaptionStyle } from "@/lib/api/captions";

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
// Draggable Caption Component
// ============================================================================

interface DraggableCaptionProps {
    captionStyle?: CaptionStyle;
    containerScale: number;
    displaySize: { width: number; height: number };
    onPositionChange?: (style: Partial<CaptionStyle>) => void;
    children: React.ReactNode;
}

function DraggableCaption({
    captionStyle,
    containerScale,
    displaySize,
    onPositionChange,
    children,
}: DraggableCaptionProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<{
        type: "move" | "font" | "width" | null;
        startX: number;
        startY: number;
        startValue: { x: number; y: number; fontSize: number; maxWidth: number };
    } | null>(null);

    const [isHovering, setIsHovering] = useState(false);
    const [localValues, setLocalValues] = useState<{
        x?: number;
        y?: number;
        fontSize?: number;
        maxWidth?: number;
    }>({});

    // Calculate values from style or fallback
    const xPos = localValues.x ?? captionStyle?.x ?? 50;
    const yPos = localValues.y ?? captionStyle?.y ?? 85;
    const fontSize = localValues.fontSize ?? captionStyle?.fontSize ?? 24;
    const maxWidth = localValues.maxWidth ?? captionStyle?.maxWidth ?? 90;

    // Convert legacy position to y if x/y not set
    let finalY = yPos;
    if (localValues.y === undefined && captionStyle?.y === undefined && captionStyle?.position) {
        switch (captionStyle.position) {
            case "top": finalY = 10; break;
            case "center": finalY = 50; break;
            case "bottom": finalY = 85; break;
        }
    }

    // Start drag handlers
    const startDrag = useCallback((type: "move" | "font" | "width", e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragState({
            type,
            startX: e.clientX,
            startY: e.clientY,
            startValue: {
                x: xPos,
                y: finalY,
                fontSize,
                maxWidth,
            },
        });
    }, [xPos, finalY, fontSize, maxWidth]);

    // Handle mouse move and up
    useEffect(() => {
        if (!dragState) return;

        const handleMouseMove = (e: MouseEvent) => {
            const dx = e.clientX - dragState.startX;
            const dy = e.clientY - dragState.startY;

            if (dragState.type === "move") {
                const deltaXPercent = (dx / displaySize.width) * 100;
                const deltaYPercent = (dy / displaySize.height) * 100;
                const newX = Math.max(5, Math.min(95, dragState.startValue.x + deltaXPercent));
                const newY = Math.max(5, Math.min(95, dragState.startValue.y + deltaYPercent));
                setLocalValues(prev => ({ ...prev, x: newX, y: newY }));
            } else if (dragState.type === "font") {
                const delta = (dx - dy) / 4;
                const newFontSize = Math.max(12, Math.min(72, dragState.startValue.fontSize + delta));
                setLocalValues(prev => ({ ...prev, fontSize: Math.round(newFontSize) }));
            } else if (dragState.type === "width") {
                const deltaPercent = (dx / displaySize.width) * 200;
                const newWidth = Math.max(20, Math.min(100, dragState.startValue.maxWidth + deltaPercent));
                setLocalValues(prev => ({ ...prev, maxWidth: Math.round(newWidth) }));
            }
        };

        const handleMouseUp = () => {
            // Commit changes
            if (onPositionChange) {
                if (dragState.type === "move" && localValues.x !== undefined && localValues.y !== undefined) {
                    onPositionChange({ x: Math.round(localValues.x), y: Math.round(localValues.y) });
                } else if (dragState.type === "font" && localValues.fontSize !== undefined) {
                    onPositionChange({ fontSize: localValues.fontSize });
                } else if (dragState.type === "width" && localValues.maxWidth !== undefined) {
                    onPositionChange({ maxWidth: localValues.maxWidth });
                }
            }
            setDragState(null);
            setLocalValues({});
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragState, displaySize, localValues, onPositionChange]);

    const isActive = isHovering || dragState !== null;
    const isDragging = dragState?.type === "move";
    const isResizingFont = dragState?.type === "font";
    const isResizingWidth = dragState?.type === "width";

    return (
        <div
            ref={containerRef}
            className="absolute z-20 select-none"
            style={{
                left: `${xPos}%`,
                top: `${finalY}%`,
                transform: "translate(-50%, -50%)",
                width: `${maxWidth}%`,
                cursor: isDragging ? "grabbing" : isResizingFont ? "nwse-resize" : isResizingWidth ? "ew-resize" : "grab",
            }}
            onMouseDown={(e) => startDrag("move", e)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Selection indicator */}
            {isActive && (
                <div
                    className="absolute -inset-2 rounded-lg border-2 border-primary/60 bg-primary/5 pointer-events-none"
                    style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.15)" }}
                />
            )}

            {/* Font size resize handles - corners */}
            {isActive && (
                <>
                    <div
                        className="absolute -bottom-3 -right-3 w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg cursor-nwse-resize flex items-center justify-center hover:scale-110 transition-transform z-30"
                        onMouseDown={(e) => startDrag("font", e)}
                        title="Drag to resize font"
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                            <path d="M15 3h6v6" />
                            <path d="M9 21H3v-6" />
                        </svg>
                    </div>
                    <div
                        className="absolute -top-3 -left-3 w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg cursor-nwse-resize flex items-center justify-center hover:scale-110 transition-transform z-30"
                        onMouseDown={(e) => startDrag("font", e)}
                        title="Drag to resize font"
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                            <path d="M15 3h6v6" />
                            <path d="M9 21H3v-6" />
                        </svg>
                    </div>
                </>
            )}

            {/* Width resize handles - sides */}
            {isActive && (
                <>
                    <div
                        className="absolute top-1/2 -right-4 -translate-y-1/2 w-5 h-10 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-ew-resize flex items-center justify-center hover:scale-110 transition-transform z-30"
                        onMouseDown={(e) => startDrag("width", e)}
                        title="Drag to resize width"
                    >
                        <svg width="8" height="12" viewBox="0 0 8 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                            <path d="M2 1v10" />
                            <path d="M6 1v10" />
                        </svg>
                    </div>
                    <div
                        className="absolute top-1/2 -left-4 -translate-y-1/2 w-5 h-10 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-ew-resize flex items-center justify-center hover:scale-110 transition-transform z-30"
                        onMouseDown={(e) => startDrag("width", e)}
                        title="Drag to resize width"
                    >
                        <svg width="8" height="12" viewBox="0 0 8 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                            <path d="M2 1v10" />
                            <path d="M6 1v10" />
                        </svg>
                    </div>
                </>
            )}

            {/* Action indicator badge */}
            {isActive && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md shadow-lg flex items-center gap-1 whitespace-nowrap pointer-events-none z-40">
                    {isResizingFont ? (
                        <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M15 3h6v6" />
                                <path d="M9 21H3v-6" />
                            </svg>
                            Font: {fontSize}px
                        </>
                    ) : isResizingWidth ? (
                        <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 12H3" />
                                <path d="M15 6l6 6-6 6" />
                                <path d="M9 6l-6 6 6 6" />
                            </svg>
                            Width: {maxWidth}%
                        </>
                    ) : (
                        <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 9l-3 3 3 3" />
                                <path d="M9 5l3-3 3 3" />
                                <path d="M15 19l-3 3-3-3" />
                                <path d="M19 9l3 3-3 3" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <line x1="12" y1="2" x2="12" y2="22" />
                            </svg>
                            Drag to move
                        </>
                    )}
                </div>
            )}

            {/* Caption content */}
            <div
                className="text-center flex flex-wrap justify-center items-center gap-1 pointer-events-none"
                style={{
                    fontFamily: captionStyle?.fontFamily || "Inter",
                    fontSize: `${fontSize * containerScale}px`,
                    fontWeight: "bold",
                    color: captionStyle?.textColor || "#FFFFFF",
                    textShadow: captionStyle?.shadow
                        ? "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000"
                        : "none",
                    WebkitTextStroke: captionStyle?.outline
                        ? `${Math.max(2, Math.round(containerScale * (captionStyle?.outlineWidth ?? 3)))}px ${captionStyle?.outlineColor || "#000000"}`
                        : "none",
                    paintOrder: "stroke fill",
                    backgroundColor: captionStyle?.backgroundColor && (captionStyle?.backgroundOpacity ?? 0) > 0
                        ? `${captionStyle.backgroundColor}${Math.round(((captionStyle.backgroundOpacity ?? 0) / 100) * 255).toString(16).padStart(2, "0")}`
                        : "transparent",
                    borderRadius: "4px",
                    padding: `${4 * containerScale}px ${12 * containerScale}px`,
                    lineHeight: 1.3,
                    textTransform: captionStyle?.textTransform === "uppercase" ? "uppercase" : "none",
                }}
            >
                {children}
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
            const scaledOutlineWidth = Math.max(2, Math.round(containerScale * (captionStyle?.outlineWidth ?? 3)));
            const glowEnabled = captionStyle?.glowEnabled ?? false;
            const glowColor = captionStyle?.glowColor || highlightColor;
            const glowIntensity = captionStyle?.glowIntensity ?? 2;
            const highlightScale = captionStyle?.highlightScale ?? 120;

            // Render each word with highlighting for the current word
            return currentCaption.words.map((word, index) => {
                const isHighlighted = index === currentWordIndex;

                // Glow effect for highlighted word
                // Always show a default glow using highlightColor; when glowEnabled, use glowColor + glowIntensity
                let glowShadow = "none";
                if (isHighlighted) {
                    if (glowEnabled) {
                        const blur1 = Math.round(glowIntensity * 5 * containerScale);
                        const blur2 = Math.round(glowIntensity * 10 * containerScale);
                        glowShadow = `0 0 ${blur1}px ${glowColor}, 0 0 ${blur2}px ${glowColor}40`;
                    } else {
                        glowShadow = `0 0 ${10 * containerScale}px ${highlightColor}, 0 0 ${20 * containerScale}px ${highlightColor}40`;
                    }
                }

                return (
                    <span
                        key={word.id || index}
                        style={{
                            color: isHighlighted ? highlightColor : textColor,
                            transform: isHighlighted ? `scale(${highlightScale / 100})` : "scale(1)",
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

                    {/* Layers container - fill layers hidden */}
                    {/* <div
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
                    </div> */}

                    {/* Caption overlay - draggable when there's a caption */}
                    {currentCaption && (
                        <DraggableCaption
                            captionStyle={captionStyle}
                            containerScale={containerScale}
                            displaySize={displaySize}
                            onPositionChange={onCaptionStyleChange}
                        >
                            {renderCaptionText()}
                        </DraggableCaption>
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
