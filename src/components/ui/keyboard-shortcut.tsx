"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Props for the KeyboardShortcut component
 */
export interface KeyboardShortcutProps extends React.HTMLAttributes<HTMLElement> {
    /** The keyboard shortcut to display (e.g., "Ctrl+S", "Esc", "Space") */
    shortcut: string;
    /** Size variant */
    size?: "sm" | "default";
}

/**
 * KeyboardShortcut - Displays a keyboard shortcut in a styled kbd element
 * 
 * @example
 * ```tsx
 * <KeyboardShortcut shortcut="Esc" />
 * <KeyboardShortcut shortcut="Ctrl+S" />
 * <KeyboardShortcut shortcut="Space" size="sm" />
 * ```
 * 
 * @validates Requirements 33.4 - Display keyboard shortcuts in tooltips
 */
export function KeyboardShortcut({
    shortcut,
    size = "default",
    className,
    ...props
}: KeyboardShortcutProps) {
    // Split shortcut into parts (e.g., "Ctrl+S" -> ["Ctrl", "S"])
    const parts = shortcut.split("+");

    return (
        <span className={cn("inline-flex items-center gap-0.5", className)} {...props}>
            {parts.map((part, index) => (
                <React.Fragment key={part}>
                    <kbd
                        className={cn(
                            "inline-flex items-center justify-center rounded border font-mono font-medium",
                            "bg-muted/50 border-muted-foreground/20 text-muted-foreground",
                            size === "sm"
                                ? "min-w-5 h-4 px-1 text-[10px]"
                                : "min-w-6 h-5 px-1.5 text-xs"
                        )}
                    >
                        {part}
                    </kbd>
                    {index < parts.length - 1 && (
                        <span className="text-muted-foreground/50 text-[10px]">+</span>
                    )}
                </React.Fragment>
            ))}
        </span>
    );
}

/**
 * Props for the ShortcutHint component
 */
export interface ShortcutHintProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** The label text */
    label: string;
    /** The keyboard shortcut */
    shortcut: string;
    /** Size variant */
    size?: "sm" | "default";
}

/**
 * ShortcutHint - Displays a label with its keyboard shortcut
 * 
 * @example
 * ```tsx
 * <ShortcutHint label="Play/Pause" shortcut="Space" />
 * <ShortcutHint label="Save" shortcut="Ctrl+S" />
 * ```
 * 
 * @validates Requirements 33.4 - Display keyboard shortcuts in tooltips
 */
export function ShortcutHint({
    label,
    shortcut,
    size = "default",
    className,
    ...props
}: ShortcutHintProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-2",
                size === "sm" ? "text-xs" : "text-sm",
                className
            )}
            {...props}
        >
            <span>{label}</span>
            <KeyboardShortcut shortcut={shortcut} size={size} />
        </span>
    );
}

/**
 * Props for the ShortcutsList component
 */
export interface ShortcutsListProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Array of shortcuts to display */
    shortcuts: Array<{
        label: string;
        shortcut: string;
    }>;
    /** Size variant */
    size?: "sm" | "default";
    /** Layout direction */
    direction?: "horizontal" | "vertical";
}

/**
 * ShortcutsList - Displays a list of keyboard shortcuts
 * 
 * @example
 * ```tsx
 * <ShortcutsList
 *   shortcuts={[
 *     { label: "Play/Pause", shortcut: "Space" },
 *     { label: "Seek", shortcut: "← →" },
 *     { label: "Mute", shortcut: "M" },
 *   ]}
 * />
 * ```
 * 
 * @validates Requirements 33.4 - Display keyboard shortcuts in tooltips
 */
export function ShortcutsList({
    shortcuts,
    size = "default",
    direction = "vertical",
    className,
    ...props
}: ShortcutsListProps) {
    return (
        <div
            className={cn(
                "flex gap-2",
                direction === "vertical" ? "flex-col" : "flex-row flex-wrap",
                className
            )}
            {...props}
        >
            {shortcuts.map(({ label, shortcut }) => (
                <ShortcutHint
                    key={`${label}-${shortcut}`}
                    label={label}
                    shortcut={shortcut}
                    size={size}
                />
            ))}
        </div>
    );
}

export default KeyboardShortcut;
