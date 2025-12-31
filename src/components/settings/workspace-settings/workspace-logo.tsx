"use client";

import { IconBuilding, IconCamera } from "@tabler/icons-react";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { PermissionGate } from "@/components/ui/permission-gate";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions";
import { safeClientError } from "@/lib/client-logger";
import { PERMISSIONS } from "@/lib/permissions";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_BASE64_SIZE = 7 * 1024 * 1024;

interface WorkspaceLogoProps {
  workspaceId: string;
  workspaceName: string;
  currentLogo?: string | null;
}

function validateFile(
  file: File,
  fileInputRef: React.RefObject<HTMLInputElement | null>
): boolean {
  if (!file.type.startsWith("image/")) {
    toast.error("Please select a valid image file");
    return false;
  }

  if (file.size > MAX_FILE_SIZE) {
    toast.error(
      `Image is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`
    );
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    return false;
  }

  return true;
}

function resetFileInput(
  fileInputRef: React.RefObject<HTMLInputElement | null>
) {
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
}

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: file.type,
  };

  const compressedFile = await imageCompression(file, options);

  if (compressedFile.size > MAX_FILE_SIZE) {
    throw new Error(
      `Image is too large after compression. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  return compressedFile;
}

function handleCompressionError(
  error: unknown,
  setIsUploadingLogo: (value: boolean) => void
) {
  safeClientError("Error compressing image:", error);
  toast.error("Failed to process image. Please try again.");
  setIsUploadingLogo(false);
}

async function uploadLogo(
  workspaceId: string,
  base64String: string,
  router: ReturnType<typeof useRouter>
) {
  const response = await fetch(`/api/workspace/${workspaceId}/update`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ logo: base64String }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update workspace logo");
  }

  toast.success("Workspace logo updated successfully");
  router.refresh();
}

function validateBase64Size(
  base64String: string,
  setIsUploadingLogo: (value: boolean) => void,
  fileInputRef?: React.RefObject<HTMLInputElement | null>
): boolean {
  if (base64String.length > MAX_BASE64_SIZE) {
    toast.error(
      `Image is too large after compression. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
    setIsUploadingLogo(false);
    if (fileInputRef?.current) {
      fileInputRef.current.value = "";
    }
    return false;
  }
  return true;
}

export function WorkspaceLogo({
  workspaceId,
  workspaceName,
  currentLogo,
}: WorkspaceLogoProps) {
  const router = useRouter();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { hasPermission } = useWorkspacePermissions(workspaceId);
  const canManageSettings = hasPermission(
    PERMISSIONS.WORKSPACE.MANAGE_SETTINGS as string
  );

  useEffect(() => {
    if (currentLogo && !logoPreview) {
      setLogoPreview(currentLogo);
    }
  }, [currentLogo, logoPreview]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!canManageSettings) {
      toast.error("You don't have permission to change the workspace logo");
      resetFileInput(fileInputRef);
      return;
    }

    if (!validateFile(file, fileInputRef)) {
      return;
    }

    setIsUploadingLogo(true);

    try {
      const compressedFile = await compressImage(file);

      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64String = reader.result as string;

        if (
          !validateBase64Size(base64String, setIsUploadingLogo, fileInputRef)
        ) {
          return;
        }

        setLogoPreview(base64String);

        try {
          await uploadLogo(workspaceId, base64String, router);
        } catch (error) {
          safeClientError("Error uploading logo:", error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to update workspace logo"
          );
          setLogoPreview(currentLogo || null);
        } finally {
          setIsUploadingLogo(false);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read image file");
        setIsUploadingLogo(false);
      };

      reader.readAsDataURL(compressedFile);
    } catch (error) {
      handleCompressionError(error, setIsUploadingLogo);
    }

    resetFileInput(fileInputRef);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Label className="font-medium text-sm" htmlFor="logo-upload">
            Workspace logo
          </Label>
          <p className="text-muted-foreground text-xs">
            Maximum upload size is 5MB
          </p>
        </div>
        <PermissionGate
          permission={PERMISSIONS.WORKSPACE.MANAGE_SETTINGS}
          workspaceId={workspaceId}
        >
          <Tooltip>
            <TooltipTrigger
              render={(props) => (
                <div {...props}>
                  <button
                    aria-busy={isUploadingLogo}
                    aria-label="Change workspace logo"
                    className="group relative rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isUploadingLogo || !canManageSettings}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Avatar className="size-10 ring-2 ring-border transition-all group-hover:ring-ring">
                      <AvatarImage
                        alt="Workspace logo"
                        src={logoPreview || undefined}
                      />
                      <AvatarFallback className="text-lg">
                        {workspaceName?.charAt(0).toUpperCase() || (
                          <IconBuilding className="size-6 opacity-50" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/60 transition-opacity ${
                        isUploadingLogo
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {isUploadingLogo ? (
                        <Spinner className="size-4 text-white" />
                      ) : (
                        <IconCamera className="size-4 text-white" />
                      )}
                    </div>
                  </button>
                </div>
              )}
            />
            <TooltipContent align="center" side="top" sideOffset={6}>
              Change workspace logo
            </TooltipContent>
          </Tooltip>
        </PermissionGate>
      </div>
      <input
        accept="image/*"
        aria-label="Upload workspace logo"
        className="hidden"
        disabled={!canManageSettings}
        id="logo-upload"
        onChange={handleLogoChange}
        ref={fileInputRef}
        type="file"
      />
    </>
  );
}
