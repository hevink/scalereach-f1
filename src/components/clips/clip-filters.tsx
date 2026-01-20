"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    IconFilter,
    IconHeart,
    IconSortAscending,
    IconSortDescending,
    IconFlame,
    IconClock,
    IconCalendar,
} from "@tabler/icons-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ClipFilters as ClipFiltersType } from "@/lib/api/clips";

/**
 * ClipFiltersProps interface
 * 
 * @validates Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export interface ClipFiltersProps {
    /** Current filter state */
    filters: ClipFiltersType;
    /** Callback when filters change */
    onChange: (filters: ClipFiltersType) => void;
    /** Total number of clips before filtering */
    totalCount: number;
    /** Number of clips after filtering */
    filteredCount: number;
    /** Additional className */
    className?: string;
    /** Whether to sync filters to URL query params */
    syncToUrl?: boolean;
}

/**
 * Sort option configuration
 */
interface SortOption {
    value: ClipFiltersType["sortBy"];
    label: string;
    icon: React.ReactNode;
}

const SORT_OPTIONS: SortOption[] = [
    { value: "score", label: "Virality Score", icon: <IconFlame className="size-4" /> },
    { value: "duration", label: "Duration", icon: <IconClock className="size-4" /> },
    { value: "createdAt", label: "Date Created", icon: <IconCalendar className="size-4" /> },
];

/**
 * Default filter values
 */
const DEFAULT_FILTERS: ClipFiltersType = {
    minScore: 0,
    maxScore: 100,
    favorited: undefined,
    sortBy: "score",
    sortOrder: "desc",
};

/**
 * Parse URL search params to ClipFilters
 */
function parseFiltersFromUrl(searchParams: URLSearchParams): Partial<ClipFiltersType> {
    const filters: Partial<ClipFiltersType> = {};

    const minScore = searchParams.get("minScore");
    if (minScore !== null) {
        const parsed = parseInt(minScore, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            filters.minScore = parsed;
        }
    }

    const maxScore = searchParams.get("maxScore");
    if (maxScore !== null) {
        const parsed = parseInt(maxScore, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            filters.maxScore = parsed;
        }
    }

    const favorited = searchParams.get("favorited");
    if (favorited === "true") {
        filters.favorited = true;
    } else if (favorited === "false") {
        filters.favorited = false;
    }

    const sortBy = searchParams.get("sortBy");
    if (sortBy === "score" || sortBy === "duration" || sortBy === "createdAt") {
        filters.sortBy = sortBy;
    }

    const sortOrder = searchParams.get("sortOrder");
    if (sortOrder === "asc" || sortOrder === "desc") {
        filters.sortOrder = sortOrder;
    }

    return filters;
}

/**
 * Convert ClipFilters to URL search params
 */
function filtersToSearchParams(filters: ClipFiltersType): URLSearchParams {
    const params = new URLSearchParams();

    // Only add non-default values to URL
    if (filters.minScore !== undefined && filters.minScore !== 0) {
        params.set("minScore", filters.minScore.toString());
    }
    if (filters.maxScore !== undefined && filters.maxScore !== 100) {
        params.set("maxScore", filters.maxScore.toString());
    }
    if (filters.favorited !== undefined) {
        params.set("favorited", filters.favorited.toString());
    }
    if (filters.sortBy && filters.sortBy !== "score") {
        params.set("sortBy", filters.sortBy);
    }
    if (filters.sortOrder && filters.sortOrder !== "desc") {
        params.set("sortOrder", filters.sortOrder);
    }

    return params;
}

