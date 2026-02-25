"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FireIcon as FireAnimatedIcon } from "@/components/ui/fire-icon";
import {
    IconBulb,
    IconClock,
    IconChartBar,
    IconChevronDown,
    IconChevronUp,
    IconSparkles,
    IconTrendingUp,
    IconEye,
    IconShare,
    IconMessage,
    IconHeart,
} from "@tabler/icons-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ============================================================================
// Types
// ============================================================================

/**
 * Key moment in the clip with timestamp and description
 */
export interface KeyMoment {
    /** Timestamp in seconds */
    timestamp: number;
    /** Description of what happens at this moment */
    description: string;
    /** Importance level of the moment */
    importance?: "high" | "medium" | "low";
}

/**
 * Engagement metrics prediction
 */
export interface EngagementMetrics {
    /** Estimated number of views */
    views?: number;
    /** Estimated number of likes */
    likes?: number;
    /** Estimated number of shares */
    shares?: number;
    /** Estimated number of comments */
    comments?: number;
    /** Estimated retention rate (0-100) */
    retentionRate?: number;
}

/**
 * Viral analysis data structure
 * 
 * @validates Requirements 16.1, 16.2, 16.3, 16.4
 */
export interface ViralAnalysis {
    /** Reasons why the clip was identified as viral */
    reasons: string[];
    /** Hooks that capture attention */
    hooks?: string[];
    /** Emotions evoked by the clip */
    emotions?: string[];
    /** Key moments in the clip timeline */
    keyMoments: KeyMoment[];
    /** Suggestions for improving viral potential */
    suggestions: string[];
    /** Estimated retention rate (0-100) */
    estimatedRetention?: number;
    /** Engagement metrics prediction */
    engagementPrediction?: EngagementMetrics;
}

/**
 * ViralAnalysisPanelProps interface
 * 
 * @validates Requirements 3.3, 16.1-16.5
 */
