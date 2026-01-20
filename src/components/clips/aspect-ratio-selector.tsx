"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    IconDeviceMobile,
    IconSquare,
    IconDeviceDesktop,
    IconBrandTiktok,
    IconBrandInstagram,
    IconBrandYoutube,
    IconCheck,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// Types
// ============================================================================

/**
 * AspectRatio type representing supported aspect ratios
 * 
 * @validates Requirements 11.1
 */
export type AspectRatio = "9:16" | "1:1" | "16:9";

/**
 * AspectRatioOption configuration
 */
export interface AspectRatioOption {
    value: AspectRatio;
    label: string;
    platforms: string[];
    dimensions: { width: number; height: number };
}

/**
 * AspectRatioSelectorProps interface
 * 
 * @validates Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */
export interface AspectRatioSelectorProps {
    /** Currently selected aspect ratio */
    value: AspectRatio;
    /** Callback when aspect ratio changes */
    onChange: (ratio: AspectRatio) => void;
    /** Optional preview URL for showing crop area */
    previewUrl?: string;
    /** Additional className */
    className?: string;
    /** Whether the selector is disabled */
    disabled?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Available aspect ratio options with platform labels
 * 
 * @validates Requirements 11.1, 11.4
 */
export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
    {
        value: "9:16",
        label: "Vertical",
        platforms: ["TikTok", "Reels", "Shorts"],
        dimensions: { width: 1080, height: 1920 },
    },
    {
        value: "1:1",
        label: "Square",
        platforms: ["Instagram"],
        dimensions: { width: 1080, height: 1080 },
    },
    {
        value: "16:9",
        label: "Horizontal",
        platforms: ["YouTube"],
        dimensions: { width: 1920, height: 1080 },
    },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the icon component for an aspect ratio
 */
function getAspectRatioIcon(ratio: AspectRatio): React.ReactNode {
    switch (ratio) {
        case "9:16":
            return <IconDeviceMobile className="size-5" />;
        case "1:1":
            return <IconSquare className="size-5" />;
        case "16:9":
            return <IconDeviceDesktop className="size-5" />;
    }
}

/**
 * Get platform icon for a platform name
 */
function getPlatformIcon(platform: string): React.ReactNode {
    switch (platform.toLowerCase()) {
        case "tiktok":
            return <IconBrandTiktok className="size-3" />;
        case "instagram":
        case "reels":
            return <IconBrandInstagram className="size-3" />;
        case "youtube":
        case "shorts":
            return <IconBrandYoutube className="size-3" />;
        default:
            return null;
    }
}

/**
 * Calculate preview dimensions maintaining aspect ratio within container
 */
function calculatePreviewDimensions(
    ratio: AspectRatio,
    containerWidth: number,
    containerHeight: number
): { width: number; height: number } {
    const option = ASPECT_RATIO_OPTIONS.find((o) => o.value === ratio);
    if (!option) return { width: containerWidth, height: containerHeight };

    const aspectRatio = option.dimensions.width / option.dimensions.height;

    // Calculate dimensions that fit within container
    let width = containerWidth;
    let height = width / aspectRatio;

    if (height > containerHeight) {
        height = containerHeight;
        width = height * aspectRatio;
    }

    return { width, height };
}

// ============================================================================
// AspectRatioPreview Component
// ============================================================================

interface AspectRatioPreviewProps {
    ratio: AspectRatio;
    previewUrl?: string;
    className?: string;
}

/**
 * AspectRatioPreview - Shows a visual preview of the crop area
 * 
 * @validates Requirements 11.2
 */
function AspectRatioPreview({ ratio, previewUrl, className }: AspectRatioPreviewProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

    // Calculate preview dimensions on mount and resize
    React.useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const newDimensions = calculatePreviewDimensions(
                    ratio,
                    rect.width,
                    rect.height
                );
                setDimensions(newDimensions);
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, [ratio]);

