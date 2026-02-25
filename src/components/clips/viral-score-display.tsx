"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FireIcon as FireAnimatedIcon } from "@/components/ui/fire-icon";

// ============================================================================
// Types
// ============================================================================

/**
 * ViralScoreDisplayProps interface
 *
 * @validates Requirements 3.4
 */
export interface ViralScoreDisplayProps {
    /** The viral score value (0-100) */
    score: number;
    /** Size variant of the display */
    size?: "sm" | "md" | "lg";
    /** Whether to show the "Viral Score" label */
    showLabel?: boolean;
    /** Whether to animate on mount */
    animated?: boolean;
    /** Additional className */
    className?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Size configurations for different variants
 */
const SIZE_CONFIG = {
    sm: {
        containerSize: "size-16",
        strokeWidth: 4,
        radius: 28,
        fontSize: "text-lg",
        labelSize: "text-xs",
        iconSize: "size-3",
    },
    md: {
        containerSize: "size-24",
        strokeWidth: 5,
        radius: 42,
        fontSize: "text-2xl",
        labelSize: "text-xs",
        iconSize: "size-4",
    },
    lg: {
        containerSize: "size-32",
        strokeWidth: 6,
        radius: 56,
        fontSize: "text-3xl",
        labelSize: "text-sm",
        iconSize: "size-5",
    },
} as const;

/**
 * SVG viewBox sizes for different variants
 */
const VIEWBOX_SIZE = {
    sm: 64,
    md: 96,
    lg: 128,
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get color classes based on viral score
 * Green for high (≥70), yellow for medium (40-69), red for low (<40)
 *
 * @validates Requirements 3.4
 */
function getScoreColors(score: number): {
    stroke: string;
    text: string;
    bg: string;
    glow: string;
} {
    if (score >= 70) {
        return {
            stroke: "stroke-green-500",
            text: "text-green-600 dark:text-green-400",
            bg: "bg-green-500/10",
            glow: "drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]",
        };
    }
    if (score >= 40) {
        return {
            stroke: "stroke-yellow-500",
            text: "text-yellow-600 dark:text-yellow-400",
            bg: "bg-yellow-500/10",
            glow: "drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]",
        };
    }
    return {
        stroke: "stroke-red-500",
        text: "text-red-600 dark:text-red-400",
        bg: "bg-red-500/10",
        glow: "drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]",
    };
}

/**
 * Calculate the stroke dash offset for the progress circle
 */
function calculateStrokeDashOffset(
    score: number,
    circumference: number
): number {
    const clampedScore = Math.max(0, Math.min(100, score));
    return circumference - (clampedScore / 100) * circumference;
}

/**
 * Get the score category label
 */
function getScoreLabel(score: number): string {
    if (score >= 70) return "High";
    if (score >= 40) return "Medium";
    return "Low";
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ViralScoreDisplay - Circular progress indicator for viral score
 *
 * Displays a viral score (0-100) as a circular progress indicator with:
 * - Color coding: Green (70-100), Yellow (40-69), Red (0-39)
 * - Score number displayed in the center
 * - Optional animation on mount
 * - Optional flame icon for viral indication
 * - Optional label showing "Viral Score"
 *
 * @validates Requirements 3.4
 *
 * @example
 * // Basic usage
 * <ViralScoreDisplay score={85} />
 *
 * @example
 * // Large size with label and animation
 * <ViralScoreDisplay
 *   score={72}
 *   size="lg"
 *   showLabel
 *   animated
 * />
 *
 * @example
 * // Small size without animation
 * <ViralScoreDisplay
 *   score={35}
 *   size="sm"
 *   animated={false}
 * />
 */
export function ViralScoreDisplay({
    score,
    size = "md",
    showLabel = false,
    animated = true,
    className,
}: ViralScoreDisplayProps) {
    // State for animation
    const [animatedScore, setAnimatedScore] = React.useState(animated ? 0 : score);
    const [isAnimating, setIsAnimating] = React.useState(animated);

    // Get size configuration
    const config = SIZE_CONFIG[size];
    const viewBoxSize = VIEWBOX_SIZE[size];
    const center = viewBoxSize / 2;
    const circumference = 2 * Math.PI * config.radius;

    // Get colors based on score
    const colors = getScoreColors(score);

    // Calculate stroke dash offset
    const strokeDashOffset = calculateStrokeDashOffset(
        animatedScore,
        circumference
    );

    // Animation effect
    React.useEffect(() => {
        if (!animated) {
            setAnimatedScore(score);
            return;
        }

        // Reset animation when score changes
        setAnimatedScore(0);
        setIsAnimating(true);

        // Animate to target score
        const duration = 1000; // 1 second
        const startTime = performance.now();
        const startScore = 0;
        const targetScore = Math.max(0, Math.min(100, score));

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentScore = startScore + (targetScore - startScore) * easeOut;

            setAnimatedScore(Math.round(currentScore));

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setIsAnimating(false);
            }
        };

        const animationFrame = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [score, animated]);

    // Clamp score for display
    const displayScore = Math.max(0, Math.min(100, Math.round(animatedScore)));
    const scoreLabel = getScoreLabel(score);

    return (
        <div
            className={cn("flex flex-col items-center gap-1", className)}
            data-testid="viral-score-display"
            role="meter"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Viral score: ${score} out of 100, ${scoreLabel} viral potential`}
        >
            {/* Circular Progress Indicator */}
            <div
                className={cn(
                    "relative",
                    config.containerSize,
                    isAnimating && animated && colors.glow
                )}
                data-testid="viral-score-circle"
            >
                <svg
                    className="transform -rotate-90"
                    viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Background circle */}
                    <circle
                        cx={center}
                        cy={center}
                        r={config.radius}
                        strokeWidth={config.strokeWidth}
                        className="stroke-muted"
                        fill="none"
                        data-testid="viral-score-bg-circle"
                    />

                    {/* Progress circle */}
                    <circle
                        cx={center}
                        cy={center}
                        r={config.radius}
                        strokeWidth={config.strokeWidth}
                        strokeLinecap="round"
                        fill="none"
                        className={cn(
                            colors.stroke,
                            animated && "transition-all duration-100"
                        )}
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: strokeDashOffset,
                        }}
                        data-testid="viral-score-progress-circle"
                    />
                </svg>

                {/* Center content */}
                <div
                    className={cn(
                        "absolute inset-0 flex flex-col items-center justify-center",
                        colors.text
                    )}
                    data-testid="viral-score-center"
                >
                    {/* Flame icon for high scores */}
                    {score >= 70 && (
                        <FireAnimatedIcon />
                    )}

                    {/* Score number */}
                    <span
                        className={cn("font-bold leading-none", config.fontSize)}
                        data-testid="viral-score-value"
                    >
                        {displayScore}
                    </span>

                    {/* Score category label (inside circle for sm/md) */}
                    {size !== "lg" && (
                        <span
                            className={cn(
                                "text-muted-foreground leading-none mt-0.5",
                                config.labelSize
                            )}
                            data-testid="viral-score-category"
                        >
                            {scoreLabel}
                        </span>
                    )}
                </div>
            </div>

            {/* Label below circle */}
            {showLabel && (
                <div className="text-center" data-testid="viral-score-label">
                    <span className={cn("text-muted-foreground", config.labelSize)}>
                        Viral Score
                    </span>
                    {size === "lg" && (
                        <span
                            className={cn("block font-medium", colors.text, config.labelSize)}
                            data-testid="viral-score-category-lg"
                        >
                            {scoreLabel} Potential
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default ViralScoreDisplay;
