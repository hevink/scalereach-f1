"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

interface ShortcutItem {
    keys: string[];
    description: string;
}

interface ShortcutGroup {
    title: string;
    shortcuts: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
        title: "Playback",
        shortcuts: [
            { keys: ["Space"], description: "Play / Pause" },
            { keys: ["←"], description: "Seek backward 5s" },
            { keys: ["→"], description: "Seek forward 5s" },
            { keys: ["M"], description: "Toggle mute" },
            { keys: ["F"], description: "Toggle fullscreen" },
        ],
    },
    {
        title: "Timeline",
        shortcuts: [
            { keys: ["←"], description: "Fine adjustment left" },
            { keys: ["→"], description: "Fine adjustment right" },
            { keys: ["Shift", "←"], description: "1 second left" },
            { keys: ["Shift", "→"], description: "1 second right" },
        ],
    },
    {
        title: "Editing",
        shortcuts: [
            { keys: ["Ctrl", "Z"], description: "Undo" },
            { keys: ["Ctrl", "Shift", "Z"], description: "Redo" },
            { keys: ["Ctrl", "S"], description: "Save" },
        ],
    },
    {
        title: "Navigation",
        shortcuts: [
            { keys: ["Esc"], description: "Close panel / Go back" },
            { keys: ["?"], description: "Show keyboard shortcuts" },
        ],
    },
];

interface KeyboardShortcutsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white">Keyboard Shortcuts</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {SHORTCUT_GROUPS.map((group) => (
                        <div key={group.title}>
                            <h3 className="text-sm font-semibold text-zinc-400 mb-3">
                                {group.title}
                            </h3>
                            <div className="space-y-2">
                                {group.shortcuts.map((shortcut, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-1.5"
                                    >
                                        <span className="text-sm text-zinc-300">
                                            {shortcut.description}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, keyIndex) => (
                                                <span key={keyIndex} className="flex items-center gap-1">
                                                    <Kbd>{key}</Kbd>
                                                    {keyIndex < shortcut.keys.length - 1 && (
                                                        <span className="text-zinc-500 text-xs">+</span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="pt-4 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 text-center">
                        Press <Kbd>?</Kbd> anytime to show this help
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Hook to manage keyboard shortcuts modal visibility
 * Opens when user presses "?" key
 */
export function useKeyboardShortcutsModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check if user pressed "?" (Shift + /)
            if (event.key === "?" && !isInputElement(event.target as Element)) {
                event.preventDefault();
                setOpen(true);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    return { open, setOpen };
}

function isInputElement(element: Element | null): boolean {
    if (!element) return false;
    const tagName = element.tagName.toLowerCase();
    return tagName === "input" || tagName === "textarea" || tagName === "select" ||
        element.getAttribute("contenteditable") === "true";
}

export default KeyboardShortcutsModal;
