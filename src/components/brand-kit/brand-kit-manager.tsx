"use client";

import { IconDeviceFloppy, IconLoader2, IconRefresh, IconVideo } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { LogoUpload } from "./logo-upload";
import { ColorPaletteBuilder } from "./color-palette-builder";
import { BrandFontSelector, SUPPORTED_FONTS } from "./brand-font-selector";
import {
    LogoPositionControls,
    DEFAULT_LOGO_POSITION,
    DEFAULT_LOGO_SIZE,
    DEFAULT_LOGO_OPACITY,
    type LogoSettings,
    type LogoPosition,
} from "./logo-position-controls";
import {
    useBrandKit,
    useCreateBrandKit,
    useUpdateBrandKit,
    useUploadLogo,
    useRemoveLogo,
} from "@/hooks/useBrandKit";
import type { BrandKit } from "@/lib/api/brand-kit";

/**
 * BrandKitManagerProps interface
 *
 * @validates Requirements 18.1, 19.1, 20.1, 21.1
 */
export interface BrandKitManagerProps {
    /** The workspace ID to manage brand kit for */
    workspaceId: string;
    /** Optional video URL for preview */
    videoUrl?: string;
    /** Additional className for styling */
    className?: string;
}

/**
 * BrandKitPreviewProps interface
 * Based on design document interface
 */
export interface BrandKitPreviewProps {
    /** Brand kit data to preview */
    brandKit: Partial<BrandKit>;
    /** Logo settings for positioning */
    logoSettings: LogoSettings;
    /** Video URL for preview background */
    videoUrl?: string;
}

/**
 * Default brand kit colors
 */
const DEFAULT_COLORS = {
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    accentColor: "#F59E0B",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
};

/**
 * Default font family
 */
const DEFAULT_FONT = "Inter";

/**
 * Position CSS mapping for logo placement
 */
const LOGO_POSITION_STYLES: Record<LogoPosition, React.CSSProperties> = {
    "top-left": { top: "8%", left: "4%" },
    "top-right": { top: "8%", right: "4%" },
    "bottom-left": { bottom: "8%", left: "4%" },
    "bottom-right": { bottom: "8%", right: "4%" },
};

/**
 * BrandKitPreview Component
 *
 * Shows a preview of how the brand kit will appear on a video.
 * Displays logo with position, size, and opacity settings.
 *
 * @validates Requirements 21.4 - Update preview on change
 */
