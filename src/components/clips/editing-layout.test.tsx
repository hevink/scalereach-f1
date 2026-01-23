import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EditingLayout, DESKTOP_BREAKPOINT } from "./editing-layout";

// ============================================================================
// Mock ResizablePanel components to avoid CSS issues in test environment
// ============================================================================

vi.mock("@/components/ui/resizable", () => ({
    ResizablePanelGroup: ({ children, className }: {
        children: React.ReactNode;
        className?: string;
        onLayout?: (sizes: number[]) => void;
        direction?: string;
    }) => (
        <div
            data-slot="resizable-panel-group"
            data-testid="resizable-panel-group"
            className={className}
        >
            {children}
        </div>
    ),
    ResizablePanel: ({ children, className, "data-testid": dataTestId }: {
        children: React.ReactNode;
        className?: string;
        defaultSize?: number;
        minSize?: number;
        "data-testid"?: string;
    }) => (
        <div
            data-slot="resizable-panel"
            data-testid={dataTestId || "resizable-panel"}
            className={className}
        >
            {children}
        </div>
    ),
    ResizableHandle: ({ className }: {
        withHandle?: boolean;
        className?: string;
        "aria-label"?: string;
    }) => (
        <div
            data-slot="resizable-handle"
            data-testid="resizable-handle"
            className={className}
        />
    ),
}));

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Mock children components for testing
 */
const mockChildren = {
    captionEditor: <div data-testid="mock-caption-editor">Caption Editor</div>,
    videoPlayer: <div data-testid="mock-video-player">Video Player</div>,
    stylePanel: <div data-testid="mock-style-panel">Style Panel</div>,
    timeline: <div data-testid="mock-timeline">Timeline</div>,
};

/**
 * Mock header component for testing
 */
const mockHeader = <div data-testid="mock-header">Header</div>;

/**
 * Helper to set viewport width for responsive testing
 */
function setViewportWidth(width: number) {
    Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: width,
    });

    // Trigger resize event
    window.dispatchEvent(new Event("resize"));
}

/**
 * Mock matchMedia for responsive testing
 */
function mockMatchMedia(matches: boolean) {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];

    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
                if (event === "change") {
                    listeners.push(listener);
                }
            }),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });

    return {
        triggerChange: (newMatches: boolean) => {
            listeners.forEach((listener) => {
                listener({ matches: newMatches } as MediaQueryListEvent);
            });
        },
    };
}

// ============================================================================
// Tests
// ============================================================================

