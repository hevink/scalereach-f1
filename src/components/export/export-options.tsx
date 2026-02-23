"use client";

import {
  IconAlertTriangle,
  IconCheck,
  IconCoin,
  IconCrown,
  IconDownload,
  IconLoader2,
  IconVolume,
} from "@tabler/icons-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
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
 */
export interface ExportOptionsProps {
  onExport: (options: ExportOptionsType) => void;
  creditCost?: number;
  userCredits?: number;
  disabled?: boolean;
  className?: string;
  captionStyleId?: string;
  brandKitId?: string;
  hasProAccess?: boolean;
  translationLanguages?: Array<{ language: string; name: string }>;
  availableDubbings?: Array<{ id: string; targetLanguage: string; voiceName: string | null; status: string }>;
}

const FORMAT_OPTIONS: Array<{
  value: ExportFormat;
  label: string;
  description: string;
  recommended?: boolean;
}> = [
    { value: "mp4", label: "MP4", description: "Best compatibility", recommended: true },
    { value: "mov", label: "MOV", description: "Apple ecosystem" },
  ];

const RESOLUTION_OPTIONS: Array<{
  value: VideoResolution;
  label: string;
  shortLabel: string;
  description: string;
  recommended?: boolean;
  sizeMultiplier: number;
  requiresPro?: boolean;
}> = [
    { value: "720p", label: "720p", shortLabel: "HD", description: "Good for social", sizeMultiplier: 1 },
    { value: "1080p", label: "1080p", shortLabel: "Full HD", description: "Recommended", recommended: true, sizeMultiplier: 2.25 },
    { value: "4k", label: "4K", shortLabel: "Ultra HD", description: "Starter & Pro", sizeMultiplier: 9, requiresPro: true },
  ];

const BASE_FILE_SIZE_MB = 15;

function estimateFileSize(resolution: VideoResolution): string {
  const resolutionConfig = RESOLUTION_OPTIONS.find((r) => r.value === resolution);
  const multiplier = resolutionConfig?.sizeMultiplier ?? 1;
  const estimatedMB = Math.round(BASE_FILE_SIZE_MB * multiplier);
  if (estimatedMB >= 1000) return `~${(estimatedMB / 1000).toFixed(1)} GB`;
  return `~${estimatedMB} MB`;
}

