"use client";

import { useEffect, useCallback } from "react";

/**
 * Key prefix for storing scroll positions in sessionStorage
 */
const SCROLL_POSITION_KEY_PREFIX = "scroll_position_";

/**
 * Hook to save and restore scroll position for a specific page
 * Uses sessionStorage to persist scroll position across navigation
 * 
 * @param pageKey - Unique identifier for the page (e.g., video ID)
 * @returns Object with saveScrollPosition and restoreScrollPosition functions
 * 
 * @validates Requirements 12.2 - Preserve user's position when navigating back
 */
export function useScrollPosition(pageKey: string) {
    const storageKey = `${SCROLL_POSITION_KEY_PREFIX}${pageKey}`;

    /**
     * Save the current scroll position to sessionStorage
     */
    const saveScrollPosition = useCallback(() => {
        if (typeof window === "undefined") return;

        const scrollPosition = window.scrollY;
        try {
            sessionStorage.setItem(storageKey, String(scrollPosition));
        } catch (error) {
            // sessionStorage might be unavailable in some contexts
            console.warn("Failed to save scroll position:", error);
        }
    }, [storageKey]);

    /**
     * Restore the scroll position from sessionStorage
     */
    const restoreScrollPosition = useCallback(() => {
        if (typeof window === "undefined") return;

        try {
            const savedPosition = sessionStorage.getItem(storageKey);
            if (savedPosition !== null) {
                const position = parseInt(savedPosition, 10);
                if (!isNaN(position)) {
                    // Use requestAnimationFrame to ensure DOM is ready
                    requestAnimationFrame(() => {
                        window.scrollTo(0, position);
                    });
                }
            }
        } catch (error) {
            console.warn("Failed to restore scroll position:", error);
        }
    }, [storageKey]);

    /**
     * Clear the saved scroll position
     */
    const clearScrollPosition = useCallback(() => {
        if (typeof window === "undefined") return;

        try {
            sessionStorage.removeItem(storageKey);
        } catch (error) {
            console.warn("Failed to clear scroll position:", error);
        }
    }, [storageKey]);

    return {
        saveScrollPosition,
        restoreScrollPosition,
        clearScrollPosition,
    };
}

/**
 * Hook to automatically restore scroll position on mount
 * and save it before navigation
 * 
 * @param pageKey - Unique identifier for the page
 * 
 * @validates Requirements 12.2 - Preserve user's position when navigating back
 */
export function useAutoScrollRestore(pageKey: string) {
    const { saveScrollPosition, restoreScrollPosition } = useScrollPosition(pageKey);

    // Restore scroll position on mount
    useEffect(() => {
        restoreScrollPosition();
    }, [restoreScrollPosition]);

    // Save scroll position before unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            saveScrollPosition();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [saveScrollPosition]);

    return { saveScrollPosition };
}

/**
 * Save scroll position for a specific page key
 * Utility function for use outside of React components
 * 
 * @param pageKey - Unique identifier for the page
 */
export function savePageScrollPosition(pageKey: string) {
    if (typeof window === "undefined") return;

    const storageKey = `${SCROLL_POSITION_KEY_PREFIX}${pageKey}`;
    try {
        sessionStorage.setItem(storageKey, String(window.scrollY));
    } catch (error) {
        console.warn("Failed to save scroll position:", error);
    }
}

/**
 * Get the saved scroll position for a specific page key
 * 
 * @param pageKey - Unique identifier for the page
 * @returns The saved scroll position or null if not found
 */
export function getSavedScrollPosition(pageKey: string): number | null {
    if (typeof window === "undefined") return null;

    const storageKey = `${SCROLL_POSITION_KEY_PREFIX}${pageKey}`;
    try {
        const savedPosition = sessionStorage.getItem(storageKey);
        if (savedPosition !== null) {
            const position = parseInt(savedPosition, 10);
            return isNaN(position) ? null : position;
        }
    } catch (error) {
        console.warn("Failed to get scroll position:", error);
    }
    return null;
}
