"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
    IconBrandYoutube,
    IconCheck,
    IconLoader2,
    IconX,
    IconUpload,
    IconSend,
    IconCloudUpload,
    IconFile,
    IconAlertCircle,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useSubmitYouTubeUrl, videoKeys } from "@/hooks/useVideo";
import { toast } from "sonner";
import Uppy from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// YouTube URL patterns
const YOUTUBE_URL_PATTERNS = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

function isValidYouTubeUrl(url: string): boolean {
    return YOUTUBE_URL_PATTERNS.some((pattern) => pattern.test(url.trim()));
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface FileState {
    id: string;
    name: string;
    size: number;
    progress: number;
    status: "pending" | "uploading" | "complete" | "error";
    error?: string;
}

interface FloatingUploadFooterProps {
    projectId?: string;
    workspaceId: string;
}

export function FloatingUploadFooter({ projectId, workspaceId }: FloatingUploadFooterProps) {
    const [url, setUrl] = useState("");
    const [isValidUrl, setIsValidUrl] = useState(false);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [files, setFiles] = useState<FileState[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const uppyRef = useRef<Uppy | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const videoIdsRef = useRef<Map<string, string>>(new Map());

    const submitMutation = useSubmitYouTubeUrl();

    // Client-side only validation for YouTube URL
    useEffect(() => {
        const trimmedUrl = url.trim();
        setIsValidUrl(trimmedUrl ? isValidYouTubeUrl(trimmedUrl) : false);
    }, [url]);

    // Initialize Uppy when dialog opens
    useEffect(() => {
        if (!isUploadDialogOpen) return;

        const uppy = new Uppy({
            id: "floating-video-uploader",
            autoProceed: true,
            allowMultipleUploadBatches: true,
            restrictions: {
                maxFileSize: 5 * 1024 * 1024 * 1024,
                maxNumberOfFiles: 5,
                allowedFileTypes: [
                    "video/mp4",
                    "video/webm",
                    "video/quicktime",
                    "video/x-msvideo",
                    "video/x-matroska",
                    "video/mpeg",
                ],
            },
        });

        uppy.use(AwsS3, {
            shouldUseMultipart: (file) => (file.size ?? 0) > 100 * 1024 * 1024,
            limit: 4,

            async createMultipartUpload(file) {
                const response = await fetch(`${API_BASE_URL}/api/uppy/multipart`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filename: file.name,
                        type: file.type,
                        metadata: { projectId, workspaceId },
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || "Failed to create upload");
                }

                const data = await response.json();
                videoIdsRef.current.set(file.id, data.videoId);
                return { uploadId: data.uploadId, key: data.key };
            },

            async signPart(_file, { uploadId, key, partNumber }) {
                const response = await fetch(
                    `${API_BASE_URL}/api/uppy/multipart/${uploadId}/${partNumber}?key=${encodeURIComponent(key)}`,
                    { method: "GET", credentials: "include" }
                );
                if (!response.ok) throw new Error("Failed to get upload URL");
                return response.json();
            },

            async listParts(_file, { uploadId, key }) {
                const response = await fetch(
                    `${API_BASE_URL}/api/uppy/multipart/${uploadId}?key=${encodeURIComponent(key)}`,
                    { method: "GET", credentials: "include" }
                );
                if (!response.ok) throw new Error("Failed to list parts");
                return response.json();
            },

            async completeMultipartUpload(file, { uploadId, key, parts }) {
                const videoId = videoIdsRef.current.get(file.id);
                const response = await fetch(
                    `${API_BASE_URL}/api/uppy/multipart/${uploadId}/complete?key=${encodeURIComponent(key)}`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ parts, videoId }),
                    }
                );
                if (!response.ok) throw new Error("Failed to complete upload");
                const data = await response.json();
                return { location: data.location };
            },

            async abortMultipartUpload(_file, { uploadId, key }) {
                await fetch(
                    `${API_BASE_URL}/api/uppy/multipart/${uploadId}?key=${encodeURIComponent(key)}`,
                    { method: "DELETE", credentials: "include" }
                );
            },

            async getUploadParameters(file) {
                const response = await fetch(`${API_BASE_URL}/api/uppy/multipart`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filename: file.name,
                        type: file.type,
                        metadata: { projectId, workspaceId },
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || "Failed to get upload URL");
                }

                const data = await response.json();
                videoIdsRef.current.set(file.id, data.videoId);

                const urlResponse = await fetch(
                    `${API_BASE_URL}/api/uppy/presign?key=${encodeURIComponent(data.key)}&contentType=${encodeURIComponent(file.type || "video/mp4")}`,
                    { method: "GET", credentials: "include" }
                );
                if (!urlResponse.ok) throw new Error("Failed to get presigned URL");
                const urlData = await urlResponse.json();

                return {
                    method: "PUT" as const,
                    url: urlData.url,
                    headers: { "Content-Type": file.type || "video/mp4" },
                };
            },
        });

        // Event handlers
        uppy.on("file-added", (file) => {
            setFiles((prev) => [
                ...prev,
                {
                    id: file.id,
                    name: file.name || "Unknown",
                    size: file.size || 0,
                    progress: 0,
                    status: "pending",
                },
            ]);
        });

        uppy.on("upload-progress", (file, progress) => {
            if (!file) return;
            const percentage = progress.bytesTotal
                ? Math.round((progress.bytesUploaded / progress.bytesTotal) * 100)
                : 0;

            setFiles((prev) =>
                prev.map((f) =>
                    f.id === file.id
                        ? { ...f, progress: percentage, status: "uploading" }
                        : f
                )
            );
        });

        uppy.on("upload-success", (file) => {
            if (!file) return;

            setFiles((prev) =>
                prev.map((f) =>
                    f.id === file.id ? { ...f, progress: 100, status: "complete" } : f
                )
            );

            toast.success("Upload complete", {
                description: `${file.name} is now being processed`,
            });

            queryClient.invalidateQueries({ queryKey: videoKeys.myVideos(workspaceId) });

            setTimeout(() => {
                uppy.removeFile(file.id);
                setFiles((prev) => prev.filter((f) => f.id !== file.id));
            }, 3000);
        });

        uppy.on("upload-error", (file, error) => {
            if (!file) return;
            console.error(`[UPPY] Upload error:`, error);

            setFiles((prev) =>
                prev.map((f) =>
                    f.id === file.id
                        ? { ...f, status: "error", error: error.message }
                        : f
                )
            );

            toast.error("Upload failed", {
                description: file.name ? `Failed to upload ${file.name}` : "Upload failed",
            });
        });

        uppyRef.current = uppy;

        return () => {
            uppy.destroy();
            uppyRef.current = null;
            setFiles([]);
        };
    }, [isUploadDialogOpen, projectId, queryClient]);

    // Handle file selection
    const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
        if (!selectedFiles || !uppyRef.current) return;

        Array.from(selectedFiles).forEach((file) => {
            try {
                uppyRef.current?.addFile({
                    name: file.name,
                    type: file.type,
                    data: file,
                    source: "local",
                });
            } catch (err) {
                console.error("Error adding file:", err);
            }
        });
    }, []);

    // Drag handlers
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
            handleFileSelect(e.dataTransfer.files);
        },
        [handleFileSelect]
    );

    const removeFile = useCallback((fileId: string) => {
        uppyRef.current?.removeFile(fileId);
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
    }, []);

    const handleSubmitYouTube = useCallback(async () => {
        if (!isValidUrl || !url.trim() || !workspaceId) return;

        try {
            await submitMutation.mutateAsync({
                youtubeUrl: url.trim(),
                workspaceId,
                projectId,
            });

            toast.success("Video submitted for processing", {
                description: "Your video is being processed",
            });

            setUrl("");
            setIsValidUrl(false);
        } catch (error) {
            toast.error("Failed to submit video", {
                description: error instanceof Error ? error.message : "Please try again",
            });
        }
    }, [isValidUrl, url, workspaceId, projectId, submitMutation]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && isValidUrl) {
                handleSubmitYouTube();
            }
        },
        [isValidUrl, handleSubmitYouTube]
    );

    return (
        <>
            {/* Floating Footer */}
            <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
                    {/* YouTube URL Input */}
                    <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                            <IconBrandYoutube className="size-5 text-red-500" />
                        </div>
                        <Input
                            type="url"
                            placeholder="Paste YouTube URL here..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={cn(
                                "pl-10 pr-10",
                                url && isValidUrl && "border-green-500 focus-visible:ring-green-500",
                                url && !isValidUrl && "border-red-500 focus-visible:ring-red-500"
                            )}
                            disabled={submitMutation.isPending}
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            {url && isValidUrl && (
                                <IconCheck className="size-4 text-green-500" />
                            )}
                            {url && !isValidUrl && (
                                <IconX className="size-4 text-red-500" />
                            )}
                        </div>
                    </div>

                    {/* Submit YouTube Button */}
                    <Button
                        size="icon"
                        onClick={handleSubmitYouTube}
                        disabled={!isValidUrl || submitMutation.isPending}
                        className="shrink-0"
                    >
                        {submitMutation.isPending ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                            <IconSend className="size-4" />
                        )}
                    </Button>

                    {/* Divider */}
                    <div className="h-8 w-px bg-border" />

                    {/* Upload File Button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsUploadDialogOpen(true)}
                        className="shrink-0"
                        title="Upload video file"
                    >
                        <IconUpload className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Upload Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IconUpload className="size-5" />
                            Upload Video
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                            className={cn(
                                "relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all duration-200",
                                "hover:border-primary/50 hover:bg-muted/50",
                                isDragging
                                    ? "border-primary bg-primary/5 scale-[1.02]"
                                    : "border-muted-foreground/25"
                            )}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,video/mpeg"
                                multiple
                                onChange={(e) => handleFileSelect(e.target.files)}
                                className="hidden"
                            />

                            <div className="flex flex-col items-center gap-4 text-center">
                                <div
                                    className={cn(
                                        "rounded-full p-4 transition-colors",
                                        isDragging ? "bg-primary/10" : "bg-muted"
                                    )}
                                >
                                    <IconCloudUpload
                                        className={cn(
                                            "size-8 transition-colors",
                                            isDragging ? "text-primary" : "text-muted-foreground"
                                        )}
                                    />
                                </div>

                                <div>
                                    <p className="font-medium">
                                        {isDragging ? "Drop your video here" : "Drag & drop video files"}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        or click to browse
                                    </p>
                                </div>

                                <div className="flex flex-wrap justify-center gap-2">
                                    {["MP4", "WebM", "MOV", "AVI", "MKV"].map((format) => (
                                        <span
                                            key={format}
                                            className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                                        >
                                            {format}
                                        </span>
                                    ))}
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    Max 5GB per file • Resumable uploads
                                </p>
                            </div>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {files.map((file) => (
                                    <div
                                        key={file.id}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                                            file.status === "complete" && "border-green-500/30 bg-green-500/5",
                                            file.status === "error" && "border-red-500/30 bg-red-500/5"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                                                file.status === "complete"
                                                    ? "bg-green-500/10 text-green-500"
                                                    : file.status === "error"
                                                        ? "bg-red-500/10 text-red-500"
                                                        : "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            {file.status === "complete" ? (
                                                <IconCheck className="size-5" />
                                            ) : file.status === "error" ? (
                                                <IconAlertCircle className="size-5" />
                                            ) : (
                                                <IconFile className="size-5" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{file.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)}
                                                </span>
                                                {file.status === "uploading" && (
                                                    <span className="text-xs text-primary">
                                                        {file.progress}%
                                                    </span>
                                                )}
                                                {file.status === "complete" && (
                                                    <span className="text-xs text-green-500">Complete</span>
                                                )}
                                                {file.status === "error" && (
                                                    <span className="text-xs text-red-500">
                                                        {file.error || "Failed"}
                                                    </span>
                                                )}
                                            </div>

                                            {(file.status === "uploading" || file.status === "pending") && (
                                                <Progress value={file.progress} className="mt-2 h-1.5" />
                                            )}
                                        </div>

                                        {file.status !== "complete" && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 shrink-0"
                                                onClick={() => removeFile(file.id)}
                                            >
                                                <IconX className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
