"use client";

import { useEffect, useCallback, useRef } from "react";

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
    /** The key to listen for (e.g., "Space", "Escape", "Enter", "ArrowLeft") */
    key: string;
    /** Optional modifier keys */
    modifiers?: {
        ctrl?: boolean;
        shift?: boolean;
        alt?: boolean;
        meta?: boolean;
    };
    /** Handler function to call when shortcut is triggered */
    handler: (event: KeyboardEvent) => void;
    /** Whether to prevent default browser behavior */
    preventDefault?: boolean;
    /** Description of the shortcut for display purposes */
    description?: string;
    /** Whether the shortcut should work when an input is focused */
    allowInInput?: boolean;
}

/**
 * Options for the useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsOptions {
    /** Whether shortcuts are enabled */
    enabled?: boolean;
    /** Element to attach listeners to (defaults to document) */
    target?: HTMLElement | null;
    /** Whether to capture events in the capture phase */
    capture?: boolean;
}

/**
 * Check if the active element is an input-like element
 */
function isInputElement(element: Element | null): boolean {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const isInput = tagName === "input" || tagName === "textarea" || tagName === "select";
    const isContentEditable = element.getAttribute("contenteditable") === "true";
    
    return isInput || isContentEditable;
}

/**
 * Check if modifiers match
 */
function modifiersMatch(
    event: KeyboardEvent,
    modifiers?: KeyboardShortcut["modifiers"]
): boolean {
    if (!modifiers) {
        // If no modifiers specified, ensure none are pressed
        return !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
    }
    
    return (
        (modifiers.ctrl ?? false) === event.ctrlKey &&
        (modifiers.shift ?? false) === event.shiftKey &&
        (modifiers.alt ?? false) === event.altKey &&
        (modifiers.meta ?? false) === event.metaKey
    );
}

/**
 * Normalize key names for comparison
 */
function normalizeKey(key: string): string {
    const keyMap: Record<string, string> = {
        " ": "Space",
        "Spacebar": "Space",
        "Esc": "Escape",
        "Up": "ArrowUp",
        "Down": "ArrowDown",
        "Left": "ArrowLeft",
        "Right": "ArrowRight",
    };
    
    return keyMap[key] || key;
}

/**
 * Hook for managing keyboard shortcuts
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: "Escape",
 *     handler: () => closeModal(),
 *     description: "Close modal",
 *   },
 *   {
 *     key: "Enter",
 *     handler: () => confirmAction(),
 *     description: "Confirm action",
 *   },
 *   {
 *     key: "s",
 *     modifiers: { ctrl: true },
 *     handler: () => save(),
 *     preventDefault: true,
 *     description: "Save",
 *   },
 * ]);
 * ```
 * 
 * @validates Requirements 33.1, 33.2, 33.3
 */
export function useKeyboardShortcuts(
    shortcuts: KeyboardShortcut[],
    options: UseKeyboardShortcutsOptions = {}
): void {
    const { enabled = true, target = null, capture = false } = options;
    
    // Use ref to avoid recreating handler on every render
    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;
    
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const activeElement = document.activeElement;
        const isInInput = isInputElement(activeElement);
        
        for (const shortcut of shortcutsRef.current) {
            // Skip if in input and not allowed
            if (isInInput && !shortcut.allowInInput) {
                continue;
            }
            
            // Check if key matches
            const normalizedEventKey = normalizeKey(event.key);
            const normalizedShortcutKey = normalizeKey(shortcut.key);
            
            if (normalizedEventKey.toLowerCase() !== normalizedShortcutKey.toLowerCase()) {
                continue;
            }
            
            // Check if modifiers match
            if (!modifiersMatch(event, shortcut.modifiers)) {
                continue;
            }
            
            // Execute handler
            if (shortcut.preventDefault) {
                event.preventDefault();
            }
            
            shortcut.handler(event);
            break; // Only handle first matching shortcut
        }
    }, []);
    
    useEffect(() => {
        if (!enabled) return;
        
        const targetElement = target || document;
        
        targetElement.addEventListener("keydown", handleKeyDown as EventListener, { capture });
        
        return () => {
            targetElement.removeEventListener("keydown", handleKeyDown as EventListener, { capture });
        };
    }, [enabled, target, capture, handleKeyDown]);
}

