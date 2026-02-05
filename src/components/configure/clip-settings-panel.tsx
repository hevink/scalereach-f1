"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { VideoConfigInput } from "@/lib/api/video-config";

interface ClipSettingsPanelProps {
    config: VideoConfigInput;
    onChange: (updates: Partial<VideoConfigInput>) => void;
    disabled?: boolean;
}

const CLIP_MODELS = [
    { value: "ClipBasic", label: "Clip Basic", description: "Standard AI clipping" },
    { value: "ClipPro", label: "Clip Pro", description: "Advanced AI with better accuracy" },
];

const GENRES = [
    { value: "Auto", label: "Auto Detect" },
    { value: "Podcast", label: "Podcast" },
    { value: "Gaming", label: "Gaming" },
    { value: "Education", label: "Education" },
    { value: "Entertainment", label: "Entertainment" },
];

const DURATION_OPTIONS = [
    { value: "0-60", label: "0-1 min", min: 0, max: 60 },
    { value: "0-180", label: "0-3 min", min: 0, max: 180 },
    { value: "60-180", label: "1-3 min", min: 60, max: 180 },
    { value: "0-300", label: "0-5 min", min: 0, max: 300 },
];

export function ClipSettingsPanel({
    config,
    onChange,
    disabled = false,
}: ClipSettingsPanelProps) {
    const currentDuration = `${config.clipDurationMin}-${config.clipDurationMax}`;

    const handleDurationChange = (value: string) => {
        const option = DURATION_OPTIONS.find((o) => o.value === value);
        if (option) {
            onChange({
                clipDurationMin: option.min,
                clipDurationMax: option.max,
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Clip Model */}
            <div className="space-y-2">
                <Label id="clip-model-label">Clip Model</Label>
                <Select
                    value={config.clipModel}
                    onValueChange={(value) => value && onChange({ clipModel: value as "ClipBasic" | "ClipPro" })}
                    disabled={disabled}
                >
                    <SelectTrigger aria-labelledby="clip-model-label">
                        <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                        {CLIP_MODELS.map((model) => (
                            <SelectItem
                                key={model.value}
                                value={model.value}
                                aria-label={`${model.label} - ${model.description}`}
                            >
                                <div className="flex flex-col">
                                    <span>{model.label}</span>
                                    <span className="text-muted-foreground text-xs">{model.description}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Genre */}
            <div className="space-y-2">
                <Label id="genre-label">Genre</Label>
                <Select
                    value={config.genre}
                    onValueChange={(value) => value && onChange({ genre: value as VideoConfigInput["genre"] })}
                    disabled={disabled}
                >
                    <SelectTrigger aria-labelledby="genre-label">
                        <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                        {GENRES.map((genre) => (
                            <SelectItem key={genre.value} value={genre.value}>
                                {genre.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Clip Duration */}
            <div className="space-y-2">
                <Label id="clip-length-label">Clip Length</Label>
                <Select
                    value={currentDuration}
                    onValueChange={(value) => value && handleDurationChange(value)}
                    disabled={disabled}
                >
                    <SelectTrigger aria-labelledby="clip-length-label">
                        <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                        {DURATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Auto Hook */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label id="auto-hook-label">Auto Hook</Label>
                    <p id="auto-hook-description" className="text-muted-foreground text-xs">
                        Automatically find attention-grabbing moments
                    </p>
                </div>
                <Switch
                    id="auto-hook-switch"
                    checked={config.enableAutoHook}
                    onCheckedChange={(checked) => onChange({ enableAutoHook: checked })}
                    disabled={disabled}
                    aria-labelledby="auto-hook-label"
                    aria-describedby="auto-hook-description"
                />
            </div>

            {/* Custom Prompt */}
            <div className="space-y-2">
                <Label id="custom-prompt-label">Custom Prompt (Optional)</Label>
                <Textarea
                    id="custom-prompt-input"
                    placeholder="Find moments where they discuss..."
                    value={config.customPrompt || ""}
                    onChange={(e) => onChange({ customPrompt: e.target.value })}
                    disabled={disabled}
                    rows={3}
                    className="resize-none"
                    aria-labelledby="custom-prompt-label"
                    aria-describedby="custom-prompt-description"
                />
                <p id="custom-prompt-description" className="text-muted-foreground text-xs">
                    Describe specific moments or topics you want to find
                </p>
            </div>
        </div>
    );
}
