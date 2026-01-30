"use client";

import {
    IconHighlight,
    IconCheck,
    IconX,
    IconPlus,
} from "@tabler/icons-react";
import { useCallback, useId, useState, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CaptionStyle, CaptionWord } from "@/lib/api/captions";
import { cn } from "@/lib/utils";

/**
 * Default highlight color preset options
 */
const HIGHLIGHT_PRESET_COLORS = [
    "#FFFF00", // Yellow
    "#00FF00", // Green
    "#FF6B6B", // Coral
    "#4ECDC4", // Teal
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FF9500", // Orange
    "#FF2D55", // Pink
];

/**
 * WordHighlightControlsProps interface
 *
 * @validates Requirements 15.1, 15.2, 15.3, 15.4
 */
export interface WordHighlightControlsProps {
    /** Current caption style configuration */
    style: CaptionStyle;
    /** Callback when style changes */
    onStyleChange: (style: CaptionStyle) => void;
    /** Caption words for keyword selection */
    words?: CaptionWord[];
    /** Callback when word highlight state changes */
    onWordsChange?: (words: CaptionWord[]) => void;
    /** Additional className */
    className?: string;
    /** Whether the controls are disabled */
    disabled?: boolean;
}

/**
 * SwitchField Component
 *
 * A labeled switch toggle for highlight enable/disable
 */
interface SwitchFieldProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
    disabled?: boolean;
}

function SwitchField({
    checked,
    onChange,
    label,
    description,
    disabled,
}: SwitchFieldProps) {
    const id = useId();

    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <IconHighlight className="size-4 text-muted-foreground" aria-hidden="true" />
                <div className="flex flex-col">
                    <Label className="font-medium text-foreground text-sm" htmlFor={id}>
                        {label}
                    </Label>
                    {description && (
                        <span className="text-muted-foreground text-xs">{description}</span>
                    )}
                </div>
            </div>
            <Switch
                aria-label={label}
                checked={checked}
                disabled={disabled}
                id={id}
                onCheckedChange={onChange}
            />
        </div>
    );
}

/**
 * KeywordBadge Component
 *
 * A badge for displaying a highlighted keyword with remove option
 */
interface KeywordBadgeProps {
    word: string;
    onRemove: () => void;
    disabled?: boolean;
    highlightColor?: string;
}

function KeywordBadge({ word, onRemove, disabled, highlightColor }: KeywordBadgeProps) {
    return (
        <Badge
            variant="secondary"
            className={cn(
                "gap-1 pr-1 transition-all",
                disabled && "opacity-50"
            )}
            style={{
                backgroundColor: highlightColor ? `${highlightColor}30` : undefined,
                borderColor: highlightColor || undefined,
            }}
        >
            <span className="max-w-[100px] truncate">{word}</span>
            <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                className={cn(
                    "ml-0.5 rounded-full p-0.5 transition-colors",
                    "hover:bg-destructive/20 hover:text-destructive",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    disabled && "pointer-events-none"
                )}
                aria-label={`Remove ${word} from highlights`}
            >
                <IconX className="size-3" />
            </button>
        </Badge>
    );
}

/**
 * KeywordInput Component
 *
 * Input field for adding new keywords to highlight
 */
interface KeywordInputProps {
    onAdd: (keyword: string) => void;
    disabled?: boolean;
    existingKeywords: string[];
}

function KeywordInput({ onAdd, disabled, existingKeywords }: KeywordInputProps) {
    const [value, setValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const inputId = useId();

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            const trimmedValue = value.trim().toLowerCase();

            if (!trimmedValue) {
                setError("Please enter a keyword");
                return;
            }

            if (existingKeywords.some((k) => k.toLowerCase() === trimmedValue)) {
                setError("Keyword already exists");
                return;
            }

            onAdd(trimmedValue);
            setValue("");
            setError(null);
        },
        [value, onAdd, existingKeywords]
    );

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        setError(null);
    }, []);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex gap-2">
                <div className="flex-1">
                    <Input
                        id={inputId}
                        value={value}
                        onChange={handleChange}
                        placeholder="Enter keyword to highlight..."
                        disabled={disabled}
                        className={cn(
                            "text-sm",
                            error && "border-destructive ring-destructive/20"
                        )}
                        aria-label="Keyword to highlight"
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : undefined}
                    />
                </div>
                <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    disabled={disabled || !value.trim()}
                    aria-label="Add keyword"
                >
                    <IconPlus className="size-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Add</span>
                </Button>
            </div>
            {error && (
                <p id={`${inputId}-error`} className="text-xs text-destructive">
                    {error}
                </p>
            )}
        </form>
    );
}

