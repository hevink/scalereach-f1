"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint for switching between desktop and mobile layouts
 * Desktop: >= 1024px (3-column grid with resizable panels)
 * Mobile: < 1024px (stacked flexbox layout)
 * @validates Requirements 5.5, 5.6, 11.1
 */
const DESKTOP_BREAKPOINT = 1024;

/**
 * Default panel sizes for desktop layout (percentages)
 */
const DEFAULT_PANEL_SIZES = {
    captionEditor: 25,
    videoPlayer: 50,
    stylePanel: 25,
};

/**
 * Minimum panel sizes to ensure usability
 */
const MIN_PANEL_SIZES = {
    captionEditor: 15,
    videoPlayer: 30,
    stylePanel: 15,
};

// ============================================================================
// Types
// ============================================================================

/**
 * Props for the EditingLayout component
 * @validates Requirements 5.1-5.6, 11.1-11.6
 */
export interface EditingLayoutProps {
    /**
     * Child components to render in each layout slot
     */
    children: {
        /** Caption editor component for the left panel */
        captionEditor: ReactNode;
        /** Video player component for the center panel */
        videoPlayer: ReactNode;
        /** Caption style panel component for the right panel */
        stylePanel: ReactNode;
        /** Timeline editor component for the bottom row */
        timeline: ReactNode;
    };
    /**
     * Force a specific layout mode (useful for testing)
     * If not provided, layout is determined by screen width
     */
    layout?: "desktop" | "mobile";
    /**
     * Optional className for the root container
     */
    className?: string;
    /**
     * Optional header content to display above the main layout
     */
    header?: ReactNode;
    /**
     * Callback when panel sizes change (desktop only)
     */
    onPanelResize?: (sizes: { captionEditor: number; videoPlayer: number; stylePanel: number }) => void;
}

// ============================================================================
// Hook: useIsDesktop
// ============================================================================

/**
 * Custom hook to detect if the viewport is desktop size (>= 1024px)
 * @validates Requirements 5.5, 5.6, 11.1
 */
function useIsDesktop(): boolean | undefined {
    const [isDesktop, setIsDesktop] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);

        const onChange = () => {
            setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
        };

        // Set initial value
        setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);

        // Listen for changes
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
}

/**
 * Desktop layout using CSS Grid with ResizablePanel for adjustable widths
 * Layout: 3 columns (caption editor | video player | style panel) + bottom row (timeline)
 * @validates Requirements 5.1-5.5
 */
