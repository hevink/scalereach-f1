"use client";

import { useState, useCallback } from "react";
import {
    IconBan,
    IconChevronDown,
    IconChevronUp,
    IconItalic,
    IconUnderline,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CaptionStyle } from "@/lib/api/captions";
import type { CaptionStylePreset } from "./caption-style-presets";

// ============================================================================
// Types
// ============================================================================

export interface CaptionPanelTabsProps {
    style: CaptionStyle;
    onChange: (style: CaptionStyle) => void;
    presets?: CaptionStylePreset[];
    selectedPresetId?: string;
    onPresetSelect?: (presetId: string, style: CaptionStyle) => void;
    disabled?: boolean;
    className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const FONTS = [
    "Montserrat",
    "Inter",
    "Roboto",
    "Open Sans",
    "Poppins",
    "Bangers",
    "Permanent Marker",
    "Anton",
    "Bebas Neue",
    "Oswald",
];

const FONT_WEIGHTS = [
    { value: "400", label: "Regular" },
    { value: "500", label: "Medium" },
    { value: "600", label: "Semibold" },
    { value: "700", label: "Bold" },
    { value: "900", label: "Black" },
];

const ANIMATIONS = [
    { value: "none", label: "None" },
    { value: "bounce", label: "Bounce" },
    { value: "fade", label: "Fade" },
    { value: "karaoke", label: "Karaoke" },
    { value: "word-by-word", label: "Word by Word" },
];

const DEFAULT_PRESETS: CaptionStylePreset[] = [
    {
        id: "no-captions",
        name: "No captions",
        description: "Disable captions",
        tags: [],
        style: {} as CaptionStyle,
    },
    {
        id: "karaoke",
        name: "Karaoke",
        description: "Highlighted word-by-word style",
        tags: ["viral", "bold"],
        style: {
            fontFamily: "Bangers",
            fontSize: 32,
            textColor: "#FFFFFF",
            backgroundColor: "#000000",
            backgroundOpacity: 0,
            x: 50, y: 85,
            alignment: "center",
            animation: "karaoke",
            highlightColor: "#00FF00",
            highlightEnabled: true,
            shadow: true,
            outline: false,
            outlineColor: "#000000",
        },
    },
    {
        id: "beasty",
        name: "Beasty",
        description: "Bold outlined style",
        tags: ["bold", "youtube"],
        style: {
            fontFamily: "Anton",
            fontSize: 28,
            textColor: "#FFFFFF",
            backgroundColor: "#000000",
            backgroundOpacity: 0,
            x: 50, y: 85,
            alignment: "center",
            animation: "none",
            highlightColor: "#00FF00",
            highlightEnabled: true,
            shadow: true,
            outline: true,
            outlineColor: "#000000",
        },
    },
    {
        id: "deep-diver",
        name: "Deep Diver",
        description: "Clean with background",
        tags: ["minimal", "clean"],
        style: {
            fontFamily: "Inter",
            fontSize: 24,
            textColor: "#FFFFFF",
            backgroundColor: "#333333",
            backgroundOpacity: 80,
            x: 50, y: 85,
            alignment: "center",
            animation: "fade",
            highlightColor: "#FFD700",
            highlightEnabled: false,
            shadow: false,
            outline: false,
            outlineColor: "#000000",
        },
    },
    {
        id: "youshaei",
        name: "Youshaei",
        description: "Green text word-by-word",
        tags: ["viral", "tiktok"],
        style: {
            fontFamily: "Montserrat",
            fontSize: 26,
            textColor: "#00FF00",
            backgroundColor: "#000000",
            backgroundOpacity: 0,
            x: 50, y: 85,
            alignment: "center",
            animation: "word-by-word",
            highlightColor: "#FFFFFF",
            highlightEnabled: true,
            shadow: true,
            outline: false,
            outlineColor: "#000000",
        },
    },
    {
        id: "pod-p",
        name: "Pod P",
        description: "Bouncy podcast style",
        tags: ["podcast", "fun"],
        style: {
            fontFamily: "Poppins",
            fontSize: 24,
            textColor: "#00BFFF",
            backgroundColor: "#000000",
            backgroundOpacity: 0,
            x: 50, y: 50,
            alignment: "center",
            animation: "bounce",
            highlightColor: "#FFFFFF",
            highlightEnabled: false,
            shadow: true,
            outline: false,
            outlineColor: "#000000",
        },
    },
    {
        id: "mozi",
        name: "Mozi",
        description: "Red accent with white background",
        tags: ["clean", "minimal"],
        style: {
            fontFamily: "Bebas Neue",
            fontSize: 30,
            textColor: "#FF6B6B",
            backgroundColor: "#FFFFFF",
            backgroundOpacity: 90,
            x: 50, y: 85,
            alignment: "center",
            animation: "none",
            highlightColor: "#FF0000",
            highlightEnabled: true,
            shadow: false,
            outline: false,
            outlineColor: "#000000",
        },
    },
    {
        id: "popline",
        name: "Popline",
        description: "Purple karaoke style",
        tags: ["viral", "new"],
        style: {
            fontFamily: "Oswald",
            fontSize: 28,
            textColor: "#FFFFFF",
            backgroundColor: "#6B5B95",
            backgroundOpacity: 85,
            x: 50, y: 85,
            alignment: "center",
            animation: "karaoke",
            highlightColor: "#FFD700",
            highlightEnabled: true,
            shadow: true,
            outline: false,
            outlineColor: "#000000",
        },
    },
    {
        id: "glitch-infinite",
        name: "Glitch Infinite",
        description: "Cyberpunk glitch effect",
        tags: ["bold", "edgy"],
        style: {
            fontFamily: "Anton",
            fontSize: 26,
            textColor: "#FFFFFF",
            backgroundColor: "#000000",
            backgroundOpacity: 0,
            x: 50, y: 85,
            alignment: "center",
            animation: "fade",
            highlightColor: "#FF00FF",
            highlightEnabled: true,
            shadow: true,
            outline: true,
            outlineColor: "#00FFFF",
        },
    },
    {
        id: "seamless-bounce",
        name: "Seamless Bounce",
        description: "Green bouncy style",
        tags: ["fun", "new"],
        style: {
            fontFamily: "Poppins",
            fontSize: 28,
            textColor: "#00FF00",
            backgroundColor: "#000000",
            backgroundOpacity: 70,
            x: 50, y: 85,
            alignment: "center",
            animation: "bounce",
            highlightColor: "#FFFF00",
            highlightEnabled: true,
            shadow: true,
            outline: false,
            outlineColor: "#000000",
        },
    },
];

// ============================================================================
// Preset Card Component
// ============================================================================

interface PresetCardProps {
    preset: CaptionStylePreset;
    isSelected: boolean;
    onClick: () => void;
}

function PresetCard({ preset, isSelected, onClick }: PresetCardProps) {
    const isNoCaption = preset.id === "no-captions";

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative flex flex-col items-center justify-center rounded-lg p-3 h-20 transition-all bg-zinc-800/50",
                "hover:bg-zinc-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected && "ring-2 ring-primary bg-zinc-700/50"
            )}
        >
            {isNoCaption ? (
                <IconBan className="size-8 text-zinc-500" />
            ) : (
                <div className="flex flex-col items-center justify-center">
                    <span
                        className="text-[10px] font-bold leading-tight"
                        style={{
                            fontFamily: preset.style.fontFamily,
                            color: preset.style.textColor || "#FFFFFF",
                            textShadow: preset.style.shadow ? "1px 1px 2px rgba(0,0,0,0.8)" : "none",
                        }}
                    >
                        TO GET
                    </span>
                    <span
                        className="text-[10px] font-bold leading-tight"
                        style={{
                            fontFamily: preset.style.fontFamily,
                            color: preset.style.highlightColor || preset.style.textColor || "#00FF00",
                            textShadow: preset.style.shadow ? "1px 1px 2px rgba(0,0,0,0.8)" : "none",
                        }}
                    >
                        STARTED
                    </span>
                </div>
            )}
            <span className="absolute bottom-1 text-[9px] text-zinc-400 truncate max-w-full px-1">
                {preset.name}
            </span>
            {preset.tags?.includes("new") && (
                <span className="absolute top-1 right-1 text-[8px] bg-green-500 text-black px-1.5 py-0.5 rounded font-medium">
                    New
                </span>
            )}
        </button>
    );
}

