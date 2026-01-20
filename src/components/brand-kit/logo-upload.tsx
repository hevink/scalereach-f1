"use client";

import {
    IconPhoto,
    IconTrash,
    IconUpload,
    IconX,
    IconLoader2,
    IconAlertCircle,
} from "@tabler/icons-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Allowed logo file formats
 * Validates: Requirements 18.2
 */
export const ALLOWED_LOGO_FORMATS = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/svg+xml",
] as const;

/**
 * Allowed logo file extensions for display
 */
export const ALLOWED_LOGO_EXTENSIONS = ["PNG", "JPG", "JPEG", "SVG"] as const;

/**
 * Maximum logo file size (5MB)
 */
export const MAX_LOGO_SIZE = 5 * 1024 * 1024;

/**
 * Validates if a file has a valid logo format
 * Validates: Requirements 18.2, 18.4
 *
 * @param file - The file to validate
 * @returns Error message if invalid, null if valid
 */
export function validateLogoFormat(file: File): string | null {
    // Check MIME type
    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_LOGO_FORMATS.includes(mimeType as (typeof ALLOWED_LOGO_FORMATS)[number])) {
        // Also check file extension as fallback
        const extension = file.name.split(".").pop()?.toLowerCase();
        const validExtensions = ["png", "jpg", "jpeg", "svg"];
        if (!extension || !validExtensions.includes(extension)) {
            return `Invalid file format. Please upload PNG, JPG, or SVG files.`;
        }
    }

    // Check file size
    if (file.size > MAX_LOGO_SIZE) {
        return `File too large. Maximum size is 5MB.`;
    }

    return null;
}

/**
 * Checks if a file extension is valid for logo upload
 * Validates: Requirements 18.2
 *
 * @param filename - The filename to check
 * @returns true if valid extension
 */
export function isValidLogoExtension(filename: string): boolean {
    const extension = filename.split(".").pop()?.toLowerCase();
    return extension ? ["png", "jpg", "jpeg", "svg"].includes(extension) : false;
}

/**
 * LogoUploadProps interface
 *
 * @validates Requirements 18.1, 18.2, 18.3, 18.4, 18.5
 */
export interface LogoUploadProps {
    /** Current logo URL to display */
    currentLogo?: string;
    /** Callback when a file is uploaded */
    onUpload: (file: File) => Promise<void>;
    /** Callback when the logo is removed */
    onRemove: () => void;
    /** Additional className */
    className?: string;
    /** Whether the component is disabled */
    disabled?: boolean;
    /** Label for the upload section */
    label?: string;
}

/**
 * LogoUpload Component
 *
 * A drag-and-drop logo upload interface with:
 * - Drag-and-drop support (Requirement 18.1)
 * - PNG, JPG, SVG format validation (Requirement 18.2)
 * - Upload preview display (Requirement 18.3)
 * - Format validation before upload (Requirement 18.4)
 * - Error message for unsupported formats (Requirement 18.5)
 *
 * @example
 * ```tsx
 * <LogoUpload
 *   currentLogo={brandKit?.logoUrl}
 *   onUpload={async (file) => {
 *     await uploadLogo({ workspaceId, file });
 *   }}
 *   onRemove={() => removeLogo(workspaceId)}
 * />
 * ```
 *
 * @validates Requirements 18.1, 18.2, 18.3, 18.4, 18.5
 */
