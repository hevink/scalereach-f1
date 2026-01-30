"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useWorkspaceKeyboardShortcuts } from "@/hooks/useWorkspaceKeyboardShortcuts";
import { KeyboardShortcutsHelp, type ShortcutCategory } from "@/components/ui/keyboard-shortcut";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import { useRouter } from "next/navigation";

/**
 * Workspace-level keyboard shortcuts organized by category
 */
const WORKSPACE_KEYBOARD_SHORTCUTS: ShortcutCategory[] = [
  {
    name: "Navigation",
    shortcuts: [
      {
        label: "Go to Dashboard",
        shortcut: "G+D",
        description: "Navigate to workspace dashboard",
      },
      {
        label: "Go to Projects",
        shortcut: "G+P",
        description: "Navigate to projects list",
      },
      {
        label: "Go to Settings",
        shortcut: "G+S",
        description: "Navigate to workspace settings",
      },
      {
        label: "Close modal / Go back",
        shortcut: "Esc",
        description: "Close dialogs or navigate back",
      },
      {
        label: "Show keyboard shortcuts",
        shortcut: "?",
        description: "Display this help panel",
      },
    ],
  },
  {
    name: "Actions",
    shortcuts: [
      {
        label: "Create new project",
        shortcut: "C",
        description: "Open new project dialog",
      },
      {
        label: "Quick search",
        shortcut: "Ctrl+K",
        description: "Open command palette / search",
      },
      {
        label: "Save",
        shortcut: "Ctrl+S",
        description: "Save current changes",
      },
    ],
  },
  {
    name: "Playback",
    shortcuts: [
      {
        label: "Play / Pause",
        shortcut: "Space",
        description: "Toggle video playback",
      },
      {
        label: "Seek backward 5s",
        shortcut: "←",
        description: "Skip back 5 seconds",
      },
      {
        label: "Seek forward 5s",
        shortcut: "→",
        description: "Skip forward 5 seconds",
      },
      {
        label: "Toggle mute",
        shortcut: "M",
        description: "Mute or unmute audio",
      },
      {
        label: "Toggle fullscreen",
        shortcut: "F",
        description: "Enter or exit fullscreen mode",
      },
    ],
  },
  {
    name: "Editing",
    shortcuts: [
      {
        label: "Undo",
        shortcut: "Ctrl+Z",
        description: "Undo last action",
      },
      {
        label: "Redo",
        shortcut: "Ctrl+Shift+Z",
        description: "Redo last undone action",
      },
      {
        label: "Fine adjustment left",
        shortcut: "←",
        description: "Move timeline selection left",
      },
      {
        label: "Fine adjustment right",
        shortcut: "→",
        description: "Move timeline selection right",
      },
      {
        label: "1 second left",
        shortcut: "Shift+←",
        description: "Move timeline 1 second left",
      },
      {
        label: "1 second right",
        shortcut: "Shift+→",
        description: "Move timeline 1 second right",
      },
    ],
  },
];

/**
 * Video controls interface for playback shortcuts
 */
export interface VideoControls {
  onPlayPause?: () => void;
  onSeekBackward?: () => void;
  onSeekForward?: () => void;
  onToggleMute?: () => void;
  onToggleFullscreen?: () => void;
}

/**
 * Context value for workspace shortcuts
 */
interface WorkspaceShortcutsContextValue {
  /** Open the create project dialog */
  openCreateProjectDialog: () => void;
  /** Close the create project dialog */
  closeCreateProjectDialog: () => void;
  /** Whether the create project dialog is open */
  isCreateProjectDialogOpen: boolean;
  /** Open the keyboard shortcuts help */
  openShortcutsHelp: () => void;
  /** Close the keyboard shortcuts help */
  closeShortcutsHelp: () => void;
  /** Whether the shortcuts help is open */
  isShortcutsHelpOpen: boolean;
  /** Open the quick search / command palette */
  openQuickSearch: () => void;
  /** Close the quick search / command palette */
  closeQuickSearch: () => void;
  /** Whether the quick search is open */
  isQuickSearchOpen: boolean;
  /** Register video controls for playback shortcuts */
  registerVideoControls: (controls: VideoControls | null) => void;
  /** Whether a keyboard sequence is in progress */
  sequenceInProgress: boolean;
  /** Current sequence prefix (e.g., "g") */
  currentSequence: string | null;
}

