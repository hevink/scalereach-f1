"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { EditorToolbar, MobileToolbar, type ToolbarPanel } from "./editor-toolbar";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

// ============================================================================
// Constants
// ============================================================================

const DESKTOP_BREAKPOINT = 1024;

const DEFAULT_PANEL_SIZES = {
    captionEditor: 25,
    videoPlayer: 75,
};

const MIN_PANEL_SIZES = {
    captionEditor: 15,
    videoPlayer: 40,
};

// ============================================================================
// Types
// ============================================================================

export interface EditingLayoutProps {
    children: {
        /** Caption editor component for the left panel */
        captionEditor: ReactNode;
        /** Video player component for the center panel */
        videoPlayer: ReactNode;
        /** Caption style panel component (shown in toolbar panel) */
        stylePanel: ReactNode;
        /** AI Hook panel component (shown in toolbar panel) */
        aiHookPanel?: ReactNode;
        /** Clip Info panel component (shown in toolbar panel) */
        clipInfoPanel?: ReactNode;
        /** Text Overlay panel component (shown in toolbar panel) */
        textOverlayPanel?: ReactNode;
        /** Background style panel component (shown in toolbar panel) */
        backgroundPanel?: ReactNode;
        /** Timeline editor component for the bottom row */
        timeline: ReactNode;
    };
    layout?: "desktop" | "mobile";
    className?: string;
    header?: ReactNode;
    onPanelResize?: (sizes: { captionEditor: number; videoPlayer: number }) => void;
    /** Controlled toolbar panel (optional - if omitted, uses internal state) */
    activeToolbarPanel?: ToolbarPanel;
    /** Callback when toolbar panel changes */
    onToolbarPanelChange?: (panel: ToolbarPanel) => void;
}

// ============================================================================
// Hook: useIsDesktop
// ============================================================================

function useIsDesktop(): boolean | undefined {
    const [isDesktop, setIsDesktop] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);

        const onChange = () => {
            setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
        };

        setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
        mql.addEventListener("change", onChange);

        return () => mql.removeEventListener("change", onChange);
    }, []);

    return isDesktop;
}

// ============================================================================
// Desktop Layout Component
// ============================================================================

interface DesktopLayoutProps {
    children: EditingLayoutProps["children"];
    header?: ReactNode;
    onPanelResize?: EditingLayoutProps["onPanelResize"];
    className?: string;
    activeToolbarPanel?: ToolbarPanel;
    onToolbarPanelChange?: (panel: ToolbarPanel) => void;
}

