"use client";

import * as React from "react";
import { IconColorPicker, IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Slider } from "./slider";

/**
 * Validates a hex color string
 * @param color - The color string to validate
 * @returns true if valid hex color (3, 4, 6, or 8 character hex with optional #)
 */
export function isValidHexColor(color: string): boolean {
    // Remove # if present
    const hex = color.startsWith("#") ? color.slice(1) : color;
    // Valid hex colors are 3, 4, 6, or 8 characters (with optional alpha)
    return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{4}$|^[0-9A-Fa-f]{6}$|^[0-9A-Fa-f]{8}$/.test(hex);
}

/**
 * Normalizes a hex color to 6-character format with #
 * @param color - The color string to normalize
 * @returns Normalized hex color string
 */
export function normalizeHexColor(color: string): string {
    let hex = color.startsWith("#") ? color.slice(1) : color;

    // Expand 3-character hex to 6-character
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    // Expand 4-character hex to 8-character (with alpha)
    if (hex.length === 4) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }

    return `#${hex.toUpperCase()}`;
}

/**
 * Extracts opacity from an 8-character hex color
 * @param color - The hex color string
 * @returns Opacity value 0-100
 */
export function getOpacityFromHex(color: string): number {
    const hex = color.startsWith("#") ? color.slice(1) : color;
    if (hex.length === 8) {
        const alpha = parseInt(hex.slice(6, 8), 16);
        return Math.round((alpha / 255) * 100);
    }
    return 100;
}

/**
 * Applies opacity to a hex color
 * @param color - The hex color string (6 characters)
 * @param opacity - Opacity value 0-100
 * @returns 8-character hex color with alpha
 */
export function applyOpacityToHex(color: string, opacity: number): string {
    const normalized = normalizeHexColor(color);
    // Get the base 6-character hex (without alpha)
    const baseHex = normalized.slice(1, 7);
    // Convert opacity (0-100) to hex alpha (00-FF)
    const alpha = Math.round((opacity / 100) * 255)
        .toString(16)
        .padStart(2, "0")
        .toUpperCase();
    return `#${baseHex}${alpha}`;
}

/**
 * Default preset colors for the color picker
 */
const DEFAULT_PRESET_COLORS = [
    "#FFFFFF", // White
    "#000000", // Black
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FF6B6B", // Coral
    "#4ECDC4", // Teal
    "#45B7D1", // Sky Blue
    "#96CEB4", // Sage
    "#FFEAA7", // Cream
    "#DDA0DD", // Plum
    "#98D8C8", // Mint
    "#F7DC6F", // Gold
];

export interface ColorPickerProps {
    /** Current color value (hex format) */
    value: string;
    /** Callback when color changes */
    onChange: (color: string) => void;
    /** Preset color swatches to display */
    presetColors?: string[];
    /** Label for the color picker */
    label?: string;
    /** Whether to show opacity slider */
    showOpacity?: boolean;
    /** Additional class names */
    className?: string;
    /** Whether the picker is disabled */
    disabled?: boolean;
}

/**
 * ColorPicker Component
 * 
 * A reusable color picker with hex input validation, preset color swatches,
 * and optional opacity slider.
 * 
 * @example
 * ```tsx
 * <ColorPicker
 *   value="#FF0000"
 *   onChange={(color) => console.log(color)}
 *   label="Text Color"
 *   presetColors={["#FF0000", "#00FF00", "#0000FF"]}
 *   showOpacity
 * />
 * ```
 * 
 * Validates: Requirements 13.3, 15.2, 19.1
 */
