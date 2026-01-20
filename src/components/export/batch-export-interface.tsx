"use client";

import { useCallback, useMemo, useState } from "react";
import {
    IconDownload,
    IconCheck,
    IconX,
    IconAlertTriangle,
    IconLoader2,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Progress,
    ProgressLabel,
    ProgressValue,
} from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBatchExport, useBatchExportStatus } from "@/hooks/useExport";
import type { ExportOptions, BatchExportRecord, ExportRecord } from "@/lib/api/export";

/**
 * ViralClip interface for batch export
 * @validates Requirements 24.1
 */
interface ViralClip {
    id: string;
    videoId: string;
    title: string;
    startTime: number;
    endTime: number;
    duration: number;
    transcript: string;
    viralityScore: number;
    viralityReason: string;
    hooks: string[];
    emotions: string[];
    thumbnailUrl?: string;
    storageUrl?: string;
    aspectRatio?: "9:16" | "1:1" | "16:9";
    favorited: boolean;
    status: "detected" | "generating" | "ready" | "exported" | "failed";
    createdAt: string;
}

/**
 * BatchExportProps interface
 *
 * @validates Requirements 24.1, 24.2, 24.3
 */
export interface BatchExportProps {
    /** Array of clips available for batch export */
    clips: ViralClip[];
    /** Callback when batch export is initiated */
    onExport: (clipIds: string[], options: ExportOptions) => void;
    /** Maximum number of clips allowed in a batch (default: 20) */
    maxBatchSize?: number;
    /** Additional className */
    className?: string;
}

/**
 * Default maximum batch size
 * @validates Requirement 24.3
 */
const DEFAULT_MAX_BATCH_SIZE = 20;

/**
 * Formats duration in seconds to MM:SS format
 */
function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Gets the color class for virality score badge
 * @validates Requirement 6.3 (Virality Score Color Mapping)
 */
function getScoreVariant(score: number): "default" | "secondary" | "destructive" {
    if (score >= 70) return "default"; // green/primary
    if (score >= 40) return "secondary"; // yellow
    return "destructive"; // red
}

/**
 * BatchExportInterface Component
 *
 * A comprehensive batch export interface with:
 * - Multi-select for clips with checkboxes (Requirement 24.1)
 * - Batch export button (Requirement 24.2)
 * - 20 clip maximum enforcement (Requirement 24.3)
 * - Overall and individual progress display (Requirement 24.4)
 * - Download links on completion (Requirement 24.5)
 * - Failed clips with error messages (Requirement 24.6)
 *
 * @example
 * ```tsx
 * <BatchExportInterface
 *   clips={viralClips}
 *   onExport={(clipIds, options) => handleBatchExport(clipIds, options)}
 *   maxBatchSize={20}
 * />
 * ```
 *
 * @validates Requirements 24.1, 24.2, 24.3, 24.4, 24.5, 24.6
 */
