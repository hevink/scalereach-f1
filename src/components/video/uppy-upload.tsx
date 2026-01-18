"use client";

import { useEffect, useRef } from "react";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import AwsS3 from "@uppy/aws-s3";
import { useQueryClient } from "@tanstack/react-query";
import { videoKeys } from "@/hooks/useVideo";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface UppyUploadProps {
    projectId?: string;
    onUploadSuccess?: (videoId: string) => void;
}

export function UppyUpload({ projectId, onUploadSuccess }: UppyUploadProps) {
    const dashboardRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const videoIdsRef = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        if (!dashboardRef.current) return;

        const uppy = new Uppy({
            id: "video-uploader",
            autoProceed: false,
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
                        metadata: { projectId },
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
                        metadata: { projectId },
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

        uppy.use(Dashboard, {
            target: dashboardRef.current,
            inline: true,
            width: "100%",
            height: 320,
            showRemoveButtonAfterComplete: true,
            proudlyDisplayPoweredByUppy: false,
            note: "MP4, WebM, MOV • Max 5GB • Resumable uploads",
            theme: "auto",
        });

        uppy.on("upload-success", (file) => {
            if (file) {
                const videoId = videoIdsRef.current.get(file.id);
                toast.success("Upload complete", {
                    description: `${file.name} is now being processed`,
                });
                if (videoId) onUploadSuccess?.(videoId);
                queryClient.invalidateQueries({ queryKey: videoKeys.myVideos() });
            }
        });

        uppy.on("upload-error", (file, error) => {
            console.error(`[UPPY] Upload error:`, error);
            toast.error("Upload failed", {
                description: file?.name ? `Failed to upload ${file.name}` : "Upload failed",
            });
        });

        uppy.on("complete", (result) => {
            if (result.successful && result.successful.length > 0) {
                setTimeout(() => {
                    result.successful?.forEach((file) => {
                        uppy.removeFile(file.id);
                    });
                }, 3000);
            }
        });

        uppy.on("restriction-failed", (file, error) => {
            toast.error("File not allowed", { description: error.message });
        });

        return () => {
            uppy.destroy();
        };
    }, [projectId, queryClient, onUploadSuccess]);

    return <div ref={dashboardRef} />;
}