export function ColorPicker({
    value,
    onChange,
    presetColors = DEFAULT_PRESET_COLORS,
    label,
    showOpacity = false,
    className,
    disabled = false,
}: ColorPickerProps) {
    const [inputValue, setInputValue] = React.useState(value);
    const [isOpen, setIsOpen] = React.useState(false);
    const [isValid, setIsValid] = React.useState(true);
    const [opacity, setOpacity] = React.useState(() => getOpacityFromHex(value));

    // Sync input value when external value changes
    React.useEffect(() => {
        setInputValue(value);
        setOpacity(getOpacityFromHex(value));
        setIsValid(isValidHexColor(value));
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Validate and update if valid
        if (isValidHexColor(newValue)) {
            setIsValid(true);
            const normalized = normalizeHexColor(newValue);
            if (showOpacity && opacity < 100) {
                onChange(applyOpacityToHex(normalized, opacity));
            } else {
                onChange(normalized);
            }
        } else {
            setIsValid(false);
        }
    };

    const handleInputBlur = () => {
        // On blur, reset to last valid value if current is invalid
        if (!isValid) {
            setInputValue(value);
            setIsValid(true);
        }
    };

    const handlePresetClick = (color: string) => {
        const normalized = normalizeHexColor(color);
        setInputValue(normalized);
        setIsValid(true);
        if (showOpacity && opacity < 100) {
            onChange(applyOpacityToHex(normalized, opacity));
        } else {
            onChange(normalized);
        }
    };

    const handleOpacityChange = (newOpacity: number | readonly number[]) => {
        const opacityValue = Array.isArray(newOpacity) ? newOpacity[0] : newOpacity;
        setOpacity(opacityValue);
        const baseColor = normalizeHexColor(inputValue);
        if (opacityValue < 100) {
            onChange(applyOpacityToHex(baseColor, opacityValue));
        } else {
            onChange(baseColor);
        }
    };

    const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value.toUpperCase();
        setInputValue(newColor);
        setIsValid(true);
        if (showOpacity && opacity < 100) {
            onChange(applyOpacityToHex(newColor, opacity));
        } else {
            onChange(newColor);
        }
    };

    // Get display color (6-char hex for the swatch)
    const displayColor = React.useMemo(() => {
        if (isValidHexColor(inputValue)) {
            return normalizeHexColor(inputValue).slice(0, 7);
        }
        return normalizeHexColor(value).slice(0, 7);
    }, [inputValue, value]);

    return (
        <div className={cn("flex flex-col gap-2", className)} data-slot="color-picker">
            {label && (
                <Label className="text-sm font-medium text-foreground">{label}</Label>
            )}

            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger
                    className={cn(
                        "inline-flex h-10 w-full items-center justify-start gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-normal outline-none transition-[color,box-shadow] hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        disabled && "pointer-events-none opacity-50"
                    )}
                    disabled={disabled}
                    aria-label={label ? `Select ${label}` : "Select color"}
                >
                    <div
                        className="size-5 rounded border border-border shadow-sm"
                        style={{
                            backgroundColor: displayColor,
                            opacity: showOpacity ? opacity / 100 : 1,
                        }}
                        aria-hidden="true"
                    />
                    <span className="flex-1 text-left font-mono text-sm">
                        {displayColor}
                    </span>
                    <IconColorPicker className="size-4 text-muted-foreground" />
                </PopoverTrigger>

                <PopoverContent className="w-64 p-3" align="start">
                    <div className="flex flex-col gap-4">
                        {/* Color Input with Native Picker */}
                        <div className="flex gap-2">
                            <div className="relative">
                                <input
                                    type="color"
                                    value={displayColor}
                                    onChange={handleNativeColorChange}
                                    className="absolute inset-0 size-10 cursor-pointer opacity-0"
                                    aria-label="Color picker"
                                    disabled={disabled}
                                />
                                <div
                                    className="size-10 rounded-md border border-border shadow-sm"
                                    style={{
                                        backgroundColor: displayColor,
                                        opacity: showOpacity ? opacity / 100 : 1,
                                    }}
                                    aria-hidden="true"
                                />
                            </div>
                            <div className="flex-1">
                                <Input
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onBlur={handleInputBlur}
                                    placeholder="#000000"
                                    className={cn(
                                        "font-mono text-sm",
                                        !isValid && "border-destructive ring-destructive/20"
                                    )}
                                    aria-label="Hex color value"
                                    aria-invalid={!isValid}
                                    disabled={disabled}
                                />
                                {!isValid && (
                                    <p className="mt-1 text-xs text-destructive">
                                        Invalid hex color
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Opacity Slider */}
                        {showOpacity && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-muted-foreground">
                                        Opacity
                                    </Label>
                                    <span className="text-xs font-medium tabular-nums">
                                        {opacity}%
                                    </span>
                                </div>
                                <Slider
                                    value={[opacity]}
                                    onValueChange={handleOpacityChange}
                                    min={0}
                                    max={100}
                                    step={1}
                                    disabled={disabled}
                                    aria-label="Color opacity"
                                />
                            </div>
                        )}

                        {/* Preset Colors */}
                        {presetColors.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <Label className="text-xs text-muted-foreground">
                                    Preset Colors
                                </Label>
                                <div className="grid grid-cols-8 gap-1">
                                    {presetColors.map((color) => {
                                        const normalizedPreset = normalizeHexColor(color);
                                        const isSelected = displayColor === normalizedPreset.slice(0, 7);
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => handlePresetClick(color)}
                                                className={cn(
                                                    "relative size-6 rounded-md border shadow-sm transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                                    isSelected
                                                        ? "border-primary ring-2 ring-primary"
                                                        : "border-border hover:border-foreground/50"
                                                )}
                                                style={{ backgroundColor: normalizedPreset }}
                                                aria-label={`Select color ${normalizedPreset}`}
                                                aria-pressed={isSelected}
                                                disabled={disabled}
                                            >
                                                {isSelected && (
                                                    <IconCheck
                                                        className={cn(
                                                            "absolute inset-0 m-auto size-3",
                                                            // Use contrasting color for checkmark
                                                            normalizedPreset === "#FFFFFF" ||
                                                                normalizedPreset === "#FFFF00" ||
                                                                normalizedPreset === "#FFEAA7" ||
                                                                normalizedPreset === "#F7DC6F"
                                                                ? "text-black"
                                                                : "text-white"
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default ColorPicker;
