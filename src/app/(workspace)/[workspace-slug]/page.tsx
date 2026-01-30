"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { useMyVideos, useValidateYouTubeUrl, useSubmitYouTubeUrl, useDeleteVideo, videoKeys } from "@/hooks/useVideo";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  IconBrandYoutube,
  IconUpload,
  IconLoader2,
  IconCheck,
  IconX,
  IconFile,
  IconAlertCircle,
  IconVideo,
  IconFolder,
} from "@tabler/icons-react";
import { Progress } from "@/components/ui/progress";
import Uppy from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import { useQueryClient } from "@tanstack/react-query";
import type { VideoInfo } from "@/lib/api/video";
import { VideoGrid } from "@/components/video/video-grid";

// Import integrated components
import { ProjectList } from "@/components/project/project-list";
import { CreditBalance } from "@/components/project/credit-balance";
import { useWorkspaceShortcuts } from "@/components/workspace/workspace-shortcuts-provider";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const YOUTUBE_URL_PATTERNS = [
  /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /^(https?:\/\/)?(www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface FileState {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

interface WorkspacePageProps {
  params: Promise<{ "workspace-slug": string }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { "workspace-slug": slug } = use(params);
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: workspace, isLoading: workspaceLoading, error } = useWorkspaceBySlug(slug);
  const { data: videos, isLoading: videosLoading, error: videosError } = useMyVideos(!!session?.user);

  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [validationState, setValidationState] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [files, setFiles] = useState<FileState[]>([]);
  const [uppyReady, setUppyReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"videos" | "projects">("videos");
  const uppyRef = useRef<Uppy | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoIdsRef = useRef<Map<string, string>>(new Map());

  // Use workspace shortcuts context for create project dialog
  const { openCreateProjectDialog } = useWorkspaceShortcuts();

  const validateMutation = useValidateYouTubeUrl();
  const submitMutation = useSubmitYouTubeUrl();
  const deleteMutation = useDeleteVideo();

  useEffect(() => {
    if (sessionPending || workspaceLoading) return;
    if (!session?.user) { router.replace("/login"); return; }
    if (error || !workspace) { router.replace("/"); return; }
  }, [session, workspace, error, sessionPending, workspaceLoading, router]);

  // YouTube URL validation effect
  useEffect(() => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) { setValidationState("idle"); setVideoInfo(null); return; }
    if (!isValidYouTubeUrl(trimmedUrl)) { setValidationState("invalid"); setVideoInfo(null); return; }
    const timeoutId = setTimeout(async () => {
      setValidationState("validating");
      try {
        const result = await validateMutation.mutateAsync(trimmedUrl);
        if (result.valid && result.videoInfo) { setValidationState("valid"); setVideoInfo(result.videoInfo); }
        else { setValidationState("invalid"); setVideoInfo(null); }
      } catch { setValidationState("invalid"); setVideoInfo(null); }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [url]);

  // Initialize Uppy on mount
  useEffect(() => {
    if (uppyRef.current) return;

    const uppy = new Uppy({
      id: "workspace-uploader",
      autoProceed: true,
      restrictions: {
        maxFileSize: 5 * 1024 * 1024 * 1024,
        maxNumberOfFiles: 5,
        allowedFileTypes: ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/mpeg"],
      },
    });

    uppy.use(AwsS3, {
      shouldUseMultipart: (file) => (file.size ?? 0) > 100 * 1024 * 1024,
      limit: 4,
      async createMultipartUpload(file) {
        const response = await fetch(`${API_BASE_URL}/api/uppy/multipart`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, type: file.type, metadata: {} }),
        });
        if (!response.ok) throw new Error("Failed to create upload");
        const data = await response.json();
        videoIdsRef.current.set(file.id, data.videoId);
        return { uploadId: data.uploadId, key: data.key };
      },
      async signPart(_file, { uploadId, key, partNumber }) {
        const response = await fetch(`${API_BASE_URL}/api/uppy/multipart/${uploadId}/${partNumber}?key=${encodeURIComponent(key)}`, { method: "GET", credentials: "include" });
        if (!response.ok) throw new Error("Failed to get upload URL");
        return response.json();
      },
      async listParts(_file, { uploadId, key }) {
        const response = await fetch(`${API_BASE_URL}/api/uppy/multipart/${uploadId}?key=${encodeURIComponent(key)}`, { method: "GET", credentials: "include" });
        if (!response.ok) throw new Error("Failed to list parts");
        return response.json();
      },
      async completeMultipartUpload(file, { uploadId, key, parts }) {
        const videoId = videoIdsRef.current.get(file.id);
        const response = await fetch(`${API_BASE_URL}/api/uppy/multipart/${uploadId}/complete?key=${encodeURIComponent(key)}`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parts, videoId }),
        });
        if (!response.ok) throw new Error("Failed to complete upload");
        return { location: (await response.json()).location };
      },
      async abortMultipartUpload(_file, { uploadId, key }) {
        await fetch(`${API_BASE_URL}/api/uppy/multipart/${uploadId}?key=${encodeURIComponent(key)}`, { method: "DELETE", credentials: "include" });
      },
      async getUploadParameters(file) {
        const response = await fetch(`${API_BASE_URL}/api/uppy/multipart`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, type: file.type, metadata: {} }),
        });
        if (!response.ok) throw new Error("Failed to get upload URL");
        const data = await response.json();
        videoIdsRef.current.set(file.id, data.videoId);
        const urlResponse = await fetch(`${API_BASE_URL}/api/uppy/presign?key=${encodeURIComponent(data.key)}&contentType=${encodeURIComponent(file.type || "video/mp4")}`, { method: "GET", credentials: "include" });
        if (!urlResponse.ok) throw new Error("Failed to get presigned URL");
        return { method: "PUT" as const, url: (await urlResponse.json()).url, headers: { "Content-Type": file.type || "video/mp4" } };
      },
    });

    uppy.on("file-added", (file) => {
      console.log("[UPPY] File added:", file.name);
      setFiles((prev) => [...prev, { id: file.id, name: file.name || "Unknown", size: file.size || 0, progress: 0, status: "pending" }]);
    });
    uppy.on("upload-progress", (file, progress) => {
      if (!file) return;
      const percentage = progress.bytesTotal ? Math.round((progress.bytesUploaded / progress.bytesTotal) * 100) : 0;
      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, progress: percentage, status: "uploading" } : f));
    });
    uppy.on("upload-success", (file) => {
      if (!file) return;
      console.log("[UPPY] Upload success:", file.name);
      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, progress: 100, status: "complete" } : f));
      toast.success("Upload complete", { description: `${file.name} is now being processed` });
      queryClient.invalidateQueries({ queryKey: videoKeys.myVideos() });
      setTimeout(() => {
        uppy.removeFile(file.id);
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
      }, 3000);
    });
    uppy.on("upload-error", (file, error) => {
      if (!file) return;
      console.error("[UPPY] Upload error:", error);
      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, status: "error", error: error.message } : f));
      toast.error("Upload failed");
    });

    uppyRef.current = uppy;
    setUppyReady(true);
    console.log("[UPPY] Initialized");

    return () => {
      console.log("[UPPY] Destroying");
      uppy.destroy();
      uppyRef.current = null;
      setUppyReady(false);
    };
  }, [queryClient]);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    console.log("[UPPY] handleFileSelect called", selectedFiles?.length, "files, uppyRef:", !!uppyRef.current);
    if (!selectedFiles || !uppyRef.current) {
      console.log("[UPPY] No files or uppy not ready");
      return;
    }
    Array.from(selectedFiles).forEach((file) => {
      try {
        console.log("[UPPY] Adding file:", file.name);
        uppyRef.current?.addFile({ name: file.name, type: file.type, data: file, source: "local" });
      } catch (err) {
        console.error("[UPPY] Error adding file:", err);
      }
    });
  }, []);

  const removeFile = useCallback((fileId: string) => {
    uppyRef.current?.removeFile(fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const handleSubmitYouTube = useCallback(async () => {
    if (validationState !== "valid" || !url.trim()) return;
    // Redirect to configure page with URL as query param
    router.push(`/${slug}/configure?url=${encodeURIComponent(url.trim())}`);
  }, [validationState, url, slug, router]);

  // Project navigation handlers
  const handleProjectSelect = useCallback((projectId: string) => {
    router.push(`/${slug}/projects/${projectId}`);
  }, [router, slug]);

  const handleCreateProject = useCallback(() => {
    openCreateProjectDialog();
  }, [openCreateProjectDialog]);

  if (sessionPending || workspaceLoading) return <div className="flex min-h-[50vh] items-center justify-center"><Spinner /></div>;
  if (!workspace) return null;

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section with Upload UI - Responsive padding */}
      {/* @validates Requirement 31.3 - Mobile-friendly experience */}
      <div className="w-full max-w-2xl pt-4 sm:pt-8 pb-8 sm:pb-12 px-4">
        {/* Header with workspace name and credit balance - Responsive layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold">{workspace.name}</h1>
          {/* Credit Balance Display - Requirement 27.1 */}
          <CreditBalance workspaceId={workspace.id} workspaceSlug={slug} variant="compact" showWarning />
        </div>

        {/* Upload Card - Enhanced Upload UI (Requirements 1.1, 2.1) */}
        <div className="bg-card border rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          {/* YouTube URL Input - Requirement 1.1 */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 sm:left-4 flex items-center">
              <IconBrandYoutube className="size-4 sm:size-5 text-muted-foreground" />
            </div>
            <Input
              type="url"
              placeholder="Drop a YouTube link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && validationState === "valid" && handleSubmitYouTube()}
              className={cn(
                "h-10 sm:h-12 pl-10 sm:pl-12 pr-10 sm:pr-12 bg-muted/50 border-0 text-sm sm:text-base",
                validationState === "valid" && "ring-1 ring-green-500",
                validationState === "invalid" && url && "ring-1 ring-red-500"
              )}
              disabled={submitMutation.isPending}
            />
            <div className="absolute inset-y-0 right-3 sm:right-4 flex items-center">
              {validationState === "validating" && <IconLoader2 className="size-4 animate-spin text-muted-foreground" />}
              {validationState === "valid" && <IconCheck className="size-4 text-green-500" />}
              {validationState === "invalid" && url && <IconX className="size-4 text-red-500" />}
            </div>
          </div>

          {/* Video Preview - Responsive layout */}
          {videoInfo && validationState === "valid" && (
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
              <img src={videoInfo.thumbnail} alt="" className="h-12 sm:h-14 w-20 sm:w-24 rounded object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">{videoInfo.title}</p>
                <p className="text-xs text-muted-foreground">{videoInfo.channelName} • {formatDuration(videoInfo.duration)}</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 size-8 sm:size-9" onClick={() => { setUrl(""); setVideoInfo(null); setValidationState("idle"); }}>
                <IconX className="size-4" />
              </Button>
            </div>
          )}

          {/* File Upload Button - Requirement 2.1 */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,video/mpeg"
              multiple
              onChange={(e) => {
                handleFileSelect(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
            <button
              onClick={() => {
                console.log("[UPPY] Upload button clicked, uppyReady:", uppyReady);
                inputRef.current?.click();
              }}
              disabled={!uppyReady}
              className={cn(
                "flex items-center gap-2 text-xs sm:text-sm transition-colors",
                uppyReady ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/50 cursor-not-allowed"
              )}
            >
              <IconUpload className="size-4" />
              {uppyReady ? "Upload file" : "Loading..."}
            </button>
            <span className="text-xs text-muted-foreground">MP4, WebM, MOV • Max 5GB</span>
          </div>

          {/* Inline File Upload Progress */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border",
                    file.status === "complete" && "border-green-500/30 bg-green-500/5",
                    file.status === "error" && "border-red-500/30 bg-red-500/5",
                    (file.status === "pending" || file.status === "uploading") && "border-border bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg",
                    file.status === "complete" ? "bg-green-500/10 text-green-500" :
                      file.status === "error" ? "bg-red-500/10 text-red-500" :
                        "bg-muted text-muted-foreground"
                  )}>
                    {file.status === "complete" ? <IconCheck className="size-4 sm:size-5" /> :
                      file.status === "error" ? <IconAlertCircle className="size-4 sm:size-5" /> :
                        <IconFile className="size-4 sm:size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs sm:text-sm font-medium">{file.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                      {file.status === "uploading" && <span className="text-xs text-primary font-medium">{file.progress}%</span>}
                      {file.status === "complete" && <span className="text-xs text-green-500">Complete</span>}
                      {file.status === "error" && <span className="text-xs text-red-500">{file.error || "Failed"}</span>}
                    </div>
                    {(file.status === "uploading" || file.status === "pending") && (
                      <Progress value={file.progress} className="mt-2 h-1.5" />
                    )}
                  </div>
                  {file.status !== "complete" && (
                    <Button variant="ghost" size="icon" className="size-7 sm:size-8 shrink-0" onClick={() => removeFile(file.id)}>
                      <IconX className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <Button
            className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium"
            onClick={handleSubmitYouTube}
            disabled={validationState !== "valid" || submitMutation.isPending}
          >
            {submitMutation.isPending ? <><IconLoader2 className="mr-2 size-4 animate-spin" />Processing...</> : "Get clips in 1 click"}
          </Button>
        </div>
      </div>

      {/* Content Section with Tabs for Videos and Projects */}
      <div className="w-full border-t">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Tabs for Videos and Projects - Requirements 25.1, 27.1 */}
          {/* @validates Requirement 31.3 - Mobile-friendly tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "videos" | "projects")} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <TabsList className="bg-transparent p-0 h-auto gap-3 sm:gap-4 w-full sm:w-auto justify-start">
                <TabsTrigger
                  value="videos"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 text-muted-foreground data-[state=active]:text-foreground flex items-center gap-1.5 sm:gap-2 text-sm"
                >
                  <IconVideo className="size-4" />
                  Videos ({videos?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="projects"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 text-muted-foreground data-[state=active]:text-foreground flex items-center gap-1.5 sm:gap-2 text-sm"
                >
                  <IconFolder className="size-4" />
                  Projects
                </TabsTrigger>
              </TabsList>
              <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="secondary" className="gap-1"><span className="size-1.5 rounded-full bg-green-500" />Auto-save</Badge>
              </div>
            </div>

            {/* Videos Tab Content */}
            <TabsContent value="videos" className="mt-0">
              {videosError ? (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <IconAlertCircle className="size-10 sm:size-12 mx-auto mb-3 sm:mb-4 text-red-500 opacity-50" />
                  <p className="font-medium text-sm sm:text-base text-red-500">Failed to load videos</p>
                  <p className="text-xs sm:text-sm">{(videosError as Error)?.message || "Please try again"}</p>
                </div>
              ) : (
                <VideoGrid
                  videos={videos || []}
                  onVideoClick={(videoId) => router.push(`/${slug}/videos/${videoId}/clips`)}
                  onDeleteVideo={(videoId) => deleteMutation.mutate(videoId)}
                  isLoading={videosLoading || sessionPending}
                />
              )}
            </TabsContent>

            {/* Projects Tab Content - Requirement 25.1 */}
            <TabsContent value="projects" className="mt-0">
              <ProjectList
                workspaceId={workspace.id}
                onProjectSelect={handleProjectSelect}
                onCreateProject={handleCreateProject}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
