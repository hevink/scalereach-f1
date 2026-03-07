"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Illustration components that work in both light and dark modes
function FavoritesIllustration({ className }: { className?: string }) {
    return (
        <svg className={cn("w-full h-full", className)} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background shapes */}
            <circle cx="100" cy="80" r="60" className="fill-primary/5" />
            <circle cx="100" cy="80" r="45" className="fill-primary/10" />

            {/* Heart shape */}
            <path
                d="M100 130c-1.5 0-3-.5-4.2-1.5C82.5 117.8 55 95.5 55 70c0-15.5 12.5-28 28-28 8.5 0 16.5 4 21.5 10.5C109.5 46 117.5 42 126 42c15.5 0 28 12.5 28 28 0 25.5-27.5 47.8-40.8 58.5-1.2 1-2.7 1.5-4.2 1.5z"
                className="fill-primary/20 stroke-primary/40"
                strokeWidth="2"
            />

            {/* Floating hearts */}
            <path d="M45 50c-1 0-2-.3-2.8-1-4.5-3.5-12-9-12-16 0-5.2 4.2-9.5 9.5-9.5 2.9 0 5.6 1.4 7.3 3.6 1.7-2.2 4.4-3.6 7.3-3.6 5.3 0 9.5 4.3 9.5 9.5 0 7-7.5 12.5-12 16-.8.7-1.8 1-2.8 1z" className="fill-primary/30" />
            <path d="M155 45c-.7 0-1.4-.2-2-0.7-3.2-2.5-8.5-6.4-8.5-11.3 0-3.7 3-6.7 6.7-6.7 2 0 4 1 5.2 2.5 1.2-1.5 3.2-2.5 5.2-2.5 3.7 0 6.7 3 6.7 6.7 0 4.9-5.3 8.8-8.5 11.3-.6.5-1.3.7-2 .7z" className="fill-primary/25" />

            {/* Sparkles */}
            <circle cx="60" cy="100" r="3" className="fill-primary/40" />
            <circle cx="140" cy="95" r="2.5" className="fill-primary/35" />
            <circle cx="75" cy="35" r="2" className="fill-primary/30" />
            <circle cx="130" cy="120" r="2" className="fill-primary/30" />
        </svg>
    );
}

function EmptyClipsIllustration({ className }: { className?: string }) {
    return (
        <svg className={cn("w-full h-full", className)} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background */}
            <rect x="40" y="30" width="120" height="100" rx="12" className="fill-muted/50" />

            {/* Video frame */}
            <rect x="50" y="40" width="100" height="70" rx="8" className="fill-background stroke-border" strokeWidth="2" />

            {/* Play button */}
            <circle cx="100" cy="75" r="18" className="fill-primary/20" />
            <path d="M95 67v16l12-8-12-8z" className="fill-primary/60" />

            {/* Scissors */}
            <g className="translate-x-[130px] translate-y-[90px]">
                <circle cx="0" cy="0" r="8" className="fill-primary/30" />
                <circle cx="16" cy="0" r="8" className="fill-primary/30" />
                <path d="M6 -4L10 4M10 -4L6 4" className="stroke-primary/50" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Film strip decoration */}
            <rect x="55" y="115" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
            <rect x="68" y="115" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
            <rect x="81" y="115" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
            <rect x="94" y="115" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
            <rect x="107" y="115" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
            <rect x="120" y="115" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
            <rect x="133" y="115" width="8" height="10" rx="1" className="fill-muted-foreground/20" />
        </svg>
    );
}

function EmptyVideosIllustration({ className }: { className?: string }) {
    return (
        <svg className={cn("w-full h-full", className)} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cloud upload background */}
            <ellipse cx="100" cy="130" rx="70" ry="10" className="fill-muted/30" />

            {/* Main cloud */}
            <path
                d="M155 85c0-16.5-13.5-30-30-30-3 0-6 .5-8.8 1.3C111.5 43.5 98 35 82.5 35 61 35 43.5 52.5 43.5 74c0 2 .2 4 .5 6C35 83 28 92.5 28 104c0 15.5 12.5 28 28 28h94c13.8 0 25-11.2 25-25 0-10-6-18.5-14.5-22.5.3-1.5.5-3 .5-4.5z"
                className="fill-muted/50 stroke-border"
                strokeWidth="2"
            />

            {/* Upload arrow */}
            <path d="M100 65v40" className="stroke-primary" strokeWidth="3" strokeLinecap="round" />
            <path d="M88 77l12-12 12 12" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Decorative dots */}
            <circle cx="55" cy="60" r="4" className="fill-primary/20" />
            <circle cx="145" cy="55" r="3" className="fill-primary/25" />
            <circle cx="165" cy="75" r="2" className="fill-primary/15" />
        </svg>
    );
}

function EmptySearchIllustration({ className }: { className?: string }) {
    return (
        <svg className={cn("w-full h-full", className)} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background circle */}
            <circle cx="90" cy="70" r="50" className="fill-muted/30" />

            {/* Magnifying glass */}
            <circle cx="85" cy="65" r="35" className="fill-background stroke-border" strokeWidth="3" />
            <circle cx="85" cy="65" r="25" className="stroke-muted-foreground/30" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="110" y1="90" x2="145" y2="125" className="stroke-muted-foreground/50" strokeWidth="8" strokeLinecap="round" />
            <line x1="110" y1="90" x2="145" y2="125" className="stroke-border" strokeWidth="6" strokeLinecap="round" />

            {/* Question mark */}
            <text x="85" y="75" textAnchor="middle" className="fill-muted-foreground/40 text-2xl font-bold">?</text>

            {/* Floating elements */}
            <circle cx="150" cy="40" r="6" className="fill-primary/20" />
            <circle cx="40" cy="100" r="4" className="fill-primary/15" />
            <rect x="160" y="80" width="10" height="10" rx="2" className="fill-primary/10" />
        </svg>
    );
}