export function BatchExportInterface({
    clips,
    onExport,
    maxBatchSize = DEFAULT_MAX_BATCH_SIZE,
    className,
}: BatchExportProps) {
    // Selection state for multi-select
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Batch export state
    const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

    // Export options state (using defaults)
    const [exportOptions] = useState<ExportOptions>({
        format: "mp4",
        resolution: "1080p",
    });

    // Batch export mutation hook
    const batchExportMutation = useBatchExport();

    // Batch export status hook (polls when active)
    const { data: batchStatusData } = useBatchExportStatus(
        activeBatchId ?? "",
        !!activeBatchId
    );

    const batchExport = batchStatusData?.batchExport;

    /**
     * Number of selected clips
     * @validates Requirement 24.3
     */
    const selectedCount = selectedIds.size;

    /**
     * Whether selection exceeds maximum batch size
     * @validates Requirement 24.3
     */
    const exceedsMaxBatchSize = selectedCount > maxBatchSize;

    /**
     * Whether the export button should be disabled
     * @validates Requirements 24.2, 24.3
     */
    const isExportDisabled = useMemo(() => {
        return (
            selectedCount === 0 ||
            exceedsMaxBatchSize ||
            batchExportMutation.isPending ||
            (activeBatchId !== null && batchExport?.status === "processing")
        );
    }, [selectedCount, exceedsMaxBatchSize, batchExportMutation.isPending, activeBatchId, batchExport?.status]);

    /**
     * Handle individual clip selection toggle
     * @validates Requirement 24.1
     */
    const handleToggleClip = useCallback((clipId: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(clipId)) {
                newSet.delete(clipId);
            } else {
                newSet.add(clipId);
            }
            return newSet;
        });
    }, []);

    /**
     * Handle select all clips
     * @validates Requirement 24.1
     */
    const handleSelectAll = useCallback(() => {
        const allIds = clips.map((clip) => clip.id);
        setSelectedIds(new Set(allIds));
    }, [clips]);

    /**
     * Handle deselect all clips
     * @validates Requirement 24.1
     */
    const handleDeselectAll = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    /**
     * Handle batch export initiation
     * @validates Requirements 24.2, 24.3
     */
    const handleBatchExport = useCallback(async () => {
        if (selectedCount === 0 || exceedsMaxBatchSize) return;

        const clipIds = Array.from(selectedIds);

        try {
            const result = await batchExportMutation.mutateAsync({
                clipIds,
                options: exportOptions,
            });

            setActiveBatchId(result.batchExport.id);
            onExport(clipIds, exportOptions);
        } catch (error) {
            console.error("Batch export failed:", error);
        }
    }, [selectedIds, selectedCount, exceedsMaxBatchSize, exportOptions, batchExportMutation, onExport]);

    /**
     * Handle download for a completed export
     * @validates Requirement 24.5
     */
    const handleDownload = useCallback((downloadUrl: string) => {
        window.open(downloadUrl, "_blank");
    }, []);

    /**
     * Calculate overall progress percentage
     * @validates Requirement 24.4
     */
    const overallProgress = useMemo(() => {
        if (!batchExport) return 0;
        const { totalClips, completedClips, failedClips } = batchExport;
        if (totalClips === 0) return 0;
        return Math.round(((completedClips + failedClips) / totalClips) * 100);
    }, [batchExport]);

    /**
     * Get status badge variant for batch export status
     */
    const getBatchStatusVariant = (status: BatchExportRecord["status"]) => {
        switch (status) {
            case "completed":
                return "default";
            case "partial":
                return "secondary";
            case "failed":
                return "destructive";
            default:
                return "outline";
        }
    };

    /**
     * Get status icon for individual export
     * @validates Requirements 24.5, 24.6
     */
    const getExportStatusIcon = (status: ExportRecord["status"]) => {
        switch (status) {
            case "completed":
                return <IconCheck className="size-4 text-green-500" />;
            case "failed":
                return <IconX className="size-4 text-destructive" />;
            case "processing":
                return <IconLoader2 className="size-4 animate-spin text-primary" />;
            default:
                return <IconLoader2 className="size-4 text-muted-foreground" />;
        }
    };

    return (
        <Card className={cn("w-full", className)} data-slot="batch-export-interface">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IconDownload className="size-5" />
                    Batch Export
                </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
                {/* Selection Controls - Requirement 24.1 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            disabled={clips.length === 0}
                        >
                            Select All
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeselectAll}
                            disabled={selectedCount === 0}
                        >
                            Deselect All
                        </Button>
                    </div>

                    {/* Selected Count Display - Requirement 24.3 */}
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                "text-sm",
                                exceedsMaxBatchSize ? "text-destructive font-medium" : "text-muted-foreground"
                            )}
                        >
                            {selectedCount} / {maxBatchSize} selected
                        </span>
                        {exceedsMaxBatchSize && (
                            <IconAlertTriangle className="size-4 text-destructive" />
                        )}
                    </div>
                </div>

                {/* Maximum Batch Size Warning - Requirement 24.3 */}
                {exceedsMaxBatchSize && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                        <IconAlertTriangle className="size-4 text-destructive" />
                        <span className="text-destructive text-sm">
                            Maximum batch size is {maxBatchSize} clips. Please deselect some clips to continue.
                        </span>
                    </div>
                )}

                {/* Clips List with Checkboxes - Requirement 24.1 */}
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                    {clips.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                            No clips available for export
                        </div>
                    ) : (
                        clips.map((clip) => (
                            <div
                                key={clip.id}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                                    selectedIds.has(clip.id)
                                        ? "border-primary/50 bg-primary/5"
                                        : "border-border hover:bg-muted/50"
                                )}
                            >
                                {/* Checkbox */}
                                <Checkbox
                                    checked={selectedIds.has(clip.id)}
                                    onCheckedChange={() => handleToggleClip(clip.id)}
                                />

                                {/* Clip Info */}
                                <div className="flex flex-1 flex-col gap-1 min-w-0">
                                    <span className="font-medium text-sm truncate">{clip.title}</span>
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                        <span>{formatDuration(clip.duration)}</span>
                                        <span>•</span>
                                        <Badge variant={getScoreVariant(clip.viralityScore)} className="text-xs">
                                            {clip.viralityScore}% viral
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Batch Export Button - Requirement 24.2 */}
                <Button
                    onClick={handleBatchExport}
                    disabled={isExportDisabled}
                    className="w-full gap-2"
                >
                    {batchExportMutation.isPending ? (
                        <>
                            <IconLoader2 className="size-4 animate-spin" />
                            Starting Export...
                        </>
                    ) : (
                        <>
                            <IconDownload className="size-4" data-icon="inline-start" />
                            Export {selectedCount} Clip{selectedCount !== 1 ? "s" : ""}
                        </>
                    )}
                </Button>

                {/* Batch Export Progress - Requirement 24.4 */}
                {batchExport && (
                    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
                        {/* Overall Progress Header */}
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Export Progress</span>
                            <Badge variant={getBatchStatusVariant(batchExport.status)}>
                                {batchExport.status}
                            </Badge>
                        </div>

                        {/* Overall Progress Bar - Requirement 24.4 */}
                        <Progress value={overallProgress} className="w-full">
                            <ProgressLabel>Overall Progress</ProgressLabel>
                            <ProgressValue />
                        </Progress>

                        {/* Progress Summary */}
                        <div className="flex items-center justify-between text-muted-foreground text-sm">
                            <span>
                                {batchExport.completedClips} completed, {batchExport.failedClips} failed
                            </span>
                            <span>
                                {batchExport.completedClips + batchExport.failedClips} / {batchExport.totalClips}
                            </span>
                        </div>

                        {/* Individual Export Progress - Requirements 24.4, 24.5, 24.6 */}
                        {batchExport.exports.length > 0 && (
                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto border-t border-border pt-4">
                                {batchExport.exports.map((exportRecord) => {
                                    const clip = clips.find((c) => c.id === exportRecord.clipId);
                                    return (
                                        <div
                                            key={exportRecord.id}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg border p-3",
                                                exportRecord.status === "failed"
                                                    ? "border-destructive/50 bg-destructive/5"
                                                    : exportRecord.status === "completed"
                                                        ? "border-green-500/50 bg-green-500/5"
                                                        : "border-border"
                                            )}
                                        >
                                            {/* Status Icon */}
                                            {getExportStatusIcon(exportRecord.status)}

                                            {/* Export Info */}
                                            <div className="flex flex-1 flex-col gap-1 min-w-0">
                                                <span className="font-medium text-sm truncate">
                                                    {clip?.title ?? `Clip ${exportRecord.clipId}`}
                                                </span>

                                                {/* Processing Progress */}
                                                {exportRecord.status === "processing" && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary transition-all"
                                                                style={{ width: `${exportRecord.progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-muted-foreground text-xs">
                                                            {exportRecord.progress}%
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Error Message - Requirement 24.6 */}
                                                {exportRecord.status === "failed" && exportRecord.error && (
                                                    <span className="text-destructive text-xs">
                                                        {exportRecord.error}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Download Button - Requirement 24.5 */}
                                            {exportRecord.status === "completed" && exportRecord.downloadUrl && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownload(exportRecord.downloadUrl!)}
                                                    className="shrink-0"
                                                >
                                                    <IconDownload className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default BatchExportInterface;
