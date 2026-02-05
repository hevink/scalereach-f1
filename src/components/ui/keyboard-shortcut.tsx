"use client";

import { IconKeyboard, IconX } from "@tabler/icons-react";
import {
  Fragment,
  type HTMLAttributes,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Props for the KeyboardShortcut component
 */
export interface KeyboardShortcutProps extends HTMLAttributes<HTMLElement> {
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
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      {...props}
    >
      {parts.map((part, index) => (
        <Fragment key={part}>
          <kbd
            className={cn(
              "inline-flex items-center justify-center rounded border font-medium font-mono",
              "border-muted-foreground/20 bg-muted/50 text-muted-foreground",
              size === "sm"
                ? "h-4 min-w-5 px-1 text-[10px]"
                : "h-5 min-w-6 px-1.5 text-xs"
            )}
          >
            {part}
          </kbd>
          {index < parts.length - 1 && (
            <span className="text-[10px] text-muted-foreground/50">+</span>
          )}
        </Fragment>
      ))}
    </span>
  );
}

/**
 * Props for the ShortcutHint component
 */
export interface ShortcutHintProps extends HTMLAttributes<HTMLSpanElement> {
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
export interface ShortcutsListProps extends HTMLAttributes<HTMLDivElement> {
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

/**
 * Shortcut category definition for grouping shortcuts
 */
export interface ShortcutCategory {
  /** Category name */
  name: string;
  /** Array of shortcuts in this category */
  shortcuts: Array<{
    label: string;
    shortcut: string;
    /** Optional description for more context */
    description?: string;
  }>;
}

/**
 * Default keyboard shortcuts organized by category
 * @validates Requirements 14.6 - Keyboard shortcuts help panel
 */
export const DEFAULT_KEYBOARD_SHORTCUTS: ShortcutCategory[] = [
  {
    name: "Playback",
    shortcuts: [
      {
        label: "Play/Pause",
        shortcut: "Space",
        description: "Toggle video playback",
      },
      {
        label: "Skip backward 5s",
        shortcut: "←",
        description: "Seek backward 5 seconds",
      },
      {
        label: "Skip forward 5s",
        shortcut: "→",
        description: "Seek forward 5 seconds",
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
        label: "Save",
        shortcut: "Ctrl+S",
        description: "Save all pending changes",
      },
      { label: "Undo", shortcut: "Ctrl+Z", description: "Undo last action" },
      {
        label: "Redo",
        shortcut: "Ctrl+Shift+Z",
        description: "Redo last undone action",
      },
    ],
  },
  {
    name: "Navigation",
    shortcuts: [
      {
        label: "Close modal/Exit fullscreen",
        shortcut: "Esc",
        description: "Close dialogs or exit fullscreen",
      },
      {
        label: "Show keyboard shortcuts",
        shortcut: "?",
        description: "Display this help panel",
      },
    ],
  },
];

/**
 * Props for the KeyboardShortcutsHelp component
 */
export interface KeyboardShortcutsHelpProps {
  /** Whether the help panel is open */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Custom shortcut categories to display (defaults to DEFAULT_KEYBOARD_SHORTCUTS) */
  categories?: ShortcutCategory[];
  /** Whether to enable the "?" key to open the panel */
  enableShortcut?: boolean;
  /** Additional class name for the dialog content */
  className?: string;
}

/**
 * KeyboardShortcutsHelp - A modal dialog displaying available keyboard shortcuts
 *
 * This component displays a help panel with all available keyboard shortcuts,
 * organized by category. It can be opened via the "?" key (Shift + /) or
 * controlled programmatically.
 *
 * @example
 * ```tsx
 * // Uncontrolled - opens with "?" key
 * <KeyboardShortcutsHelp />
 *
 * // Controlled
 * const [open, setOpen] = useState(false);
 * <KeyboardShortcutsHelp open={open} onOpenChange={setOpen} />
 *
 * // Custom shortcuts
 * <KeyboardShortcutsHelp
 *   categories={[
 *     {
 *       name: "Custom",
 *       shortcuts: [{ label: "Custom action", shortcut: "Ctrl+K" }]
 *     }
 *   ]}
 * />
 * ```
 *
 * @validates Requirements 14.6 - Display keyboard shortcuts help panel accessible via "?" key
 */
export function KeyboardShortcutsHelp({
  open: controlledOpen,
  onOpenChange,
  categories = DEFAULT_KEYBOARD_SHORTCUTS,
  enableShortcut = true,
  className,
}: KeyboardShortcutsHelpProps) {
  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(false);

  // Determine if controlled or uncontrolled
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  /**
   * Handle keyboard shortcut to open help panel
   * Listens for "?" key (Shift + /)
   * @validates Requirements 14.6 - Accessible via "?" key
   */
  useEffect(() => {
    if (!enableShortcut) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for "?" key (Shift + / or Shift + ?)
      // Different keyboards may report this differently
      const isQuestionMark =
        (event.key === "?" && event.shiftKey) ||
        (event.key === "/" && event.shiftKey) ||
        event.key === "?";

      // Don't trigger if user is typing in an input
      const activeElement = document.activeElement;
      const isInInput =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isQuestionMark && !isInInput) {
        event.preventDefault();
        handleOpenChange(!isOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enableShortcut, isOpen, handleOpenChange]);

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogContent
        aria-describedby="keyboard-shortcuts-description"
        className={cn("sm:max-w-lg", className)}
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <IconKeyboard className="h-5 w-5 text-muted-foreground" />
            <DialogTitle className="font-semibold text-lg">
              Keyboard Shortcuts
            </DialogTitle>
          </div>
          <Button
            aria-label="Close keyboard shortcuts help"
            onClick={() => handleOpenChange(false)}
            size="icon-sm"
            variant="ghost"
          >
            <IconX className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <DialogDescription
          className="sr-only"
          id="keyboard-shortcuts-description"
        >
          A list of available keyboard shortcuts organized by category
        </DialogDescription>

        <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-2">
          {categories.map((category) => (
            <div className="space-y-3" key={category.name}>
              <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
                {category.name}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map(({ label, shortcut, description }) => (
                  <div
                    className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                    key={`${label}-${shortcut}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{label}</span>
                      {description && (
                        <span className="text-muted-foreground text-xs">
                          {description}
                        </span>
                      )}
                    </div>
                    <KeyboardShortcut shortcut={shortcut} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-border border-t pt-4">
          <p className="text-center text-muted-foreground text-xs">
            Press <KeyboardShortcut shortcut="?" size="sm" /> to toggle this
            help panel
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage keyboard shortcuts help panel state
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle } = useKeyboardShortcutsHelp();
 *
 * return (
 *   <>
 *     <Button onClick={open}>Show Shortcuts</Button>
 *     <KeyboardShortcutsHelp open={isOpen} onOpenChange={toggle} />
 *   </>
 * );
 * ```
 */
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
}

export default KeyboardShortcut;
