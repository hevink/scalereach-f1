"use client";

import { useEffect, useMemo, useCallback } from "react";
import {
    IconDownload,
    IconLoader2,
    IconAlertTriangle,
    IconCheck,
    IconClock,
    IconRefresh,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Progress,
    ProgressLabel,
    ProgressValue,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useExportStatus } from "@/hooks/useExport";
import type { ExportStatus } from "@/lib/api/export";

/**
 * ExportProgressProps interface
 *
 * @validates Requirements 23.1, 23.2, 23.3, 23.4, 23.5
 */
export interface ExportProgressProps {
    /** The ID of the export to track */
    exportId: string;
    /** Callback when export completes successfully with download URL */
    onComplete: (downloadUrl: string) => void;
    /** Callback when export fails with error message */
    onError: (error: string) => void;
    /** Additional className */
    className?: string;
}

/**
 * Status configuration for different export states
 */
const STATUS_CONFIG: Record<
    ExportStatus,
    {
        label: string;
        icon: typeof IconLoader2;
        iconClassName: string;
        cardClassName: string;
    }
> = {
    queued: {
        label: "Queued",
        icon: IconClock,
        iconClassName: "text-muted-foreground",
        cardClassName: "border-border",
    },
    processing: {
        label: "Processing",
        icon: IconLoader2,
        iconClassName: "text-primary animate-spin",
        cardClassName: "border-primary/50",
    },
    completed: {
        label: "Completed",
        icon: IconCheck,
        iconClassName: "text-green-500",
        cardClassName: "border-green-500/50",
    },
    failed: {
        label: "Failed",
        icon: IconAlertTriangle,
        iconClassName: "text-destructive",
        cardClassName: "border-destructive/50",
    },
};

/**
 * Formats file size in bytes to human-readable format
 */
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Formats expiration time relative to now
 * @validates Requirement 23.4
 */
function formatExpirationTime(expiresAt: string): string {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expirationDate.getTime() - now.getTime();

    if (diffMs <= 0) return "Expired";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
}

/**
 * ExportProgress Component
 *
 * Displays export progress with real-time status updates:
 * - Progress bar during export (Requirement 23.1)
 * - Polls for status updates every 2 seconds (Requirement 23.2)
 * - Shows download button on completion (Requirement 23.3)
 * - Displays expiration time (24 hours) (Requirement 23.4)
 * - Shows error with retry button (Requirement 23.5)
 *
 * @example
 * ```tsx
 * <ExportProgress
 *   exportId="export-123"
 *   onComplete={(url) => console.log("Download:", url)}
 *   onError={(error) => console.error("Export failed:", error)}
 * />
 * ```
 *
 * @validates Requirements 23.1, 23.2, 23.3, 23.4, 23.5
 */
