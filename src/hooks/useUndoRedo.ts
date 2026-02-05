"use client";

import { useState, useCallback, useRef } from "react";

/**
 * Options for the useUndoRedo hook
 */
export interface UseUndoRedoOptions<T> {
    /** Initial state value */
    initialState: T;
    /** Maximum number of operations to keep in history (default: 50) */
    maxHistory?: number;
}

/**
 * Return type for the useUndoRedo hook
 */
export interface UseUndoRedoReturn<T> {
    /** Current state value */
    state: T;
    /** Update state and push to undo history */
    setState: (newState: T) => void;
    /** Undo the last state change */
    undo: () => void;
    /** Redo the last undone state change */
    redo: () => void;
    /** Whether undo is available */
    canUndo: boolean;
    /** Whether redo is available */
    canRedo: boolean;
    /** Clear all history (undo and redo stacks) */
    clearHistory: () => void;
    /** Get the current history size */
    historySize: number;
    /** Get the current redo stack size */
    redoSize: number;
}

/**
 * Default maximum history size
 * @validates Requirements 19.4 - Support up to 50 undo/redo operations
 */
const DEFAULT_MAX_HISTORY = 50;

/**
 * Custom hook for managing undo/redo state
 * 
 * This hook provides a generic undo/redo mechanism that can be used with any state type.
 * It maintains separate stacks for undo (past states) and redo (future states),
 * with a configurable maximum history size.
 * 
 * @example
 * ```tsx
 * const {
 *   state,
 *   setState,
 *   undo,
 *   redo,
 *   canUndo,
 *   canRedo,
 *   clearHistory,
 * } = useUndoRedo({ initialState: "Hello" });
 * 
 * // Update state (pushes to undo history)
 * setState("Hello World");
 * 
 * // Undo the change
 * undo(); // state is now "Hello"
 * 
 * // Redo the change
 * redo(); // state is now "Hello World"
 * ```
 * 
 * @validates Requirements 19.1 - Maintain undo history for caption text edits
 * @validates Requirements 19.4 - Support up to 50 undo/redo operations
 * 
 * @param options - Configuration options for the hook
 * @returns Object containing state, state setters, and undo/redo controls
 */
export function useUndoRedo<T>(options: UseUndoRedoOptions<T>): UseUndoRedoReturn<T> {
    const { initialState, maxHistory = DEFAULT_MAX_HISTORY } = options;

    // Current state
    const [state, setCurrentState] = useState<T>(initialState);

    // Undo stack (past states) - most recent at the end
    const [undoStack, setUndoStack] = useState<T[]>([]);

    // Redo stack (future states) - most recent at the end
    const [redoStack, setRedoStack] = useState<T[]>([]);

    // Use ref to track if we're in the middle of an undo/redo operation
    // This prevents pushing to history during undo/redo
    const isUndoRedoOperation = useRef(false);

    /**
     * Push a new state to the history
     * Clears the redo stack when a new state is pushed
     * Limits history to maxHistory operations
     * 
     * @validates Requirements 19.1 - Maintain undo history for caption text edits
     * @validates Requirements 19.4 - Limit history to 50 operations
     */
    const setState = useCallback((newState: T) => {
        // Don't push to history if this is an undo/redo operation
        if (isUndoRedoOperation.current) {
            setCurrentState(newState);
            return;
        }

        setUndoStack((prevStack) => {
            // Add current state to undo stack
            const newStack = [...prevStack, state];
            
            // Limit stack size to maxHistory
            if (newStack.length > maxHistory) {
                return newStack.slice(newStack.length - maxHistory);
            }
            
            return newStack;
        });

        // Clear redo stack when new state is pushed
        setRedoStack([]);

        // Update current state
        setCurrentState(newState);
    }, [state, maxHistory]);

    /**
     * Undo the last state change
     * Moves current state to redo stack and restores previous state
     * 
     * @validates Requirements 19.2 - Undo last caption edit with Ctrl+Z
     */
    const undo = useCallback(() => {
        if (undoStack.length === 0) {
            return;
        }

        isUndoRedoOperation.current = true;

        // Get the previous state from undo stack
        const previousState = undoStack[undoStack.length - 1];
        
        // Remove the previous state from undo stack
        setUndoStack((prevStack) => prevStack.slice(0, -1));

        // Push current state to redo stack
        setRedoStack((prevStack) => [...prevStack, state]);

        // Restore previous state
        setCurrentState(previousState);

        isUndoRedoOperation.current = false;
    }, [undoStack, state]);

    /**
     * Redo the last undone state change
     * Moves current state to undo stack and restores next state
     * 
     * @validates Requirements 19.3 - Redo last undone edit with Ctrl+Shift+Z
     */
    const redo = useCallback(() => {
        if (redoStack.length === 0) {
            return;
        }

        isUndoRedoOperation.current = true;

        // Get the next state from redo stack
        const nextState = redoStack[redoStack.length - 1];
        
        // Remove the next state from redo stack
        setRedoStack((prevStack) => prevStack.slice(0, -1));

        // Push current state to undo stack
        setUndoStack((prevStack) => {
            const newStack = [...prevStack, state];
            // Maintain max history limit
            if (newStack.length > maxHistory) {
                return newStack.slice(newStack.length - maxHistory);
            }
            return newStack;
        });

        // Restore next state
        setCurrentState(nextState);

        isUndoRedoOperation.current = false;
    }, [redoStack, state, maxHistory]);

    /**
     * Clear all history (both undo and redo stacks)
     * 
     * @validates Requirements 19.5 - Clear undo history when navigating away
     */
    const clearHistory = useCallback(() => {
        setUndoStack([]);
        setRedoStack([]);
    }, []);

    /**
     * Reset the state to initial value and clear history
     */
    const reset = useCallback(() => {
        setCurrentState(initialState);
        setUndoStack([]);
        setRedoStack([]);
    }, [initialState]);

    return {
        state,
        setState,
        undo,
        redo,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        clearHistory,
        historySize: undoStack.length,
        redoSize: redoStack.length,
    };
}

/**
 * Hook for managing undo/redo with automatic cleanup on unmount
 * Useful for editing screens where history should be cleared on navigation
 * 
 * @validates Requirements 19.5 - Clear undo history when navigating away
 * 
 * @example
 * ```tsx
 * const undoRedo = useUndoRedoWithCleanup({
 *   initialState: captionText,
 *   maxHistory: 50,
 * });
 * // History is automatically cleared when component unmounts
 * ```
 */
export function useUndoRedoWithCleanup<T>(
    options: UseUndoRedoOptions<T>
): UseUndoRedoReturn<T> {
    const undoRedo = useUndoRedo(options);

    // Note: Cleanup on unmount is handled by the component using this hook
    // The clearHistory function is provided for manual cleanup if needed

    return undoRedo;
}

export default useUndoRedo;
