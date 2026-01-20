"use client";

import { IconTypography } from "@tabler/icons-react";

import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Supported fonts for brand kit
 * These fonts are commonly used for video captions and branding
 *
 * @validates Requirement 20.1
 */
export const SUPPORTED_FONTS = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Montserrat",
    "Poppins",
    "Oswald",
    "Bebas Neue",
    "Anton",
    "Bangers",
    "Permanent Marker",
] as const;

/**
 * Type for supported font names
 */
export type SupportedFont = (typeof SUPPORTED_FONTS)[number];

/**
 * FontSelectorProps interface
 *
 * @validates Requirements 20.1, 20.2, 20.3
 */
export interface FontSelectorProps {
    /** Currently selected font name */
    value: string;
    /** Callback when font selection changes */
    onChange: (font: string) => void;
    /** Array of available fonts to display */
    fonts: string[];
    /** Additional className */
    className?: string;
    /** Whether the component is disabled */
    disabled?: boolean;
    /** Label for the font selector section */
    label?: string;
}

/**
 * BrandFontSelector Component
 *
 * A font selection dropdown with font previews:
 * - Display font dropdown with previews (Requirement 20.1)
 * - Show selected font preview (Requirement 20.2)
 * - Support font selection (Requirement 20.3)
 *
 * @example
 * ```tsx
 * <BrandFontSelector
 *   value={brandKit?.font ?? "Inter"}
 *   onChange={(font) => updateBrandKit({ font })}
 *   fonts={SUPPORTED_FONTS}
 * />
 * ```
 *
 * @validates Requirements 20.1, 20.2, 20.3
 */
export function BrandFontSelector({
    value,
    onChange,
    fonts,
    className,
    disabled = false,
    label = "Brand Font",
}: FontSelectorProps) {
    /**
     * Gets the font-family CSS value for a given font name
     * Falls back to sans-serif for safety
     */
    const getFontFamily = (fontName: string): string => {
        return `"${fontName}", sans-serif`;
    };

    return (
        <div
            className={cn("flex flex-col gap-3", className)}
            data-slot="brand-font-selector"
        >
            {/* Label */}
            <Label className="font-medium text-foreground text-sm">{label}</Label>

            {/* Font Selector Dropdown - Requirement 20.1, 20.3 */}
            <Select
                value={value}
                onValueChange={(newValue) => newValue && onChange(newValue)}
                disabled={disabled}
            >
                <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                        <IconTypography className="size-4 text-muted-foreground" />
                        {/* Selected Font Preview - Requirement 20.2 */}
                        <SelectValue>
                            <span
                                style={{ fontFamily: getFontFamily(value) }}
                                className="truncate"
                            >
                                {value || "Select a font"}
                            </span>
                        </SelectValue>
                    </div>
                </SelectTrigger>

                <SelectContent>
                    {/* Font Options with Previews - Requirement 20.1 */}
                    {fonts.map((font) => (
                        <SelectItem key={font} value={font}>
                            <span
                                style={{ fontFamily: getFontFamily(font) }}
                                className="truncate"
                            >
                                {font}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Selected Font Preview Section - Requirement 20.2 */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="mb-2 text-muted-foreground text-xs">Preview</p>
                <p
                    className="text-lg leading-relaxed"
                    style={{ fontFamily: getFontFamily(value) }}
                >
                    The quick brown fox jumps over the lazy dog
                </p>
                <p
                    className="mt-1 text-sm text-muted-foreground"
                    style={{ fontFamily: getFontFamily(value) }}
                >
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789
                </p>
            </div>

            {/* Empty State */}
            {fonts.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <IconTypography className="size-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                        <p className="font-medium text-sm">No fonts available</p>
                        <p className="text-muted-foreground text-xs">
                            No fonts have been configured
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BrandFontSelector;
