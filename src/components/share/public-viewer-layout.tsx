/**
 * Public Viewer Layout Component
 * Clean, minimal layout without workspace context for public clip viewing
 * 
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6
 */

import { ReactNode } from "react";
import Link from "next/link";

export interface PublicViewerLayoutProps {
    children: ReactNode;
    videoTitle?: string;
}

export function PublicViewerLayout({ children, videoTitle }: PublicViewerLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-semibold">
                                {videoTitle || "Shared Clips"}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                View and download viral clips
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t bg-muted/30 py-6">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <p className="text-sm text-muted-foreground">
                            Powered by{" "}
                            <Link
                                href="https://scalereach.ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-foreground hover:underline"
                            >
                                ScaleReach
                            </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Create your own viral clips with AI
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
