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

    // Separate new templates for highlighting
    const newTemplates = templates.filter((t) => t.isNew);
    const regularTemplates = templates.filter((t) => !t.isNew);

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
            {/* Preview */}
            <div
                className="relative aspect-9/16 w-full"
                style={{ backgroundColor: template.style.backgroundColor || "#000" }}
            >
                {/* Sample text preview */}
                <div
                    className={cn(
                        "absolute inset-x-2 flex items-center justify-center",
                        template.style.position === "top" && "top-4",
                        template.style.position === "center" && "top-1/2 -translate-y-1/2",
                        template.style.position === "bottom" && "bottom-4"
                    )}
                >
                    <span
                        className="truncate px-2 py-1 text-center font-bold"
                        style={{
                            fontFamily: template.style.fontFamily,
                            fontSize: "10px",
                            color: template.style.textColor,
                            textShadow: template.style.shadow ? "1px 1px 2px rgba(0,0,0,0.8)" : undefined,
                            WebkitTextStroke: template.style.outline
                                ? `0.5px ${template.style.outlineColor || "#000"}`
                                : undefined,
                        }}
                    >
                        Sample Text
                    </span>
                </div>

                {/* New badge */}
                {template.isNew && (
                    <Badge className="absolute top-1 right-1 text-[10px]" variant="default">
                        New
                    </Badge>
                )}
            </div>

            {/* Name */}
            <div className="border-t bg-background p-2">
                <p className="truncate text-center font-medium text-xs">{template.name}</p>
            </div>

            {/* Selection indicator */}
            {isSelected && (
                <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
            )}
        </button>
    );
}
