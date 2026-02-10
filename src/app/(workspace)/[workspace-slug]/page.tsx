"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { useMyVideos, useSubmitYouTubeUrl, useDeleteVideo, videoKeys } from "@/hooks/useVideo";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UploadLimitErrorModal } from "@/components/upload/upload-limit-error-modal";
import {
  IconUpload,
  IconLoader2,
  IconCheck,
  IconX,
  IconFile,
  IconAlertCircle,
  IconVideo,
  // IconFolder,
} from "@tabler/icons-react";
import { YouTubeIcon } from "@/components/icons/youtube-icon";
import { Progress } from "@/components/ui/progress";
import Uppy from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import { useQueryClient } from "@tanstack/react-query";
import { VideoGrid } from "@/components/video/video-grid";

// Import integrated components
// import { ProjectList } from "@/components/project/project-list";
import { CreditBalance } from "@/components/project/credit-balance";
// import { useWorkspaceShortcuts } from "@/components/workspace/workspace-shortcuts-provider";

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
  const searchParams = useSearchParams();
  const uploadToProject = searchParams.get("uploadToProject");
  const statusFilter = searchParams.get("filter") || undefined;
  const { data: session, isPending: sessionPending } = useSession();
  const { data: workspace, isLoading: workspaceLoading, error } = useWorkspaceBySlug(slug);
  const { data: videos, isLoading: videosLoading, error: videosError } = useMyVideos(workspace?.id || "", !!session?.user && !!workspace?.id, statusFilter);

  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [files, setFiles] = useState<FileState[]>([]);
  const [uppyReady, setUppyReady] = useState(false);
  const [showLimitError, setShowLimitError] = useState(false);
  const [limitErrorDetails, setLimitErrorDetails] = useState<{
    errorType: "fileSize" | "duration";
    currentLimit: string;
    attemptedValue: string;
    currentPlan: string;
    recommendedPlan?: string;
  } | null>(null);

  // Get plan limits for this workspace
  const planLimits = usePlanLimits(slug);
  // const [activeTab, setActiveTab] = useState<"videos" | "projects">("videos");
  const uppyRef = useRef<Uppy | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const videoIdsRef = useRef<Map<string, { videoId: string; key: string }>>(new Map());
  const workspaceRef = useRef<typeof workspace>(workspace);

  // Keep workspaceRef in sync
  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  // Scroll to upload section when coming from project page
  useEffect(() => {
    if (uploadToProject && uploadSectionRef.current && !workspaceLoading) {
      uploadSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      // Focus the input after scrolling
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  }, [uploadToProject, workspaceLoading]);

  // Use workspace shortcuts context for create project dialog
  // const { openCreateProjectDialog } = useWorkspaceShortcuts();

  const submitMutation = useSubmitYouTubeUrl();
  const deleteMutation = useDeleteVideo();

  useEffect(() => {
    if (sessionPending || workspaceLoading) return;
    if (!session?.user) { router.replace("/login"); return; }
    if (error || !workspace) { router.replace("/"); return; }
  }, [session, workspace, error, sessionPending, workspaceLoading, router]);

  // Client-side only YouTube URL validation
  useEffect(() => {
    const trimmedUrl = url.trim();
    setIsValidUrl(trimmedUrl ? isValidYouTubeUrl(trimmedUrl) : false);
  }, [url]);

  // Initialize Uppy on mount
  useEffect(() => {
    if (uppyRef.current) return;

    const uppy = new Uppy({
      id: "workspace-uploader",
      autoProceed: true,
      restrictions: {
        maxFileSize: planLimits.maxFileSize, // Use plan-based limit
        maxNumberOfFiles: 5,
        allowedFileTypes: ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/mpeg"],
      },
    });

    uppy.use(AwsS3, {
      shouldUseMultipart: (file) => (file.size ?? 0) > 100 * 1024 * 1024,
      limit: 4,
      async createMultipartUpload(file) {
        const workspaceId = workspaceRef.current?.id;
        if (!workspaceId) throw new Error("Workspace not found");
        const response = await fetch(`${API_BASE_URL}/api/uppy/multipart`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, type: file.type, metadata: { workspaceId, fileSize: file.size } }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          // Handle plan limit errors
          if (errorData.upgradeRequired) {
            setLimitErrorDetails({
              errorType: "fileSize",
              currentLimit: errorData.currentLimit || `${planLimits.maxFileSizeGB}GB`,
              attemptedValue: formatFileSize(file.size || 0),
              currentPlan: planLimits.planName,
              recommendedPlan: errorData.recommendedPlan,
            });
            setShowLimitError(true);
          }
          throw new Error(errorData.error || "Failed to create upload");
        }
        const data = await response.json();
        videoIdsRef.current.set(file.id, { videoId: data.videoId, key: data.key });
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
        const uploadInfo = videoIdsRef.current.get(file.id);
        const videoId = uploadInfo?.videoId;
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
        const workspaceId = workspaceRef.current?.id;
        if (!workspaceId) throw new Error("Workspace not found");
        const response = await fetch(`${API_BASE_URL}/api/uppy/multipart`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, type: file.type, metadata: { workspaceId } }),
        });
        if (!response.ok) throw new Error("Failed to get upload URL");
        const data = await response.json();
        videoIdsRef.current.set(file.id, { videoId: data.videoId, key: data.key });
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
    uppy.on("upload-success", async (file) => {
      if (!file) return;
      console.log("[UPPY] Upload success:", file.name);
      const uploadInfo = videoIdsRef.current.get(file.id);
      const videoId = uploadInfo?.videoId;
      const key = uploadInfo?.key;

      // For single-file uploads (non-multipart), we need to call the complete endpoint
      // to update the video record with the storage key
      if (videoId && key && file.size && file.size < 100 * 1024 * 1024) {
        try {
          await fetch(`${API_BASE_URL}/api/uppy/complete`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoId, key }),
          });
        } catch (err) {
          console.error("[UPPY] Failed to complete upload:", err);
        }
      }

      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, progress: 100, status: "complete" } : f));
      toast.success("Upload complete", { description: "Redirecting to configure your clips..." });
      queryClient.invalidateQueries({ queryKey: videoKeys.all });

      // Redirect to configure page after a short delay
      setTimeout(() => {
        uppy.removeFile(file.id);
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
        if (videoId) {
          router.push(`/${slug}/configure?videoId=${videoId}`);
        }
      }, 1000);
    });
    uppy.on("upload-error", (file, error) => {
      if (!file) return;
      console.error("[UPPY] Upload error:", error);
      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, status: "error", error: error.message } : f));

      // Check if it's a file size limit error
      if (error.message.includes("exceeds") || error.message.includes("limit")) {
        // Error modal already shown in createMultipartUpload
      } else {
        toast.error("Upload failed", { description: error.message });
      }
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
    if (!isValidUrl || !url.trim()) return;
    // Redirect to configure page with URL as query param
    router.push(`/${slug}/configure?url=${encodeURIComponent(url.trim())}`);
  }, [isValidUrl, url, slug, router]);

  // Project navigation handlers - TEMPORARILY COMMENTED
  // const handleProjectSelect = useCallback((projectId: string) => {
  //   router.push(`/${slug}/projects/${projectId}`);
  // }, [router, slug]);

  // const handleCreateProject = useCallback(() => {
  //   openCreateProjectDialog();
  // }, [openCreateProjectDialog]);

  if (sessionPending || workspaceLoading) return <div className="flex min-h-[50vh] items-center justify-center"><Spinner /></div>;
  if (!workspace) return null;

  return (
    <>
      {/* Upload Limit Error Modal */}
      {limitErrorDetails && (
        <UploadLimitErrorModal
          isOpen={showLimitError}
          onClose={() => {
            setShowLimitError(false);
            setLimitErrorDetails(null);
          }}
          errorType={limitErrorDetails.errorType}
          currentLimit={limitErrorDetails.currentLimit}
          attemptedValue={limitErrorDetails.attemptedValue}
          currentPlan={limitErrorDetails.currentPlan}
          recommendedPlan={limitErrorDetails.recommendedPlan}
          workspaceSlug={slug}
        />
      )}

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
          <div ref={uploadSectionRef} className={cn(
            "bg-card rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 transition-all",
            uploadToProject ? "ring-2 ring-primary" : "border"
          )}>
            {/* Show project context when uploading to a specific project */}
            {uploadToProject && (
              <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <span>Adding video to project</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.replace(`/${slug}`)}
                  className="h-auto py-1 px-2 text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}
            {/* YouTube URL Input - Requirement 1.1 */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 sm:left-4 flex items-center">
                <YouTubeIcon className="size-4 sm:size-5" />
              </div>
              <Input
                type="url"
                placeholder="Drop a YouTube link"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && isValidUrl && handleSubmitYouTube()}
                className={cn(
                  "h-10 sm:h-12 pl-10 sm:pl-12 pr-10 sm:pr-12 bg-muted/50 border-0 text-sm sm:text-base",
                  url && isValidUrl && "ring-1 ring-green-500",
                  url && !isValidUrl && "ring-1 ring-red-500"
                )}
                disabled={submitMutation.isPending}
              />
              <div className="absolute inset-y-0 right-3 sm:right-4 flex items-center">
                {url && isValidUrl && <IconCheck className="size-4 text-green-500" />}
                {url && !isValidUrl && <IconX className="size-4 text-red-500" />}
              </div>
            </div>

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
              <span className="text-xs text-muted-foreground">
                MP4, WebM, MOV • Max {planLimits.maxFileSizeGB}GB • Up to {planLimits.maxDurationFormatted}
              </span>
              {planLimits.canUpgrade && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto py-0 px-0 text-xs text-primary hover:underline"
                  onClick={() => router.push(`/${slug}/pricing`)}
                >
                  Upgrade for longer videos →
                </Button>
              )}
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
              disabled={!isValidUrl || submitMutation.isPending}
            >
              {submitMutation.isPending ? <><IconLoader2 className="mr-2 size-4 animate-spin" />Processing...</> : "Get clips in 1 click"}
            </Button>
          </div>
        </div>

        {/* Content Section - Videos Only (Projects temporarily disabled) */}
        <div className="w-full border-t">
          <div className="max-w-6xl mx-auto px-4 py-4">
            {/* Videos Header */}
            <div className="flex items-center gap-2 mb-4">
              <IconVideo className="size-5" />
              <h2 className="text-lg font-semibold">Videos ({videos?.length || 0})</h2>
            </div>

            {/* Videos Content */}
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

            {/* TEMPORARILY COMMENTED - Tabs for Videos and Projects
          <div className="w-full">
            <div className="relative inline-flex gap-1 rounded-lg bg-muted p-1">
              {[
                { value: "videos" as const, label: `Videos (${videos?.length || 0})`, icon: IconVideo },
                { value: "projects" as const, label: "Projects", icon: IconFolder },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "relative z-10 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    activeTab === tab.value
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {activeTab === tab.value && (
                    <motion.div
                      layoutId="activeTabBg"
                      className="absolute inset-0 rounded-md bg-background shadow-sm"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <motion.div
                    className="relative z-10"
                    animate={{ scale: activeTab === tab.value ? 1.05 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <tab.icon className="size-4" />
                  </motion.div>
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mt-4"
              >
                {activeTab === "videos" && (
                  <>
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
                  </>
                )}

                {activeTab === "projects" && (
                  <ProjectList
                    workspaceId={workspace.id}
                    onProjectSelect={handleProjectSelect}
                    onCreateProject={handleCreateProject}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          */}
          </div>
        </div>
      </div>
    </>
  );
}
