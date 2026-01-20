"use client";

import { IconPalette, IconPlus, IconX } from "@tabler/icons-react";
import { useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Default maximum number of colors allowed in the palette
 * @validates Requirement 19.4
 */
export const DEFAULT_MAX_COLORS = 5;

/**
 * Default color to add when creating a new swatch
 */
export const DEFAULT_NEW_COLOR = "#000000";

/**
 * ColorPaletteBuilderProps interface
 *
 * @validates Requirements 19.1, 19.2, 19.3, 19.4, 19.5
 */
export interface ColorPaletteBuilderProps {
    /** Current array of hex color strings */
    colors: string[];
    /** Callback when colors array changes */
    onChange: (colors: string[]) => void;
    /** Maximum number of colors allowed (default: 5) */
    maxColors?: number;
    /** Additional className */
    className?: string;
    /** Whether the component is disabled */
    disabled?: boolean;
    /** Label for the color palette section */
    label?: string;
}

/**
 * ColorPaletteBuilder Component
 *
 * A color palette management interface with:
 * - Display color swatches with pickers (Requirement 19.1)
 * - Support adding new colors (Requirement 19.2)
 * - Support removing colors (Requirement 19.3)
 * - Enforce maximum 5 colors by default (Requirement 19.4)
 * - Save colors to brand kit via onChange callback (Requirement 19.5)
 *
 * @example
 * ```tsx
 * <ColorPaletteBuilder
 *   colors={brandKit?.colors ?? []}
 *   onChange={(colors) => updateBrandKit({ colors })}
 *   maxColors={5}
 * />
 * ```
 *
 * @validates Requirements 19.1, 19.2, 19.3, 19.4, 19.5
 */
export function ColorPaletteBuilder({
    colors,
    onChange,
    maxColors = DEFAULT_MAX_COLORS,
    className,
    disabled = false,
    label = "Brand Colors",
}: ColorPaletteBuilderProps) {
    const canAddMore = colors.length < maxColors;

    /**
     * Handles adding a new color to the palette
     * @validates Requirement 19.2
     */
    const handleAddColor = useCallback(() => {
        if (!canAddMore) {
            toast.error(`Maximum ${maxColors} colors allowed`);
            return;
        }

        const newColors = [...colors, DEFAULT_NEW_COLOR];
        onChange(newColors);
        toast.success("Color added to palette");
    }, [colors, onChange, canAddMore, maxColors]);

    /**
     * Handles removing a color from the palette
     * @validates Requirement 19.3
     */
    const handleRemoveColor = useCallback(
        (index: number) => {
            const newColors = colors.filter((_, i) => i !== index);
            onChange(newColors);
            toast.success("Color removed from palette");
        },
        [colors, onChange]
    );

    /**
     * Handles updating a color at a specific index
     * @validates Requirements 19.1, 19.5
     */
    const handleColorChange = useCallback(
        (index: number, newColor: string) => {
            const newColors = [...colors];
            newColors[index] = newColor;
            onChange(newColors);
        },
        [colors, onChange]
    );

    return (
        <div
            className={cn("flex flex-col gap-3", className)}
            data-slot="color-palette-builder"
        >
            {/* Label */}
            <div className="flex items-center justify-between">
                <Label className="font-medium text-foreground text-sm">{label}</Label>
                <span className="text-muted-foreground text-xs">
                    {colors.length}/{maxColors} colors
                </span>
            </div>

            {/* Color Swatches Grid - Requirement 19.1 */}
            {colors.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {colors.map((color, index) => (
                        <div
                            key={`color-${index}`}
                            className="group relative flex items-center gap-2"
                        >
                            {/* Color Picker Swatch - Requirement 19.1 */}
                            <div className="flex-1">
                                <ColorPicker
                                    value={color}
                                    onChange={(newColor) => handleColorChange(index, newColor)}
                                    disabled={disabled}
                                    presetColors={[
                                        "#FFFFFF",
                                        "#000000",
                                        "#FF0000",
                                        "#00FF00",
                                        "#0000FF",
                                        "#FFFF00",
                                        "#FF00FF",
                                        "#00FFFF",
                                    ]}
                                />
                            </div>

                            {/* Remove Button - Requirement 19.3 */}
                            <Button
                                aria-label={`Remove color ${color}`}
                                className="size-8 shrink-0 text-destructive opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                                disabled={disabled}
                                onClick={() => handleRemoveColor(index)}
                                size="icon"
                                variant="ghost"
                            >
                                <IconX className="size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <IconPalette className="size-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                        <p className="font-medium text-sm">No colors added</p>
                        <p className="text-muted-foreground text-xs">
                            Add colors to your brand palette
                        </p>
                    </div>
                </div>
            )}

            {/* Add Color Button - Requirement 19.2, 19.4 */}
            <Button
                className="w-full"
                disabled={disabled || !canAddMore}
                onClick={handleAddColor}
                variant="outline"
            >
                <IconPlus className="mr-2 size-4" />
                Add Color
                {!canAddMore && (
                    <span className="ml-1 text-muted-foreground text-xs">
                        (max {maxColors})
                    </span>
                )}
            </Button>

            {/* Max Colors Warning */}
            {!canAddMore && (
                <p className="text-center text-muted-foreground text-xs">
                    Maximum of {maxColors} colors reached. Remove a color to add a new one.
                </p>
            )}
        </div>
    );
}

export default ColorPaletteBuilder;
