"use client";

import { useState, type ReactNode } from "react";
import {
    IconTextCaption,
    IconUpload,
    IconPalette,
    IconMovie,
    IconTransitionRight,
    IconMusic,
    IconSparkles,
    IconX,
    IconSubtask,
    IconLanguage,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// Types
// ============================================================================

export type ToolbarPanel = "ai-enhance" | "captions" | "upload" | "brand" | "broll" | "transitions" | "music" | "ai" | "translate" | null;

export interface EditorToolbarProps {
    /** Currently active panel */
    activePanel: ToolbarPanel;
    /** Callback when a panel is selected */
    onPanelChange: (panel: ToolbarPanel) => void;
    /** Content to show in the captions panel */
    captionsPanel?: ReactNode;
    /** Content to show in the translate panel */
    translatePanel?: ReactNode;
    /** Additional class names */
    className?: string;
}

interface ToolbarItem {
    id: ToolbarPanel;
    icon: typeof IconTextCaption;
    label: string;
    disabled?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const TOOLBAR_ITEMS: ToolbarItem[] = [
    { id: "ai-enhance" as ToolbarPanel, icon: IconSparkles, label: "AI enhance", disabled: true },
    { id: "captions", icon: IconTextCaption, label: "Captions" },
    { id: "translate", icon: IconLanguage, label: "Translate" },
    { id: "upload", icon: IconUpload, label: "Upload", disabled: true },
    { id: "brand", icon: IconPalette, label: "Brand template", disabled: true },
    { id: "broll", icon: IconMovie, label: "B-Roll", disabled: true },
    { id: "transitions", icon: IconTransitionRight, label: "Transitions", disabled: true },
    { id: "music", icon: IconMusic, label: "Music", disabled: true },
    { id: "ai", icon: IconSubtask, label: "AI hook", disabled: true },
];

// ============================================================================
// ToolbarButton Component
// ============================================================================

interface ToolbarButtonProps {
    item: ToolbarItem;
    isActive: boolean;
    onClick: () => void;
}

function ToolbarButton({ item, isActive, onClick }: ToolbarButtonProps) {
    const Icon = item.icon;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={onClick}
                    disabled={item.disabled}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 w-12 py-2 rounded-lg transition-all",
                        "hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        isActive && "bg-zinc-800 text-white",
                        !isActive && "text-zinc-500",
                        item.disabled && "opacity-40 cursor-not-allowed"
                    )}
                >
                    <Icon className="size-5" />
                    <span className="text-[9px] leading-tight">{item.label.split(' ')[0]}</span>
                </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-zinc-800 border-zinc-700 text-white">
                <p>{item.label}</p>
                {item.disabled && <p className="text-xs text-zinc-400">Coming soon</p>}
            </TooltipContent>
        </Tooltip>
    );
}

// ============================================================================
// Panel Header Component
// ============================================================================

interface PanelHeaderProps {
    title: string;
    onClose: () => void;
}

function PanelHeader({ title, onClose }: PanelHeaderProps) {
    return (
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <h3 className="font-semibold text-sm text-white">{title}</h3>
            <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
                <IconX className="size-4" />
            </Button>
        </div>
    );
}

// ============================================================================
// EditorToolbar Component
// ============================================================================

/**
 * EditorToolbar - Vertical toolbar with expandable panels
 * 
 * Shows a vertical strip of tool icons on the right side.
 * Clicking an icon opens a panel with that tool's options.
 */
export function EditorToolbar({
    activePanel,
    onPanelChange,
    captionsPanel,
    translatePanel,
    className,
}: EditorToolbarProps) {
    const handleItemClick = (itemId: ToolbarPanel) => {
        if (activePanel === itemId) {
            onPanelChange(null);
        } else {
            onPanelChange(itemId);
        }
    };

    const getPanelTitle = (panel: ToolbarPanel): string => {
        const item = TOOLBAR_ITEMS.find((i) => i.id === panel);
        return item?.label || "";
    };

    return (
        <div className={cn("flex h-full", className)}>
            {/* Expandable Panel */}
            {activePanel && (
                <div className="w-[280px] h-full border-l border-zinc-800 bg-zinc-900 flex flex-col animate-in slide-in-from-right-2">
                    <PanelHeader
                        title={getPanelTitle(activePanel)}
                        onClose={() => onPanelChange(null)}
                    />
                    <div className="flex-1 overflow-auto p-4">
                        {activePanel === "captions" && captionsPanel}
                        {activePanel === "translate" && translatePanel}
                        {activePanel !== "captions" && activePanel !== "translate" && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500">
                                <p className="text-sm">Coming soon</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toolbar Strip */}
            <div className="w-14 h-full border-l border-zinc-800 bg-zinc-900 flex flex-col items-center py-3 gap-2">
                {TOOLBAR_ITEMS.map((item) => (
                    <ToolbarButton
                        key={item.id}
                        item={item}
                        isActive={activePanel === item.id}
                        onClick={() => handleItemClick(item.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default EditorToolbar;