export function LogoUpload({
    currentLogo,
    onUpload,
    onRemove,
    className,
    disabled = false,
    label = "Logo",
}: LogoUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Display logo: preview takes precedence, then current logo
    const displayLogo = previewUrl || currentLogo;

    /**
     * Handles file validation and upload
     */
    const handleFile = useCallback(
        async (file: File) => {
            // Clear previous error
            setError(null);

            // Validate file format - Requirement 18.4
            const validationError = validateLogoFormat(file);
            if (validationError) {
                // Requirement 18.5 - Display error message for unsupported formats
                setError(validationError);
                toast.error(validationError);
                return;
            }

            // Create preview - Requirement 18.3
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload file
            setIsUploading(true);
            try {
                await onUpload(file);
                toast.success("Logo uploaded successfully");
                // Clear preview after successful upload (the currentLogo prop will update)
                setPreviewUrl(null);
            } catch (uploadError) {
                const errorMessage =
                    uploadError instanceof Error
                        ? uploadError.message
                        : "Failed to upload logo";
                setError(errorMessage);
                toast.error(errorMessage);
                // Clear preview on error
                setPreviewUrl(null);
            } finally {
                setIsUploading(false);
            }
        },
        [onUpload]
    );

    /**
     * Handles file input change
     */
    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                handleFile(file);
            }
            // Reset input so same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        },
        [handleFile]
    );

    /**
     * Handles drag over event - Requirement 18.1
     */
    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled && !isUploading) {
                setIsDragging(true);
            }
        },
        [disabled, isUploading]
    );

    /**
     * Handles drag leave event
     */
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    /**
     * Handles drop event - Requirement 18.1
     */
    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (disabled || isUploading) return;

            const file = e.dataTransfer.files?.[0];
            if (file) {
                handleFile(file);
            }
        },
        [disabled, isUploading, handleFile]
    );

    /**
     * Handles click on upload zone
     */
    const handleClick = useCallback(() => {
        if (!disabled && !isUploading) {
            fileInputRef.current?.click();
        }
    }, [disabled, isUploading]);

    /**
     * Handles remove button click
     */
    const handleRemove = useCallback(() => {
        setPreviewUrl(null);
        setError(null);
        onRemove();
        toast.success("Logo removed");
    }, [onRemove]);

    /**
     * Handles clearing the preview without removing the current logo
     */
    const handleClearPreview = useCallback(() => {
        setPreviewUrl(null);
        setError(null);
    }, []);

    return (
        <div
            className={cn("flex flex-col gap-3", className)}
            data-slot="logo-upload"
        >
            {/* Label */}
            <Label className="font-medium text-foreground text-sm">{label}</Label>

            {/* Upload Zone or Preview */}
            {displayLogo ? (
                // Logo Preview - Requirement 18.3
                <div className="relative">
                    <div className="relative flex items-center justify-center rounded-lg border border-border bg-muted/30 p-4">
                        {/* Logo Image */}
                        <div className="relative">
                            <img
                                alt="Logo preview"
                                className="max-h-32 max-w-full object-contain"
                                src={displayLogo}
                            />
                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center rounded bg-background/80">
                                    <IconLoader2 className="size-6 animate-spin text-primary" />
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute right-2 top-2 flex gap-1">
                            {previewUrl && !isUploading && (
                                <Button
                                    aria-label="Cancel preview"
                                    className="size-7"
                                    disabled={disabled}
                                    onClick={handleClearPreview}
                                    size="icon"
                                    variant="ghost"
                                >
                                    <IconX className="size-4" />
                                </Button>
                            )}
                            {!previewUrl && !isUploading && (
                                <Button
                                    aria-label="Remove logo"
                                    className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    disabled={disabled}
                                    onClick={handleRemove}
                                    size="icon"
                                    variant="ghost"
                                >
                                    <IconTrash className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Replace Button */}
                    {!isUploading && (
                        <div className="mt-2 flex justify-center">
                            <Button
                                className="text-xs"
                                disabled={disabled}
                                onClick={handleClick}
                                size="sm"
                                variant="outline"
                            >
                                <IconUpload className="mr-1.5 size-3.5" />
                                Replace Logo
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                // Drop Zone - Requirement 18.1
                <div
                    aria-label="Logo upload drop zone"
                    className={cn(
                        "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors",
                        isDragging
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30",
                        (disabled || isUploading) && "cursor-not-allowed opacity-50",
                        error && "border-destructive/50"
                    )}
                    onClick={handleClick}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    role="button"
                    tabIndex={disabled || isUploading ? -1 : 0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleClick();
                        }
                    }}
                >
                    {/* Icon */}
                    <div
                        className={cn(
                            "flex size-12 items-center justify-center rounded-full",
                            isDragging ? "bg-primary/10" : "bg-muted"
                        )}
                    >
                        {isUploading ? (
                            <IconLoader2 className="size-6 animate-spin text-primary" />
                        ) : error ? (
                            <IconAlertCircle className="size-6 text-destructive" />
                        ) : (
                            <IconPhoto
                                className={cn(
                                    "size-6",
                                    isDragging ? "text-primary" : "text-muted-foreground"
                                )}
                            />
                        )}
                    </div>

                    {/* Text */}
                    <div className="text-center">
                        <p className="font-medium text-sm">
                            {isDragging
                                ? "Drop your logo here"
                                : isUploading
                                    ? "Uploading..."
                                    : "Drag and drop your logo"}
                        </p>
                        {!isUploading && (
                            <p className="text-muted-foreground text-xs">
                                or{" "}
                                <span className="text-primary underline-offset-2 hover:underline">
                                    browse files
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Supported Formats */}
                    <p className="text-muted-foreground text-xs">
                        PNG, JPG, SVG • Max 5MB
                    </p>
                </div>
            )}

            {/* Error Message - Requirement 18.5 */}
            {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                    <IconAlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Hidden File Input */}
            <input
                accept={ALLOWED_LOGO_FORMATS.join(",")}
                aria-hidden="true"
                className="hidden"
                disabled={disabled || isUploading}
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
            />
        </div>
    );
}

export default LogoUpload;
