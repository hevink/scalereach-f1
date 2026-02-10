"use client";

import { useCallback, useState } from "react";
import {
    IconPlus,
    IconTrash,
    IconAlignLeft,
    IconAlignCenter,
    IconAlignRight,
    IconBold,
    IconItalic,
    IconCopy,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LabeledSlider } from "@/components/ui/labeled-slider";
import { ColorPicker } from "@/components/ui/color-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

// ============================================================================
// Types
// ============================================================================

export interface TextOverlay {
    id: string;
    text: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: "normal" | "bold";
    fontStyle: "normal" | "italic";
    textColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    alignment: "left" | "center" | "right";
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    rotation: number;
    shadow: boolean;
    outline: boolean;
    outlineColor: string;
    startTime: number; // seconds — when overlay appears
    endTime: number; // seconds — when overlay disappears
}

export interface TextOverlayPanelProps {
    overlays: TextOverlay[];
    selectedId: string | null;
    onAdd: () => void;
    onRemove: (id: string) => void;
    onUpdate: (id: string, updates: Partial<TextOverlay>) => void;
    onSelect: (id: string | null) => void;
    onDuplicate: (id: string) => void;
    className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const TEXT_FONTS = [
    "Inter",
    "Roboto",
    "Montserrat",
    "Poppins",
    "Open Sans",
    "Bangers",
    "Permanent Marker",
    "Anton",
    "Bebas Neue",
    "Oswald",
    "Righteous",
    "Russo One",
    "Black Ops One",
    "Georgia",
] as const;

const ALIGNMENT_OPTIONS = [
    { value: "left" as const, icon: IconAlignLeft, label: "Left" },
    { value: "center" as const, icon: IconAlignCenter, label: "Center" },
    { value: "right" as const, icon: IconAlignRight, label: "Right" },
];

// ============================================================================
// Text Overlay Panel
// ============================================================================

export function TextOverlayPanel({
    overlays,
    selectedId,
    onAdd,
    onRemove,
    onUpdate,
    onSelect,
    onDuplicate,
    className,
}: TextOverlayPanelProps) {
    const selected = overlays.find((o) => o.id === selectedId);

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            {/* Add button */}
            <Button
                onClick={onAdd}
                variant="outline"
                size="sm"
                className="w-full gap-2"
            >
                <IconPlus className="size-4" />
                Add Text
            </Button>

            {/* Overlay list */}
            {overlays.length > 0 && (
                <div className="flex flex-col gap-1">
                    <Label className="text-xs text-zinc-400">Text Layers</Label>
                    {overlays.map((overlay) => (
                        <button
                            key={overlay.id}
                            onClick={() => onSelect(overlay.id === selectedId ? null : overlay.id)}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 rounded-md text-xs text-left transition-colors",
                                overlay.id === selectedId
                                    ? "bg-zinc-800 text-white"
                                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
                            )}
                        >
                            <span className="truncate flex-1">
                                {overlay.text || "Empty text"}
                            </span>
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicate(overlay.id);
                                    }}
                                    className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    title="Duplicate"
                                >
                                    <IconCopy className="size-3" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove(overlay.id);
                                    }}
                                    className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors"
                                    title="Delete"
                                >
                                    <IconTrash className="size-3" />
                                </button>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Editor for selected overlay */}
            {selected && (
                <>
                    <Separator />
                    <TextOverlayEditor
                        overlay={selected}
                        onUpdate={(updates) => onUpdate(selected.id, updates)}
                    />
                </>
            )}

            {/* Empty state */}
            {overlays.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                    <IconAlignCenter className="size-8 mb-2 opacity-40" />
                    <p className="text-xs">No text overlays yet</p>
                    <p className="text-[10px] text-zinc-600 mt-1">
                        Click &quot;Add Text&quot; to get started
                    </p>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Text Overlay Editor (for a single selected overlay)
// ============================================================================

interface TextOverlayEditorProps {
    overlay: TextOverlay;
    onUpdate: (updates: Partial<TextOverlay>) => void;
}

function TextOverlayEditor({ overlay, onUpdate }: TextOverlayEditorProps) {
    return (
        <div className="flex flex-col gap-4">
            {/* Text content */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Text</Label>
                <Input
                    value={overlay.text}
                    onChange={(e) => onUpdate({ text: e.target.value })}
                    placeholder="Enter text..."
                    className="text-sm bg-zinc-800 border-zinc-700"
                />
            </div>

            {/* Timing */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Start (s)</Label>
                    <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={overlay.startTime}
                        onChange={(e) => onUpdate({ startTime: Math.max(0, parseFloat(e.target.value) || 0) })}
                        className="text-sm bg-zinc-800 border-zinc-700 font-mono"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">End (s)</Label>
                    <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={overlay.endTime}
                        onChange={(e) => onUpdate({ endTime: Math.max(overlay.startTime + 0.1, parseFloat(e.target.value) || 0) })}
                        className="text-sm bg-zinc-800 border-zinc-700 font-mono"
                    />
                </div>
            </div>

            {/* Font family */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Font</Label>
                <Select
                    value={overlay.fontFamily}
                    onValueChange={(v) => v && onUpdate({ fontFamily: v })}
                >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {TEXT_FONTS.map((font) => (
                            <SelectItem key={font} value={font}>
                                <span style={{ fontFamily: font }}>{font}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Font size */}
            <LabeledSlider
                value={overlay.fontSize}
                onChange={(v) => onUpdate({ fontSize: v })}
                min={8}
                max={120}
                step={1}
                label="Font Size"
                unit="px"
            />

            {/* Bold / Italic / Alignment row */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onUpdate({ fontWeight: overlay.fontWeight === "bold" ? "normal" : "bold" })}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded transition-colors",
                        overlay.fontWeight === "bold"
                            ? "bg-zinc-700 text-white"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                    )}
                    title="Bold"
                >
                    <IconBold className="size-4" />
                </button>
                <button
                    onClick={() => onUpdate({ fontStyle: overlay.fontStyle === "italic" ? "normal" : "italic" })}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded transition-colors",
                        overlay.fontStyle === "italic"
                            ? "bg-zinc-700 text-white"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                    )}
                    title="Italic"
                >
                    <IconItalic className="size-4" />
                </button>

                <div className="w-px h-5 bg-zinc-700 mx-1" />

                {ALIGNMENT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => onUpdate({ alignment: opt.value })}
                            className={cn(
                                "w-8 h-8 flex items-center justify-center rounded transition-colors",
                                overlay.alignment === opt.value
                                    ? "bg-zinc-700 text-white"
                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                            )}
                            title={opt.label}
                        >
                            <Icon className="size-4" />
                        </button>
                    );
                })}
            </div>

            {/* Colors */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Text Color</Label>
                    <ColorPicker
                        value={overlay.textColor}
                        onChange={(v) => onUpdate({ textColor: v })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Background</Label>
                    <ColorPicker
                        value={overlay.backgroundColor}
                        onChange={(v) => onUpdate({ backgroundColor: v })}
                    />
                </div>
            </div>

            {/* Background opacity */}
            <LabeledSlider
                value={overlay.backgroundOpacity}
                onChange={(v) => onUpdate({ backgroundOpacity: v })}
                min={0}
                max={100}
                step={1}
                label="Background Opacity"
                unit="%"
            />

            {/* Position */}
            <div className="grid grid-cols-2 gap-3">
                <LabeledSlider
                    value={overlay.x}
                    onChange={(v) => onUpdate({ x: v })}
                    min={0}
                    max={100}
                    step={1}
                    label="X Position"
                    unit="%"
                />
                <LabeledSlider
                    value={overlay.y}
                    onChange={(v) => onUpdate({ y: v })}
                    min={0}
                    max={100}
                    step={1}
                    label="Y Position"
                    unit="%"
                />
            </div>

            {/* Rotation */}
            <LabeledSlider
                value={overlay.rotation}
                onChange={(v) => onUpdate({ rotation: v })}
                min={-180}
                max={180}
                step={1}
                label="Rotation"
                unit="°"
            />

            <Separator />

            {/* Effects */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Shadow</Label>
                    <Switch
                        checked={overlay.shadow}
                        onCheckedChange={(v) => onUpdate({ shadow: v })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Outline</Label>
                    <Switch
                        checked={overlay.outline}
                        onCheckedChange={(v) => onUpdate({ outline: v })}
                    />
                </div>
                {overlay.outline && (
                    <div className="flex items-center justify-between">
                        <Label className="text-xs">Outline Color</Label>
                        <ColorPicker
                            value={overlay.outlineColor}
                            onChange={(v) => onUpdate({ outlineColor: v })}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Helper: create default overlay
// ============================================================================

let textIdCounter = 0;

export function createTextOverlay(partial?: Partial<TextOverlay>): TextOverlay {
    return {
        id: `text_${Date.now()}_${++textIdCounter}`,
        text: "Your text here",
        fontFamily: "Inter",
        fontSize: 32,
        fontWeight: "bold",
        fontStyle: "normal",
        textColor: "#FFFFFF",
        backgroundColor: "#000000",
        backgroundOpacity: 0,
        alignment: "center",
        x: 50,
        y: 50,
        rotation: 0,
        shadow: true,
        outline: false,
        outlineColor: "#000000",
        startTime: 0,
        endTime: 3,
        ...partial,
    };
}
