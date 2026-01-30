"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * EmptyState component props
 * Provides a simpler API for common empty state patterns
 */
export interface EmptyStateProps {
    /** Icon to display in the empty state */
    icon: React.ReactNode;
    /** Title text for the empty state */
    title: string;
    /** Description text explaining the empty state */
    description: string;
    /** Optional action button configuration */
    action?: {
        /** Button label text */
        label: string;
        /** Click handler for the action button */
        onClick: () => void;
    };
    /** Optional secondary action */
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
    /** Optional feature hints to display */
    features?: string[];
    /** Optional additional className for the container */
    className?: string;
    /** Variant for different visual styles */
    variant?: "default" | "card" | "minimal";
}

/**
 * EmptyState - A reusable empty state component with icon, title, description, and optional action
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
    secondaryAction,
    features,
    className,
    variant = "default",
}: EmptyStateProps) {
    if (variant === "minimal") {
        return (
            <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
                <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 mb-4">
                    {icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
                <p className="text-sm text-zinc-400 max-w-sm">{description}</p>
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
                "flex flex-col items-center justify-center py-16 px-6 text-center",
                "rounded-2xl border border-zinc-800 bg-zinc-900/50",
                className
            )}>
                {/* Icon with decorative element */}
                <div className="relative mb-6">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
                        {icon}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-zinc-900">
                        <div className="size-2 rounded-full bg-emerald-500" />
                    </div>
                </div>

                {/* Text */}
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 max-w-md mb-6">{description}</p>

                {/* Actions */}
                {(action || secondaryAction) && (
                    <div className="flex items-center gap-3">
                        {action && (
                            <Button onClick={action.onClick}>
                                {action.label}
                            </Button>
                        )}
                        {secondaryAction && (
                            <Button variant="outline" onClick={secondaryAction.onClick}>
                                {secondaryAction.label}
                            </Button>
                        )}
                    </div>
                )}

                {/* Feature hints */}
                {features && features.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                        {features.map((feature, index) => (
                            <span
                                key={index}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 text-xs text-zinc-400"
                            >
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                {feature}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Default variant
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-16 px-6 text-center",
            "rounded-xl border-2 border-dashed border-zinc-800",
            className
        )}>
            {/* Icon */}
            <div className="flex size-14 items-center justify-center rounded-xl bg-zinc-800/50 text-zinc-400 mb-4">
                {icon}
            </div>

            {/* Text */}
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-zinc-400 max-w-sm mb-6">{description}</p>

            {/* Actions */}
            {(action || secondaryAction) && (
                <div className="flex items-center gap-3">
                    {action && (
                        <Button onClick={action.onClick}>
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button variant="ghost" onClick={secondaryAction.onClick}>
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}

            {/* Feature hints */}
            {features && features.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-6 pt-6 border-t border-zinc-800 w-full max-w-md">
                    {features.map((feature, index) => (
                        <span
                            key={index}
                            className="text-xs text-zinc-500"
                        >
                            {feature}
                            {index < features.length - 1 && <span className="mx-2">•</span>}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
