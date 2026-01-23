"use client";

import { IconLoader2, IconPlayerPlay, IconBookmark } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ClippingModeSelector } from "./clipping-mode-selector";
import { ClipSettingsPanel } from "./clip-settings-panel";
import { TimeframeSelector } from "./timeframe-selector";
import { CaptionTemplateGrid } from "./caption-template-grid";
import { AspectRatioSelector } from "./aspect-ratio-selector";
import type { VideoConfigInput, CaptionTemplate } from "@/lib/api/video-config";

interface VideoConfigFormProps {
    config: VideoConfigInput;
    onChange: (updates: Partial<VideoConfigInput>) => void;
    templates: CaptionTemplate[];
    videoDuration: number;
    isLoading?: boolean;
    isSaving?: boolean;
    onSubmit: () => void;
    onSaveAsDefault: () => void;
}

export function VideoConfigForm({
    config,
    onChange,
    templates,
    videoDuration,
    isLoading = false,
    isSaving = false,
    onSubmit,
    onSaveAsDefault,
}: VideoConfigFormProps) {
    const isDisabled = isLoading || isSaving;

    return (
        <div className="space-y-6">
            {/* Clipping Mode */}
            <Card>
                <CardHeader>
                    <CardTitle>Clipping Mode</CardTitle>
                    <CardDescription>
                        Choose whether to use AI to find viral moments or process the full video
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ClippingModeSelector
                        skipClipping={config.skipClipping ?? false}
                        onChange={(skip) => onChange({ skipClipping: skip })}
                        disabled={isDisabled}
                    />
                </CardContent>
            </Card>

            {/* AI Clipping Settings (only shown when AI clipping is enabled) */}
            {!config.skipClipping && (
                <Card>
                    <CardHeader>
                        <CardTitle>AI Clipping Settings</CardTitle>
                        <CardDescription>
                            Configure how the AI finds and generates clips
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ClipSettingsPanel
                            config={config}
                            onChange={onChange}
                            disabled={isDisabled}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Processing Timeframe */}
            <Card>
                <CardHeader>
                    <CardTitle>Processing Timeframe</CardTitle>
                    <CardDescription>
                        Select which portion of the video to process
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TimeframeSelector
                        videoDuration={videoDuration}
                        start={config.timeframeStart ?? 0}
                        end={config.timeframeEnd ?? null}
                        onChange={(start, end) => onChange({ timeframeStart: start, timeframeEnd: end })}
                        disabled={isDisabled}
                    />
                </CardContent>
            </Card>

            {/* Caption Template */}
            <Card>
                <CardHeader>
                    <CardTitle>Caption Template</CardTitle>
                    <CardDescription>
                        Choose a style for your captions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CaptionTemplateGrid
                        templates={templates}
                        selectedId={config.captionTemplateId ?? "karaoke"}
                        onSelect={(id) => onChange({ captionTemplateId: id })}
                        disabled={isDisabled}
                    />
                </CardContent>
            </Card>

            {/* Output Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Output Settings</CardTitle>
                    <CardDescription>
                        Configure the output format
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <AspectRatioSelector
                        value={config.aspectRatio ?? "9:16"}
                        onChange={(ratio) => onChange({ aspectRatio: ratio })}
                        disabled={isDisabled}
                    />

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Watermark</Label>
                            <p className="text-muted-foreground text-xs">
                                Add a watermark to exported clips
                            </p>
                        </div>
                        <Switch
                            checked={config.enableWatermark ?? true}
                            onCheckedChange={(checked) => onChange({ enableWatermark: checked })}
                            disabled={isDisabled}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button
                    variant="outline"
                    onClick={onSaveAsDefault}
                    disabled={isDisabled}
                    className="gap-2"
                >
                    <IconBookmark className="size-4" />
                    Save settings as default
                </Button>

                <Button
                    onClick={onSubmit}
                    disabled={isDisabled}
                    size="lg"
                    className="gap-2"
                >
                    {isSaving ? (
                        <>
                            <IconLoader2 className="size-4 animate-spin" />
                            Starting...
                        </>
                    ) : (
                        <>
                            <IconPlayerPlay className="size-4" />
                            Start Processing
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
