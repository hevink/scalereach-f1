"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CaptionTemplate } from "@/lib/api/video-config";

interface CaptionTemplateGridProps {
    templates: CaptionTemplate[];
    selectedId: string;
    onSelect: (templateId: string) => void;
    disabled?: boolean;
}

export function CaptionTemplateGrid({
    templates,
    selectedId,
    onSelect,
    disabled = false,
}: CaptionTemplateGridProps) {
    const [activeTab, setActiveTab] = useState("presets");

    return (
        <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="presets">Quick Presets</TabsTrigger>
                    <TabsTrigger value="my-templates">My Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="presets" className="mt-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {templates.map((template) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                isSelected={selectedId === template.id}
                                onSelect={() => onSelect(template.id)}
                                disabled={disabled}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="my-templates" className="mt-4">
                    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
                        <p className="text-muted-foreground text-sm">
                            No custom templates yet. Create one in the clip editor.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

interface TemplateCardProps {
    template: CaptionTemplate;
    isSelected: boolean;
    onSelect: () => void;
    disabled?: boolean;
}

function TemplateCard({ template, isSelected, onSelect, disabled }: TemplateCardProps) {
    const style = template.style;

    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={disabled}
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-lg border-2 transition-all",
                isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50",
                disabled && "cursor-not-allowed opacity-50"
            )}
        >
            {/* Preview - Square box */}
            <div className="relative aspect-square w-full bg-zinc-900 overflow-hidden">
                {/* Simulated video background */}
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-900" />

                {/* Caption preview */}
                <div
                    className={cn(
                        "absolute inset-x-2 flex items-center justify-center px-1",
                        style.position === "top" && "top-3",
                        style.position === "center" && "top-1/2 -translate-y-1/2",
                        style.position === "bottom" && "bottom-3"
                    )}
                >
                    <div
                        className="rounded px-2 py-1"
                        style={{
                            backgroundColor: style.backgroundColor
                                ? `${style.backgroundColor}${Math.round((style.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')}`
                                : 'transparent',
                        }}
                    >
                        <span
                            className="block text-center font-bold leading-tight"
                            style={{
                                fontFamily: style.fontFamily,
                                fontSize: "14px",
                                color: style.textColor,
                                textShadow: style.shadow ? "1px 1px 2px rgba(0,0,0,0.9)" : undefined,
                                WebkitTextStroke: style.outline
                                    ? `0.5px ${style.outlineColor || "#000"}`
                                    : undefined,
                            }}
                        >
                            Sample
                        </span>
                        <span
                            className="block text-center font-bold leading-tight"
                            style={{
                                fontFamily: style.fontFamily,
                                fontSize: "14px",
                                color: style.highlightEnabled ? style.highlightColor : style.textColor,
                                textShadow: style.shadow ? "1px 1px 2px rgba(0,0,0,0.9)" : undefined,
                                WebkitTextStroke: style.outline
                                    ? `0.5px ${style.outlineColor || "#000"}`
                                    : undefined,
                            }}
                        >
                            Text
                        </span>
                    </div>
                </div>

                {/* New badge */}
                {template.isNew && (
                    <Badge className="absolute top-1 right-1 text-[8px] px-1 py-0" variant="default">
                        New
                    </Badge>
                )}

                {/* Selection checkmark */}
                {isSelected && (
                    <div className="absolute top-1 left-1 size-4 rounded-full bg-primary flex items-center justify-center">
                        <svg className="size-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Name */}
            <div className="border-t bg-background p-1.5">
                <p className="truncate text-center font-medium text-[10px]">{template.name}</p>
            </div>
        </button>
    );
}
