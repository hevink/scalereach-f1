"use client";

import {
    IconArrowUpLeft,
    IconArrowUpRight,
    IconArrowDownLeft,
    IconArrowDownRight,
} from "@tabler/icons-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LabeledSlider } from "@/components/ui/labeled-slider";
import { cn } from "@/lib/utils";

/**
 * Logo position options for corner placement
 * @validates Requirement 21.1
 */
export type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/**
 * Logo settings interface containing position, size, and opacity
 * @validates Requirements 21.1, 21.2, 21.3
 */
export interface LogoSettings {
    /** Corner position for logo placement */
    position: LogoPosition;
    /** Logo size as percentage (5-30%) */
    size: number;
    /** Logo opacity as percentage (0-100%) */
    opacity: number;
}

/**
 * LogoPositionControlsProps interface
 * @validates Requirements 21.1, 21.2, 21.3, 21.4, 21.5
 */
export interface LogoPositionControlsProps {
    /** Current logo position */
    position: LogoPosition;
    /** Current logo size (5-30%) */
    size: number;
    /** Current logo opacity (0-100%) */
    opacity: number;
    /** Callback when any setting changes - updates preview and saves to brand kit */
    onChange: (settings: LogoSettings) => void;
    /** Additional className */
    className?: string;
    /** Whether the component is disabled */
    disabled?: boolean;
    /** Label for the position controls section */
    label?: string;
}

/**
 * Default logo size percentage
 */
export const DEFAULT_LOGO_SIZE = 15;

/**
 * Minimum logo size percentage
 * @validates Requirement 21.2
 */
export const MIN_LOGO_SIZE = 5;

/**
 * Maximum logo size percentage
 * @validates Requirement 21.2
 */
export const MAX_LOGO_SIZE = 30;

/**
 * Default logo opacity percentage
 */
export const DEFAULT_LOGO_OPACITY = 100;

/**
 * Minimum logo opacity percentage
 * @validates Requirement 21.3
 */
export const MIN_LOGO_OPACITY = 0;

/**
 * Maximum logo opacity percentage
 * @validates Requirement 21.3
 */
export const MAX_LOGO_OPACITY = 100;

/**
 * Default logo position
 * @validates Requirement 21.1
 */
export const DEFAULT_LOGO_POSITION: LogoPosition = "bottom-right";

/**
 * Position configuration for the 4 corner buttons
 */
const POSITION_CONFIG: Array<{
    value: LogoPosition;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    gridPosition: string;
}> = [
        {
            value: "top-left",
            label: "Top Left",
            icon: IconArrowUpLeft,
            gridPosition: "col-start-1 row-start-1",
        },
        {
            value: "top-right",
            label: "Top Right",
            icon: IconArrowUpRight,
            gridPosition: "col-start-2 row-start-1",
        },
        {
            value: "bottom-left",
            label: "Bottom Left",
            icon: IconArrowDownLeft,
            gridPosition: "col-start-1 row-start-2",
        },
        {
            value: "bottom-right",
            label: "Bottom Right",
            icon: IconArrowDownRight,
            gridPosition: "col-start-2 row-start-2",
        },
    ];

/**
 * LogoPositionControls Component
 *
 * A comprehensive logo positioning interface with:
 * - Position selector for 4 corners (Requirement 21.1)
 * - Size slider (5-30%) (Requirement 21.2)
 * - Opacity slider (0-100%) (Requirement 21.3)
 * - Updates preview on change via onChange callback (Requirement 21.4)
 * - Saves settings to brand kit via onChange callback (Requirement 21.5)
 *
 * @example
 * ```tsx
 * <LogoPositionControls
 *   position={brandKit?.logoPosition ?? "bottom-right"}
 *   size={brandKit?.logoSize ?? 15}
 *   opacity={brandKit?.logoOpacity ?? 100}
 *   onChange={(settings) => {
 *     updateBrandKit(settings);
 *     updatePreview(settings);
 *   }}
 * />
 * ```
 *
 * @validates Requirements 21.1, 21.2, 21.3, 21.4, 21.5
 */
export function LogoPositionControls({
    position,
    size,
    opacity,
    onChange,
    className,
    disabled = false,
    label = "Logo Position",
}: LogoPositionControlsProps) {
    /**
     * Handles position button click
     * @validates Requirements 21.1, 21.4, 21.5
     */
    const handlePositionChange = useCallback(
        (newPosition: LogoPosition) => {
            onChange({
                position: newPosition,
                size,
                opacity,
            });
        },
        [onChange, size, opacity]
    );

    /**
     * Handles size slider change
     * @validates Requirements 21.2, 21.4, 21.5
     */
    const handleSizeChange = useCallback(
        (newSize: number) => {
            onChange({
                position,
                size: newSize,
                opacity,
            });
        },
        [onChange, position, opacity]
    );

    /**
     * Handles opacity slider change
     * @validates Requirements 21.3, 21.4, 21.5
     */
    const handleOpacityChange = useCallback(
        (newOpacity: number) => {
            onChange({
                position,
                size,
                opacity: newOpacity,
            });
        },
        [onChange, position, size]
    );

    return (
        <div
            className={cn("flex flex-col gap-4", className)}
            data-slot="logo-position-controls"
        >
            {/* Position Selector - Requirement 21.1 */}
            <div className="flex flex-col gap-3">
                <Label className="font-medium text-foreground text-sm">{label}</Label>

                {/* 2x2 Grid of Position Buttons */}
                <div className="grid grid-cols-2 gap-2">
                    {POSITION_CONFIG.map(({ value, label: posLabel, icon: Icon, gridPosition }) => (
                        <Button
                            key={value}
                            aria-label={`Position logo at ${posLabel}`}
                            aria-pressed={position === value}
                            className={cn(
                                "h-12 flex-col gap-1",
                                gridPosition,
                                position === value && "border-primary bg-primary/10 text-primary"
                            )}
                            disabled={disabled}
                            onClick={() => handlePositionChange(value)}
                            variant={position === value ? "outline" : "ghost"}
                        >
                            <Icon className="size-5" />
                            <span className="text-xs">{posLabel}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Size Slider - Requirement 21.2 */}
            <LabeledSlider
                disabled={disabled}
                label="Logo Size"
                max={MAX_LOGO_SIZE}
                min={MIN_LOGO_SIZE}
                onChange={handleSizeChange}
                step={1}
                unit="%"
                value={size}
            />

            {/* Opacity Slider - Requirement 21.3 */}
            <LabeledSlider
                disabled={disabled}
                label="Logo Opacity"
                max={MAX_LOGO_OPACITY}
                min={MIN_LOGO_OPACITY}
                onChange={handleOpacityChange}
                step={1}
                unit="%"
                value={opacity}
            />
        </div>
    );
}

export default LogoPositionControls;