/**
 * ClipFilters Component
 * 
 * Provides filtering and sorting controls for viral clips:
 * - Score range slider with min/max values
 * - Favorites toggle filter
 * - Sort dropdown (score, duration, date)
 * - Displays filtered count
 * - Syncs filters to URL query params
 * 
 * @example
 * ```tsx
 * const [filters, setFilters] = useState<ClipFilters>({
 *   sortBy: 'score',
 *   sortOrder: 'desc',
 * });
 * 
 * <ClipFilters
 *   filters={filters}
 *   onChange={setFilters}
 *   totalCount={50}
 *   filteredCount={25}
 *   syncToUrl
 * />
 * ```
 * 
 * @validates Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export function ClipFilters({
    filters,
    onChange,
    totalCount,
    filteredCount,
    className,
    syncToUrl = true,
}: ClipFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize filters from URL on mount
    React.useEffect(() => {
        if (syncToUrl) {
            const urlFilters = parseFiltersFromUrl(searchParams);
            if (Object.keys(urlFilters).length > 0) {
                onChange({
                    ...DEFAULT_FILTERS,
                    ...filters,
                    ...urlFilters,
                });
            }
        }
        // Only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync filters to URL when they change
    const updateUrl = React.useCallback(
        (newFilters: ClipFiltersType) => {
            if (!syncToUrl) return;

            const params = filtersToSearchParams(newFilters);
            const queryString = params.toString();
            const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

            // Use replace to avoid adding to history for every filter change
            router.replace(newUrl, { scroll: false });
        },
        [syncToUrl, pathname, router]
    );

    // Handle filter changes
    const handleFilterChange = React.useCallback(
        (updates: Partial<ClipFiltersType>) => {
            const newFilters = { ...filters, ...updates };
            onChange(newFilters);
            updateUrl(newFilters);
        },
        [filters, onChange, updateUrl]
    );

    // Handle score range change
    const handleScoreRangeChange = React.useCallback(
        (values: number | readonly number[]) => {
            const [min, max] = Array.isArray(values) ? values : [values, values];
            handleFilterChange({
                minScore: min,
                maxScore: max,
            });
        },
        [handleFilterChange]
    );

    // Handle favorites toggle
    const handleFavoritesToggle = React.useCallback(
        (checked: boolean) => {
            handleFilterChange({
                favorited: checked ? true : undefined,
            });
        },
        [handleFilterChange]
    );

    // Handle sort by change
    const handleSortByChange = React.useCallback(
        (value: string | null) => {
            if (value && (value === "score" || value === "duration" || value === "createdAt")) {
                handleFilterChange({
                    sortBy: value,
                });
            }
        },
        [handleFilterChange]
    );

    // Handle sort order toggle
    const handleSortOrderToggle = React.useCallback(() => {
        handleFilterChange({
            sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
        });
    }, [filters.sortOrder, handleFilterChange]);

    // Reset filters to defaults
    const handleResetFilters = React.useCallback(() => {
        onChange(DEFAULT_FILTERS);
        updateUrl(DEFAULT_FILTERS);
    }, [onChange, updateUrl]);

    // Check if any filters are active (non-default)
    const hasActiveFilters =
        (filters.minScore !== undefined && filters.minScore > 0) ||
        (filters.maxScore !== undefined && filters.maxScore < 100) ||
        filters.favorited === true ||
        filters.sortBy !== "score" ||
        filters.sortOrder !== "desc";

    // Current score range values
    const minScore = filters.minScore ?? 0;
    const maxScore = filters.maxScore ?? 100;

    return (
        <div
            className={cn(
                "flex flex-col gap-3 sm:gap-4 rounded-lg border bg-card p-3 sm:p-4",
                className
            )}
            role="region"
            aria-label="Clip filters"
        >
            {/* Header with filter icon and count - Responsive layout */}
            {/* @validates Requirement 31.3 - Mobile-friendly experience */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <IconFilter className="size-4 text-muted-foreground" />
                    <span className="font-medium text-xs sm:text-sm">Filters</span>
                    {hasActiveFilters && (
                        <Badge variant="secondary" className="text-xs">
                            Active
                        </Badge>
                    )}
                </div>
                {/* Filtered count display - Requirement 7.5 */}
                <span className="text-muted-foreground text-xs sm:text-sm">
                    {filteredCount} of {totalCount} clips
                </span>
            </div>

            {/* Score Range Filter - Requirement 7.1 */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs sm:text-sm font-medium">Score Range</Label>
                    <span className="text-muted-foreground text-xs tabular-nums">
                        {minScore} - {maxScore}
                    </span>
                </div>
                <Slider
                    value={[minScore, maxScore]}
                    onValueChange={handleScoreRangeChange}
                    min={0}
                    max={100}
                    step={1}
                    aria-label="Score range filter"
                    className="touch-none"
                />
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">0</span>
                    <span className="text-muted-foreground text-xs">100</span>
                </div>
            </div>

            {/* Favorites Toggle - Requirement 7.2 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <IconHeart className="size-4 text-muted-foreground" />
                    <Label htmlFor="favorites-filter" className="text-xs sm:text-sm font-medium">
                        Favorites Only
                    </Label>
                </div>
                <Switch
                    id="favorites-filter"
                    checked={filters.favorited === true}
                    onCheckedChange={handleFavoritesToggle}
                    aria-label="Show favorites only"
                />
            </div>

            {/* Sort Controls - Requirement 7.3 */}
            {/* @validates Requirement 31.3 - Mobile-friendly sort controls */}
            <div className="flex flex-col gap-2">
                <Label className="text-xs sm:text-sm font-medium">Sort By</Label>
                <div className="flex items-center gap-2">
                    <Select
                        value={filters.sortBy}
                        onValueChange={handleSortByChange}
                    >
                        <SelectTrigger className="flex-1 h-10 sm:h-9 text-xs sm:text-sm" aria-label="Sort by">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    <span className="flex items-center gap-2">
                                        {option.icon}
                                        <span className="text-xs sm:text-sm">{option.label}</span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSortOrderToggle}
                        aria-label={`Sort ${filters.sortOrder === "asc" ? "ascending" : "descending"}`}
                        title={filters.sortOrder === "asc" ? "Ascending" : "Descending"}
                        className="h-10 w-10 sm:h-9 sm:w-9 shrink-0"
                    >
                        {filters.sortOrder === "asc" ? (
                            <IconSortAscending className="size-4" />
                        ) : (
                            <IconSortDescending className="size-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="w-full text-xs sm:text-sm"
                >
                    Reset Filters
                </Button>
            )}
        </div>
    );
}

export default ClipFilters;