const WorkspaceShortcutsContext = createContext<WorkspaceShortcutsContextValue | null>(null);

/**
 * Hook to access workspace shortcuts context
 */
export function useWorkspaceShortcuts() {
  const context = useContext(WorkspaceShortcutsContext);
  if (!context) {
    throw new Error("useWorkspaceShortcuts must be used within a WorkspaceShortcutsProvider");
  }
  return context;
}

/**
 * Props for WorkspaceShortcutsProvider
 */
interface WorkspaceShortcutsProviderProps {
  children: ReactNode;
  workspaceSlug: string;
  workspaceId: string;
}

/**
 * WorkspaceShortcutsProvider
 *
 * Provides keyboard shortcuts functionality across the workspace.
 * Handles navigation shortcuts, action shortcuts, and playback controls.
 *
 * @example
 * ```tsx
 * <WorkspaceShortcutsProvider workspaceSlug="my-workspace" workspaceId="123">
 *   <YourWorkspaceContent />
 * </WorkspaceShortcutsProvider>
 * ```
 *
 * @validates Requirements 33.1, 33.2, 33.3, 33.4
 */
export function WorkspaceShortcutsProvider({
  children,
  workspaceSlug,
  workspaceId,
}: WorkspaceShortcutsProviderProps) {
  const router = useRouter();

  // Dialog states
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);

  // Video controls (registered by video player components)
  const [videoControls, setVideoControls] = useState<VideoControls | null>(null);

  // Dialog handlers
  const openCreateProjectDialog = useCallback(() => setIsCreateProjectDialogOpen(true), []);
  const closeCreateProjectDialog = useCallback(() => setIsCreateProjectDialogOpen(false), []);
  const openShortcutsHelp = useCallback(() => setIsShortcutsHelpOpen(true), []);
  const closeShortcutsHelp = useCallback(() => setIsShortcutsHelpOpen(false), []);
  const openQuickSearch = useCallback(() => setIsQuickSearchOpen(true), []);
  const closeQuickSearch = useCallback(() => setIsQuickSearchOpen(false), []);

  // Register video controls
  const registerVideoControls = useCallback((controls: VideoControls | null) => {
    setVideoControls(controls);
  }, []);

  // Initialize keyboard shortcuts
  const { sequenceInProgress, currentSequence } = useWorkspaceKeyboardShortcuts({
    workspaceSlug,
    enabled: true,
    onCreateProject: openCreateProjectDialog,
    onQuickSearch: openQuickSearch,
    onShowShortcuts: openShortcutsHelp,
    videoControls: videoControls || undefined,
  });

  // Handle project creation success
  const handleProjectCreated = useCallback(
    (project: { id: string; name: string }) => {
      router.push(`/${workspaceSlug}/projects/${project.id}`);
    },
    [router, workspaceSlug]
  );

  const contextValue: WorkspaceShortcutsContextValue = {
    openCreateProjectDialog,
    closeCreateProjectDialog,
    isCreateProjectDialogOpen,
    openShortcutsHelp,
    closeShortcutsHelp,
    isShortcutsHelpOpen,
    openQuickSearch,
    closeQuickSearch,
    isQuickSearchOpen,
    registerVideoControls,
    sequenceInProgress,
    currentSequence,
  };

  return (
    <WorkspaceShortcutsContext.Provider value={contextValue}>
      {children}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        workspaceId={workspaceId}
        onSuccess={handleProjectCreated}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        open={isShortcutsHelpOpen}
        onOpenChange={setIsShortcutsHelpOpen}
        categories={WORKSPACE_KEYBOARD_SHORTCUTS}
        enableShortcut={false} // We handle the "?" shortcut ourselves
      />

      {/* Quick Search / Command Palette Placeholder */}
      {/* TODO: Implement command palette component */}
      {isQuickSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50"
          onClick={closeQuickSearch}
          onKeyDown={(e) => e.key === "Escape" && closeQuickSearch()}
        >
          <div
            className="w-full max-w-lg bg-background border rounded-lg shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              placeholder="Search or type a command..."
              className="w-full bg-transparent border-none outline-none text-lg"
              autoFocus
              onKeyDown={(e) => e.key === "Escape" && closeQuickSearch()}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd> to close
            </p>
          </div>
        </div>
      )}
    </WorkspaceShortcutsContext.Provider>
  );
}

export default WorkspaceShortcutsProvider;
