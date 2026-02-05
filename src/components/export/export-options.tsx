"use client";

import {
  IconAlertTriangle,
  IconCoin,
  IconCrown,
  IconDeviceTv,
  IconDownload,
  IconFile,
} from "@tabler/icons-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ExportFormat,
  ExportOptions as ExportOptionsType,
  VideoResolution,
} from "@/lib/api/export";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";

/**
 * ExportOptionsProps interface
 *
 * @validates Requirements 22.1, 22.2, 22.3, 22.4, 22.5
 */
export interface ExportOptionsProps {
  /** Callback when export is initiated with selected options */
  onExport: (options: ExportOptionsType) => void;
  /** Credit cost for the export operation */
  creditCost: number;
  /** User's current credit balance */
  userCredits: number;
  /** Whether the export controls are disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Optional caption style ID to include in export */
  captionStyleId?: string;
  /** Optional brand kit ID to include in export */
  brandKitId?: string;
  /** Whether the user has Pro access (enables 4K export) */
  hasProAccess?: boolean;
}

/**
 * Format options with labels and recommendations
 * @validates Requirement 22.1
 */
const FORMAT_OPTIONS: Array<{
  value: ExportFormat;
  label: string;
  recommended?: boolean;
}> = [
    { value: "mp4", label: "MP4", recommended: true },
    { value: "mov", label: "MOV" },
  ];

/**
 * Resolution options with labels, recommendations, and estimated file size multipliers
 * @validates Requirements 22.2, 22.3, 22.4
 */
const RESOLUTION_OPTIONS: Array<{
  value: VideoResolution;
  label: string;
  recommended?: boolean;
  /** Estimated file size multiplier (relative to 720p baseline) */
  sizeMultiplier: number;
  /** Whether this resolution requires Pro access */
  requiresPro?: boolean;
}> = [
    { value: "720p", label: "720p (HD)", sizeMultiplier: 1 },
    {
      value: "1080p",
      label: "1080p (Full HD)",
      recommended: true,
      sizeMultiplier: 2.25,
    },
    { value: "4k", label: "4K (Ultra HD)", sizeMultiplier: 9, requiresPro: true },
  ];

/**
 * Base file size estimate in MB for a 1-minute clip at 720p
 * Used for rough file size estimation
 */
const BASE_FILE_SIZE_MB = 15;

/**
 * Estimates file size based on resolution
 * @validates Requirement 22.3
 */
function estimateFileSize(resolution: VideoResolution): string {
  const resolutionConfig = RESOLUTION_OPTIONS.find(
    (r) => r.value === resolution
  );
  const multiplier = resolutionConfig?.sizeMultiplier ?? 1;
  const estimatedMB = Math.round(BASE_FILE_SIZE_MB * multiplier);

  if (estimatedMB >= 1000) {
    return `~${(estimatedMB / 1000).toFixed(1)} GB`;
  }
  return `~${estimatedMB} MB`;
}

/**
 * ExportOptions Component
 *
 * A comprehensive export configuration interface with:
 * - Format selector (MP4, MOV) (Requirement 22.1)
 * - Resolution selector (720p, 1080p, 4K) (Requirement 22.2)
 * - Estimated file size display (Requirement 22.3)
 * - Credit cost display with warning (Requirement 22.4)
 * - User permission validation (Requirement 22.5)
 *
 * @example
 * ```tsx
 * <ExportOptions
 *   onExport={(options) => handleExport(options)}
 *   creditCost={5}
 *   userCredits={10}
 * />
 * ```
 *
 * @validates Requirements 22.1, 22.2, 22.3, 22.4, 22.5
 */
