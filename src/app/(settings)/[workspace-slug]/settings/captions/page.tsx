"use client";

import { use, useCallback, useState } from "react";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconRefresh, IconTypography, IconDeviceFloppy } from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    CaptionStylePanel,
    CaptionStylePresets,
    DEFAULT_PRESETS,
    getPresetById,
    type CaptionStylePreset,
} from "@/components/captions";
import type { CaptionStyle } from "@/lib/api/captions";
import { toast } from "sonner";

interface CaptionsSettingsPageProps {
    params: Promise<{ "workspace-slug": string }>;
}

/**
 * Default caption style configuration
 */
const DEFAULT_CAPTION_STYLE: CaptionStyle = {
    fontFamily: "Inter",
    fontSize: 36,
    textColor: "#FFFFFF",
    backgroundColor: "#000000",
    backgroundOpacity: 50,
    position: "bottom",
    alignment: "center",
    animation: "fade",
    highlightColor: "#FFFF00",
    highlightEnabled: false,
    shadow: true,
    outline: false,
};

/**
 * Captions Settings Page
 *
 * Route: /{workspace-slug}/settings/captions
 *
 * This page allows users to configure default caption styles for their workspace.
 * Settings include:
 * - Caption style presets selection
 * - Font family, size, and colors
 * - Position and alignment
 * - Effects (shadow, outline)
 */
export default function CaptionsSettingsPage({
    params,
}: CaptionsSettingsPageProps) {
    const { "workspace-slug": slug } = use(params);
    const {
        data: workspace,
        isLoading: workspaceLoading,
        isError: workspaceError,
        error,
        refetch,
    } = useWorkspaceBySlug(slug);

    const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);
    const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>();
    const [isSaving, setIsSaving] = useState(false);

    const handleStyleChange = useCallback((newStyle: CaptionStyle) => {
        setCaptionStyle(newStyle);
        // Clear preset selection when manually changing style
        setSelectedPresetId(undefined);
    }, []);

    const handlePresetSelect = useCallback((presetId: string, style: CaptionStyle) => {
        setSelectedPresetId(presetId);
        setCaptionStyle(style);
    }, []);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            // TODO: Implement API call to save caption settings
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success("Caption settings saved successfully");
        } catch (err) {
            toast.error("Failed to save caption settings");
        } finally {
            setIsSaving(false);
        }
    }, [captionStyle]);

    // Loading state
    if (workspaceLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-72" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Error state
    if (workspaceError || !workspace) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="font-medium text-2xl">Captions</h1>
                    <p className="text-muted-foreground text-sm">
                        Configure default caption styles for your videos
                    </p>
                </div>
                <Card className="border-destructive/50">
                    <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
                        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                            <IconTypography className="size-8 text-destructive" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-medium text-lg">Failed to load workspace</h3>
                            <p className="text-muted-foreground text-sm">
                                {error instanceof Error
                                    ? error.message
                                    : "Unable to load workspace data. Please try again."}
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="font-medium text-2xl">Captions</h1>
                <p className="text-muted-foreground text-sm">
                    Configure default caption styles for your videos
                </p>
            </div>

            {/* Caption Style Presets Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Style Presets</CardTitle>
                    <CardDescription>
                        Choose from pre-designed caption styles or customize your own
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CaptionStylePresets
                        presets={DEFAULT_PRESETS}
                        selectedPresetId={selectedPresetId}
                        onSelect={(presetId) => {
                            const preset = getPresetById(presetId);
                            if (preset) {
                                handlePresetSelect(presetId, preset.style);
                            }
                        }}
                    />
                </CardContent>
            </Card>

            {/* Caption Style Customization Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Custom Style</CardTitle>
                    <CardDescription>
                        Fine-tune your caption appearance with custom settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CaptionStylePanel
                        style={captionStyle}
                        onChange={handleStyleChange}
                        showPresets={false}
                    />
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    <IconDeviceFloppy className="mr-2 size-4" />
                    {isSaving ? "Saving..." : "Save Settings"}
                </Button>
            </div>
        </div>
    );
}
