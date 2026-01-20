"use client";

import {
    IconPlayerPlay,
    IconTextCaption,
    IconMicrophone2,
    IconBounceRight,
    IconEyeOff,
    IconCheck,
    IconSparkles,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useCallback, useId, useState, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { CaptionAnimation } from "@/lib/api/captions";
import { cn } from "@/lib/utils";

/**
 * Animation option configuration
 */
interface AnimationOption {
    value: CaptionAnimation;
    label: string;
    description: string;
    icon: ReactNode;
    demoText: string;
}

/**
 * Animation options with descriptions and icons
 * Validates: Requirements 14.1, 14.2
 */
const ANIMATION_OPTIONS: AnimationOption[] = [
    {
        value: "none",
        label: "None",
        description: "Static captions without animation",
        icon: <IconEyeOff className="size-5" />,
        demoText: "Sample Caption",
    },
    {
        value: "word-by-word",
        label: "Word by Word",
        description: "Words appear one at a time as spoken",
        icon: <IconTextCaption className="size-5" />,
        demoText: "Word by Word",
    },
    {
        value: "karaoke",
        label: "Karaoke",
        description: "Words highlight progressively like karaoke",
        icon: <IconMicrophone2 className="size-5" />,
        demoText: "Karaoke Style",
    },
    {
        value: "bounce",
        label: "Bounce",
        description: "Words bounce in with a playful effect",
        icon: <IconBounceRight className="size-5" />,
        demoText: "Bounce Effect",
    },
    {
        value: "fade",
        label: "Fade",
        description: "Words fade in smoothly",
        icon: <IconPlayerPlay className="size-5" />,
        demoText: "Fade In",
    },
];

/**
 * CaptionAnimationSelectorProps interface
 *
 * @validates Requirements 14.1, 14.2, 14.3, 14.4
 */
export interface CaptionAnimationSelectorProps {
    /** Currently selected animation */
    value: CaptionAnimation;
    /** Callback when animation changes */
    onChange: (animation: CaptionAnimation) => void;
    /** Additional className */
    className?: string;
    /** Whether the selector is disabled */
    disabled?: boolean;
}

/**
 * AnimationPreview Component
 *
 * Displays an animated preview/demo of each animation type
 */
interface AnimationPreviewProps {
    animation: CaptionAnimation;
    text: string;
    isActive: boolean;
}

function AnimationPreview({ animation, text, isActive }: AnimationPreviewProps) {
    const [animationKey, setAnimationKey] = useState(0);
    const words = text.split(" ");

    // Reset animation when card becomes active
    useEffect(() => {
        if (isActive) {
            setAnimationKey((prev) => prev + 1);
        }
    }, [isActive]);

    // Render different animation previews based on type
    const renderPreview = () => {
        switch (animation) {
            case "none":
                return (
                    <span className="font-semibold text-white text-sm">{text}</span>
                );

            case "word-by-word":
                return (
                    <span key={animationKey} className="flex gap-1">
                        {words.map((word, index) => (
                            <span
                                key={index}
                                className={cn(
                                    "font-semibold text-white text-sm",
                                    isActive && "animate-word-appear"
                                )}
                                style={{
                                    animationDelay: isActive ? `${index * 300}ms` : "0ms",
                                    opacity: isActive ? 0 : 1,
                                    animationFillMode: "forwards",
                                }}
                            >
                                {word}
                            </span>
                        ))}
                    </span>
                );

            case "karaoke":
                return (
                    <span key={animationKey} className="flex gap-1">
                        {words.map((word, index) => (
                            <span
                                key={index}
                                className={cn(
                                    "font-semibold text-sm transition-colors duration-300",
                                    isActive ? "animate-karaoke-highlight" : "text-white"
                                )}
                                style={{
                                    animationDelay: isActive ? `${index * 400}ms` : "0ms",
                                    animationFillMode: "forwards",
                                }}
                            >
                                {word}
                            </span>
                        ))}
                    </span>
                );

            case "bounce":
                return (
                    <span key={animationKey} className="flex gap-1">
                        {words.map((word, index) => (
                            <span
                                key={index}
                                className={cn(
                                    "font-semibold text-white text-sm",
                                    isActive && "animate-bounce-in"
                                )}
                                style={{
                                    animationDelay: isActive ? `${index * 200}ms` : "0ms",
                                    opacity: isActive ? 0 : 1,
                                    animationFillMode: "forwards",
                                }}
                            >
                                {word}
                            </span>
                        ))}
                    </span>
                );

            case "fade":
                return (
                    <span key={animationKey} className="flex gap-1">
                        {words.map((word, index) => (
                            <span
                                key={index}
                                className={cn(
                                    "font-semibold text-white text-sm",
                                    isActive && "animate-fade-in"
                                )}
                                style={{
                                    animationDelay: isActive ? `${index * 250}ms` : "0ms",
                                    opacity: isActive ? 0 : 1,
                                    animationFillMode: "forwards",
                                }}
                            >
                                {word}
                            </span>
                        ))}
                    </span>
                );

            default:
                return (
                    <span className="font-semibold text-white text-sm">{text}</span>
                );
        }
    };

    return (
        <div className="flex h-12 items-center justify-center rounded-md bg-linear-to-br from-slate-800 to-slate-900 px-3">
            {renderPreview()}
        </div>
    );
}

/**
 * AnimationCard Component
 *
 * Individual animation option card with preview and selection state
 */
interface AnimationCardProps {
    option: AnimationOption;
    isSelected: boolean;
    onSelect: () => void;
    disabled?: boolean;
}

function AnimationCard({
    option,
    isSelected,
    onSelect,
    disabled,
}: AnimationCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Card
            className={cn(
                "relative cursor-pointer transition-all duration-200",
                "hover:ring-2 hover:ring-primary/50",
                isSelected && "ring-2 ring-primary",
                disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => !disabled && onSelect()}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="radio"
            tabIndex={disabled ? -1 : 0}
            aria-checked={isSelected}
            aria-label={`${option.label} animation: ${option.description}`}
            onKeyDown={(e) => {
                if (!disabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelect();
                }
            }}
        >
            {/* Selection indicator */}
            {isSelected && (
                <div className="absolute right-2 top-2 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <IconCheck className="size-3" />
                </div>
            )}

            <CardContent className="flex flex-col gap-3 p-4">
                {/* Animation preview - Requirement 14.2 */}
                <AnimationPreview
                    animation={option.value}
                    text={option.demoText}
                    isActive={isHovered || isSelected}
                />

                {/* Icon and label */}
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            "text-muted-foreground transition-colors",
                            isSelected && "text-primary"
                        )}
                    >
                        {option.icon}
                    </span>
                    <span className="font-medium text-sm">{option.label}</span>
                </div>

                {/* Description - Requirement 14.2 */}
                <p className="text-muted-foreground text-xs leading-relaxed">
                    {option.description}
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * CaptionAnimationSelector Component
 *
 * A selector for caption animation effects with:
 * - Animation options: none, word-by-word, karaoke, bounce, fade (Requirement 14.1)
 * - Preview/description for each animation (Requirement 14.2)
 * - Visual demonstration of the effect (Requirement 14.3)
 * - Animations synchronized with word timestamps (Requirement 14.4)
 *
 * @example
 * ```tsx
 * const [animation, setAnimation] = useState<CaptionAnimation>('none');
 *
 * <CaptionAnimationSelector
 *   value={animation}
 *   onChange={(newAnimation) => setAnimation(newAnimation)}
 * />
 * ```
 *
 * @validates Requirements 14.1, 14.2, 14.3, 14.4
 */
export function CaptionAnimationSelector({
    value,
    onChange,
    className,
    disabled = false,
}: CaptionAnimationSelectorProps) {
    const groupId = useId();

    const handleSelect = useCallback(
        (animation: CaptionAnimation) => {
            if (!disabled) {
                onChange(animation);
            }
        },
        [disabled, onChange]
    );

    return (
        <section
            aria-label="Caption animation selection"
            className={cn("flex flex-col gap-4", className)}
            data-slot="caption-animation-selector"
            role="radiogroup"
            aria-labelledby={`${groupId}-label`}
        >
            {/* Header */}
            <div className="flex items-center gap-2">
                <IconSparkles className="size-4 text-muted-foreground" />
                <Label
                    id={`${groupId}-label`}
                    className="font-medium text-sm"
                >
                    Caption Animation
                </Label>
            </div>

            {/* Animation options grid - Requirement 14.1 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {ANIMATION_OPTIONS.map((option) => (
                    <AnimationCard
                        key={option.value}
                        option={option}
                        isSelected={value === option.value}
                        onSelect={() => handleSelect(option.value)}
                        disabled={disabled}
                    />
                ))}
            </div>

            {/* Selected animation info */}
            {value !== "none" && (
                <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-muted-foreground text-xs">
                        <span className="font-medium text-foreground">Selected:</span>{" "}
                        {ANIMATION_OPTIONS.find((o) => o.value === value)?.label} -{" "}
                        {ANIMATION_OPTIONS.find((o) => o.value === value)?.description}
                    </p>
                </div>
            )}
        </section>
    );
}

export default CaptionAnimationSelector;
