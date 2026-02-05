"use client";

import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconBorderOuter,
  IconLayoutBottombar,
  IconLayoutNavbar,
  IconLayoutNavbarCollapse,
  IconShadow,
  IconTypography,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ColorPicker } from "@/components/ui/color-picker";
import { Label } from "@/components/ui/label";
import { LabeledSlider } from "@/components/ui/labeled-slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type {
  CaptionPosition,
  CaptionStyle,
  TextAlignment,
} from "@/lib/api/captions";
import { cn } from "@/lib/utils";
import {
  CaptionStylePresets,
  type CaptionStylePreset,
} from "./caption-style-presets";

/**
 * Debounce delay for style changes (ms)
 * Ensures preview updates within 500ms (Requirement 35.4)
 */
const DEBOUNCE_DELAY = 300;

/**
 * Supported fonts for captions
 * Based on design document specification
 * Includes viral-optimized fonts (Requirement 8.1)
 */
export const SUPPORTED_FONTS = [
  // Viral-optimized fonts (Requirement 8.1)
  "Moji Pop",
  "Line",
  "Brishti",
  "Deep",
  "Depo B",
  "Bangers",
  "Permanent Marker",
  "Anton",
  "Bebas Neue",
  "Oswald",
  // Standard fonts
  "Inter",
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Poppins",
] as const;

/**
 * Mapping of font names to their CSS font-family values
 * Custom fonts use fallback system fonts
 */
export const FONT_FAMILY_MAP: Record<string, string> = {
  // Viral-optimized fonts (Google Fonts)
  "Bangers": "var(--font-bangers), cursive",
  "Permanent Marker": "var(--font-permanent-marker), cursive",
  "Anton": "var(--font-anton), sans-serif",
  "Bebas Neue": "var(--font-bebas-neue), sans-serif",
  "Oswald": "var(--font-oswald), sans-serif",
  // Custom viral fonts (require custom font files - using fallbacks)
  "Moji Pop": "'Moji Pop', 'Comic Sans MS', cursive",
  "Line": "'Line', 'Arial Rounded MT Bold', sans-serif",
  "Brishti": "'Brishti', 'Brush Script MT', cursive",
  "Deep": "'Deep', 'Impact', sans-serif",
  "Depo B": "'Depo B', 'Arial Black', sans-serif",
  // Standard fonts
  "Inter": "Inter, sans-serif",
  "Roboto": "Roboto, sans-serif",
  "Open Sans": "'Open Sans', sans-serif",
  "Montserrat": "Montserrat, sans-serif",
  "Poppins": "Poppins, sans-serif",
};

/**
 * Font size bounds (12-72px)
 * Validates: Requirements 13.2
 */
export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 72;

/**
 * Background opacity bounds (0-100%)
 * Validates: Requirements 13.4
 */
export const OPACITY_MIN = 0;
export const OPACITY_MAX = 100;

/**
 * Position options with icons and labels
 */
const POSITION_OPTIONS: {
  value: CaptionPosition;
  label: string;
  icon: ReactNode;
}[] = [
    {
      value: "top",
      label: "Top",
      icon: <IconLayoutNavbar className="size-4" />,
    },
    {
      value: "center",
      label: "Center",
      icon: <IconLayoutNavbarCollapse className="size-4" />,
    },
    {
      value: "bottom",
      label: "Bottom",
      icon: <IconLayoutBottombar className="size-4" />,
    },
  ];

/**
 * Alignment options with icons and labels
 */
const ALIGNMENT_OPTIONS: {
  value: TextAlignment;
  label: string;
  icon: ReactNode;
}[] = [
    {
      value: "left",
      label: "Left",
      icon: <IconAlignLeft className="size-4" />,
    },
    {
      value: "center",
      label: "Center",
      icon: <IconAlignCenter className="size-4" />,
    },
    {
      value: "right",
      label: "Right",
      icon: <IconAlignRight className="size-4" />,
    },
  ];

