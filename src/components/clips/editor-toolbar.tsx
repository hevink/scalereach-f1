"use client";

import { type ReactNode } from "react";
import {
    IconTextCaption,
    IconSparkles,
    IconX,
    IconInfoCircle,
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

export type ToolbarPanel = "captions" | "ai-hook" | "clip-info" | null;

export interface EditorToolbarProps {
    activePanel: ToolbarPanel;
    onPanelChange: (panel: ToolbarPanel) => void;
    captionsPanel?: ReactNode;
    aiHookPanel?: ReactNode;
    clipInfoPanel?: ReactNode;
    className?: string;
}

interface ToolbarItem {
    id: ToolbarPanel;
    icon: typeof IconTextCaption;
    label: string;
    disabled?: boolean;
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
    { id: "captions", icon: IconTextCaption, label: "Captions" },
    { id: "ai-hook", icon: IconSparkles, label: "AI Hook" },
    { id: "clip-info", icon: IconInfoCircle, label: "Clip Info" },
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

export function EditorToolbar({
    activePanel,
    onPanelChange,
    captionsPanel,
    aiHookPanel,
    clipInfoPanel,
    className,
}: EditorToolbarProps) {
    const handleItemClick = (itemId: ToolbarPanel) => {
        onPanelChange(activePanel === itemId ? null : itemId);
    };

    const getPanelTitle = (panel: ToolbarPanel): string => {
        const item = TOOLBAR_ITEMS.find((i) => i.id === panel);
        return item?.label || "";
    };

    const getPanelContent = (panel: ToolbarPanel): ReactNode => {
        if (panel === "captions") return captionsPanel;
        if (panel === "ai-hook") return aiHookPanel;
        if (panel === "clip-info") return clipInfoPanel;
        return null;
    };

    return (
        <div className={cn("flex h-full", className)}>
            {activePanel && (
                <div className="w-[280px] h-full border-l border-zinc-800 bg-zinc-900 flex flex-col animate-in slide-in-from-right-2">
                    <PanelHeader
                        title={getPanelTitle(activePanel)}
                        onClose={() => onPanelChange(null)}
                    />
                    <div className="flex-1 overflow-auto p-4">
                        {getPanelContent(activePanel)}
                    </div>
                </div>
            )}

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
