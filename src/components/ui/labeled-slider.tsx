"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Slider } from "./slider";

/**
 * Clamps a value to be within the specified bounds
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The clamped value
 */
export function clampValue(value: number, min: number, max: number): number {
    if (min > max) {
        throw new Error("min must be less than or equal to max");
    }
    return Math.min(Math.max(value, min), max);
}

/**
 * Formats a value with an optional unit for display
 * @param value - The numeric value
 * @param unit - Optional unit string (e.g., "px", "%")
 * @returns Formatted string
 */
export function formatValueWithUnit(value: number, unit?: string): string {
    return unit ? `${value}${unit}` : `${value}`;
}

export interface LabeledSliderProps {
    /** Current slider value */
    value: number;
    /** Callback when value changes */
    onChange: (value: number) => void;
    /** Minimum value */
    min: number;
    /** Maximum value */
    max: number;
    /** Step increment (default: 1) */
    step?: number;
    /** Label text displayed above the slider */
    label: string;
    /** Unit to display after the value (e.g., "px", "%") */
    unit?: string;
    /** Additional class names */
    className?: string;
    /** Whether the slider is disabled */
    disabled?: boolean;
    /** ID for accessibility */
    id?: string;
}

/**
 * LabeledSlider Component
 * 
 * A reusable slider component with min/max labels, value display with unit,
 * and step configuration. Built on top of the base Slider component.
 * 
 * @example
 * ```tsx
 * // Font size slider (12-72px)
 * <LabeledSlider
 *   value={fontSize}
 *   onChange={setFontSize}
 *   min={12}
 *   max={72}
 *   step={1}
 *   label="Font Size"
 *   unit="px"
 * />
 * 
 * // Opacity slider (0-100%)
 * <LabeledSlider
 *   value={opacity}
 *   onChange={setOpacity}
 *   min={0}
 *   max={100}
 *   step={1}
 *   label="Opacity"
 *   unit="%"
 * />
 * 
 * // Logo size slider (5-30%)
 * <LabeledSlider
 *   value={logoSize}
 *   onChange={setLogoSize}
 *   min={5}
 *   max={30}
 *   step={1}
 *   label="Logo Size"
 *   unit="%"
 * />
 * ```
 * 
 * Validates: Requirements 13.2, 13.4, 21.2, 21.3
 */
export function LabeledSlider({
    value,
    onChange,
    min,
    max,
    step = 1,
    label,
    unit,
    className,
    disabled = false,
    id,
}: LabeledSliderProps) {
    // Generate a unique ID if not provided
    const sliderId = id || React.useId();

    // Handle value change from slider
    const handleValueChange = React.useCallback(
        (newValue: number | readonly number[]) => {
            const numericValue = Array.isArray(newValue) ? newValue[0] : newValue;
            // Clamp the value to ensure it's within bounds
            const clampedValue = clampValue(numericValue, min, max);
            onChange(clampedValue);
        },
        [onChange, min, max]
    );

    // Ensure the displayed value is clamped
    const displayValue = clampValue(value, min, max);

    return (
        <div
            className={cn("flex flex-col gap-2", className)}
            data-slot="labeled-slider"
            data-disabled={disabled || undefined}
        >
            {/* Header with label and current value */}
            <div className="flex items-center justify-between">
                <Label
                    htmlFor={sliderId}
                    className="text-sm font-medium text-foreground"
                >
                    {label}
                </Label>
                <span
                    className="text-sm font-medium tabular-nums text-muted-foreground"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {formatValueWithUnit(displayValue, unit)}
                </span>
            </div>

            {/* Slider */}
            <Slider
                id={sliderId}
                value={[displayValue]}
                onValueChange={handleValueChange}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                aria-label={label}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={displayValue}
                aria-valuetext={formatValueWithUnit(displayValue, unit)}
            />

            {/* Min/Max labels */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                    {formatValueWithUnit(min, unit)}
                </span>
                <span className="text-xs text-muted-foreground">
                    {formatValueWithUnit(max, unit)}
                </span>
            </div>
        </div>
    );
}

export default LabeledSlider;