describe("EditingLayout", () => {
    beforeEach(() => {
        // Reset viewport to desktop size by default
        setViewportWidth(1280);
        mockMatchMedia(true);
    });

    describe("Desktop Layout (≥1024px)", () => {
        beforeEach(() => {
            setViewportWidth(1280);
            mockMatchMedia(true);
        });

        /**
         * @validates Requirements 5.1, 5.2, 5.3, 5.4, 5.5
         */
        it("renders desktop layout with all panels when layout='desktop'", () => {
            render(<EditingLayout layout="desktop">{mockChildren}</EditingLayout>);

            // Verify desktop layout is rendered
            expect(screen.getByTestId("editing-layout-desktop")).toBeInTheDocument();
            expect(screen.getByTestId("editing-layout-desktop")).toHaveAttribute(
                "data-layout",
                "desktop"
            );

            // Verify all children are rendered
            expect(screen.getByTestId("mock-caption-editor")).toBeInTheDocument();
            expect(screen.getByTestId("mock-video-player")).toBeInTheDocument();
            expect(screen.getByTestId("mock-style-panel")).toBeInTheDocument();
            expect(screen.getByTestId("mock-timeline")).toBeInTheDocument();
        });

        /**
         * @validates Requirements 5.1 - Video player in center
         */
        it("renders video player in the center panel", () => {
            render(<EditingLayout layout="desktop">{mockChildren}</EditingLayout>);

            const videoPlayerPanel = screen.getByTestId("editing-layout-video-player");
            expect(videoPlayerPanel).toBeInTheDocument();
            expect(screen.getByTestId("mock-video-player")).toBeInTheDocument();
        });

        /**
         * @validates Requirements 5.2 - Caption editor on left
         */
        it("renders caption editor in the left panel", () => {
            render(<EditingLayout layout="desktop">{mockChildren}</EditingLayout>);

            const captionEditorPanel = screen.getByTestId("editing-layout-caption-editor");
            expect(captionEditorPanel).toBeInTheDocument();
            expect(screen.getByTestId("mock-caption-editor")).toBeInTheDocument();
        });

        /**
         * @validates Requirements 5.3 - Caption style panel on right
         */
        it("renders caption style panel in the right panel", () => {
            render(<EditingLayout layout="desktop">{mockChildren}</EditingLayout>);

            const stylePanelPanel = screen.getByTestId("editing-layout-style-panel");
            expect(stylePanelPanel).toBeInTheDocument();
            expect(screen.getByTestId("mock-style-panel")).toBeInTheDocument();
        });

        /**
         * @validates Requirements 5.4 - Timeline at bottom
         */
        it("renders timeline editor at the bottom", () => {
            render(<EditingLayout layout="desktop">{mockChildren}</EditingLayout>);

            const timelinePanel = screen.getByTestId("editing-layout-timeline");
            expect(timelinePanel).toBeInTheDocument();
            expect(screen.getByTestId("mock-timeline")).toBeInTheDocument();
        });

        it("renders optional header when provided", () => {
            render(
                <EditingLayout layout="desktop" header={mockHeader}>
                    {mockChildren}
                </EditingLayout>
            );

            expect(screen.getByTestId("editing-layout-header")).toBeInTheDocument();
            expect(screen.getByTestId("mock-header")).toBeInTheDocument();
        });

        it("does not render header when not provided", () => {
            render(<EditingLayout layout="desktop">{mockChildren}</EditingLayout>);

            expect(screen.queryByTestId("editing-layout-header")).not.toBeInTheDocument();
        });

        it("uses ResizablePanel for adjustable widths", () => {
            render(<EditingLayout layout="desktop">{mockChildren}</EditingLayout>);

            // Check for resizable panel group
            const resizablePanelGroup = document.querySelector('[data-slot="resizable-panel-group"]');
            expect(resizablePanelGroup).toBeInTheDocument();

            // Check for resizable handles
            const resizableHandles = document.querySelectorAll('[data-slot="resizable-handle"]');
            expect(resizableHandles.length).toBe(2); // Two handles between three panels
        });

        it("applies custom className to root container", () => {
            render(
                <EditingLayout layout="desktop" className="custom-class">
                    {mockChildren}
                </EditingLayout>
            );

            expect(screen.getByTestId("editing-layout-desktop")).toHaveClass("custom-class");
        });
    });

    describe("Mobile Layout (<1024px)", () => {
        beforeEach(() => {
            setViewportWidth(768);
            mockMatchMedia(false);
        });

        /**
         * @validates Requirements 5.6, 11.1
         */
        it("renders mobile layout with stacked panels when layout='mobile'", () => {
            render(<EditingLayout layout="mobile">{mockChildren}</EditingLayout>);

            // Verify mobile layout is rendered
            expect(screen.getByTestId("editing-layout-mobile")).toBeInTheDocument();
            expect(screen.getByTestId("editing-layout-mobile")).toHaveAttribute(
                "data-layout",
                "mobile"
            );

            // Verify all children are rendered
            expect(screen.getByTestId("mock-caption-editor")).toBeInTheDocument();
            expect(screen.getByTestId("mock-video-player")).toBeInTheDocument();
            expect(screen.getByTestId("mock-style-panel")).toBeInTheDocument();
            expect(screen.getByTestId("mock-timeline")).toBeInTheDocument();
        });

        /**
         * @validates Requirements 11.2 - Video player at top in mobile
         */
        it("renders video player at the top in mobile layout", () => {
            render(<EditingLayout layout="mobile">{mockChildren}</EditingLayout>);

            const videoPlayerSection = screen.getByTestId("editing-layout-video-player");
            expect(videoPlayerSection).toBeInTheDocument();
            expect(videoPlayerSection.tagName).toBe("SECTION");
        });

        /**
         * @validates Requirements 11.3 - Caption editor below video in mobile
         */
        it("renders caption editor below video player in mobile layout", () => {
            render(<EditingLayout layout="mobile">{mockChildren}</EditingLayout>);

            const captionEditorSection = screen.getByTestId("editing-layout-caption-editor");
            expect(captionEditorSection).toBeInTheDocument();
            expect(captionEditorSection.tagName).toBe("SECTION");
        });

        /**
         * @validates Requirements 11.4 - Style panel below caption editor in mobile
         */
        it("renders style panel below caption editor in mobile layout", () => {
            render(<EditingLayout layout="mobile">{mockChildren}</EditingLayout>);

            const stylePanelSection = screen.getByTestId("editing-layout-style-panel");
            expect(stylePanelSection).toBeInTheDocument();
            expect(stylePanelSection.tagName).toBe("SECTION");
        });

        /**
         * @validates Requirements 11.5 - Timeline at bottom in mobile
         */
        it("renders timeline at the bottom in mobile layout", () => {
            render(<EditingLayout layout="mobile">{mockChildren}</EditingLayout>);

            const timelineSection = screen.getByTestId("editing-layout-timeline");
            expect(timelineSection).toBeInTheDocument();
        });

        /**
         * @validates Requirements 11.6 - Touch-friendly controls
         */
        it("has aria-labels for accessibility on mobile sections", () => {
            render(<EditingLayout layout="mobile">{mockChildren}</EditingLayout>);

            expect(screen.getByLabelText("Video player")).toBeInTheDocument();
            expect(screen.getByLabelText("Caption editor")).toBeInTheDocument();
            expect(screen.getByLabelText("Caption style panel")).toBeInTheDocument();
        });

        it("renders optional header when provided in mobile layout", () => {
            render(
                <EditingLayout layout="mobile" header={mockHeader}>
                    {mockChildren}
                </EditingLayout>
            );

            expect(screen.getByTestId("editing-layout-header")).toBeInTheDocument();
            expect(screen.getByTestId("mock-header")).toBeInTheDocument();
        });

        it("does not use ResizablePanel in mobile layout", () => {
            render(<EditingLayout layout="mobile">{mockChildren}</EditingLayout>);

            // Check that resizable panel group is NOT present
            const resizablePanelGroup = document.querySelector('[data-slot="resizable-panel-group"]');
            expect(resizablePanelGroup).not.toBeInTheDocument();
        });

        it("applies custom className to root container in mobile layout", () => {
            render(
                <EditingLayout layout="mobile" className="custom-class">
                    {mockChildren}
                </EditingLayout>
            );

            expect(screen.getByTestId("editing-layout-mobile")).toHaveClass("custom-class");
        });
    });

    describe("Responsive Behavior", () => {
        /**
         * @validates Requirements 5.5, 11.1
         */
        it("automatically detects desktop layout when viewport >= 1024px", async () => {
            setViewportWidth(1280);
            mockMatchMedia(true);

            render(<EditingLayout>{mockChildren}</EditingLayout>);

            await waitFor(() => {
                expect(screen.getByTestId("editing-layout-desktop")).toBeInTheDocument();
            });
        });

        /**
         * @validates Requirements 5.6, 11.1
         */
        it("automatically detects mobile layout when viewport < 1024px", async () => {
            setViewportWidth(768);
            mockMatchMedia(false);

            render(<EditingLayout>{mockChildren}</EditingLayout>);

            await waitFor(() => {
                expect(screen.getByTestId("editing-layout-mobile")).toBeInTheDocument();
            });
        });

        it("explicit layout prop overrides automatic detection", async () => {
            // Set viewport to desktop size
            setViewportWidth(1280);
            mockMatchMedia(true);

            // But force mobile layout
            render(<EditingLayout layout="mobile">{mockChildren}</EditingLayout>);

            // Should render mobile layout despite desktop viewport
            expect(screen.getByTestId("editing-layout-mobile")).toBeInTheDocument();
        });
    });

    describe("Breakpoint Constant", () => {
        it("exports DESKTOP_BREAKPOINT as 1024", () => {
            expect(DESKTOP_BREAKPOINT).toBe(1024);
        });
    });
});