export function ExportOptions({
  onExport,
  creditCost,
  userCredits,
  disabled = false,
  className,
  captionStyleId,
  brandKitId,
  hasProAccess = false,
  translationLanguages,
  availableDubbings,
}: ExportOptionsProps) {
  const [format, setFormat] = useState<ExportFormat>("mp4");
  const [resolution, setResolution] = useState<VideoResolution>("1080p");
  const [targetLanguage, setTargetLanguage] = useState<string | undefined>();
  const [dubbingId, setDubbingId] = useState<string | undefined>();

  const hasInsufficientCredits = useMemo(() => {
    if (creditCost === undefined || userCredits === undefined) return false;
    return userCredits < creditCost;
  }, [userCredits, creditCost]);

  const requiresProUpgrade = useMemo(() => {
    const selectedOption = RESOLUTION_OPTIONS.find((r) => r.value === resolution);
    return selectedOption?.requiresPro && !hasProAccess;
  }, [resolution, hasProAccess]);

  const estimatedSize = useMemo(() => estimateFileSize(resolution), [resolution]);

  const handleExport = useCallback(() => {
    const options: ExportOptionsType = {
      format,
      resolution,
      ...(captionStyleId && { captionStyleId }),
      ...(brandKitId && { brandKitId }),
      ...(targetLanguage && { targetLanguage }),
      ...(dubbingId && { dubbingId }),
    };
    analytics.featureUsed("clip_export", {
      format,
      resolution,
      hasCaptions: !!captionStyleId,
      hasBrandKit: !!brandKitId,
      targetLanguage: targetLanguage || "original",
      hasDubbing: !!dubbingId,
    });
    onExport(options);
  }, [format, resolution, captionStyleId, brandKitId, targetLanguage, dubbingId, onExport]);

  const isExportDisabled = disabled || hasInsufficientCredits || requiresProUpgrade;

  return (
    <div className={cn("flex flex-col gap-5", className)} data-slot="export-options">
      {/* Format Selector — Card-style toggle */}
      <div className="flex flex-col gap-2.5">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Format
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {FORMAT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => setFormat(option.value)}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-3 transition-all",
                "hover:border-primary/40 hover:bg-primary/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                format === option.value
                  ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                  : "border-border bg-card",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {format === option.value && (
                <div className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary">
                  <IconCheck className="size-2.5 text-primary-foreground" />
                </div>
              )}
              <span className={cn(
                "text-sm font-semibold",
                format === option.value ? "text-primary" : "text-foreground"
              )}>
                {option.label}
              </span>
              <span className="text-[11px] text-muted-foreground">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Resolution Selector — Card-style toggle */}
      <div className="flex flex-col gap-2.5">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Resolution
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {RESOLUTION_OPTIONS.map((option) => {
            const isLocked = option.requiresPro && !hasProAccess;
            const isSelected = resolution === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled || isLocked}
                onClick={() => setResolution(option.value)}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl border-2 px-3 py-3 transition-all",
                  "hover:border-primary/40 hover:bg-primary/5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                    : "border-border bg-card",
                  isLocked && "opacity-50 cursor-not-allowed hover:border-border hover:bg-card",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSelected && !isLocked && (
                  <div className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary">
                    <IconCheck className="size-2.5 text-primary-foreground" />
                  </div>
                )}
                {isLocked && (
                  <div className="absolute top-1.5 right-1.5">
                    <IconCrown className="size-3.5 text-amber-500" />
                  </div>
                )}
                <span className={cn(
                  "text-sm font-semibold",
                  isSelected ? "text-primary" : "text-foreground",
                  isLocked && "text-muted-foreground"
                )}>
                  {option.label}
                </span>
                <span className="text-[11px] text-muted-foreground">{option.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Caption Language Selector */}
      {translationLanguages && translationLanguages.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Caption Language
          </Label>
          <Select
            disabled={disabled}
            onValueChange={(value) =>
              setTargetLanguage(value === "original" ? undefined : (value || undefined))
            }
            value={targetLanguage || "original"}
          >
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="Original" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Original</SelectItem>
              {translationLanguages.map((lang) => (
                <SelectItem key={lang.language} value={lang.language}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Dubbed Audio Selector */}
      {availableDubbings && availableDubbings.filter((d) => d.status === "completed").length > 0 && (
        <div className="flex flex-col gap-2.5">
          <Label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <IconVolume className="size-3.5" />
            Dubbed Audio
          </Label>
          <Select
            disabled={disabled}
            onValueChange={(value) =>
              setDubbingId(value === "none" ? undefined : (value || undefined))
            }
            value={dubbingId || "none"}
          >
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="No dubbed audio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No dubbed audio</SelectItem>
              {availableDubbings
                .filter((d) => d.status === "completed")
                .map((dub) => (
                  <SelectItem key={dub.id} value={dub.id}>
                    {dub.voiceName || "AI Voice"} ({dub.targetLanguage.toUpperCase()})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pro Upgrade Warning */}
      {requiresProUpgrade && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
          <IconCrown className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              4K requires Starter or Pro
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Upgrade to unlock Ultra HD exports.
            </p>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{format.toUpperCase()}</span>
          <span className="text-border">·</span>
          <span>{RESOLUTION_OPTIONS.find((r) => r.value === resolution)?.label}</span>
          <span className="text-border">·</span>
          <span>{estimatedSize}</span>
        </div>
      </div>

      {/* Credit Cost Display (deprecated) */}
      {creditCost !== undefined && userCredits !== undefined && (
        <div
          className={cn(
            "rounded-xl border p-3.5",
            hasInsufficientCredits
              ? "border-destructive/50 bg-destructive/5"
              : "border-border bg-muted/30"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconCoin className="size-4" />
              Cost
            </span>
            <span className="text-sm font-medium">{creditCost} credits</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className={cn(
              "text-sm font-medium",
              hasInsufficientCredits ? "text-destructive" : "text-foreground"
            )}>
              {userCredits} credits
            </span>
          </div>
          {hasInsufficientCredits && (
            <div className="mt-2.5 flex items-center gap-2 text-xs text-destructive">
              <IconAlertTriangle className="size-3.5" />
              <span>Insufficient credits.</span>
            </div>
          )}
        </div>
      )}

      {/* Export Button */}
      <Button
        size="lg"
        className="w-full gap-2 rounded-xl text-sm font-semibold"
        disabled={isExportDisabled}
        onClick={handleExport}
      >
        {disabled ? (
          <IconLoader2 className="size-4 animate-spin" />
        ) : (
          <IconDownload className="size-4" />
        )}
        {disabled ? "Exporting..." : "Export Clip"}
      </Button>
    </div>
  );
}

export default ExportOptions;
