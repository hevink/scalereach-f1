"use client";

import { useCallback, useEffect, useState } from "react";
import { IconPlus, IconTrash, IconGripVertical } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface TextOverlay {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string | null;
    fontWeight?: number;
    lineHeight?: number;
    color: string;
    backgroundColor: string;
    backgroundOpacity: number;
    borderRadius: number;
    maxWidth?: number;
    startTime: number;
    endTime: number;
}

export interface TextOverlayPanelProps {
    overlays: TextOverlay[];
    onChange: (overlays: TextOverlay[]) => void;
    clipDuration: number;
    currentTime?: number;
    className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const FONT_OPTIONS = [
    "Inter",
    "Montserrat",
    "Poppins",
    "Roboto",
    "Oswald",
    "Bebas Neue",
    "Playfair Display",
    "Anton",
];

const COLOR_PRESETS = [
    "#FFFFFF", "#000000", "#FF0000", "#FFD700",
    "#00FF00", "#00BFFF", "#FF69B4", "#8B5CF6",
];

function createDefaultOverlay(clipDuration: number, currentTime = 0): TextOverlay {
    const startTime = Math.min(currentTime, clipDuration);
    const endTime = Math.min(startTime + 3, clipDuration);
    return {
        id: `overlay-${Date.now()}`,
        text: "Your text here",
        x: 50,
        y: 25,
        fontSize: 32,
        fontFamily: "Inter",
        fontWeight: 600,
        lineHeight: 1.2,
        color: "#FFFFFF",
        backgroundColor: "#000000",
        backgroundOpacity: 100,
        borderRadius: 4,
        maxWidth: 80,
        startTime,
        endTime,
    };
}

// ============================================================================
// Single Overlay Editor
// ============================================================================

interface OverlayEditorProps {
    overlay: TextOverlay;
    index: number;
    clipDuration: number;
    onChange: (updated: TextOverlay) => void;
    onDelete: () => void;
}

function OverlayEditor({ overlay, index, clipDuration, onChange, onDelete }: OverlayEditorProps) {
    const [expanded, setExpanded] = useState(true);
    // Local slider state for smooth dragging
    const [localX, setLocalX] = useState<number | null>(null);
    const [localY, setLocalY] = useState<number | null>(null);

    // Reset local state when overlay changes from external source (e.g. drag on preview)
    useEffect(() => {
        setLocalX(null);
        setLocalY(null);
    }, [overlay.x, overlay.y]);

    const update = useCallback(
        (partial: Partial<TextOverlay>) => onChange({ ...overlay, ...partial }),
        [overlay, onChange]
    );

    const displayX = localX ?? overlay.x;
    const displayY = localY ?? overlay.y;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-zinc-800/50 transition-colors"
            >
                <IconGripVertical className="size-3.5 text-zinc-600 shrink-0" />
                <span className="text-xs font-medium text-zinc-300 truncate flex-1 text-left">
                    {overlay.text || `Text ${index + 1}`}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                    <IconTrash className="size-3" />
                </Button>
            </button>

            {expanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-zinc-800">
                    {/* Text */}
                    <div className="pt-3">
                        <Label className="text-[10px] text-zinc-500 uppercase tracking-wide">Text</Label>
                        <Input
                            value={overlay.text}
                            onChange={(e) => update({ text: e.target.value })}
                            className="mt-1 h-8 text-xs bg-zinc-800 border-zinc-700"
                            placeholder="Enter text..."
                        />
                    </div>

                    {/* Font & Size */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-wide">Font</Label>
                            <Select value={overlay.fontFamily ?? undefined} onValueChange={(v) => update({ fontFamily: v })}>
                                <SelectTrigger className="mt-1 h-8 text-xs bg-zinc-800 border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONT_OPTIONS.map((f) => (
                                        <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-wide">Size</Label>
                            <Input
                                type="number"
                                value={overlay.fontSize}
                                onChange={(e) => update({ fontSize: Number(e.target.value) || 16 })}
                                className="mt-1 h-8 text-xs bg-zinc-800 border-zinc-700"
                                min={8}
                                max={120}
                            />
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <Label className="text-[10px] text-zinc-500 uppercase tracking-wide">Text Color</Label>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {COLOR_PRESETS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => update({ color: c })}
                                    className={cn(
                                        "size-6 rounded-full border-2 transition-transform hover:scale-110",
                                        overlay.color === c ? "border-white scale-110" : "border-zinc-700"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            {/* Custom color picker */}
                            <label
                                className="size-6 rounded-full border-2 border-zinc-700 cursor-pointer hover:scale-110 transition-transform overflow-hidden relative"
                                title="Custom color"
                                style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
                            >
                                <input
                                    type="color"
                                    value={overlay.color}
                                    onChange={(e) => update({ color: e.target.value })}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Background Color */}
                    <div>
                        <Label className="text-[10px] text-zinc-500 uppercase tracking-wide">Background Color</Label>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {COLOR_PRESETS.map((c) => (
                                <button
                                    key={`bg-${c}`}
                                    onClick={() => update({ backgroundColor: c })}
                                    className={cn(
                                        "size-6 rounded-full border-2 transition-transform hover:scale-110",
                                        overlay.backgroundColor === c ? "border-white scale-110" : "border-zinc-700"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            <label
                                className="size-6 rounded-full border-2 border-zinc-700 cursor-pointer hover:scale-110 transition-transform overflow-hidden relative"
                                title="Custom background color"
                                style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
                            >
                                <input
                                    type="color"
                                    value={overlay.backgroundColor}
                                    onChange={(e) => update({ backgroundColor: e.target.value })}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Background Opacity */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-wide">Background Opacity</Label>
                            <span className="text-[10px] text-zinc-400 tabular-nums">{overlay.backgroundOpacity}%</span>
                        </div>
                        <Slider
                            value={[overlay.backgroundOpacity]}
                            onValueChange={(val) => {
                                const v = Array.isArray(val) ? val[0] : val;
                                update({ backgroundOpacity: v });
                            }}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                        />
                    </div>

                    {/* Border Radius */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-wide">Border Radius</Label>
                            <span className="text-[10px] text-zinc-400 tabular-nums">{overlay.borderRadius ?? 4}px</span>
                        </div>
                        <Slider
                            value={[overlay.borderRadius ?? 4]}
                            onValueChange={(val) => {
                                const v = Array.isArray(val) ? val[0] : val;
                                update({ borderRadius: v });
                            }}
                            min={0}
                            max={32}
                            step={1}
                            className="w-full"
                        />
                    </div>

                    {/* Position */}
                    <div className="space-y-2">
                        <Label className="text-[10px] text-zinc-500 uppercase tracking-wide">Position</Label>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-zinc-500">X</span>
                                <span className="text-[10px] text-zinc-400 tabular-nums">{displayX}%</span>
                            </div>
                            <Slider
                                value={[displayX]}
                                onValueChange={(val) => {
                                    const v = Array.isArray(val) ? val[0] : val;
                                    setLocalX(v);
                                    update({ x: v });
                                }}
                                min={0}
                                max={100}
                                step={1}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-zinc-500">Y</span>
                                <span className="text-[10px] text-zinc-400 tabular-nums">{displayY}%</span>
                            </div>
                            <Slider
                                value={[displayY]}
                                onValueChange={(val) => {
                                    const v = Array.isArray(val) ? val[0] : val;
                                    setLocalY(v);
                                    update({ y: v });
                                }}
                                min={0}
                                max={100}
                                step={1}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Width */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-wide">Width</Label>
                            <span className="text-[10px] text-zinc-400 tabular-nums">{overlay.maxWidth ?? 80}%</span>
                        </div>
                        <Slider
                            value={[overlay.maxWidth ?? 80]}
                            onValueChange={(val) => {
                                const v = Array.isArray(val) ? val[0] : val;
                                update({ maxWidth: v });
                            }}
                            min={20}
                            max={100}
                            step={1}
                            className="w-full"
                        />
                    </div>

                    {/* Timing */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-wide">Start (s)</Label>
                            <Input
                                type="number"
                                value={overlay.startTime}
                                onChange={(e) => update({ startTime: Math.max(0, Number(e.target.value)) })}
                                className="mt-1 h-8 text-xs bg-zinc-800 border-zinc-700"
                                min={0}
                                max={clipDuration}
                                step={0.1}
                            />
                        </div>
                        <div>
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-wide">End (s)</Label>
                            <Input
                                type="number"
                                value={overlay.endTime}
                                onChange={(e) => update({ endTime: Math.min(clipDuration, Number(e.target.value)) })}
                                className="mt-1 h-8 text-xs bg-zinc-800 border-zinc-700"
                                min={0}
                                max={clipDuration}
                                step={0.1}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// TextOverlayPanel Component
// ============================================================================

export function TextOverlayPanel({ overlays, onChange, clipDuration, currentTime = 0, className }: TextOverlayPanelProps) {
    const handleAdd = useCallback(() => {
        onChange([...overlays, createDefaultOverlay(clipDuration, currentTime)]);
    }, [overlays, onChange, clipDuration, currentTime]);

    const handleUpdate = useCallback((index: number, updated: TextOverlay) => {
        const next = [...overlays];
        next[index] = updated;
        onChange(next);
    }, [overlays, onChange]);

    const handleDelete = useCallback((index: number) => {
        onChange(overlays.filter((_, i) => i !== index));
    }, [overlays, onChange]);

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">
                    {overlays.length === 0 ? "No text overlays yet" : `${overlays.length} overlay${overlays.length !== 1 ? "s" : ""}`}
                </p>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-zinc-700 hover:bg-zinc-800"
                    onClick={handleAdd}
                >
                    <IconPlus className="size-3" />
                    Add Text
                </Button>
            </div>

            {overlays.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="size-10 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                        <span className="text-lg">T</span>
                    </div>
                    <p className="text-xs text-zinc-400 max-w-[200px]">
                        Add text overlays to display titles, CTAs, or annotations on your clip
                    </p>
                </div>
            )}

            <div className="space-y-2">
                {overlays.map((overlay, i) => (
                    <OverlayEditor
                        key={overlay.id}
                        overlay={overlay}
                        index={i}
                        clipDuration={clipDuration}
                        onChange={(updated) => handleUpdate(i, updated)}
                        onDelete={() => handleDelete(i)}
                    />
                ))}
            </div>
        </div>
    );
}