export function ExportOptions({
  onExport,
  creditCost,
  userCredits,
  disabled = false,
  className,
  captionStyleId,
  brandKitId,
  hasProAccess = false,
}: ExportOptionsProps) {
  // State for selected format and resolution
  const [format, setFormat] = useState<ExportFormat>("mp4");
  const [resolution, setResolution] = useState<VideoResolution>("1080p");

  /**
   * Check if user has sufficient credits
   * @validates Requirement 22.5
   */
  const hasInsufficientCredits = useMemo(() => {
    return userCredits < creditCost;
  }, [userCredits, creditCost]);

  /**
   * Check if selected resolution requires Pro access that user doesn't have
   * @validates Requirement 22.4, 22.5
   */
  const requiresProUpgrade = useMemo(() => {
    const selectedOption = RESOLUTION_OPTIONS.find(
      (r) => r.value === resolution
    );
    return selectedOption?.requiresPro && !hasProAccess;
  }, [resolution, hasProAccess]);

  /**
   * Estimated file size based on selected resolution
   * @validates Requirement 22.3
   */
  const estimatedSize = useMemo(() => {
    return estimateFileSize(resolution);
  }, [resolution]);

  /**
   * Handle export button click
   * Builds export options and calls onExport callback
   */
  const handleExport = useCallback(() => {
    const options: ExportOptionsType = {
      format,
      resolution,
      ...(captionStyleId && { captionStyleId }),
      ...(brandKitId && { brandKitId }),
    };

    // Track export event
    analytics.featureUsed("clip_export", {
      format,
      resolution,
      hasCaptions: !!captionStyleId,
      hasBrandKit: !!brandKitId,
    });

    onExport(options);
  }, [format, resolution, captionStyleId, brandKitId, onExport]);

  /**
   * Whether the export button should be disabled
   * @validates Requirement 22.5
   */
  const isExportDisabled =
    disabled || hasInsufficientCredits || requiresProUpgrade;

  return (
    <Card className={cn("w-full", className)} data-slot="export-options">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconDownload className="size-5" />
          Export Options
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* Format Selector - Requirement 22.1 */}
        <div className="flex flex-col gap-2">
          <Label className="flex items-center gap-2 font-medium text-foreground text-sm">
            <IconFile className="size-4 text-muted-foreground" />
            Format
          </Label>
          <Select
            disabled={disabled}
            onValueChange={(value) => value && setFormat(value as ExportFormat)}
            value={format}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {FORMAT_OPTIONS.find((f) => f.value === format)?.label ??
                  "Select format"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FORMAT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    {option.label}
                    {option.recommended && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary text-xs">
                        Recommended
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resolution Selector - Requirement 22.2, 22.4 */}
        <div className="flex flex-col gap-2">
          <Label className="flex items-center gap-2 font-medium text-foreground text-sm">
            <IconDeviceTv className="size-4 text-muted-foreground" />
            Resolution
          </Label>
          <Select
            disabled={disabled}
            onValueChange={(value) =>
              value && setResolution(value as VideoResolution)
            }
            value={resolution}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {RESOLUTION_OPTIONS.find((r) => r.value === resolution)
                  ?.label ?? "Select resolution"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    {option.label}
                    {option.recommended && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary text-xs">
                        Recommended
                      </span>
                    )}
                    {/* Pro badge for 4K - Requirement 22.4 */}
                    {option.requiresPro && (
                      <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600 text-xs dark:text-amber-400">
                        <IconCrown className="size-3" />
                        Pro
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pro Upgrade Warning - Requirement 22.4, 22.5 */}
        {requiresProUpgrade && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-amber-600 text-sm dark:text-amber-400">
              <IconCrown className="size-4" />
              <span className="font-medium">4K export requires Pro</span>
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              Upgrade to Pro to unlock 4K Ultra HD exports and other premium
              features.
            </p>
          </div>
        )}

        {/* Estimated File Size - Requirement 22.3 */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Estimated File Size
            </span>
            <span className="font-medium text-sm">{estimatedSize}</span>
          </div>
        </div>

        {/* Credit Cost Display - Requirement 22.4 */}
        <div
          className={cn(
            "rounded-lg border p-4",
            hasInsufficientCredits
              ? "border-destructive/50 bg-destructive/10"
              : "border-border bg-muted/30"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <IconCoin className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Credit Cost</span>
            </span>
            <span className="font-medium text-sm">{creditCost} credits</span>
          </div>

          {/* Credit Balance */}
          <div className="mt-2 flex items-center justify-between border-border/50 border-t pt-2">
            <span className="text-muted-foreground text-sm">Your Balance</span>
            <span
              className={cn(
                "font-medium text-sm",
                hasInsufficientCredits ? "text-destructive" : "text-foreground"
              )}
            >
              {userCredits} credits
            </span>
          </div>

          {/* Insufficient Credits Warning - Requirement 22.5 */}
          {hasInsufficientCredits && (
            <div className="mt-3 flex items-center gap-2 text-destructive text-sm">
              <IconAlertTriangle className="size-4" />
              <span>
                Insufficient credits. Please purchase more credits to export.
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end">
        {/* Export Button - validates against user permissions (Requirement 22.5) */}
        <Button
          className="gap-2"
          disabled={isExportDisabled}
          onClick={handleExport}
        >
          <IconDownload className="size-4" data-icon="inline-start" />
          Export Clip
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ExportOptions;