export interface ViralAnalysisPanelProps {
    /** Viral analysis data */
    analysis: ViralAnalysis;
    /** Whether the panel is initially expanded */
    defaultExpanded?: boolean;
    /** Callback when a key moment is clicked */
    onKeyMomentClick?: (timestamp: number) => void;
    /** Additional className */
    className?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format timestamp in seconds to MM:SS format
 */
function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format large numbers with K/M suffix
 */
function formatNumber(num: number): string {
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
}

/**
 * Get color class for importance level
 */
function getImportanceColor(importance?: "high" | "medium" | "low"): string {
    switch (importance) {
        case "high":
            return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
        case "medium":
            return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
        case "low":
            return "bg-muted text-muted-foreground border-border";
        default:
            return "bg-primary/10 text-primary border-primary/30";
    }
}

/**
 * Get retention rate color
 */
function getRetentionColor(rate: number): string {
    if (rate >= 70) return "text-green-600 dark:text-green-400";
    if (rate >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * SectionHeader - Collapsible section header
 */
interface SectionHeaderProps {
    icon: React.ReactNode;
    title: string;
    count?: number;
    isOpen: boolean;
    onToggle: () => void;
}

function SectionHeader({ icon, title, count, isOpen, onToggle }: SectionHeaderProps) {
    return (
        <CollapsibleTrigger
            className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground transition-colors"
            onClick={onToggle}
            data-testid={`section-header-${title.toLowerCase().replace(/\s+/g, "-")}`}
        >
            <div className="flex items-center gap-2">
                {icon}
                <span>{title}</span>
                {count !== undefined && count > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {count}
                    </Badge>
                )}
            </div>
            {isOpen ? (
                <IconChevronUp className="size-4 text-muted-foreground" />
            ) : (
                <IconChevronDown className="size-4 text-muted-foreground" />
            )}
        </CollapsibleTrigger>
    );
}

/**
 * ReasonsSection - Display viral analysis reasons
 * 
 * @validates Requirements 16.1
 */
interface ReasonsSectionProps {
    reasons: string[];
}

function ReasonsSection({ reasons }: ReasonsSectionProps) {
    const [isOpen, setIsOpen] = React.useState(true);

    if (reasons.length === 0) return null;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <SectionHeader
                icon={<FireAnimatedIcon />}
                title="Why This Clip is Viral"
                count={reasons.length}
                isOpen={isOpen}
                onToggle={() => setIsOpen(!isOpen)}
            />
            <CollapsibleContent>
                <ul
                    className="space-y-2 pl-6 pt-2"
                    data-testid="viral-reasons-list"
                    role="list"
                    aria-label="Viral reasons"
                >
                    {reasons.map((reason, index) => (
                        <li
                            key={`reason-${index}`}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                            data-testid={`viral-reason-${index}`}
                        >
                            <span className="text-primary mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                            <span>{reason}</span>
                        </li>
                    ))}
                </ul>
            </CollapsibleContent>
        </Collapsible>
    );
}

/**
 * KeyMomentsSection - Display key moments timeline
 * 
 * @validates Requirements 16.2
 */
interface KeyMomentsSectionProps {
    keyMoments: KeyMoment[];
    onMomentClick?: (timestamp: number) => void;
}

function KeyMomentsSection({ keyMoments, onMomentClick }: KeyMomentsSectionProps) {
    const [isOpen, setIsOpen] = React.useState(true);

    if (keyMoments.length === 0) return null;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <SectionHeader
                icon={<IconClock className="size-4 text-blue-500" />}
                title="Key Moments"
                count={keyMoments.length}
                isOpen={isOpen}
                onToggle={() => setIsOpen(!isOpen)}
            />
            <CollapsibleContent>
                <div
                    className="space-y-2 pt-2"
                    data-testid="key-moments-list"
                    role="list"
                    aria-label="Key moments in the clip"
                >
                    {keyMoments.map((moment, index) => (
                        <button
                            key={`moment-${index}`}
                            type="button"
                            className={cn(
                                "w-full flex items-start gap-3 p-2 rounded-md border text-left transition-colors",
                                "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                getImportanceColor(moment.importance)
                            )}
                            onClick={() => onMomentClick?.(moment.timestamp)}
                            data-testid={`key-moment-${index}`}
                            aria-label={`Jump to ${formatTimestamp(moment.timestamp)}: ${moment.description}`}
                        >
                            <Badge
                                variant="outline"
                                className="shrink-0 font-mono text-xs"
                            >
                                {formatTimestamp(moment.timestamp)}
                            </Badge>
                            <span className="text-sm flex-1">{moment.description}</span>
                            {moment.importance === "high" && (
                                <IconSparkles
                                    className="size-4 text-yellow-500 shrink-0"
                                    aria-label="High importance"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

/**
 * EngagementMetricsSection - Display engagement metrics
 * 
 * @validates Requirements 16.3
 */
interface EngagementMetricsSectionProps {
    metrics?: EngagementMetrics;
    estimatedRetention?: number;
}

function EngagementMetricsSection({ metrics, estimatedRetention }: EngagementMetricsSectionProps) {
    const [isOpen, setIsOpen] = React.useState(true);

    // Check if we have any metrics to display
    const hasMetrics = metrics && (
        metrics.views !== undefined ||
        metrics.likes !== undefined ||
        metrics.shares !== undefined ||
        metrics.comments !== undefined
    );

    if (!hasMetrics && estimatedRetention === undefined) return null;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <SectionHeader
                icon={<IconChartBar className="size-4 text-purple-500" />}
                title="Engagement Metrics"
                isOpen={isOpen}
                onToggle={() => setIsOpen(!isOpen)}
            />
            <CollapsibleContent>
                <div className="space-y-4 pt-2" data-testid="engagement-metrics">
                    {/* Retention Rate */}
                    {estimatedRetention !== undefined && (
                        <div className="space-y-2" data-testid="retention-rate">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <IconTrendingUp className="size-4" />
                                    Estimated Retention
                                </span>
                                <span className={cn("font-semibold", getRetentionColor(estimatedRetention))}>
                                    {estimatedRetention}%
                                </span>
                            </div>
                            <Progress
                                value={estimatedRetention}
                                aria-label={`Retention rate: ${estimatedRetention}%`}
                            />
                        </div>
                    )}

                    {/* Engagement Predictions */}
                    {hasMetrics && (
                        <div
                            className="grid grid-cols-2 gap-3"
                            data-testid="engagement-predictions"
                            role="list"
                            aria-label="Predicted engagement metrics"
                        >
                            {metrics.views !== undefined && (
                                <div
                                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                                    data-testid="metric-views"
                                >
                                    <IconEye className="size-4 text-blue-500" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Views</span>
                                        <span className="text-sm font-semibold">{formatNumber(metrics.views)}</span>
                                    </div>
                                </div>
                            )}
                            {metrics.likes !== undefined && (
                                <div
                                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                                    data-testid="metric-likes"
                                >
                                    <IconHeart className="size-4 text-red-500" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Likes</span>
                                        <span className="text-sm font-semibold">{formatNumber(metrics.likes)}</span>
                                    </div>
                                </div>
                            )}
                            {metrics.shares !== undefined && (
                                <div
                                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                                    data-testid="metric-shares"
                                >
                                    <IconShare className="size-4 text-green-500" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Shares</span>
                                        <span className="text-sm font-semibold">{formatNumber(metrics.shares)}</span>
                                    </div>
                                </div>
                            )}
                            {metrics.comments !== undefined && (
                                <div
                                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                                    data-testid="metric-comments"
                                >
                                    <IconMessage className="size-4 text-yellow-500" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Comments</span>
                                        <span className="text-sm font-semibold">{formatNumber(metrics.comments)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

/**
 * SuggestionsSection - Display improvement suggestions
 * 
 * @validates Requirements 16.4
 */
interface SuggestionsSectionProps {
    suggestions: string[];
}

function SuggestionsSection({ suggestions }: SuggestionsSectionProps) {
    const [isOpen, setIsOpen] = React.useState(true);

    if (suggestions.length === 0) return null;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <SectionHeader
                icon={<IconBulb className="size-4 text-yellow-500" />}
                title="Improvement Suggestions"
                count={suggestions.length}
                isOpen={isOpen}
                onToggle={() => setIsOpen(!isOpen)}
            />
            <CollapsibleContent>
                <ul
                    className="space-y-2 pl-6 pt-2"
                    data-testid="suggestions-list"
                    role="list"
                    aria-label="Improvement suggestions"
                >
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={`suggestion-${index}`}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                            data-testid={`suggestion-${index}`}
                        >
                            <span className="text-yellow-500 mt-0.5 shrink-0">💡</span>
                            <span>{suggestion}</span>
                        </li>
                    ))}
                </ul>
            </CollapsibleContent>
        </Collapsible>
    );
}

/**
 * EmotionsDisplay - Display emotions as badges
 */
interface EmotionsDisplayProps {
    emotions: string[];
}

function EmotionsDisplay({ emotions }: EmotionsDisplayProps) {
    if (emotions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5" data-testid="emotions-display">
            <span className="text-xs text-muted-foreground mr-1">Emotions:</span>
            {emotions.map((emotion, index) => (
                <Badge
                    key={`emotion-${index}`}
                    variant="secondary"
                    className="text-xs"
                    data-testid={`emotion-${index}`}
                >
                    {emotion}
                </Badge>
            ))}
        </div>
    );
}

/**
 * HooksDisplay - Display hooks as badges
 */
interface HooksDisplayProps {
    hooks: string[];
}

function HooksDisplay({ hooks }: HooksDisplayProps) {
    if (hooks.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5" data-testid="hooks-display">
            <span className="text-xs text-muted-foreground mr-1">Hooks:</span>
            {hooks.map((hook, index) => (
                <Badge
                    key={`hook-${index}`}
                    variant="outline"
                    className="text-xs"
                    data-testid={`hook-${index}`}
                >
                    {hook}
                </Badge>
            ))}
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ViralAnalysisPanel - Display comprehensive viral analysis for a clip
 * 
 * Shows:
 * - Viral analysis reasons (why the clip was identified as viral)
 * - Key moments timeline (important timestamps in the clip)
 * - Engagement metrics (predicted views, shares, retention rate, etc.)
 * - Improvement suggestions (how to make the clip more viral)
 * - Emotions and hooks as badges
 * 
 * The panel is collapsible/expandable with each section independently collapsible.
 * Clicking on key moments can trigger navigation to that timestamp in the video.
 * 
 * @validates Requirements 3.3, 16.1, 16.2, 16.3, 16.4, 16.5
 * 
 * @example
 * // Basic usage
 * <ViralAnalysisPanel
 *   analysis={{
 *     reasons: ["Strong hook in first 3 seconds", "High emotional engagement"],
 *     keyMoments: [
 *       { timestamp: 0, description: "Attention-grabbing opening", importance: "high" },
 *       { timestamp: 15, description: "Key reveal moment", importance: "medium" },
 *     ],
 *     suggestions: ["Add captions for accessibility", "Consider shorter duration"],
 *     estimatedRetention: 75,
 *   }}
 * />
 * 
 * @example
 * // With engagement metrics and click handler
 * <ViralAnalysisPanel
 *   analysis={{
 *     reasons: ["Trending topic", "Relatable content"],
 *     keyMoments: [{ timestamp: 5, description: "Punchline" }],
 *     suggestions: ["Add music"],
 *     estimatedRetention: 82,
 *     engagementPrediction: {
 *       views: 50000,
 *       likes: 5000,
 *       shares: 1200,
 *       comments: 300,
 *     },
 *   }}
 *   onKeyMomentClick={(timestamp) => videoRef.current?.seekTo(timestamp)}
 * />
 */
export function ViralAnalysisPanel({
    analysis,
    defaultExpanded = true,
    onKeyMomentClick,
    className,
}: ViralAnalysisPanelProps) {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    // Destructure analysis data with defaults
    const {
        reasons = [],
        hooks = [],
        emotions = [],
        keyMoments = [],
        suggestions = [],
        estimatedRetention,
        engagementPrediction,
    } = analysis;

    // Check if we have any content to display
    const hasContent =
        reasons.length > 0 ||
        keyMoments.length > 0 ||
        suggestions.length > 0 ||
        estimatedRetention !== undefined ||
        engagementPrediction !== undefined;

    if (!hasContent) {
        return (
            <div
                className={cn(
                    "rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground",
                    className
                )}
                data-testid="viral-analysis-panel-empty"
                role="region"
                aria-label="Viral analysis"
            >
                No viral analysis data available for this clip.
            </div>
        );
    }

    return (
        <div
            className={cn(
                "rounded-lg border bg-card overflow-hidden",
                className
            )}
            data-testid="viral-analysis-panel"
            role="region"
            aria-label="Viral analysis panel"
        >
            {/* Panel Header */}
            <button
                type="button"
                className={cn(
                    "w-full flex items-center justify-between p-4 text-left",
                    "hover:bg-muted/50 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-controls="viral-analysis-content"
                data-testid="viral-analysis-panel-toggle"
            >
                <div className="flex items-center gap-2">
                    <FireAnimatedIcon />
                    <h3 className="font-semibold">Viral Analysis</h3>
                </div>
                {isExpanded ? (
                    <IconChevronUp className="size-5 text-muted-foreground" aria-hidden="true" />
                ) : (
                    <IconChevronDown className="size-5 text-muted-foreground" aria-hidden="true" />
                )}
            </button>

            {/* Panel Content */}
            {isExpanded && (
                <div
                    id="viral-analysis-content"
                    className="px-4 pb-4 space-y-4"
                    data-testid="viral-analysis-content"
                >
                    {/* Emotions and Hooks */}
                    {(emotions.length > 0 || hooks.length > 0) && (
                        <div className="space-y-2 pb-2 border-b">
                            <EmotionsDisplay emotions={emotions} />
                            <HooksDisplay hooks={hooks} />
                        </div>
                    )}

                    {/* Viral Reasons */}
                    <ReasonsSection reasons={reasons} />

                    {/* Key Moments */}
                    <KeyMomentsSection
                        keyMoments={keyMoments}
                        onMomentClick={onKeyMomentClick}
                    />

                    {/* Engagement Metrics */}
                    <EngagementMetricsSection
                        metrics={engagementPrediction}
                        estimatedRetention={estimatedRetention}
                    />

                    {/* Improvement Suggestions */}
                    <SuggestionsSection suggestions={suggestions} />
                </div>
            )}
        </div>
    );
}

export default ViralAnalysisPanel;
