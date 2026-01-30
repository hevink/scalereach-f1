"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconDeviceMobile, IconDeviceDesktop, IconSquare } from "@tabler/icons-react";

interface AspectRatioSelectorProps {
    value: "9:16" | "16:9" | "1:1";
    onChange: (ratio: "9:16" | "16:9" | "1:1") => void;
    disabled?: boolean;
}

const ASPECT_RATIOS = [
    {
        value: "9:16" as const,
        label: "9:16 Portrait",
        description: "TikTok, Reels, Shorts",
        icon: IconDeviceMobile,
    },
    {
        value: "16:9" as const,
        label: "16:9 Landscape",
        description: "YouTube, Twitter",
        icon: IconDeviceDesktop,
    },
    {
        value: "1:1" as const,
        label: "1:1 Square",
        description: "Instagram Feed",
        icon: IconSquare,
    },
];

export function AspectRatioSelector({
    value,
    onChange,
    disabled = false,
}: AspectRatioSelectorProps) {
    const selected = ASPECT_RATIOS.find((r) => r.value === value);

    return (
        <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select value={value} onValueChange={(val) => val && onChange(val)} disabled={disabled}>
                <SelectTrigger>
                    <SelectValue>
                        {selected && (
                            <div className="flex items-center gap-2">
                                <selected.icon className="size-4" />
                                <span>{selected.label}</span>
                            </div>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {ASPECT_RATIOS.map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                            <div className="flex items-center gap-2">
                                <ratio.icon className="size-4" />
                                <div className="flex flex-col">
                                    <span>{ratio.label}</span>
                                    <span className="text-muted-foreground text-xs">{ratio.description}</span>
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