/**
 * WordHighlightControls Component
 *
 * A comprehensive control panel for word highlighting in captions:
 * - Toggle for current word highlighting (Requirement 15.1)
 * - Highlight color picker (Requirement 15.2)
 * - Keyword selection for persistent highlights (Requirement 15.3)
 * - Preview synchronized with playback (Requirement 15.4 - handled by parent)
 *
 * @example
 * ```tsx
 * const [style, setStyle] = useState<CaptionStyle>(defaultStyle);
 * const [words, setWords] = useState<CaptionWord[]>([]);
 *
 * <WordHighlightControls
 *   style={style}
 *   onStyleChange={(newStyle) => setStyle(newStyle)}
 *   words={words}
 *   onWordsChange={(newWords) => setWords(newWords)}
 * />
 * ```
 *
 * @validates Requirements 15.1, 15.2, 15.3, 15.4
 */
export function WordHighlightControls({
    style,
    onStyleChange,
    words = [],
    onWordsChange,
    className,
    disabled = false,
}: WordHighlightControlsProps) {
    // Extract unique highlighted keywords from words
    const highlightedKeywords = useMemo(() => {
        const keywords = new Set<string>();
        words.forEach((word) => {
            if (word.highlight) {
                keywords.add(word.word.toLowerCase());
            }
        });
        return Array.from(keywords);
    }, [words]);

    // Handle highlight enabled toggle - Requirement 15.1
    const handleHighlightEnabledChange = useCallback(
        (enabled: boolean) => {
            onStyleChange({
                ...style,
                highlightEnabled: enabled,
            });
        },
        [style, onStyleChange]
    );

    // Handle highlight color change - Requirement 15.2
    const handleHighlightColorChange = useCallback(
        (color: string) => {
            onStyleChange({
                ...style,
                highlightColor: color,
            });
        },
        [style, onStyleChange]
    );

    // Handle adding a keyword for persistent highlighting - Requirement 15.3
    const handleAddKeyword = useCallback(
        (keyword: string) => {
            if (!onWordsChange) return;

            const normalizedKeyword = keyword.toLowerCase();
            const updatedWords = words.map((word) => {
                if (word.word.toLowerCase() === normalizedKeyword) {
                    return { ...word, highlight: true };
                }
                return word;
            });

            // If the keyword doesn't exist in words, we still track it
            // by updating any matching words
            onWordsChange(updatedWords);
        },
        [words, onWordsChange]
    );

    // Handle removing a keyword from persistent highlighting - Requirement 15.3
    const handleRemoveKeyword = useCallback(
        (keyword: string) => {
            if (!onWordsChange) return;

            const normalizedKeyword = keyword.toLowerCase();
            const updatedWords = words.map((word) => {
                if (word.word.toLowerCase() === normalizedKeyword) {
                    return { ...word, highlight: false };
                }
                return word;
            });

            onWordsChange(updatedWords);
        },
        [words, onWordsChange]
    );

    // Toggle highlight for a specific word - Requirement 15.3
    const handleToggleWordHighlight = useCallback(
        (wordIndex: number) => {
            if (!onWordsChange) return;

            const updatedWords = words.map((word, index) => {
                if (index === wordIndex) {
                    return { ...word, highlight: !word.highlight };
                }
                return word;
            });

            onWordsChange(updatedWords);
        },
        [words, onWordsChange]
    );

    return (
        <section
            aria-label="Word highlight controls"
            className={cn("flex flex-col gap-6", className)}
            data-slot="word-highlight-controls"
        >
            {/* Header */}
            <div className="flex items-center gap-2">
                <IconHighlight className="size-4 text-muted-foreground" />
                <span className="font-medium text-sm">Word Highlighting</span>
            </div>

            {/* Current Word Highlighting Toggle - Requirement 15.1 */}
            <div className="flex flex-col gap-4">
                <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Current Word
                </h3>

                <SwitchField
                    checked={style.highlightEnabled}
                    onChange={handleHighlightEnabledChange}
                    label="Highlight Current Word"
                    description="Highlight the word being spoken during playback"
                    disabled={disabled}
                />
            </div>

            {/* Highlight Color Picker - Requirement 15.2 */}
            <div className="flex flex-col gap-4">
                <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Highlight Color
                </h3>

                <ColorPicker
                    value={style.highlightColor || "#FFFF00"}
                    onChange={handleHighlightColorChange}
                    label="Highlight Color"
                    presetColors={HIGHLIGHT_PRESET_COLORS}
                    disabled={disabled}
                />
            </div>

            {/* Keyword Selection for Persistent Highlights - Requirement 15.3 */}
            {onWordsChange && (
                <div className="flex flex-col gap-4">
                    <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Persistent Highlights
                    </h3>

                    <p className="text-muted-foreground text-xs">
                        Add keywords that will always be highlighted in captions.
                    </p>

                    {/* Keyword Input */}
                    <KeywordInput
                        onAdd={handleAddKeyword}
                        disabled={disabled}
                        existingKeywords={highlightedKeywords}
                    />

                    {/* Highlighted Keywords List */}
                    {highlightedKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {highlightedKeywords.map((keyword) => (
                                <KeywordBadge
                                    key={keyword}
                                    word={keyword}
                                    onRemove={() => handleRemoveKeyword(keyword)}
                                    disabled={disabled}
                                    highlightColor={style.highlightColor}
                                />
                            ))}
                        </div>
                    )}

                    {highlightedKeywords.length === 0 && (
                        <p className="text-muted-foreground text-xs italic">
                            No keywords selected for persistent highlighting.
                        </p>
                    )}
                </div>
            )}

            {/* Word Selection from Transcript - Requirement 15.3 */}
            {onWordsChange && words.length > 0 && (
                <div className="flex flex-col gap-4">
                    <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Select Words to Highlight
                    </h3>

                    <p className="text-muted-foreground text-xs">
                        Click on words to toggle their highlight state.
                    </p>

                    <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-muted/30 p-3 max-h-[200px] overflow-y-auto">
                        {words.map((word, index) => (
                            <button
                                key={`${word.word}-${word.start}-${index}`}
                                type="button"
                                onClick={() => handleToggleWordHighlight(index)}
                                disabled={disabled}
                                className={cn(
                                    "inline-flex items-center rounded px-2 py-1 text-sm transition-all",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                                    word.highlight
                                        ? "font-medium shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    disabled && "pointer-events-none opacity-50"
                                )}
                                style={{
                                    backgroundColor: word.highlight
                                        ? `${style.highlightColor || "#FFFF00"}40`
                                        : undefined,
                                    borderColor: word.highlight
                                        ? style.highlightColor || "#FFFF00"
                                        : undefined,
                                    border: word.highlight ? "1px solid" : undefined,
                                }}
                                aria-pressed={word.highlight}
                                aria-label={`${word.highlight ? "Remove highlight from" : "Highlight"} "${word.word}"`}
                            >
                                {word.word}
                                {word.highlight && (
                                    <IconCheck className="ml-1 size-3 text-current" aria-hidden="true" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Preview Info - Requirement 15.4 */}
            {style.highlightEnabled && (
                <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-muted-foreground text-xs">
                        <span className="font-medium text-foreground">Preview:</span>{" "}
                        Word highlighting will be shown in the caption preview synchronized with video playback.
                    </p>
                </div>
            )}
        </section>
    );
}

export default WordHighlightControls;