export function ExportProgress({
    exportId,
    onComplete,
    onError,
    className,
}: ExportProgressProps) {
    /**
     * Use the export status hook which polls every 2 seconds
     * @validates Requirement 23.2
     */
    const { data, isLoading, isError, error, refetch } = useExportStatus(
        exportId,
        true
    );

    const exportRecord = data?.export;
    const status = exportRecord?.status ?? "queued";
    const progress = exportRecord?.progress ?? 0;

    /**
     * Get status configuration for current state
     */
    const statusConfig = useMemo(() => STATUS_CONFIG[status], [status]);
    const StatusIcon = statusConfig.icon;

    /**
     * Handle completion callback
     * @validates Requirement 23.3
     */
    useEffect(() => {
        if (status === "completed" && exportRecord?.downloadUrl) {
            onComplete(exportRecord.downloadUrl);
        }
    }, [status, exportRecord?.downloadUrl, onComplete]);

    /**
     * Handle error callback
     * @validates Requirement 23.5
     */
    useEffect(() => {
        if (status === "failed" && exportRecord?.error) {
            onError(exportRecord.error);
        }
    }, [status, exportRecord?.error, onError]);

    /**
     * Handle download button click
     * @validates Requirement 23.3
     */
    const handleDownload = useCallback(() => {
        if (exportRecord?.downloadUrl) {
            window.open(exportRecord.downloadUrl, "_blank");
        }
    }, [exportRecord?.downloadUrl]);

    /**
     * Handle retry button click
     * @validates Requirement 23.5
     */
    const handleRetry = useCallback(() => {
        refetch();
    }, [refetch]);

    /**
     * Format expiration time for display
     * @validates Requirement 23.4
     */
    const expirationDisplay = useMemo(() => {
        if (status !== "completed" || !exportRecord?.expiresAt) return null;
        return formatExpirationTime(exportRecord.expiresAt);
    }, [status, exportRecord?.expiresAt]);

    // Handle loading state
    if (isLoading && !exportRecord) {
        return (
            <Card className={cn("w-full", className)} data-slot="export-progress">
                <CardContent className="flex items-center justify-center py-8">
                    <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground text-sm">
                        Loading export status...
                    </span>
                </CardContent>
            </Card>
        );
    }

    // Handle error state from query
    if (isError && !exportRecord) {
        return (
            <Card
                className={cn("w-full border-destructive/50", className)}
                data-slot="export-progress"
            >
                <CardContent className="flex flex-col items-center gap-4 py-8">
                    <IconAlertTriangle className="size-8 text-destructive" />
                    <p className="text-center text-destructive text-sm">
                        {error?.message ?? "Failed to load export status"}
                    </p>
                    <Button variant="outline" size="sm" onClick={handleRetry}>
                        <IconRefresh className="mr-2 size-4" />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className={cn("w-full", statusConfig.cardClassName, className)}
            data-slot="export-progress"
        >
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <StatusIcon className={cn("size-5", statusConfig.iconClassName)} />
                    Export {statusConfig.label}
                </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                {/* Progress Bar - Requirement 23.1 */}
                {(status === "queued" || status === "processing") && (
                    <Progress value={progress} className="w-full">
                        <ProgressLabel>Progress</ProgressLabel>
                        <ProgressValue />
                    </Progress>
                )}

                {/* Processing Status Details */}
                {status === "processing" && (
                    <p className="text-muted-foreground text-sm">
                        Your export is being processed. This may take a few minutes
                        depending on the clip length and resolution.
                    </p>
                )}

                {/* Queued Status Details */}
                {status === "queued" && (
                    <p className="text-muted-foreground text-sm">
                        Your export is queued and will begin processing shortly.
                    </p>
                )}

                {/* Completed State - Requirements 23.3, 23.4 */}
                {status === "completed" && exportRecord && (
                    <div className="flex flex-col gap-4">
                        {/* File Info */}
                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                            <div className="flex flex-col gap-2">
                                {/* File Size */}
                                {exportRecord.fileSize && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">
                                            File Size
                                        </span>
                                        <span className="font-medium text-sm">
                                            {formatFileSize(exportRecord.fileSize)}
                                        </span>
                                    </div>
                                )}

                                {/* Format & Resolution */}
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-sm">Format</span>
                                    <span className="font-medium text-sm uppercase">
                                        {exportRecord.format} • {exportRecord.resolution}
                                    </span>
                                </div>

                                {/* Expiration Time - Requirement 23.4 */}
                                {expirationDisplay && (
                                    <div className="flex items-center justify-between border-t border-border/50 pt-2">
                                        <span className="flex items-center gap-1 text-muted-foreground text-sm">
                                            <IconClock className="size-3.5" />
                                            Expires
                                        </span>
                                        <span className="font-medium text-amber-600 text-sm dark:text-amber-500">
                                            {expirationDisplay}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Download Button - Requirement 23.3 */}
                        {exportRecord.downloadUrl && (
                            <Button onClick={handleDownload} className="w-full gap-2">
                                <IconDownload className="size-4" data-icon="inline-start" />
                                Download Export
                            </Button>
                        )}
                    </div>
                )}

                {/* Failed State - Requirement 23.5 */}
                {status === "failed" && exportRecord && (
                    <div className="flex flex-col gap-4">
                        {/* Error Message */}
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                            <div className="flex items-start gap-2">
                                <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium text-destructive text-sm">
                                        Export Failed
                                    </span>
                                    <p className="text-muted-foreground text-sm">
                                        {exportRecord.error ??
                                            "An unexpected error occurred during export."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Retry Button - Requirement 23.5 */}
                        <Button
                            variant="outline"
                            onClick={handleRetry}
                            className="w-full gap-2"
                        >
                            <IconRefresh className="size-4" data-icon="inline-start" />
                            Retry Export
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default ExportProgress;