/**
 * CaptionStylePanelProps interface
 *
 * @validates Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 9.1, 9.2, 9.3, 9.4, 9.5
 */
export interface CaptionStylePanelProps {
  /** Current caption style configuration */
  style: CaptionStyle;
  /** Callback when style changes */
  onChange: (style: CaptionStyle) => void;
  /** Additional className */
  className?: string;
  /** Whether the panel is disabled */
  disabled?: boolean;
  /** Available caption style presets (optional, uses defaults if not provided) */
  presets?: CaptionStylePreset[];
  /** Currently selected preset ID */
  selectedPresetId?: string;
  /** Callback when a preset is selected - receives preset ID and the preset's style */
  onPresetSelect?: (presetId: string, style: CaptionStyle) => void;
  /** Whether to show the presets section (default: true) */
  showPresets?: boolean;
}

/**
 * Clamps font size to valid bounds (12-72px)
 * Validates: Requirements 13.2
 */
export function clampFontSize(size: number): number {
  return Math.min(Math.max(size, FONT_SIZE_MIN), FONT_SIZE_MAX);
}

/**
 * Clamps opacity to valid bounds (0-100%)
 * Validates: Requirements 13.4
 */
export function clampOpacity(opacity: number): number {
  return Math.min(Math.max(opacity, OPACITY_MIN), OPACITY_MAX);
}

/**
 * Validates if a font is in the supported fonts list
 */
export function isValidFont(font: string): boolean {
  return SUPPORTED_FONTS.includes(font as (typeof SUPPORTED_FONTS)[number]);
}

/**
 * Gets the CSS font-family value for a given font name
 * @param fontName - The display name of the font
 * @returns The CSS font-family value
 */
export function getFontFamily(fontName: string): string {
  return FONT_FAMILY_MAP[fontName] || fontName;
}

/**
 * ToggleButtonGroup Component
 *
 * A group of toggle buttons for selecting from a set of options
 */
interface ToggleButtonGroupProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon: ReactNode }[];
  label: string;
  disabled?: boolean;
}