function EmptyNotificationsIllustration({ className }: { className?: string }) {
    return (
        <svg className={cn("w-full h-full", className)} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bell */}
            <path
                d="M100 25c-22 0-40 18-40 40v25c0 5-10 15-10 15h100s-10-10-10-15V65c0-22-18-40-40-40z"
                className="fill-muted/50 stroke-border"
                strokeWidth="2"
            />
            <circle cx="100" cy="120" r="12" className="fill-muted/50 stroke-border" strokeWidth="2" />

            {/* Zzz */}
            <text x="130" y="45" className="fill-muted-foreground/30 text-sm font-bold">Z</text>
            <text x="145" y="35" className="fill-muted-foreground/20 text-xs font-bold">z</text>
            <text x="155" y="28" className="fill-muted-foreground/15 text-[10px] font-bold">z</text>

            {/* Decorative */}
            <circle cx="55" cy="50" r="3" className="fill-primary/20" />
            <circle cx="160" cy="70" r="4" className="fill-primary/15" />
        </svg>
    );
}

function GenericEmptyIllustration({ className }: { className?: string }) {
    return (
        <svg className={cn("w-full h-full", className)} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Folder/box shape */}
            <path
                d="M35 50h50l10 15h70c5.5 0 10 4.5 10 10v55c0 5.5-4.5 10-10 10H35c-5.5 0-10-4.5-10-10V60c0-5.5 4.5-10 10-10z"
                className="fill-muted/40 stroke-border"
                strokeWidth="2"
            />

            {/* Inner shadow */}
            <path d="M35 75h130v45c0 5.5-4.5 10-10 10H35c-5.5 0-10-4.5-10-10V85c0-5.5 4.5-10 10-10z" className="fill-muted/20" />

            {/* Decorative elements */}
            <circle cx="100" cy="100" r="15" className="fill-primary/10 stroke-primary/20" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx="100" cy="100" r="5" className="fill-primary/20" />

            {/* Floating dots */}
            <circle cx="55" cy="40" r="4" className="fill-primary/25" />
            <circle cx="160" cy="45" r="3" className="fill-primary/20" />
            <circle cx="175" cy="90" r="2" className="fill-primary/15" />
        </svg>
    );
}

// Map of illustration types
const illustrations = {
    favorites: FavoritesIllustration,
    clips: EmptyClipsIllustration,
    videos: EmptyVideosIllustration,
    search: EmptySearchIllustration,
    notifications: EmptyNotificationsIllustration,
    generic: GenericEmptyIllustration,
} as const;

export type IllustrationType = keyof typeof illustrations;

export interface EmptyStateProps {
    /** Icon to display (used if no illustration) */
    icon?: React.ReactNode;
    /** Illustration type to display */
    illustration?: IllustrationType;
    /** Title text */
    title: string;
    /** Description text */
    description: string;
    /** Primary action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Secondary action button */
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
    /** Feature hints */
    features?: string[];
    /** Additional className */
    className?: string;
    /** Visual variant */
    variant?: "default" | "card" | "minimal";
}

export function EmptyState({
    icon,
    illustration,
    title,
    description,
    action,
    secondaryAction,
    features,
    className,
    variant = "default",
}: EmptyStateProps) {
    const IllustrationComponent = illustration ? illustrations[illustration] : null;

    if (variant === "minimal") {
        return (
            <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
                {IllustrationComponent ? (
                    <div className="w-32 h-24 mb-4">
                        <IllustrationComponent />
                    </div>
                ) : icon ? (
                    <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
                        {icon}
                    </div>
                ) : null}
                <h3 className="text-base font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
                {action && (
                    <Button onClick={action.onClick} className="mt-4">
                        {action.label}
                    </Button>
                )}
            </div>
        );
    }

    if (variant === "card") {
        return (
            <div className={cn(
                "flex flex-col items-center justify-center py-12 px-6 text-center",
                "rounded-2xl border bg-card/50",
                className
            )}>
                {IllustrationComponent ? (
                    <div className="w-48 h-36 mb-4">
                        <IllustrationComponent />
                    </div>
                ) : icon ? (
                    <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
                        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                            {icon}
                        </div>
                    </div>
                ) : null}
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
                {(action || secondaryAction) && (
                    <div className="flex items-center gap-3">
                        {action && <Button onClick={action.onClick}>{action.label}</Button>}
                        {secondaryAction && <Button variant="outline" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>}
                    </div>
                )}
                {features && features.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                        {features.map((feature, i) => (
                            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs text-muted-foreground">
                                <span className="size-1.5 rounded-full bg-primary" />
                                {feature}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Default variant - clean, modern design
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center max-w-md mx-auto", className)}>
            {IllustrationComponent ? (
                <div className="w-48 h-36 mb-6">
                    <IllustrationComponent />
                </div>
            ) : icon ? (
                <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-2xl scale-150" />
                    <div className="relative flex size-16 items-center justify-center rounded-2xl bg-muted/80 backdrop-blur-sm border border-border/50 text-muted-foreground">
                        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                            className: cn((icon as React.ReactElement<{ className?: string }>).props?.className, "size-7")
                        }) : icon}
                    </div>
                </div>
            ) : null}
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">{description}</p>
            {(action || secondaryAction) && (
                <div className="flex items-center gap-3">
                    {action && <Button onClick={action.onClick} size="sm">{action.label}</Button>}
                    {secondaryAction && <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>}
                </div>
            )}
            {features && features.length > 0 && (
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-8 text-xs text-muted-foreground/70">
                    {features.map((feature, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-primary/50" />
                            {feature}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