function DesktopLayout({ children, header, onPanelResize, className, activeToolbarPanel: controlledPanel, onToolbarPanelChange }: DesktopLayoutProps) {
    const [internalPanel, setInternalPanel] = useState<ToolbarPanel>(null);
    const activeToolbarPanel = controlledPanel !== undefined ? controlledPanel : internalPanel;
    const setActiveToolbarPanel = onToolbarPanelChange || setInternalPanel;

    return (
        <div
            className={cn("flex h-full flex-col overflow-hidden", className)}
            data-testid="editing-layout-desktop"
            data-layout="desktop"
        >
            {/* Header */}
            {header && (
                <div className="shrink-0 border-b" data-testid="editing-layout-header">
                    {header}
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left + Center Panels */}
                <div className="flex-1 overflow-hidden">
                    <ResizablePanelGroup
                        orientation="horizontal"
                        className="h-full"
                    >
                        {/* Left Panel: Caption Editor */}
                        <ResizablePanel
                            id="caption-editor-panel"
                            defaultSize={DEFAULT_PANEL_SIZES.captionEditor}
                            minSize={MIN_PANEL_SIZES.captionEditor}
                            className="overflow-hidden"
                            data-testid="editing-layout-caption-editor"
                        >
                            <div className="h-full overflow-hidden">
                                {children.captionEditor}
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle aria-label="Resize caption editor" />

                        {/* Center Panel: Video Player */}
                        <ResizablePanel
                            id="video-player-panel"
                            defaultSize={DEFAULT_PANEL_SIZES.videoPlayer}
                            minSize={MIN_PANEL_SIZES.videoPlayer}
                            className="overflow-auto"
                            data-testid="editing-layout-video-player"
                        >
                            <div className="flex h-full flex-col overflow-auto p-4">
                                {children.videoPlayer}
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>

                {/* Right Toolbar */}
                <EditorToolbar
                    activePanel={activeToolbarPanel}
                    onPanelChange={setActiveToolbarPanel}
                    captionsPanel={children.stylePanel}
                    aiHookPanel={children.aiHookPanel}
                    clipInfoPanel={children.clipInfoPanel}
                    textOverlayPanel={children.textOverlayPanel}
                    backgroundPanel={children.backgroundPanel}
                />
            </div>

            {/* Bottom Row: Timeline Editor */}
            <div
                className="shrink-0 border-t bg-zinc-900"
                data-testid="editing-layout-timeline"
            >
                {children.timeline}
            </div>
        </div>
    );
}

// ============================================================================
// Mobile Layout Component
// ============================================================================

interface MobileLayoutProps {
    children: EditingLayoutProps["children"];
    header?: ReactNode;
    className?: string;
    activeToolbarPanel?: ToolbarPanel;
    onToolbarPanelChange?: (panel: ToolbarPanel) => void;
}

const PANEL_TITLES: Record<NonNullable<ToolbarPanel>, string> = {
    captions: "Captions",
    "clip-info": "Clip Info",
    "text-overlay": "Text Overlay",
    background: "Background",
};

function MobileLayout({ children, header, className, activeToolbarPanel: controlledPanel, onToolbarPanelChange }: MobileLayoutProps) {
    const [internalPanel, setInternalPanel] = useState<ToolbarPanel>(null);
    const activeToolbarPanel = controlledPanel !== undefined ? controlledPanel : internalPanel;
    const setActiveToolbarPanel = onToolbarPanelChange || setInternalPanel;

    const getPanelContent = (panel: ToolbarPanel): ReactNode => {
        if (panel === "captions") return children.stylePanel;
        if (panel === "clip-info") return children.clipInfoPanel;
        if (panel === "text-overlay") return children.textOverlayPanel;
        if (panel === "background") return children.backgroundPanel;
        return null;
    };

    return (
        <div
            className={cn("flex h-full flex-col overflow-hidden", className)}
            data-testid="editing-layout-mobile"
            data-layout="mobile"
        >
            {/* Header */}
            {header && (
                <div className="shrink-0 border-b" data-testid="editing-layout-header">
                    {header}
                </div>
            )}

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto">
                {/* Video Player (Top) */}
                <section
                    className="p-3"
                    data-testid="editing-layout-video-player"
                    aria-label="Video player"
                >
                    {children.videoPlayer}
                </section>

                {/* Caption Editor (Below Video) */}
                <section
                    className="border-t px-3 pb-3"
                    data-testid="editing-layout-caption-editor"
                    aria-label="Caption editor"
                >
                    {children.captionEditor}
                </section>
            </div>

            {/* Timeline Editor */}
            <div
                className="shrink-0 border-t bg-zinc-900"
                data-testid="editing-layout-timeline"
            >
                {children.timeline}
            </div>

            {/* Bottom Tab Bar */}
            <MobileToolbar
                activePanel={activeToolbarPanel}
                onPanelChange={setActiveToolbarPanel}
            />

            {/* Bottom Sheet Panel */}
            <Sheet
                open={activeToolbarPanel !== null}
                onOpenChange={(open) => { if (!open) setActiveToolbarPanel(null); }}
            >
                <SheetContent side="bottom" className="bg-zinc-900 border-zinc-800 text-white max-h-[70vh] flex flex-col p-0" showCloseButton={false}>
                    <SheetHeader className="border-b border-zinc-800 px-4 py-3 shrink-0">
                        <SheetTitle className="text-sm font-semibold text-white">
                            {activeToolbarPanel ? PANEL_TITLES[activeToolbarPanel] : ""}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-auto p-4">
                        {getPanelContent(activeToolbarPanel)}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

// ============================================================================
// Loading Skeleton Component
// ============================================================================

function EditingLayoutSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "flex h-full flex-col items-center justify-center",
                className
            )}
            data-testid="editing-layout-skeleton"
        >
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
    );
}

// ============================================================================
// Main EditingLayout Component
// ============================================================================

/**
 * EditingLayout - Responsive layout container for the editing screen
 * 
 * Desktop Layout (≥1024px):
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Header                                                     │
 * ├──────────────┬─────────────────────────────┬────────┬───────┤
 * │   Caption    │   Video Player              │ Panel  │ Tools │
 * │   Editor     │   (Center)                  │        │       │
 * │   (Left)     │                             │        │       │
 * ├──────────────┴─────────────────────────────┴────────┴───────┤
 * │  Timeline Editor (Bottom)                                   │
 * └─────────────────────────────────────────────────────────────┘
 */
export function EditingLayout({
    children,
    layout,
    className,
    header,
    onPanelResize,
    activeToolbarPanel,
    onToolbarPanelChange,
}: EditingLayoutProps) {
    const isDesktopDetected = useIsDesktop();
    const effectiveLayout = layout ?? (isDesktopDetected ? "desktop" : "mobile");

    if (isDesktopDetected === undefined && !layout) {
        return <EditingLayoutSkeleton className={className} />;
    }

    if (effectiveLayout === "desktop") {
        return (
            <DesktopLayout
                header={header}
                onPanelResize={onPanelResize}
                className={className}
                activeToolbarPanel={activeToolbarPanel}
                onToolbarPanelChange={onToolbarPanelChange}
            >
                {children}
            </DesktopLayout>
        );
    }

    return (
        <MobileLayout
            header={header}
            className={className}
            activeToolbarPanel={activeToolbarPanel}
            onToolbarPanelChange={onToolbarPanelChange}
        >
            {children}
        </MobileLayout>
    );
}

// ============================================================================
// Exports
// ============================================================================

export { DESKTOP_BREAKPOINT, DEFAULT_PANEL_SIZES, MIN_PANEL_SIZES };