function DesktopLayout({ children, header, onPanelResize, className }: DesktopLayoutProps) {
    const handlePanelResize = (layout: { [panelId: string]: number }) => {
        if (onPanelResize) {
            // Extract sizes from the layout object using panel IDs
            const captionEditorSize = layout["caption-editor-panel"] ?? DEFAULT_PANEL_SIZES.captionEditor;
            const videoPlayerSize = layout["video-player-panel"] ?? DEFAULT_PANEL_SIZES.videoPlayer;
            const stylePanelSize = layout["style-panel"] ?? DEFAULT_PANEL_SIZES.stylePanel;

            onPanelResize({
                captionEditor: captionEditorSize,
                videoPlayer: videoPlayerSize,
                stylePanel: stylePanelSize,
            });
        }
    };

    return (
        <div
            className={cn(
                "flex h-full flex-col overflow-hidden",
                className
            )}
            data-testid="editing-layout-desktop"
            data-layout="desktop"
        >
            {/* Optional Header */}
            {header && (
                <div className="shrink-0 border-b" data-testid="editing-layout-header">
                    {header}
                </div>
            )}

            {/* Main Content Area: 3-column resizable layout */}
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup
                    orientation="horizontal"
                    className="h-full"
                    onLayoutChange={handlePanelResize}
                >
                    {/* Left Panel: Caption Editor */}
                    <ResizablePanel
                        id="caption-editor-panel"
                        defaultSize={DEFAULT_PANEL_SIZES.captionEditor}
                        minSize={MIN_PANEL_SIZES.captionEditor}
                        className="overflow-auto"
                        data-testid="editing-layout-caption-editor"
                    >
                        <div className="h-full overflow-auto p-4">
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

                    <ResizableHandle withHandle aria-label="Resize video player" />

                    {/* Right Panel: Caption Style Panel */}
                    <ResizablePanel
                        id="style-panel"
                        defaultSize={DEFAULT_PANEL_SIZES.stylePanel}
                        minSize={MIN_PANEL_SIZES.stylePanel}
                        className="overflow-auto"
                        data-testid="editing-layout-style-panel"
                    >
                        <div className="h-full overflow-auto p-4">
                            {children.stylePanel}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            {/* Bottom Row: Timeline Editor */}
            <div
                className="shrink-0 border-t bg-background"
                data-testid="editing-layout-timeline"
            >
                <div className="p-4">
                    {children.timeline}
                </div>
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
}

/**
 * Mobile layout using flexbox column for stacked layout
 * Order: Header → Video Player → Caption Editor → Style Panel → Timeline
 * All sections are scrollable with touch-friendly tap targets (min 44px)
 * @validates Requirements 5.6, 11.1-11.6
 */
function MobileLayout({ children, header, className }: MobileLayoutProps) {
    return (
        <div
            className={cn(
                "flex h-full flex-col overflow-hidden",
                className
            )}
            data-testid="editing-layout-mobile"
            data-layout="mobile"
        >
            {/* Optional Header */}
            {header && (
                <div className="shrink-0 border-b" data-testid="editing-layout-header">
                    {header}
                </div>
            )}

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto">
                {/* Video Player (Top) */}
                <section
                    className="border-b p-4"
                    data-testid="editing-layout-video-player"
                    aria-label="Video player"
                >
                    {children.videoPlayer}
                </section>

                {/* Caption Editor (Below Video) */}
                <section
                    className="border-b p-4"
                    data-testid="editing-layout-caption-editor"
                    aria-label="Caption editor"
                >
                    {children.captionEditor}
                </section>

                {/* Caption Style Panel (Below Caption Editor) */}
                <section
                    className="border-b p-4"
                    data-testid="editing-layout-style-panel"
                    aria-label="Caption style panel"
                >
                    {children.stylePanel}
                </section>
            </div>

            {/* Timeline Editor (Bottom - Fixed) */}
            <div
                className="shrink-0 border-t bg-background"
                data-testid="editing-layout-timeline"
            >
                <div className="p-4">
                    {children.timeline}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Loading Skeleton Component
// ============================================================================

/**
 * Loading skeleton shown while determining layout
 */
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
 * ┌─────────────────────────────────────────────────────┐
 * │  Header (optional)                                  │
 * ├──────────────┬──────────────────┬───────────────────┤
 * │   Caption    │   Video Player   │  Caption Style    │
 * │   Editor     │   (Center)       │  Panel (Right)    │
 * │   (Left)     │                  │                   │
 * ├──────────────┴──────────────────┴───────────────────┤
 * │  Timeline Editor (Bottom)                           │
 * └─────────────────────────────────────────────────────┘
 * 
 * Mobile Layout (<1024px):
 * ┌─────────────────────────────────────────────────────┐
 * │  Header (optional)                                  │
 * ├─────────────────────────────────────────────────────┤
 * │  Video Player (Top)                                 │
 * ├─────────────────────────────────────────────────────┤
 * │  Caption Editor (Scrollable)                        │
 * ├─────────────────────────────────────────────────────┤
 * │  Caption Style Panel (Scrollable)                   │
 * ├─────────────────────────────────────────────────────┤
 * │  Timeline Editor (Bottom)                           │
 * └─────────────────────────────────────────────────────┘
 * 
 * @validates Requirements 5.1-5.6, 11.1-11.6
 */
export function EditingLayout({
    children,
    layout,
    className,
    header,
    onPanelResize,
}: EditingLayoutProps) {
    const isDesktopDetected = useIsDesktop();

    // Determine which layout to use
    // Priority: explicit layout prop > detected layout
    const effectiveLayout = layout ?? (isDesktopDetected ? "desktop" : "mobile");

    // Show skeleton while detecting layout (only on initial render)
    if (isDesktopDetected === undefined && !layout) {
        return <EditingLayoutSkeleton className={className} />;
    }

    // Render appropriate layout
    if (effectiveLayout === "desktop") {
        return (
            <DesktopLayout
                header={header}
                onPanelResize={onPanelResize}
                className={className}
            >
                {children}
            </DesktopLayout>
        );
    }

    return (
        <MobileLayout header={header} className={className}>
            {children}
        </MobileLayout>
    );
}

// ============================================================================
// Exports
// ============================================================================

export { DESKTOP_BREAKPOINT, DEFAULT_PANEL_SIZES, MIN_PANEL_SIZES };