function ToggleButtonGroup<T extends string>({
  value,
  onChange,
  options,
  label,
  disabled,
}: ToggleButtonGroupProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="font-medium text-foreground text-sm">{label}</Label>
      <div className="inline-flex rounded-md border border-input bg-transparent p-1">
        {options.map((option) => (
          <button
            aria-label={option.label}
            aria-pressed={value === option.value}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded px-3 py-1.5 font-medium text-sm transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              value === option.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            disabled={disabled}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.icon}
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * SwitchField Component
 *
 * A labeled switch toggle
 */
interface SwitchFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

function SwitchField({
  checked,
  onChange,
  label,
  description,
  icon,
  disabled,
}: SwitchFieldProps) {
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {icon && (
          <span aria-hidden="true" className="text-muted-foreground">
            {icon}
          </span>
        )}
        <div className="flex flex-col">
          <Label className="font-medium text-foreground text-sm" htmlFor={id}>
            {label}
          </Label>
          {description && (
            <span className="text-muted-foreground text-xs">{description}</span>
          )}
        </div>
      </div>
      <Switch
        aria-label={label}
        checked={checked}
        disabled={disabled}
        id={id}
        onCheckedChange={onChange}
      />
    </div>
  );
}

/**
 * CaptionStylePanel Component
 *
 * A comprehensive panel for customizing caption appearance including:
 * - Caption style presets for quick application (Requirements 9.1, 9.2, 9.3)
 * - Font family dropdown with supported fonts (Requirement 13.1)
 * - Font size slider (12-72px) (Requirement 13.2)
 * - Color pickers for text, background, and highlight colors (Requirement 13.3)
 * - Background opacity slider (0-100%) (Requirement 13.4)
 * - Position selector (top, center, bottom) (Requirement 13.5)
 * - Alignment selector (left, center, right) (Requirement 13.6)
 * - Shadow and outline toggles (Requirement 13.7)
 *
 * All changes trigger the onChange callback within 500ms (Requirement 13.8)
 * Responsive design for mobile/tablet/desktop (Requirement 31.1, 31.2, 31.3)
 *
 * @example
 * ```tsx
 * const [style, setStyle] = useState<CaptionStyle>(defaultStyle);
 *
 * <CaptionStylePanel
 *   style={style}
 *   onChange={(newStyle) => setStyle(newStyle)}
 *   onPresetSelect={(presetId, presetStyle) => {
 *     setStyle(presetStyle);
 *     // Save as last used style
 *   }}
 * />
 * ```
 *
 * @validates Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 31.1, 31.2, 31.3
 */
export function CaptionStylePanel({
  style,
  onChange,
  className,
  disabled = false,
  presets,
  selectedPresetId,
  onPresetSelect,
  showPresets = true,
}: CaptionStylePanelProps) {
  // Local state for immediate UI updates
  const [localStyle, setLocalStyle] = useState<CaptionStyle>(style);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalStyle(style);
  }, [style]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  /**
   * Helper to update a single style property with debouncing
   * Updates local state immediately for responsive UI
   * Debounces the onChange callback for performance (Requirement 35.4)
   */
  const updateStyle = useCallback(
    <K extends keyof CaptionStyle>(key: K, value: CaptionStyle[K]) => {
      const newStyle = {
        ...localStyle,
        [key]: value,
      };

      // Update local state immediately for responsive UI
      setLocalStyle(newStyle);

      // Debounce the onChange callback
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onChange(newStyle);
      }, DEBOUNCE_DELAY);
    },
    [localStyle, onChange]
  );

  // Handle font family change
  const handleFontFamilyChange = useCallback(
    (font: string | null) => {
      if (font && isValidFont(font)) {
        updateStyle("fontFamily", font);
      }
    },
    [updateStyle]
  );

  // Handle font size change with clamping
  const handleFontSizeChange = useCallback(
    (size: number) => {
      updateStyle("fontSize", clampFontSize(size));
    },
    [updateStyle]
  );

  // Handle opacity change with clamping
  const handleOpacityChange = useCallback(
    (opacity: number) => {
      updateStyle("backgroundOpacity", clampOpacity(opacity));
    },
    [updateStyle]
  );

  /**
   * Handle preset selection
   * Applies all style properties from the selected preset
   * @validates Requirements 9.2 - Apply all style properties from selected preset
   */
  const handlePresetSelect = useCallback(
    (presetId: string) => {
      // Find the preset by ID
      const { getPresetById } = require("./caption-style-presets");
      const preset = getPresetById(presetId);

      if (preset && onPresetSelect) {
        // Call the onPresetSelect callback with both the preset ID and the style
        // This allows the parent component to:
        // 1. Apply the style (Requirement 9.2)
        // 2. Track the selected preset
        // 3. Save as last used style (Requirement 9.5)
        onPresetSelect(presetId, { ...preset.style });
      }
    },
    [onPresetSelect]
  );

  return (
    <section
      aria-label="Caption style customization"
      className={cn("flex flex-col gap-4 sm:gap-6", className)}
      data-slot="caption-style-panel"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <IconTypography className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">Caption Style</span>
      </div>

      {/* Style Presets Section - Requirement 9.1, 9.2, 9.3 */}
      {showPresets && (
        <>
          <CaptionStylePresets
            presets={presets}
            selectedPresetId={selectedPresetId}
            onSelect={handlePresetSelect}
            disabled={disabled}
          />
          <Separator className="my-2" />
        </>
      )}

      {/* Typography Section */}
      {/* @validates Requirement 31.3 - Mobile-friendly forms */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          Typography
        </h3>

        {/* Font Family Dropdown - Requirement 13.1, 8.1 */}
        <div className="flex flex-col gap-2">
          <Label className="font-medium text-foreground text-xs sm:text-sm">
            Font Family
          </Label>
          <Select
            disabled={disabled}
            onValueChange={handleFontFamilyChange}
            value={localStyle.fontFamily}
          >
            <SelectTrigger aria-label="Select font family" className="w-full h-10 sm:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* Viral-optimized fonts section */}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Viral Fonts
              </div>
              {SUPPORTED_FONTS.slice(0, 10).map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: getFontFamily(font) }}>{font}</span>
                </SelectItem>
              ))}
              {/* Standard fonts section */}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                Standard Fonts
              </div>
              {SUPPORTED_FONTS.slice(10).map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: getFontFamily(font) }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size Slider - Requirement 13.2 */}
        <LabeledSlider
          disabled={disabled}
          label="Font Size"
          max={FONT_SIZE_MAX}
          min={FONT_SIZE_MIN}
          onChange={handleFontSizeChange}
          step={1}
          unit="px"
          value={localStyle.fontSize}
        />
      </div>

      {/* Colors Section */}
      {/* @validates Requirement 31.3 - Mobile-friendly color pickers */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          Colors
        </h3>

        {/* Color pickers in responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Text Color - Requirement 13.3 */}
          <ColorPicker
            disabled={disabled}
            label="Text Color"
            onChange={(color) => updateStyle("textColor", color)}
            value={localStyle.textColor}
          />

          {/* Background Color - Requirement 13.3 */}
          <ColorPicker
            disabled={disabled}
            label="Background Color"
            onChange={(color) => updateStyle("backgroundColor", color)}
            value={localStyle.backgroundColor || "#000000"}
          />
        </div>

        {/* Background Opacity - Requirement 13.4 */}
        <LabeledSlider
          disabled={disabled}
          label="Background Opacity"
          max={OPACITY_MAX}
          min={OPACITY_MIN}
          onChange={handleOpacityChange}
          step={1}
          unit="%"
          value={localStyle.backgroundOpacity}
        />

        {/* Highlight Color - Requirement 13.3 */}
        <ColorPicker
          disabled={disabled}
          label="Highlight Color"
          onChange={(color) => updateStyle("highlightColor", color)}
          value={localStyle.highlightColor || "#FFFF00"}
        />
      </div>

      {/* Position & Alignment Section */}
      {/* @validates Requirement 31.3 - Mobile-friendly toggle buttons */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          Position & Alignment
        </h3>

        {/* Position Selector - Requirement 13.5 */}
        <ToggleButtonGroup
          disabled={disabled}
          label="Position"
          onChange={(position) => updateStyle("position", position as CaptionPosition)}
          options={POSITION_OPTIONS}
          value={localStyle.position ?? "bottom"}
        />

        {/* Alignment Selector - Requirement 13.6 */}
        <ToggleButtonGroup
          disabled={disabled}
          label="Alignment"
          onChange={(alignment) => updateStyle("alignment", alignment as TextAlignment)}
          options={ALIGNMENT_OPTIONS}
          value={localStyle.alignment ?? "center"}
        />
      </div>

      {/* Effects Section */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          Effects
        </h3>

        {/* Shadow Toggle - Requirement 13.7 */}
        <SwitchField
          checked={localStyle.shadow}
          description="Add a drop shadow behind text"
          disabled={disabled}
          icon={<IconShadow className="size-4" />}
          label="Text Shadow"
          onChange={(checked) => updateStyle("shadow", checked)}
        />

        {/* Outline Toggle - Requirement 13.7 */}
        <SwitchField
          checked={localStyle.outline}
          description="Add an outline around text"
          disabled={disabled}
          icon={<IconBorderOuter className="size-4" />}
          label="Text Outline"
          onChange={(checked) => updateStyle("outline", checked)}
        />

        {/* Outline Color (shown when outline is enabled) */}
        {localStyle.outline && (
          <ColorPicker
            disabled={disabled}
            label="Outline Color"
            onChange={(color) => updateStyle("outlineColor", color)}
            value={localStyle.outlineColor || "#000000"}
          />
        )}
      </div>
    </section>
  );
}

export default CaptionStylePanel;
