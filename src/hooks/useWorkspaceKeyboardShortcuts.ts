"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Configuration for workspace keyboard shortcuts
 */
export interface WorkspaceShortcutsConfig {
  /** Current workspace slug for navigation */
  workspaceSlug: string;
  /** Whether shortcuts are enabled */
  enabled?: boolean;
  /** Callback when create project shortcut is triggered */
  onCreateProject?: () => void;
  /** Callback when quick search shortcut is triggered */
  onQuickSearch?: () => void;
  /** Callback when keyboard shortcuts help is triggered */
  onShowShortcuts?: () => void;
  /** Video player controls (optional - only active on pages with video) */
  videoControls?: {
    onPlayPause?: () => void;
    onSeekBackward?: () => void;
    onSeekForward?: () => void;
    onToggleMute?: () => void;
    onToggleFullscreen?: () => void;
  };
}

/**
 * Return type for the hook
 */
export interface WorkspaceShortcutsReturn {
  /** Whether a sequence is in progress (e.g., "G" was pressed, waiting for next key) */
  sequenceInProgress: boolean;
  /** The current sequence prefix (e.g., "g" if G was pressed) */
  currentSequence: string | null;
}

/**
 * Check if the active element is an input-like element where shortcuts should be ignored
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const isInput = tagName === "input" || tagName === "textarea" || tagName === "select";
  const isContentEditable = element.getAttribute("contenteditable") === "true";

  // Also check for specific roles that indicate editable content
  const role = element.getAttribute("role");
  const isEditableRole = role === "textbox" || role === "searchbox";

  return isInput || isContentEditable || isEditableRole;
}

/**
 * Sequence timeout in milliseconds
 * User must press the second key within this time after the first key
 */
const SEQUENCE_TIMEOUT = 1000;

/**
 * Hook for workspace-level keyboard shortcuts
 *
 * Handles:
 * - Navigation: G+D (dashboard), G+P (projects), G+S (settings)
 * - Actions: C (create project), Ctrl+K (quick search)
 * - Playback: Space (play/pause), arrows (seek), M (mute), F (fullscreen)
 *
 * @example
 * ```tsx
 * const { sequenceInProgress } = useWorkspaceKeyboardShortcuts({
 *   workspaceSlug: "my-workspace",
 *   onCreateProject: () => setCreateDialogOpen(true),
 *   onQuickSearch: () => setSearchOpen(true),
 * });
 * ```
 *
 * @validates Requirements 33.1, 33.2, 33.3, 33.4
 */
export function useWorkspaceKeyboardShortcuts(
  config: WorkspaceShortcutsConfig
): WorkspaceShortcutsReturn {
  const {
    workspaceSlug,
    enabled = true,
    onCreateProject,
    onQuickSearch,
    onShowShortcuts,
    videoControls,
  } = config;

  const router = useRouter();

  // Track sequence state
  const [sequenceInProgress, setSequenceInProgress] = useState(false);
  const [currentSequence, setCurrentSequence] = useState<string | null>(null);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear sequence state
  const clearSequence = useCallback(() => {
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
    setSequenceInProgress(false);
    setCurrentSequence(null);
  }, []);

  // Start a sequence (e.g., when "G" is pressed)
  const startSequence = useCallback((prefix: string) => {
    clearSequence();
    setSequenceInProgress(true);
    setCurrentSequence(prefix);

    // Auto-clear after timeout
    sequenceTimeoutRef.current = setTimeout(() => {
      clearSequence();
    }, SEQUENCE_TIMEOUT);
  }, [clearSequence]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if shortcuts are disabled
      if (!enabled) return;

      // Skip if user is typing in an input
      const activeElement = document.activeElement;
      const isInInput = isInputElement(activeElement);

      const key = event.key.toLowerCase();
      const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
      const hasShift = event.shiftKey;
      const hasAlt = event.altKey;

      // Handle Ctrl+K / Cmd+K for quick search (works even in inputs)
      if ((event.ctrlKey || event.metaKey) && key === "k" && !hasShift && !hasAlt) {
        event.preventDefault();
        onQuickSearch?.();
        clearSequence();
        return;
      }

      // Skip other shortcuts if in input
      if (isInInput) return;

      // Handle "?" for keyboard shortcuts help
      if (event.key === "?" || (hasShift && key === "/")) {
        event.preventDefault();
        onShowShortcuts?.();
        clearSequence();
        return;
      }

      // Handle sequence shortcuts (G + something)
      if (currentSequence === "g") {
        event.preventDefault();
        clearSequence();

        switch (key) {
          case "d":
            // G+D: Go to Dashboard
            router.push(`/${workspaceSlug}`);
            break;
          case "p":
            // G+P: Go to Projects (dashboard with projects tab)
            router.push(`/${workspaceSlug}?tab=projects`);
            break;
          case "s":
            // G+S: Go to Settings
            router.push(`/${workspaceSlug}/settings`);
            break;
          default:
            // Unknown sequence, ignore
            break;
        }
        return;
      }

      // Start "G" sequence for navigation
      if (key === "g" && !hasCtrlOrMeta && !hasShift && !hasAlt) {
        event.preventDefault();
        startSequence("g");
        return;
      }

      // Single key shortcuts (no modifiers)
      if (!hasCtrlOrMeta && !hasShift && !hasAlt) {
        switch (key) {
          case "c":
            // C: Create new project
            event.preventDefault();
            onCreateProject?.();
            clearSequence();
            return;

          case " ":
            // Space: Play/Pause video
            if (videoControls?.onPlayPause) {
              event.preventDefault();
              videoControls.onPlayPause();
            }
            clearSequence();
            return;

          case "arrowleft":
            // Left arrow: Seek backward
            if (videoControls?.onSeekBackward) {
              event.preventDefault();
              videoControls.onSeekBackward();
            }
            clearSequence();
            return;

          case "arrowright":
            // Right arrow: Seek forward
            if (videoControls?.onSeekForward) {
              event.preventDefault();
              videoControls.onSeekForward();
            }
            clearSequence();
            return;

          case "m":
            // M: Toggle mute
            if (videoControls?.onToggleMute) {
              event.preventDefault();
              videoControls.onToggleMute();
            }
            clearSequence();
            return;

          case "f":
            // F: Toggle fullscreen
            if (videoControls?.onToggleFullscreen) {
              event.preventDefault();
              videoControls.onToggleFullscreen();
            }
            clearSequence();
            return;

          default:
            // Unknown key, clear any sequence
            clearSequence();
            break;
        }
      }

      // Ctrl+S: Save (prevent default browser save dialog)
      if (hasCtrlOrMeta && key === "s" && !hasShift && !hasAlt) {
        event.preventDefault();
        // Save is typically handled by individual components
        clearSequence();
        return;
      }
    },
    [
      enabled,
      currentSequence,
      workspaceSlug,
      router,
      onCreateProject,
      onQuickSearch,
      onShowShortcuts,
      videoControls,
      clearSequence,
      startSequence,
    ]
  );

  // Set up event listener
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [enabled, handleKeyDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, []);

  return {
    sequenceInProgress,
    currentSequence,
  };
}

export default useWorkspaceKeyboardShortcuts;