// ============================================================================
// Presets Tab Content
// ============================================================================

interface PresetsTabProps {
    presets: CaptionStylePreset[];
    selectedPresetId?: string;
    onSelect: (preset: CaptionStylePreset) => void;
}

function PresetsTab({ presets, selectedPresetId, onSelect }: PresetsTabProps) {
    const displayPresets = presets.length > 0 ? presets : DEFAULT_PRESETS;

    return (
        <div className="grid grid-cols-2 gap-2">
            {displayPresets.map((preset) => (
                <PresetCard
                    key={preset.id}
                    preset={preset}
                    isSelected={selectedPresetId === preset.id}
                    onClick={() => onSelect(preset)}
                />
            ))}
        </div>
    );
}

// ============================================================================
// Font Tab Content
// ============================================================================

interface FontTabProps {
    style: CaptionStyle;
    onChange: (updates: Partial<CaptionStyle>) => void;
    disabled?: boolean;
}

function FontTab({ style, onChange, disabled }: FontTabProps) {
    const [fontSettingsOpen, setFontSettingsOpen] = useState(true);

    return (
        <div className="flex flex-col gap-3">
            {/* Font Settings Collapsible */}
            <Collapsible open={fontSettingsOpen} onOpenChange={setFontSettingsOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-zinc-300 hover:text-white">
                    Font settings
                    {fontSettingsOpen ? (
                        <IconChevronUp className="size-4" />
                    ) : (
                        <IconChevronDown className="size-4" />
                    )}
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-col gap-3 pt-2">
                    {/* Font Family */}
                    <Select
                        value={style.fontFamily ?? undefined}
                        onValueChange={(value) => onChange({ fontFamily: value || undefined })}
                        disabled={disabled}
                    >
                        <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                            {FONTS.map((font) => (
                                <SelectItem key={font} value={font} className="text-white hover:bg-zinc-700">
                                    <span style={{ fontFamily: font }}>{font}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Font Size & Weight Row */}
                    <div className="flex gap-2">
                        <div className="flex items-center bg-zinc-800 rounded-md border border-zinc-700">
                            <div
                                className="w-8 h-8 rounded-l-md border-r border-zinc-700"
                                style={{ backgroundColor: style.textColor }}
                            />
                            <Input
                                type="number"
                                value={style.fontSize}
                                onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
                                className="w-14 border-0 bg-transparent text-center text-white"
                                disabled={disabled}
                            />
                            <span className="text-xs text-zinc-500 pr-2">px</span>
                        </div>
                        <Select defaultValue="900" disabled={disabled}>
                            <SelectTrigger className="flex-1 bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                {FONT_WEIGHTS.map((weight) => (
                                    <SelectItem key={weight.value} value={weight.value} className="text-white hover:bg-zinc-700">
                                        {weight.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Decoration */}
                    <div className="flex items-center justify-between">
                        <Label className="text-sm text-zinc-400">Decoration</Label>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700">
                                <IconItalic className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700">
                                <IconUnderline className="size-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Uppercase */}
                    <div className="flex items-center justify-between">
                        <Label className="text-sm text-zinc-400">Uppercase</Label>
                        <Switch className="data-[state=checked]:bg-green-500" />
                    </div>

                    {/* Font Stroke */}
                    <div className="flex items-center justify-between">
                        <Label className="text-sm text-zinc-400">Font stroke</Label>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-black border border-zinc-700" />
                            <div className="flex items-center bg-zinc-800 rounded-md border border-zinc-700">
                                <Input
                                    type="number"
                                    defaultValue={8}
                                    className="w-12 border-0 bg-transparent text-center text-white"
                                    disabled={disabled}
                                />
                                <span className="text-xs text-zinc-500 pr-2">px</span>
                            </div>
                        </div>
                    </div>

                    {/* Font Shadows */}
                    <div className="flex items-center justify-between">
                        <Label className="text-sm text-zinc-400">Font shadows</Label>
                        <Switch
                            checked={style.shadow}
                            onCheckedChange={(checked) => onChange({ shadow: checked })}
                            className="data-[state=checked]:bg-green-500"
                        />
                    </div>

                    {style.shadow && (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-black border border-zinc-700" />
                            <div className="flex items-center gap-1">
                                <div className="flex items-center bg-zinc-800 rounded border border-zinc-700">
                                    <Input type="number" defaultValue={2} className="w-10 border-0 bg-transparent text-center text-white text-xs" />
                                </div>
                                <span className="text-xs text-zinc-500">x</span>
                                <div className="flex items-center bg-zinc-800 rounded border border-zinc-700">
                                    <Input type="number" defaultValue={2} className="w-10 border-0 bg-transparent text-center text-white text-xs" />
                                </div>
                                <span className="text-xs text-zinc-500">y</span>
                                <div className="flex items-center bg-zinc-800 rounded border border-zinc-700">
                                    <Input type="number" defaultValue={2} className="w-10 border-0 bg-transparent text-center text-white text-xs" />
                                </div>
                                <span className="text-xs text-zinc-500">blur</span>
                            </div>
                        </div>
                    )}
                </CollapsibleContent>
            </Collapsible>

            {/* AI Keywords Highlighter */}
            <div className="flex items-center justify-between py-2 border-t border-zinc-800">
                <Label className="text-sm text-zinc-300">AI keywords highlighter</Label>
                <Switch
                    checked={style.highlightEnabled}
                    onCheckedChange={(checked) => onChange({ highlightEnabled: checked })}
                    className="data-[state=checked]:bg-green-500"
                />
            </div>

            {style.highlightEnabled && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 bg-zinc-800 rounded-md px-3 py-2 border border-zinc-700">
                        <div className="w-5 h-5 rounded-full bg-green-500" />
                        <span className="text-sm text-zinc-300 font-mono">04f827FF</span>
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-800 rounded-md px-3 py-2 border border-zinc-700">
                        <div className="w-5 h-5 rounded-full bg-yellow-400" />
                        <span className="text-sm text-zinc-300 font-mono">FFFD03FF</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Effects Tab Content
// ============================================================================

interface EffectsTabProps {
    style: CaptionStyle;
    onChange: (updates: Partial<CaptionStyle>) => void;
    disabled?: boolean;
}

function EffectsTab({ style, onChange, disabled }: EffectsTabProps) {
    return (
        <div className="flex flex-col gap-4">
            {/* Position X */}
            <div className="flex flex-col gap-2">
                <Label className="text-sm text-zinc-400">Horizontal Position (X)</Label>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-8">Left</span>
                    <Slider
                        value={[style.x ?? 50]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(v) => onChange({ x: v[0] })}
                        className="flex-1"
                        disabled={disabled}
                    />
                    <span className="text-xs text-zinc-500 w-8">Right</span>
                    <span className="text-xs text-zinc-400 w-8">{style.x ?? 50}%</span>
                </div>
            </div>

            {/* Position Y */}
            <div className="flex flex-col gap-2">
                <Label className="text-sm text-zinc-400">Vertical Position (Y)</Label>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-8">Top</span>
                    <Slider
                        value={[style.y ?? 85]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(v) => onChange({ y: v[0] })}
                        className="flex-1"
                        disabled={disabled}
                    />
                    <span className="text-xs text-zinc-500 w-8">Bottom</span>
                    <span className="text-xs text-zinc-400 w-8">{style.y ?? 85}%</span>
                </div>
            </div>

            {/* Quick Position Presets */}
            <div className="flex flex-col gap-2">
                <Label className="text-sm text-zinc-400">Quick Positions</Label>
                <div className="flex gap-1">
                    {[
                        { x: 50, y: 15, label: "Top" },
                        { x: 50, y: 50, label: "Middle" },
                        { x: 50, y: 85, label: "Bottom" },
                    ].map((pos) => (
                        <Button
                            key={pos.label}
                            variant="outline"
                            size="sm"
                            className={cn(
                                "flex-1 bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white",
                                style.x === pos.x && style.y === pos.y && "bg-zinc-700 text-white border-zinc-600"
                            )}
                            onClick={() => onChange({ x: pos.x, y: pos.y })}
                            disabled={disabled}
                        >
                            {pos.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Animation */}
            <div className="flex flex-col gap-2">
                <Label className="text-sm text-zinc-400">Animation</Label>
                <Select
                    value={style.animation}
                    onValueChange={(value) => onChange({ animation: value as CaptionStyle["animation"] })}
                    disabled={disabled}
                >
                    <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                        {ANIMATIONS.map((anim) => (
                            <SelectItem key={anim.value} value={anim.value} className="text-white hover:bg-zinc-700">
                                {anim.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Lines */}
            <div className="flex flex-col gap-2">
                <Label className="text-sm text-zinc-400">Lines</Label>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-zinc-700 border-zinc-600 text-white"
                    >
                        Three lines
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    >
                        One line
                    </Button>
                </div>
            </div>

            {/* Highlighted Word Color */}
            <div className="flex items-center justify-between">
                <Label className="text-sm text-zinc-400">Highlighted word color</Label>
                <div
                    className="w-8 h-8 rounded-full cursor-pointer border-2 border-zinc-600"
                    style={{ backgroundColor: style.highlightColor || "#00FF00" }}
                />
            </div>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function CaptionPanelTabs({
    style,
    onChange,
    presets,
    selectedPresetId,
    onPresetSelect,
    disabled = false,
    className,
}: CaptionPanelTabsProps) {
    const [activeTab, setActiveTab] = useState("presets");

    const handleStyleUpdate = useCallback(
        (updates: Partial<CaptionStyle>) => {
            onChange({ ...style, ...updates });
        },
        [style, onChange]
    );

    const handlePresetSelect = useCallback(
        (preset: CaptionStylePreset) => {
            if (onPresetSelect && preset.style) {
                onPresetSelect(preset.id, preset.style);
            }
        },
        [onPresetSelect]
    );

    return (
        <div className={cn("flex flex-col", className)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-3 bg-transparent border-b border-zinc-800 rounded-none h-auto p-0">
                    <TabsTrigger
                        value="presets"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-500 py-3"
                    >
                        Presets
                    </TabsTrigger>
                    <TabsTrigger
                        value="font"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-500 py-3"
                    >
                        Font
                    </TabsTrigger>
                    <TabsTrigger
                        value="effects"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-500 py-3"
                    >
                        Effects
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="presets" className="mt-4">
                    <PresetsTab
                        presets={presets || []}
                        selectedPresetId={selectedPresetId}
                        onSelect={handlePresetSelect}
                    />
                </TabsContent>

                <TabsContent value="font" className="mt-4">
                    <FontTab
                        style={style}
                        onChange={handleStyleUpdate}
                        disabled={disabled}
                    />
                </TabsContent>

                <TabsContent value="effects" className="mt-4">
                    <EffectsTab
                        style={style}
                        onChange={handleStyleUpdate}
                        disabled={disabled}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default CaptionPanelTabs;