/**
 * Hook for modal keyboard shortcuts (Escape to close, Enter to confirm)
 * 
 * @example
 * ```tsx
 * useModalKeyboardShortcuts({
 *   onEscape: () => setOpen(false),
 *   onEnter: () => handleConfirm(),
 *   enabled: isOpen,
 * });
 * ```
 * 
 * @validates Requirements 33.3
 */
export function useModalKeyboardShortcuts(options: {
    onEscape?: () => void;
    onEnter?: () => void;
    enabled?: boolean;
}): void {
    const { onEscape, onEnter, enabled = true } = options;
    
    const shortcuts: KeyboardShortcut[] = [];
    
    if (onEscape) {
        shortcuts.push({
            key: "Escape",
            handler: onEscape,
            description: "Close",
            allowInInput: true, // Escape should work even in inputs
        });
    }
    
    if (onEnter) {
        shortcuts.push({
            key: "Enter",
            handler: onEnter,
            description: "Confirm",
            allowInInput: false, // Enter in inputs should not trigger confirm
        });
    }
    
    useKeyboardShortcuts(shortcuts, { enabled });
}

/**
 * Format a keyboard shortcut for display
 * 
 * @example
 * formatShortcut({ key: "s", modifiers: { ctrl: true } }) // "Ctrl+S"
 * formatShortcut({ key: "Escape" }) // "Esc"
 */
export function formatShortcut(shortcut: Pick<KeyboardShortcut, "key" | "modifiers">): string {
    const parts: string[] = [];
    
    if (shortcut.modifiers?.ctrl) parts.push("Ctrl");
    if (shortcut.modifiers?.alt) parts.push("Alt");
    if (shortcut.modifiers?.shift) parts.push("Shift");
    if (shortcut.modifiers?.meta) parts.push("⌘");
    
    // Format key for display
    const keyDisplayMap: Record<string, string> = {
        "Space": "Space",
        "Escape": "Esc",
        "Enter": "Enter",
        "ArrowUp": "↑",
        "ArrowDown": "↓",
        "ArrowLeft": "←",
        "ArrowRight": "→",
        "Backspace": "⌫",
        "Delete": "Del",
        "Tab": "Tab",
    };
    
    const displayKey = keyDisplayMap[shortcut.key] || shortcut.key.toUpperCase();
    parts.push(displayKey);
    
    return parts.join("+");
}

/**
 * Common keyboard shortcuts used across the application
 * 
 * @validates Requirements 33.1, 33.2, 33.3, 33.4
 */
export const KEYBOARD_SHORTCUTS = {
    // Video player shortcuts (Requirement 33.1)
    VIDEO_PLAY_PAUSE: { key: "Space", description: "Play/Pause" },
    VIDEO_SEEK_BACKWARD: { key: "ArrowLeft", description: "Seek backward 5s" },
    VIDEO_SEEK_FORWARD: { key: "ArrowRight", description: "Seek forward 5s" },
    VIDEO_MUTE: { key: "m", description: "Toggle mute" },
    VIDEO_FULLSCREEN: { key: "f", description: "Toggle fullscreen" },
    
    // Timeline editor shortcuts (Requirement 33.2)
    TIMELINE_FINE_LEFT: { key: "ArrowLeft", description: "Fine adjustment left" },
    TIMELINE_FINE_RIGHT: { key: "ArrowRight", description: "Fine adjustment right" },
    TIMELINE_COARSE_LEFT: { key: "ArrowLeft", modifiers: { shift: true }, description: "1s adjustment left" },
    TIMELINE_COARSE_RIGHT: { key: "ArrowRight", modifiers: { shift: true }, description: "1s adjustment right" },
    
    // Modal shortcuts (Requirement 33.3)
    MODAL_CLOSE: { key: "Escape", description: "Close" },
    MODAL_CONFIRM: { key: "Enter", description: "Confirm" },
    
    // General shortcuts
    UNDO: { key: "z", modifiers: { ctrl: true }, description: "Undo" },
    REDO: { key: "z", modifiers: { ctrl: true, shift: true }, description: "Redo" },
    SAVE: { key: "s", modifiers: { ctrl: true }, description: "Save" },
} as const;

export default useKeyboardShortcuts;