function BrandKitPreview({
    brandKit,
    logoSettings,
    videoUrl,
}: BrandKitPreviewProps) {
    const hasLogo = !!brandKit.logoUrl;
    const colors = [
        brandKit.primaryColor,
        brandKit.secondaryColor,
        brandKit.accentColor,
        brandKit.backgroundColor,
        brandKit.textColor,
    ].filter(Boolean);

    return (
        <div className="flex flex-col gap-4">
            {/* Video Preview with Logo Overlay */}
            <div
                className="relative aspect-9/16 max-h-[400px] w-full overflow-hidden rounded-lg border border-border bg-muted"
                style={{
                    background: videoUrl
                        ? `url(${videoUrl}) center/cover`
                        : `linear-gradient(135deg, ${brandKit.backgroundColor || "#1a1a2e"} 0%, ${brandKit.primaryColor || "#16213e"} 100%)`,
                }}
            >
                {/* Video placeholder background */}
                {!videoUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground" aria-label="Video preview placeholder">
                        <IconVideo className="size-12 opacity-30" aria-hidden="true" />
                        <span className="text-xs opacity-50">Video Preview</span>
                    </div>
                )}

                {/* Logo Overlay */}
                {hasLogo && (
                    <div
                        className="absolute transition-all duration-300"
                        style={{
                            ...LOGO_POSITION_STYLES[logoSettings.position],
                            width: `${logoSettings.size}%`,
                            opacity: logoSettings.opacity / 100,
                        }}
                    >
                        <img
                            alt="Brand logo preview"
                            className="h-auto w-full object-contain drop-shadow-lg"
                            src={brandKit.logoUrl}
                        />
                    </div>
                )}

                {/* Sample Caption Preview */}
                <div className="absolute inset-x-4 bottom-16 text-center">
                    <div
                        className="inline-block rounded-md px-3 py-2"
                        style={{
                            fontFamily: `"${brandKit.fontFamily || DEFAULT_FONT}", sans-serif`,
                            color: brandKit.textColor || "#FFFFFF",
                            backgroundColor: `${brandKit.backgroundColor || "#000000"}B3`,
                            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                        }}
                    >
                        <span className="text-sm font-medium">Sample caption text</span>
                    </div>
                </div>

                {/* Position Indicator */}
                {hasLogo && (
                    <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-white text-xs" aria-label={`Logo position: ${logoSettings.position.replace("-", " ")}`}>
                        {logoSettings.position.replace("-", " ")}
                    </div>
                )}
            </div>

            {/* Color Palette Preview */}
            {colors.length > 0 && (
                <div className="flex flex-col gap-2">
                    <span className="text-muted-foreground text-xs">Color Palette</span>
                    <div className="flex gap-1">
                        {colors.map((color, index) => (
                            <div
                                key={`preview-color-${index}`}
                                className="size-8 rounded-md border border-border shadow-sm"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Font Preview */}
            {brandKit.fontFamily && (
                <div className="flex flex-col gap-2">
                    <span className="text-muted-foreground text-xs">Typography</span>
                    <div
                        className="rounded-md border border-border bg-muted/30 p-3"
                        style={{ fontFamily: `"${brandKit.fontFamily}", sans-serif` }}
                    >
                        <p className="text-sm">{brandKit.fontFamily}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * BrandKitManager Component
 *
 * A container component that combines all brand kit components:
 * - LogoUpload (Requirement 18.1)
 * - ColorPaletteBuilder (Requirement 19.1)
 * - BrandFontSelector (Requirement 20.1)
 * - LogoPositionControls (Requirement 21.1)
 *
 * Features:
 * - Fetches brand kit data using useBrandKit hook
 * - Provides save button with API integration
 * - Shows loading states using Skeleton components
 * - Shows error states with retry option
 *
 * @example
 * ```tsx
 * <BrandKitManager workspaceId="workspace-123" />
 * ```
 *
 * @validates Requirements 18.1, 19.1, 20.1, 21.1
 */
export function BrandKitManager({
    workspaceId,
    videoUrl,
    className,
}: BrandKitManagerProps) {
    // Fetch brand kit data
    const {
        data: brandKit,
        isLoading,
        isError,
        error,
        refetch,
    } = useBrandKit(workspaceId);

    // Mutations
    const createBrandKit = useCreateBrandKit();
    const updateBrandKit = useUpdateBrandKit();
    const uploadLogo = useUploadLogo();
    const removeLogo = useRemoveLogo();

    // Local state for unsaved changes
    const [localColors, setLocalColors] = useState<string[]>([]);
    const [localFont, setLocalFont] = useState<string>(DEFAULT_FONT);
    const [localLogoSettings, setLocalLogoSettings] = useState<LogoSettings>({
        position: DEFAULT_LOGO_POSITION,
        size: DEFAULT_LOGO_SIZE,
        opacity: DEFAULT_LOGO_OPACITY,
    });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Initialize local state from brand kit data
    useEffect(() => {
        if (brandKit) {
            // Convert brand kit colors to array format for ColorPaletteBuilder
            const colors = [
                brandKit.primaryColor,
                brandKit.secondaryColor,
                brandKit.accentColor,
                brandKit.backgroundColor,
                brandKit.textColor,
            ].filter(Boolean);
            setLocalColors(colors);
            setLocalFont(brandKit.fontFamily || DEFAULT_FONT);
            // Reset unsaved changes when data loads
            setHasUnsavedChanges(false);
        } else if (!isLoading && !brandKit) {
            // Set defaults for new brand kit
            setLocalColors([
                DEFAULT_COLORS.primaryColor,
                DEFAULT_COLORS.secondaryColor,
                DEFAULT_COLORS.accentColor,
            ]);
            setLocalFont(DEFAULT_FONT);
        }
    }, [brandKit, isLoading]);

    /**
     * Handles logo upload
     * @validates Requirement 18.1
     */
    const handleLogoUpload = useCallback(
        async (file: File) => {
            await uploadLogo.mutateAsync({ workspaceId, file });
        },
        [workspaceId, uploadLogo]
    );

    /**
     * Handles logo removal
     * @validates Requirement 18.1
     */
    const handleLogoRemove = useCallback(() => {
        removeLogo.mutate(workspaceId);
    }, [workspaceId, removeLogo]);

    /**
     * Handles color palette changes
     * @validates Requirement 19.1
     */
    const handleColorsChange = useCallback((colors: string[]) => {
        setLocalColors(colors);
        setHasUnsavedChanges(true);
    }, []);

    /**
     * Handles font selection changes
     * @validates Requirement 20.1
     */
    const handleFontChange = useCallback((font: string) => {
        setLocalFont(font);
        setHasUnsavedChanges(true);
    }, []);

    /**
     * Handles logo position/size/opacity changes
     * @validates Requirement 21.1
     */
    const handleLogoSettingsChange = useCallback((settings: LogoSettings) => {
        setLocalLogoSettings(settings);
        setHasUnsavedChanges(true);
    }, []);

    /**
     * Saves all brand kit changes
     * @validates Requirements 18.1, 19.1, 20.1, 21.1
     */
    const handleSave = useCallback(async () => {
        try {
            const request = {
                primaryColor: localColors[0] || DEFAULT_COLORS.primaryColor,
                secondaryColor: localColors[1] || DEFAULT_COLORS.secondaryColor,
                accentColor: localColors[2] || DEFAULT_COLORS.accentColor,
                backgroundColor: localColors[3] || DEFAULT_COLORS.backgroundColor,
                textColor: localColors[4] || DEFAULT_COLORS.textColor,
                fontFamily: localFont,
            };

            if (brandKit) {
                // Update existing brand kit
                await updateBrandKit.mutateAsync({
                    workspaceId,
                    request,
                });
                toast.success("Brand kit saved successfully");
            } else {
                // Create new brand kit
                await createBrandKit.mutateAsync({
                    workspaceId,
                    request,
                });
                toast.success("Brand kit created successfully");
            }
            setHasUnsavedChanges(false);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to save brand kit";
            toast.error(errorMessage);
        }
    }, [
        brandKit,
        localColors,
        localFont,
        workspaceId,
        updateBrandKit,
        createBrandKit,
    ]);

    const isSaving = updateBrandKit.isPending || createBrandKit.isPending;

    // Loading state
    if (isLoading) {
        return (
            <div className={cn("flex flex-col gap-6", className)} data-slot="brand-kit-manager">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <Skeleton className="h-7 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-40 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-40 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-28" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-32 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-36" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-48 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className={cn("flex flex-col gap-6", className)} data-slot="brand-kit-manager">
                <Card className="border-destructive/50">
                    <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
                        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                            <IconRefresh className="size-8 text-destructive" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-medium text-lg">Failed to load brand kit</h3>
                            <p className="text-muted-foreground text-sm">
                                {error instanceof Error
                                    ? error.message
                                    : "An unexpected error occurred"}
                            </p>
                        </div>
                        <Button onClick={() => refetch()} variant="outline">
                            <IconRefresh className="mr-2 size-4" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div
            className={cn("flex flex-col gap-4 sm:gap-6", className)}
            data-slot="brand-kit-manager"
        >
            {/* Header with Save Button - Responsive layout */}
            {/* @validates Requirement 31.3 - Mobile-friendly experience */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="font-semibold text-lg sm:text-xl">Brand Kit</h2>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                        Customize your brand assets for video exports
                    </p>
                </div>
                <Button
                    disabled={!hasUnsavedChanges || isSaving}
                    onClick={handleSave}
                    className="w-full sm:w-auto"
                >
                    {isSaving ? (
                        <IconLoader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                        <IconDeviceFloppy className="mr-2 size-4" />
                    )}
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {/* Unsaved Changes Indicator */}
            {hasUnsavedChanges && (
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 sm:px-4 py-2">
                    <p className="text-amber-700 text-xs sm:text-sm dark:text-amber-400">
                        You have unsaved changes. Click &quot;Save Changes&quot; to apply them.
                    </p>
                </div>
            )}

            {/* Brand Kit Components Grid - Responsive for desktop/tablet/mobile */}
            {/* @validates Requirements 31.1, 31.2, 31.3 - Desktop, tablet, mobile layouts */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                {/* Left Column - Brand Kit Controls */}
                <div className="flex flex-col gap-4 sm:gap-6 lg:col-span-2">
                    {/* Controls grid - 1 column on mobile, 2 on tablet+ */}
                    <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                        {/* Logo Upload - Requirement 18.1 */}
                        <Card>
                            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                                <CardTitle className="text-sm sm:text-base">Logo</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4 pt-0">
                                <LogoUpload
                                    currentLogo={brandKit?.logoUrl ?? undefined}
                                    onUpload={handleLogoUpload}
                                    onRemove={handleLogoRemove}
                                    disabled={uploadLogo.isPending || removeLogo.isPending}
                                />
                            </CardContent>
                        </Card>

                        {/* Color Palette Builder - Requirement 19.1 */}
                        <Card>
                            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                                <CardTitle className="text-sm sm:text-base">Brand Colors</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4 pt-0">
                                <ColorPaletteBuilder
                                    colors={localColors}
                                    onChange={handleColorsChange}
                                    maxColors={5}
                                />
                            </CardContent>
                        </Card>

                        {/* Brand Font Selector - Requirement 20.1 */}
                        <Card>
                            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                                <CardTitle className="text-sm sm:text-base">Typography</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4 pt-0">
                                <BrandFontSelector
                                    value={localFont}
                                    onChange={handleFontChange}
                                    fonts={[...SUPPORTED_FONTS]}
                                />
                            </CardContent>
                        </Card>

                        {/* Logo Position Controls - Requirement 21.1 */}
                        <Card>
                            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                                <CardTitle className="text-sm sm:text-base">Logo Placement</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4 pt-0">
                                <LogoPositionControls
                                    position={localLogoSettings.position}
                                    size={localLogoSettings.size}
                                    opacity={localLogoSettings.opacity}
                                    onChange={handleLogoSettingsChange}
                                    disabled={!brandKit?.logoUrl}
                                />
                                {!brandKit?.logoUrl && (
                                    <p className="mt-3 text-center text-muted-foreground text-xs">
                                        Upload a logo to configure placement settings
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column - Brand Kit Preview */}
                {/* On mobile, this appears below the controls */}
                <Card className="lg:col-span-1 order-first lg:order-none">
                    <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                        <CardTitle className="text-sm sm:text-base">Preview</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            See how your brand kit will appear on videos
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <BrandKitPreview
                            brandKit={{
                                logoUrl: brandKit?.logoUrl ?? undefined,
                                primaryColor: localColors[0] || DEFAULT_COLORS.primaryColor,
                                secondaryColor: localColors[1] || DEFAULT_COLORS.secondaryColor,
                                accentColor: localColors[2] || DEFAULT_COLORS.accentColor,
                                backgroundColor: localColors[3] || DEFAULT_COLORS.backgroundColor,
                                textColor: localColors[4] || DEFAULT_COLORS.textColor,
                                fontFamily: localFont,
                            }}
                            logoSettings={localLogoSettings}
                            videoUrl={videoUrl}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default BrandKitManager;