    const option = ASPECT_RATIO_OPTIONS.find((o) => o.value === ratio);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative flex items-center justify-center overflow-hidden rounded-lg border bg-muted/30",
                className
            )}
        >
            {/* Crop area preview */}
            <div
                className="relative overflow-hidden rounded border-2 border-primary/50 bg-background shadow-sm transition-all duration-200"
                style={{
                    width: dimensions.width || "auto",
                    height: dimensions.height || "auto",
                    minWidth: 40,
                    minHeight: 40,
                }}
            >
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="text-center">
                            {getAspectRatioIcon(ratio)}
                            <p className="mt-1 font-mono text-muted-foreground text-xs">
                                {ratio}
                            </p>
                        </div>
                    </div>
                )}

                {/* Corner indicators */}
                <div className="absolute top-0 left-0 h-2 w-2 border-t-2 border-l-2 border-primary" />
                <div className="absolute top-0 right-0 h-2 w-2 border-t-2 border-r-2 border-primary" />
                <div className="absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-primary" />
                <div className="absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-primary" />
            </div>

            {/* Dimensions label */}
            {option && (
                <div className="absolute right-2 bottom-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                        {option.dimensions.width}×{option.dimensions.height}
                    </Badge>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// AspectRatioOption Component
// ============================================================================

interface AspectRatioOptionCardProps {
    option: AspectRatioOption;
    isSelected: boolean;
    onSelect: () => void;
    disabled?: boolean;
}

/**
 * AspectRatioOptionCard - Individual aspect ratio option card
 * 
 * @validates Requirements 11.1, 11.4
 */
function AspectRatioOptionCard({
    option,
    isSelected,
    onSelect,
    disabled,
}: AspectRatioOptionCardProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={onSelect}
                        disabled={disabled}
                        className={cn(
                            "relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all",
                            "hover:border-primary/50 hover:bg-muted/50",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card",
                            disabled && "cursor-not-allowed opacity-50"
                        )}
                        aria-pressed={isSelected}
                        aria-label={`${option.label} (${option.value}) - ${option.platforms.join(", ")}`}
                    >
                        {/* Selected indicator */}
                        {isSelected && (
                            <div className="absolute top-1.5 right-1.5">
                                <div className="flex size-4 items-center justify-center rounded-full bg-primary">
                                    <IconCheck className="size-3 text-primary-foreground" />
                                </div>
                            </div>
                        )}

                        {/* Aspect ratio icon */}
                        <div
                            className={cn(
                                "flex items-center justify-center rounded-md p-2 transition-colors",
                                isSelected
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            {getAspectRatioIcon(option.value)}
                        </div>

                        {/* Label and ratio */}
                        <div className="text-center">
                            <p
                                className={cn(
                                    "font-medium text-sm",
                                    isSelected ? "text-primary" : "text-foreground"
                                )}
                            >
                                {option.label}
                            </p>
                            <p className="font-mono text-muted-foreground text-xs">
                                {option.value}
                            </p>
                        </div>

                        {/* Platform badges */}
                        <div className="flex flex-wrap justify-center gap-1">
                            {option.platforms.map((platform) => (
                                <Badge
                                    key={platform}
                                    variant={isSelected ? "default" : "secondary"}
                                    className="flex items-center gap-1 px-1.5 py-0 text-xs"
                                >
                                    {getPlatformIcon(platform)}
                                    <span className="text-[10px]">{platform}</span>
                                </Badge>
                            ))}
                        </div>
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <p>
                        {option.dimensions.width}×{option.dimensions.height}px
                    </p>
                    <p className="text-muted-foreground text-xs">
                        Best for: {option.platforms.join(", ")}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// ============================================================================
// AspectRatioSelector Component
// ============================================================================

/**
 * AspectRatioSelector Component
 * 
 * A selector for choosing video aspect ratios with platform labels and preview.
 * 
 * Features:
 * - Display 9:16, 1:1, 16:9 options with icons (Requirement 11.1)
 * - Visual preview of crop area (Requirement 11.2)
 * - Immediate preview update on selection (Requirement 11.3)
 * - Platform labels for each ratio (Requirement 11.4)
 * - Persists selection (handled by parent via onChange) (Requirement 11.5)
 * 
 * @example
 * ```tsx
 * const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
 * 
 * <AspectRatioSelector
 *   value={aspectRatio}
 *   onChange={setAspectRatio}
 *   previewUrl="/thumbnails/video-123.jpg"
 * />
 * ```
 * 
 * @validates Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */
export function AspectRatioSelector({
    value,
    onChange,
    previewUrl,
    className,
    disabled,
}: AspectRatioSelectorProps) {
    // Handle aspect ratio selection
    const handleSelect = React.useCallback(
        (ratio: AspectRatio) => {
            if (!disabled && ratio !== value) {
                onChange(ratio);
            }
        },
        [disabled, value, onChange]
    );

    return (
        <div
            className={cn("flex flex-col gap-4", className)}
            data-slot="aspect-ratio-selector"
            role="radiogroup"
            aria-label="Aspect ratio selector"
        >
            {/* Aspect ratio options */}
            <div className="grid grid-cols-3 gap-3">
                {ASPECT_RATIO_OPTIONS.map((option) => (
                    <AspectRatioOptionCard
                        key={option.value}
                        option={option}
                        isSelected={value === option.value}
                        onSelect={() => handleSelect(option.value)}
                        disabled={disabled}
                    />
                ))}
            </div>

            {/* Preview area */}
            <AspectRatioPreview
                ratio={value}
                previewUrl={previewUrl}
                className="h-40"
            />
        </div>
    );
}

export default AspectRatioSelector;
