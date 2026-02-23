"use client";

import { cn } from "@/lib/utils";

interface DurationOption {
    label: string;
    min: number;
    max: number;
}

const DURATION_OPTIONS: DurationOption[] = [
    { label: "Auto", min: 0, max: 0 },
    { label: "0 - 30s", min: 5, max: 30 },
    { label: "30 - 60s", min: 30, max: 60 },
    { label: "1 - 2 min", min: 60, max: 120 },
    { label: "2 - 3 min", min: 120, max: 180 },
];

interface ClipDurationSelectorProps {
    min: number;
    max: number;
    onChange: (min: number, max: number) => void;
    disabled?: boolean;
}

export function ClipDurationSelector({ min, max, onChange, disabled }: ClipDurationSelectorProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((option) => {
                const isSelected = min === option.min && max === option.max;
                return (
                    <button
                        key={option.label}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(option.min, option.max)}
                        className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                            "hover:bg-muted hover:border-primary/50",
                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                            isSelected && "ring-1 ring-primary bg-muted border-primary",
                            !isSelected && "bg-muted/50 border-border",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
