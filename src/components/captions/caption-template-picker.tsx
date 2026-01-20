"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { IconCheck, IconPalette } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CaptionTemplate, CaptionStyle } from "@/lib/api/captions";

/**
 * CaptionTemplatePickerProps interface
 *
 * @validates Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */
export interface CaptionTemplatePickerProps {
    /** Available caption templates */
    templates: CaptionTemplate[];
    /** Currently selected template ID */
    selectedId?: string;
    /** Callback when a template is selected */
    onSelect: (templateId: string) => void;
    /** Additional className */
    className?: string;
    /** Whether the picker is in a loading state */
    isLoading?: boolean;
    /** Whether the picker is disabled */
    disabled?: boolean;
}

/**
 * Get a preview style object for displaying template preview
 */
function getPreviewStyle(style: CaptionStyle): React.CSSProperties {
    return {
        fontFamily: style.fontFamily,
        fontSize: `${Math.min(style.fontSize, 16)}px`, // Cap preview font size
        color: style.textColor,
        backgroundColor: style.backgroundColor
            ? `${style.backgroundColor}${Math.round(style.backgroundOpacity * 2.55)
                .toString(16)
                .padStart(2, "0")}`
            : "transparent",
        textAlign: style.alignment,
        textShadow: style.shadow ? "1px 1px 2px rgba(0,0,0,0.5)" : "none",
        WebkitTextStroke: style.outline
            ? `1px ${style.outlineColor || "#000000"}`
            : "none",
    };
}

/**
 * Get animation badge label
 */
function getAnimationLabel(animation: CaptionStyle["animation"]): string {
    switch (animation) {
        case "word-by-word":
            return "Word by Word";
        case "karaoke":
            return "Karaoke";
        case "bounce":
            return "Bounce";
        case "fade":
            return "Fade";
        default:
            return "None";
    }
}

/**
 * CaptionTemplateCard Component
 *
 * Individual template card with preview and selection state
 */
interface CaptionTemplateCardProps {
    template: CaptionTemplate;
    isSelected: boolean;
    onSelect: () => void;
    disabled?: boolean;
}

function CaptionTemplateCard({
    template,
    isSelected,
    onSelect,
    disabled,
}: CaptionTemplateCardProps) {
    const previewStyle = getPreviewStyle(template.style);

    return (
        <Card
            className={cn(
                "relative cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary/50",
                isSelected && "ring-2 ring-primary",
                disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => !disabled && onSelect()}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-pressed={isSelected}
            aria-label={`Select ${template.name} template`}
            onKeyDown={(e) => {
                if (!disabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelect();
                }
            }}
        >
            {/* Selection indicator */}
            {isSelected && (
                <div className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <IconCheck className="size-4" />
                </div>
            )}

            {/* Preview image or styled preview */}
            <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                {template.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={template.previewUrl}
                        alt={`${template.name} template preview`}
                        className="size-full object-cover"
                    />
                ) : (
                    // Fallback styled preview
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4">
                        <div
                            className="max-w-full truncate rounded px-2 py-1 text-center"
                            style={previewStyle}
                        >
                            Sample Caption
                        </div>
                    </div>
                )}
            </div>

            <CardContent className="p-3">
                {/* Template name */}
                <h3 className="mb-2 font-medium text-sm">{template.name}</h3>

                {/* Style badges */}
                <div className="flex flex-wrap gap-1">
                    {/* Animation badge */}
                    {template.style.animation !== "none" && (
                        <Badge variant="secondary" className="text-xs">
                            {getAnimationLabel(template.style.animation)}
                        </Badge>
                    )}

                    {/* Highlight badge */}
                    {template.style.highlightEnabled && (
                        <Badge variant="secondary" className="text-xs">
                            Highlight
                        </Badge>
                    )}

                    {/* Position badge */}
                    <Badge variant="outline" className="text-xs capitalize">
                        {template.style.position}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Loading skeleton for template cards
 */
function TemplateCardSkeleton() {
    return (
        <Card>
            <Skeleton className="aspect-video w-full rounded-t-lg" />
            <CardContent className="p-3">
                <Skeleton className="mb-2 h-4 w-24" />
                <div className="flex gap-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * CaptionTemplatePicker Component
 *
 * Displays caption style templates in a grid layout with:
 * - Visual preview for each template
 * - Highlighted selection state
 * - One-click template application
 * - Loading and empty states
 *
 * @example
 * ```tsx
 * const { data: templates, isLoading } = useCaptionTemplates();
 * const [selectedId, setSelectedId] = useState<string>();
 *
 * <CaptionTemplatePicker
 *   templates={templates ?? []}
 *   selectedId={selectedId}
 *   onSelect={(id) => {
 *     setSelectedId(id);
 *     // Apply template style
 *   }}
 *   isLoading={isLoading}
 * />
 * ```
 *
 * @validates Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */
export function CaptionTemplatePicker({
    templates,
    selectedId,
    onSelect,
    className,
    isLoading = false,
    disabled = false,
}: CaptionTemplatePickerProps) {
    // Loading state
    if (isLoading) {
        return (
            <div
                className={cn("flex flex-col gap-4", className)}
                role="region"
                aria-label="Caption templates"
                aria-busy="true"
            >
                <div className="flex items-center gap-2">
                    <IconPalette className="size-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Caption Templates</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TemplateCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (templates.length === 0) {
        return (
            <div
                className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center",
                    className
                )}
                role="region"
                aria-label="Caption templates"
            >
                <IconPalette className="size-8 text-muted-foreground" />
                <p className="font-medium text-sm">No templates available</p>
                <p className="text-muted-foreground text-xs">
                    Caption templates will appear here once configured.
                </p>
            </div>
        );
    }

    return (
        <div
            className={cn("flex flex-col gap-4", className)}
            role="region"
            aria-label="Caption templates"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <IconPalette className="size-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Caption Templates</span>
                </div>
                <span className="text-muted-foreground text-xs">
                    {templates.length} template{templates.length !== 1 ? "s" : ""}{" "}
                    available
                </span>
            </div>

            {/* Template grid - Requirement 12.1: Display at least 5 caption style templates */}
            <div
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                role="listbox"
                aria-label="Select a caption template"
            >
                {templates.map((template) => (
                    <CaptionTemplateCard
                        key={template.id}
                        template={template}
                        isSelected={selectedId === template.id}
                        onSelect={() => onSelect(template.id)}
                        disabled={disabled}
                    />
                ))}
            </div>

            {/* Selected template info */}
            {selectedId && (
                <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-muted-foreground text-xs">
                        <span className="font-medium text-foreground">Selected:</span>{" "}
                        {templates.find((t) => t.id === selectedId)?.name ?? "Unknown"}
                    </p>
                </div>
            )}
        </div>
    );
}

export default CaptionTemplatePicker;
