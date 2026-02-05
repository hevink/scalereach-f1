"use client";

import { useCallback, useEffect, useState } from "react";
import type { CaptionStyle } from "@/lib/api/captions";
import {
  DEFAULT_PRESETS,
  getPresetById,
  type CaptionStylePreset,
} from "@/components/captions/caption-style-presets";

/**
 * Local storage key for persisting the last used caption style
 * @validates Requirements 9.5 - Save last used caption style as default
 */
const LAST_USED_STYLE_KEY = "caption_style_last_used";

/**
 * Local storage key for persisting the last selected preset ID
 */
const LAST_USED_PRESET_KEY = "caption_style_last_preset";

/**
 * Interface for the hook return value
 */
export interface UseCaptionStylePresetsReturn {
  /** All available presets */
  presets: CaptionStylePreset[];
  /** Currently selected preset ID */
  selectedPresetId: string | undefined;
  /** Apply a preset by ID - returns the style if found */
  applyPreset: (presetId: string) => CaptionStyle | undefined;
  /** Get the last used style from localStorage */
  getLastUsedStyle: () => CaptionStyle | undefined;
  /** Save a style as the last used style */
  saveLastUsedStyle: (style: CaptionStyle, presetId?: string) => void;
  /** Clear the selected preset (when user manually edits style) */
  clearSelectedPreset: () => void;
  /** Check if a style matches a preset */
  isPresetStyle: (style: CaptionStyle) => boolean;
}

/**
 * Compares two caption styles for equality
 * Used to determine if a style matches a preset
 */
function areStylesEqual(style1: CaptionStyle, style2: CaptionStyle): boolean {
  // Compare all relevant style properties
  return (
    style1.fontFamily === style2.fontFamily &&
    style1.fontSize === style2.fontSize &&
    style1.textColor === style2.textColor &&
    style1.backgroundColor === style2.backgroundColor &&
    style1.backgroundOpacity === style2.backgroundOpacity &&
    style1.position === style2.position &&
    style1.alignment === style2.alignment &&
    style1.animation === style2.animation &&
    style1.highlightColor === style2.highlightColor &&
    style1.highlightEnabled === style2.highlightEnabled &&
    style1.shadow === style2.shadow &&
    style1.outline === style2.outline &&
    style1.outlineColor === style2.outlineColor
  );
}

/**
 * useCaptionStylePresets Hook
 *
 * Manages caption style presets with the following features:
 * - Apply all style properties from selected preset (Requirement 9.2)
 * - Allow editing after preset application (Requirement 9.4)
 * - Save last used style as default for new clips (Requirement 9.5)
 *
 * @example
 * ```tsx
 * const {
 *   presets,
 *   selectedPresetId,
 *   applyPreset,
 *   getLastUsedStyle,
 *   saveLastUsedStyle,
 * } = useCaptionStylePresets();
 *
 * // Apply a preset
 * const newStyle = applyPreset("viral-bold");
 * if (newStyle) {
 *   setCaptionStyle(newStyle);
 * }
 *
 * // Get last used style for new clips
 * const defaultStyle = getLastUsedStyle() || DEFAULT_CAPTION_STYLE;
 * ```
 *
 * @validates Requirements 9.2, 9.4, 9.5
 */
export function useCaptionStylePresets(): UseCaptionStylePresetsReturn {
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(
    undefined
  );

  // Initialize selected preset from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedPresetId = localStorage.getItem(LAST_USED_PRESET_KEY);
        if (savedPresetId) {
          setSelectedPresetId(savedPresetId);
        }
      } catch (error) {
        console.warn("Failed to load last used preset from localStorage:", error);
      }
    }
  }, []);

  /**
   * Apply a preset by ID
   * Returns the style from the preset if found, undefined otherwise
   *
   * @validates Requirements 9.2 - Apply all style properties from selected preset
   */
  const applyPreset = useCallback((presetId: string): CaptionStyle | undefined => {
    const preset = getPresetById(presetId);
    if (!preset) {
      console.warn(`Preset with ID "${presetId}" not found`);
      return undefined;
    }

    // Update selected preset state
    setSelectedPresetId(presetId);

    // Save to localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LAST_USED_PRESET_KEY, presetId);
        localStorage.setItem(LAST_USED_STYLE_KEY, JSON.stringify(preset.style));
      } catch (error) {
        console.warn("Failed to save preset to localStorage:", error);
      }
    }

    // Return a copy of the style to prevent mutations
    return { ...preset.style };
  }, []);

  /**
   * Get the last used style from localStorage
   *
   * @validates Requirements 9.5 - Save last used caption style as default
   */
  const getLastUsedStyle = useCallback((): CaptionStyle | undefined => {
    if (typeof window === "undefined") {
      return undefined;
    }

    try {
      const savedStyle = localStorage.getItem(LAST_USED_STYLE_KEY);
      if (savedStyle) {
        return JSON.parse(savedStyle) as CaptionStyle;
      }
    } catch (error) {
      console.warn("Failed to load last used style from localStorage:", error);
    }

    return undefined;
  }, []);

  /**
   * Save a style as the last used style
   * Optionally associates it with a preset ID
   *
   * @validates Requirements 9.5 - Save last used caption style as default
   */
  const saveLastUsedStyle = useCallback(
    (style: CaptionStyle, presetId?: string): void => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        localStorage.setItem(LAST_USED_STYLE_KEY, JSON.stringify(style));
        if (presetId) {
          localStorage.setItem(LAST_USED_PRESET_KEY, presetId);
          setSelectedPresetId(presetId);
        }
      } catch (error) {
        console.warn("Failed to save style to localStorage:", error);
      }
    },
    []
  );

  /**
   * Clear the selected preset
   * Called when user manually edits style after applying a preset
   *
   * @validates Requirements 9.4 - Allow editing after preset application
   */
  const clearSelectedPreset = useCallback((): void => {
    setSelectedPresetId(undefined);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(LAST_USED_PRESET_KEY);
      } catch (error) {
        console.warn("Failed to clear preset from localStorage:", error);
      }
    }
  }, []);

  /**
   * Check if a style matches any preset
   * Returns true if the style exactly matches a preset's style
   */
  const isPresetStyle = useCallback((style: CaptionStyle): boolean => {
    return DEFAULT_PRESETS.some((preset) => areStylesEqual(style, preset.style));
  }, []);

  return {
    presets: DEFAULT_PRESETS,
    selectedPresetId,
    applyPreset,
    getLastUsedStyle,
    saveLastUsedStyle,
    clearSelectedPreset,
    isPresetStyle,
  };
}

export default useCaptionStylePresets;
