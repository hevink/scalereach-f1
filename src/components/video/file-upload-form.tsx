"use client";

import { useState, useCallback, useRef } from "react";
import {
    IconUpload,
    IconX,
    IconPlayerPause,
    IconPlayerPlay,
    IconTrash,
    IconCheck,
    IconLoader2,
    IconAlertCircle,
    IconFile,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUpload, type UploadProgress } from "@/hooks/useUpload";
import { toast } from "sonner";

const ALLOWED_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/mpeg",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatTime(seconds: number): string {
    if (!seconds || !isFinite(seconds)) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatSpeed(bytesPerSecond: number): string {
    if (!bytesPerSecond) return "-- MB/s";
    const mbps = bytesPerSecond / (1024 * 1024);
    return `${mbps.toFixed(1)} MB/s`;
}

interface UploadItemProps {
    upload: UploadProgress;
    onPause: () => void;
    onResume: () => void;
    onCancel: () => void;
    onClear: () => void;
    onSelectFile: (file: File) => void;
}

function UploadItem({ upload, onPause, onResume, onCancel, onClear, onSelectFile }: UploadItemProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleResumeClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onSelectFile(file);
        }
    };

    const statusIcon = {
        pending: <IconLoader2 className="size-4 animate-spin text-muted-foreground" />,
        uploading: <IconLoader2 className="size-4 animate-spin text-blue-500" />,
        paused: <IconPlayerPause className="size-4 text-yellow-500" />,
        completed: <IconCheck className="size-4 text-green-500" />,
        failed: <IconAlertCircle className="size-4 text-red-500" />,
        processing: <IconLoader2 className="size-4 animate-spin text-purple-500" />,
    };

    const statusText = {
        pending: "Pending",
        uploading: `Uploading • ${formatSpeed(upload.speed)} • ${formatTime(upload.remainingTime)} remaining`,
        paused: "Paused - Select file to resume",
        completed: "Completed",
        failed: upload.error || "Failed",
        processing: "Processing video...",
    };

    return (
        <div className="rounded-lg border p-4">
            <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <IconFile className="size-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="truncate font-medium text-sm">{upload.filename}</h4>
                        <div className="flex items-center gap-1">
                            {upload.status === "uploading" && (
                                <Button variant="ghost" size="icon" className="size-7" onClick={onPause}>
                                    <IconPlayerPause className="size-4" />
                                </Button>
                            )}
                            {upload.status === "paused" && (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={ALLOWED_TYPES.join(",")}
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                    <Button variant="ghost" size="icon" className="size-7" onClick={handleResumeClick}>
                                        <IconPlayerPlay className="size-4" />
                                    </Button>
                                </>
                            )}
                            {(upload.status === "completed" || upload.status === "failed" || upload.status === "processing") && (
                                <Button variant="ghost" size="icon" className="size-7" onClick={onClear}>
                                    <IconX className="size-4" />
                                </Button>
                            )}
                            {(upload.status === "uploading" || upload.status === "paused" || upload.status === "pending") && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 text-destructive hover:text-destructive"
                                    onClick={onCancel}
                                >
                                    <IconTrash className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
                        {statusIcon[upload.status]}
                        <span>{statusText[upload.status]}</span>
                    </div>

                    {(upload.status === "uploading" || upload.status === "paused") && (
                        <div className="mt-2 space-y-1">
                            <Progress value={upload.percentage} className="h-1.5" />
                            <div className="flex justify-between text-muted-foreground text-xs">
                                <span>{formatFileSize(upload.uploadedSize)} / {formatFileSize(upload.totalSize)}</span>
                                <span>{upload.percentage.toFixed(1)}%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface FileUploadFormProps {
    projectId?: string;
    workspaceId: string;
    onSuccess?: (videoId: string) => void;
}

export function FileUploadForm({ projectId, workspaceId, onSuccess }: FileUploadFormProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploads, startUpload, pauseUpload, resumeUpload, cancelUpload, clearUpload } = useUpload(workspaceId, projectId);

    const validateFile = useCallback((file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return "Invalid file type. Please upload MP4, WebM, MOV, AVI, MKV, or MPEG.";
        }
        if (file.size > MAX_FILE_SIZE) {
            return `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`;
        }
        return null;
    }, []);

    const handleFiles = useCallback(
        async (files: FileList | null) => {
            if (!files || files.length === 0) return;

            const file = files[0];
            const error = validateFile(file);

            if (error) {
                toast.error(error);
                return;
            }

            try {
                const result = await startUpload(file);
                onSuccess?.(result.videoId);
            } catch (error) {
                if (error instanceof Error && error.message !== "Upload cancelled") {
                    toast.error("Upload failed", {
                        description: error.message,
                    });
                }
            }
        },
        [validateFile, startUpload, onSuccess]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
        },
        [handleFiles]
    );

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            handleFiles(e.target.files);
            // Reset input so same file can be selected again
            e.target.value = "";
        },
        [handleFiles]
    );

    const handleResumeWithFile = useCallback(
        async (uploadId: string, file: File) => {
            try {
                await resumeUpload(uploadId, file);
            } catch (error) {
                toast.error("Resume failed", {
                    description: error instanceof Error ? error.message : "Please try again",
                });
            }
        },
        [resumeUpload]
    );

    const activeUploads = uploads.filter(
        (u) => u.status === "uploading" || u.status === "paused" || u.status === "pending"
    );
    const completedUploads = uploads.filter(
        (u) => u.status === "completed" || u.status === "failed" || u.status === "processing"
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IconUpload className="size-5" />
                    Upload Video File
                </CardTitle>
                <CardDescription>
                    Drag and drop or click to upload a video file (max 5GB)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Drop Zone */}
                <div
                    className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50"
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_TYPES.join(",")}
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    <div className="flex flex-col items-center gap-2">
                        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                            <IconUpload className="size-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">
                                {isDragging ? "Drop your video here" : "Drag and drop your video"}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                or{" "}
                                <button
                                    type="button"
                                    className="text-primary underline-offset-2 hover:underline"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    browse files
                                </button>
                            </p>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            MP4, WebM, MOV, AVI, MKV • Max 5GB
                        </p>
                    </div>
                </div>

                {/* Active Uploads */}
                {activeUploads.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Uploading</h4>
                        {activeUploads.map((upload) => (
                            <UploadItem
                                key={upload.uploadId}
                                upload={upload}
                                onPause={() => pauseUpload(upload.uploadId)}
                                onResume={() => { }}
                                onCancel={() => cancelUpload(upload.uploadId)}
                                onClear={() => clearUpload(upload.uploadId)}
                                onSelectFile={(file) => handleResumeWithFile(upload.uploadId, file)}
                            />
                        ))}
                    </div>
                )}

                {/* Completed/Failed Uploads */}
                {completedUploads.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Recent</h4>
                        {completedUploads.map((upload) => (
                            <UploadItem
                                key={upload.uploadId}
                                upload={upload}
                                onPause={() => { }}
                                onResume={() => { }}
                                onCancel={() => { }}
                                onClear={() => clearUpload(upload.uploadId)}
                                onSelectFile={() => { }}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
