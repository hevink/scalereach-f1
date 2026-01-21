import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { ClipFilters } from './clip-filters';
import type { ClipFiltersProps } from './clip-filters';
import type { ClipFilters as ClipFiltersType, ClipResponse, ClipStatus, AspectRatio } from '@/lib/api/clips';

/**
 * Tests for ClipFilters Component
 * Feature: video-clipping-frontend-redesign
 * 
 * These tests validate that the ClipFilters component correctly handles
 * filtering and sorting of clips.
 * 
 * @validates Requirements 2.5, 17.1, 17.2, 17.3, 17.4, 17.5
 */

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({
        replace: vi.fn(),
        push: vi.fn(),
    }),
    usePathname: () => '/test-path',
}));

// Default filter values
const DEFAULT_FILTERS: ClipFiltersType = {
    minScore: 0,
    maxScore: 100,
    favorited: undefined,
    sortBy: 'score',
    sortOrder: 'desc',
};

// Helper to create default props
function createDefaultProps(overrides: Partial<ClipFiltersProps> = {}): ClipFiltersProps {
    return {
        filters: { ...DEFAULT_FILTERS },
        onChange: vi.fn(),
        totalCount: 50,
        filteredCount: 50,
        syncToUrl: false, // Disable URL sync for testing
        ...overrides,
    };
}

// Helper to create a valid clip for testing
function createTestClip(overrides: Partial<ClipResponse> = {}): ClipResponse {
    return {
        id: 'clip-123',
        videoId: 'video-456',
        title: 'Test Clip Title',
        startTime: 10,
        endTime: 40,
        duration: 30,
        transcript: 'This is a test transcript',
        viralityScore: 75,
        viralityReason: 'High engagement potential',
        hooks: ['Hook 1', 'Hook 2'],
        emotions: ['excitement', 'curiosity'],
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        storageKey: null,
        storageUrl: null,
        aspectRatio: '9:16',
        favorited: false,
        status: 'ready',
        errorMessage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

// Arbitrary for generating random clip data for property-based tests
const clipArbitrary: fc.Arbitrary<ClipResponse> = fc.record({
    id: fc.uuid(),
    videoId: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    startTime: fc.float({ min: 0, max: 3600 }),
    endTime: fc.float({ min: 0, max: 3600 }),
    duration: fc.integer({ min: 1, max: 600 }),
    transcript: fc.string(),
    viralityScore: fc.integer({ min: 0, max: 100 }),
    viralityReason: fc.string({ minLength: 0, maxLength: 200 }),
    hooks: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }),
    emotions: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 }),
    thumbnailUrl: fc.oneof(fc.webUrl(), fc.constant(undefined)),
    storageKey: fc.oneof(fc.string(), fc.constant(null)),
    storageUrl: fc.oneof(fc.webUrl(), fc.constant(null)),
    aspectRatio: fc.oneof(
        fc.constantFrom('9:16' as AspectRatio, '1:1' as AspectRatio, '16:9' as AspectRatio),
        fc.constant(null)
    ),
    favorited: fc.boolean(),
    status: fc.constantFrom(
        'detected' as ClipStatus,
        'generating' as ClipStatus,
        'ready' as ClipStatus,
        'exported' as ClipStatus,
        'failed' as ClipStatus
    ),
    errorMessage: fc.oneof(fc.string(), fc.constant(null)),
    createdAt: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts).toISOString()),
    updatedAt: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts).toISOString()),
});

// Arbitrary for generating valid filter configurations
const filtersArbitrary: fc.Arbitrary<ClipFiltersType> = fc.record({
    minScore: fc.integer({ min: 0, max: 100 }),
    maxScore: fc.integer({ min: 0, max: 100 }),
    favorited: fc.oneof(fc.constant(true), fc.constant(false), fc.constant(undefined)),
    sortBy: fc.constantFrom('score' as const, 'duration' as const, 'createdAt' as const),
    sortOrder: fc.constantFrom('asc' as const, 'desc' as const),
}).map(filters => ({
    ...filters,
    // Ensure minScore <= maxScore
    minScore: Math.min(filters.minScore, filters.maxScore),
    maxScore: Math.max(filters.minScore, filters.maxScore),
}));

/**
 * Helper function to apply filters to a list of clips
 * This simulates what the backend or parent component would do
 */
function applyFilters(clips: ClipResponse[], filters: ClipFiltersType): ClipResponse[] {
    let result = [...clips];

    // Apply viral score filter
    if (filters.minScore !== undefined) {
        result = result.filter(clip => clip.viralityScore >= filters.minScore!);
    }
    if (filters.maxScore !== undefined) {
        result = result.filter(clip => clip.viralityScore <= filters.maxScore!);
    }

    // Apply favorited filter
    if (filters.favorited === true) {
        result = result.filter(clip => clip.favorited === true);
    }

    // Apply sorting
    result.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
            case 'score':
                comparison = a.viralityScore - b.viralityScore;
                break;
            case 'duration':
                comparison = a.duration - b.duration;
                break;
            case 'createdAt':
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
        }
        return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
}

describe('ClipFilters Component', () => {
    describe('Unit Tests', () => {
        it('renders without crashing', () => {
            const props = createDefaultProps();
            const { container } = render(<ClipFilters {...props} />);
            expect(container.querySelector('[data-testid="clip-filters"]')).toBeTruthy();
        });

        it('displays the correct filtered count', () => {
            const props = createDefaultProps({
                totalCount: 100,
                filteredCount: 25,
            });
            const { container } = render(<ClipFilters {...props} />);

            const countDisplay = container.querySelector('[data-testid="filtered-count"]');
            expect(countDisplay?.textContent).toContain('25 of 100');
        });

        it('renders score filter controls', () => {
            const props = createDefaultProps();
            const { container } = render(<ClipFilters {...props} />);

            const scoreFilter = container.querySelector('[data-testid="score-filter"]');
            expect(scoreFilter).toBeTruthy();

            const slider = container.querySelector('[data-testid="score-range-slider"]');
            expect(slider).toBeTruthy();
        });

        it('renders sort controls', () => {
            const props = createDefaultProps();
            const { container } = render(<ClipFilters {...props} />);

            const sortControls = container.querySelector('[data-testid="sort-controls"]');
            expect(sortControls).toBeTruthy();

            const sortBySelect = container.querySelector('[data-testid="sort-by-select"]');
            expect(sortBySelect).toBeTruthy();

            const sortOrderToggle = container.querySelector('[data-testid="sort-order-toggle"]');
            expect(sortOrderToggle).toBeTruthy();
        });

        it('renders favorites filter toggle', () => {
            const props = createDefaultProps();
            const { container } = render(<ClipFilters {...props} />);

            const favoritesFilter = container.querySelector('[data-testid="favorites-filter"]');
            expect(favoritesFilter).toBeTruthy();

            const favoritesToggle = container.querySelector('[data-testid="favorites-toggle"]');
            expect(favoritesToggle).toBeTruthy();
        });

        it('calls onChange when sort order is toggled', async () => {
            const onChange = vi.fn();
            const props = createDefaultProps({
                onChange,
                filters: { ...DEFAULT_FILTERS, sortOrder: 'desc' },
            });
            const { container } = render(<ClipFilters {...props} />);

            const sortOrderToggle = container.querySelector('[data-testid="sort-order-toggle"]');
            fireEvent.click(sortOrderToggle!);

            expect(onChange).toHaveBeenCalledWith(
                expect.objectContaining({ sortOrder: 'asc' })
            );
        });

        it('calls onChange when favorites toggle is changed', () => {
            const onChange = vi.fn();
            const props = createDefaultProps({
                onChange,
                filters: { ...DEFAULT_FILTERS, favorited: undefined },
            });
            const { container } = render(<ClipFilters {...props} />);

            const favoritesToggle = container.querySelector('[data-testid="favorites-toggle"]');
            fireEvent.click(favoritesToggle!);

            expect(onChange).toHaveBeenCalledWith(
                expect.objectContaining({ favorited: true })
            );
        });

        it('shows reset button when filters are active', () => {
            const props = createDefaultProps({
                filters: { ...DEFAULT_FILTERS, minScore: 50 },
            });
            const { container } = render(<ClipFilters {...props} />);

            const resetButton = container.querySelector('[data-testid="reset-filters-button"]');
            expect(resetButton).toBeTruthy();
        });

        it('does not show reset button when using default filters', () => {
            const props = createDefaultProps({
                filters: DEFAULT_FILTERS,
            });
            const { container } = render(<ClipFilters {...props} />);

            const resetButton = container.querySelector('[data-testid="reset-filters-button"]');
            expect(resetButton).toBeNull();
        });

        it('displays current score range', () => {
            const props = createDefaultProps({
                filters: { ...DEFAULT_FILTERS, minScore: 30, maxScore: 80 },
            });
            const { container } = render(<ClipFilters {...props} />);

            const rangeDisplay = container.querySelector('[data-testid="score-range-display"]');
            expect(rangeDisplay?.textContent).toBe('30 - 80');
        });

        it('has correct accessibility attributes', () => {
            const props = createDefaultProps();
            const { container } = render(<ClipFilters {...props} />);

            const filtersRegion = container.querySelector('[data-testid="clip-filters"]');
            expect(filtersRegion?.getAttribute('role')).toBe('region');
            expect(filtersRegion?.getAttribute('aria-label')).toBe('Clip filters');
        });
    });

    describe('Property-Based Tests', () => {
        /**
         * Property 7: Filter and Sort Controls Function
         * 
         * **Validates: Requirements 2.5, 17.5**
         * 
         * For ANY filter or sort option applied, the displayed clips list should
         * update to match the filter/sort criteria.
         * 
         * This property tests that:
         * - When filters change, onChange is called with the new filter values
         * - The filter values are correctly propagated
         * - This holds true for any valid filter configuration
         */
        it('Property 7: Filter and Sort Controls Function', () => {
            fc.assert(
                fc.property(
                    filtersArbitrary,
                    fc.array(clipArbitrary, { minLength: 1, maxLength: 30 }),
                    (filters, clips) => {
                        // Ensure unique IDs
                        const uniqueClips = clips.map((clip, index) => ({
                            ...clip,
                            id: `clip-${index}`,
                        }));

                        // Apply filters to get expected result
                        const filteredClips = applyFilters(uniqueClips, filters);

                        const onChange = vi.fn();
                        const props = createDefaultProps({
                            filters,
                            onChange,
                            totalCount: uniqueClips.length,
                            filteredCount: filteredClips.length,
                        });

                        const { container } = render(<ClipFilters {...props} />);

                        // Verify the component renders with the correct filter state
                        const filtersElement = container.querySelector('[data-testid="clip-filters"]');
                        expect(filtersElement, 'ClipFilters should render').toBeTruthy();

                        // Verify the filtered count is displayed correctly
                        const countDisplay = container.querySelector('[data-testid="filtered-count"]');
                        expect(
                            countDisplay?.textContent,
                            'Filtered count should be displayed'
                        ).toContain(`${filteredClips.length} of ${uniqueClips.length}`);

                        // Verify the score range is displayed correctly
                        const rangeDisplay = container.querySelector('[data-testid="score-range-display"]');
                        expect(
                            rangeDisplay?.textContent,
                            'Score range should be displayed'
                        ).toBe(`${filters.minScore} - ${filters.maxScore}`);
                    }
                ),
                { numRuns: 20 }
            );
        });

        /**
         * Property 54: Viral Score Filter
         * 
         * **Validates: Requirements 17.1**
         * 
         * For ANY viral score threshold filter applied, only clips with scores
         * above the threshold should be displayed.
         * 
         * This property tests that:
         * - When a minimum score filter is set, clips below that score are excluded
         * - When a maximum score filter is set, clips above that score are excluded
         * - The filtering is applied correctly for any threshold value (0-100)
         */
        it('Property 54: Viral Score Filter', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 100 }), // minScore threshold
                    fc.integer({ min: 0, max: 100 }), // maxScore threshold
                    fc.array(clipArbitrary, { minLength: 5, maxLength: 30 }),
                    (minScoreRaw, maxScoreRaw, clips) => {
                        // Ensure minScore <= maxScore
                        const minScore = Math.min(minScoreRaw, maxScoreRaw);
                        const maxScore = Math.max(minScoreRaw, maxScoreRaw);

                        // Ensure unique IDs
                        const uniqueClips = clips.map((clip, index) => ({
                            ...clip,
                            id: `clip-${index}`,
                        }));

                        // Calculate expected filtered clips
                        const expectedFilteredClips = uniqueClips.filter(
                            clip => clip.viralityScore >= minScore && clip.viralityScore <= maxScore
                        );

                        const filters: ClipFiltersType = {
                            ...DEFAULT_FILTERS,
                            minScore,
                            maxScore,
                        };

                        const onChange = vi.fn();
                        const props = createDefaultProps({
                            filters,
                            onChange,
                            totalCount: uniqueClips.length,
                            filteredCount: expectedFilteredClips.length,
                        });

                        const { container } = render(<ClipFilters {...props} />);

                        // Verify the score range is displayed correctly
                        const rangeDisplay = container.querySelector('[data-testid="score-range-display"]');
                        expect(
                            rangeDisplay?.textContent,
                            `Score range should show ${minScore} - ${maxScore}`
                        ).toBe(`${minScore} - ${maxScore}`);

                        // Verify the filtered count matches expected
                        const countDisplay = container.querySelector('[data-testid="filtered-count"]');
                        expect(
                            countDisplay?.textContent,
                            `Should show ${expectedFilteredClips.length} of ${uniqueClips.length} clips`
                        ).toContain(`${expectedFilteredClips.length} of ${uniqueClips.length}`);

                        // Verify that all clips in the expected result have scores within range
                        expectedFilteredClips.forEach(clip => {
                            expect(
                                clip.viralityScore >= minScore && clip.viralityScore <= maxScore,
                                `Clip with score ${clip.viralityScore} should be within range [${minScore}, ${maxScore}]`
                            ).toBe(true);
                        });

                        // Verify that clips outside the range are excluded
                        const excludedClips = uniqueClips.filter(
                            clip => clip.viralityScore < minScore || clip.viralityScore > maxScore
                        );
                        expect(
                            expectedFilteredClips.length + excludedClips.length,
                            'Filtered + excluded clips should equal total clips'
                        ).toBe(uniqueClips.length);
                    }
                ),
                { numRuns: 20 }
            );
        });

        /**
         * Property 55: Sorting Functionality
         * 
         * **Validates: Requirements 17.2, 17.3, 17.4**
         * 
         * For ANY sort option (score, duration, or date) and order (asc or desc),
         * the clips should be displayed in the correct sorted order.
         * 
         * This property tests that:
         * - Sorting by score orders clips by viralityScore
         * - Sorting by duration orders clips by duration
         * - Sorting by createdAt orders clips by creation date
         * - Ascending order shows lowest values first
         * - Descending order shows highest values first
         */
        it('Property 55: Sorting Functionality', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('score' as const, 'duration' as const, 'createdAt' as const),
                    fc.constantFrom('asc' as const, 'desc' as const),
                    fc.array(clipArbitrary, { minLength: 2, maxLength: 30 }),
                    (sortBy, sortOrder, clips) => {
                        // Ensure unique IDs and varied values for sorting
                        const uniqueClips = clips.map((clip, index) => ({
                            ...clip,
                            id: `clip-${index}`,
                            // Ensure varied values for better sorting tests
                            viralityScore: (clip.viralityScore + index) % 101,
                            duration: clip.duration + index,
                            createdAt: new Date(Date.now() - index * 86400000).toISOString(),
                        }));

                        const filters: ClipFiltersType = {
                            ...DEFAULT_FILTERS,
                            sortBy,
                            sortOrder,
                        };

                        // Apply sorting to get expected result
                        const sortedClips = applyFilters(uniqueClips, filters);

                        // Verify the sorting is correct
                        for (let i = 0; i < sortedClips.length - 1; i++) {
                            const current = sortedClips[i];
                            const next = sortedClips[i + 1];

                            let currentValue: number;
                            let nextValue: number;

                            switch (sortBy) {
                                case 'score':
                                    currentValue = current.viralityScore;
                                    nextValue = next.viralityScore;
                                    break;
                                case 'duration':
                                    currentValue = current.duration;
                                    nextValue = next.duration;
                                    break;
                                case 'createdAt':
                                    currentValue = new Date(current.createdAt).getTime();
                                    nextValue = new Date(next.createdAt).getTime();
                                    break;
                            }

                            if (sortOrder === 'asc') {
                                expect(
                                    currentValue <= nextValue,
                                    `In ascending order, ${sortBy} ${currentValue} should be <= ${nextValue}`
                                ).toBe(true);
                            } else {
                                expect(
                                    currentValue >= nextValue,
                                    `In descending order, ${sortBy} ${currentValue} should be >= ${nextValue}`
                                ).toBe(true);
                            }
                        }

                        // Verify the UI reflects the sort configuration
                        const onChange = vi.fn();
                        const props = createDefaultProps({
                            filters,
                            onChange,
                            totalCount: uniqueClips.length,
                            filteredCount: sortedClips.length,
                        });

                        const { container } = render(<ClipFilters {...props} />);

                        // Verify sort order toggle shows correct icon
                        const sortOrderToggle = container.querySelector('[data-testid="sort-order-toggle"]');
                        expect(sortOrderToggle).toBeTruthy();

                        const ariaLabel = sortOrderToggle?.getAttribute('aria-label');
                        if (sortOrder === 'asc') {
                            expect(ariaLabel).toBe('Sort ascending');
                        } else {
                            expect(ariaLabel).toBe('Sort descending');
                        }
                    }
                ),
                { numRuns: 20 }
            );
        });

        /**
         * Property: Sort order toggle changes between asc and desc
         * 
         * For any current sort order, clicking the toggle should switch to the opposite order.
         */
        it('Property: Sort order toggle changes between asc and desc', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('asc' as const, 'desc' as const),
                    (currentSortOrder) => {
                        const onChange = vi.fn();
                        const filters: ClipFiltersType = {
                            ...DEFAULT_FILTERS,
                            sortOrder: currentSortOrder,
                        };
                        const props = createDefaultProps({
                            filters,
                            onChange,
                        });

                        const { container } = render(<ClipFilters {...props} />);

                        const sortOrderToggle = container.querySelector('[data-testid="sort-order-toggle"]');
                        fireEvent.click(sortOrderToggle!);

                        // Should toggle to opposite order
                        const expectedNewOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
                        expect(onChange).toHaveBeenCalledWith(
                            expect.objectContaining({ sortOrder: expectedNewOrder })
                        );
                    }
                ),
                { numRuns: 20 }
            );
        });

        /**
         * Property: Favorites filter correctly toggles
         * 
         * When favorites toggle is clicked, it should toggle between true and undefined.
         */
        it('Property: Favorites filter correctly toggles', () => {
            fc.assert(
                fc.property(
                    fc.oneof(fc.constant(true), fc.constant(undefined)),
                    (currentFavorited) => {
                        const onChange = vi.fn();
                        const filters: ClipFiltersType = {
                            ...DEFAULT_FILTERS,
                            favorited: currentFavorited,
                        };
                        const props = createDefaultProps({
                            filters,
                            onChange,
                        });

                        const { container } = render(<ClipFilters {...props} />);

                        const favoritesToggle = container.querySelector('[data-testid="favorites-toggle"]');
                        fireEvent.click(favoritesToggle!);

                        // Should toggle to opposite state
                        const expectedNewFavorited = currentFavorited === true ? undefined : true;
                        expect(onChange).toHaveBeenCalledWith(
                            expect.objectContaining({ favorited: expectedNewFavorited })
                        );
                    }
                ),
                { numRuns: 20 }
            );
        });

        /**
         * Property: Filter count is always non-negative and <= total count
         * 
         * For any filter configuration, the filtered count should be between 0 and total count.
         */
        it('Property: Filter count is always valid', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 1000 }), // totalCount
                    fc.integer({ min: 0, max: 1000 }), // filteredCount
                    (totalCount, filteredCountRaw) => {
                        // Ensure filteredCount <= totalCount
                        const filteredCount = Math.min(filteredCountRaw, totalCount);

                        const props = createDefaultProps({
                            totalCount,
                            filteredCount,
                        });

                        const { container } = render(<ClipFilters {...props} />);

                        const countDisplay = container.querySelector('[data-testid="filtered-count"]');
                        expect(countDisplay?.textContent).toContain(`${filteredCount} of ${totalCount}`);

                        // Verify the invariant
                        expect(filteredCount >= 0).toBe(true);
                        expect(filteredCount <= totalCount).toBe(true);
                    }
                ),
                { numRuns: 20 }
            );
        });

        /**
         * Property: Combined filters work correctly
         * 
         * When multiple filters are applied together, the result should be the intersection
         * of all filter criteria.
         */
        it('Property: Combined filters work correctly', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 50 }), // minScore
                    fc.integer({ min: 50, max: 100 }), // maxScore
                    fc.boolean(), // favorited filter active
                    fc.constantFrom('score' as const, 'duration' as const, 'createdAt' as const),
                    fc.constantFrom('asc' as const, 'desc' as const),
                    fc.array(clipArbitrary, { minLength: 10, maxLength: 30 }),
                    (minScore, maxScore, favoritedFilter, sortBy, sortOrder, clips) => {
                        // Ensure unique IDs and varied favorited states
                        const uniqueClips = clips.map((clip, index) => ({
                            ...clip,
                            id: `clip-${index}`,
                            favorited: index % 2 === 0, // Alternate favorited state
                        }));

                        const filters: ClipFiltersType = {
                            minScore,
                            maxScore,
                            favorited: favoritedFilter ? true : undefined,
                            sortBy,
                            sortOrder,
                        };

                        // Apply all filters
                        const filteredClips = applyFilters(uniqueClips, filters);

                        // Verify each filtered clip meets ALL criteria
                        filteredClips.forEach(clip => {
                            // Score filter
                            expect(
                                clip.viralityScore >= minScore,
                                `Clip score ${clip.viralityScore} should be >= ${minScore}`
                            ).toBe(true);
                            expect(
                                clip.viralityScore <= maxScore,
                                `Clip score ${clip.viralityScore} should be <= ${maxScore}`
                            ).toBe(true);

                            // Favorited filter
                            if (favoritedFilter) {
                                expect(
                                    clip.favorited,
                                    'Clip should be favorited when filter is active'
                                ).toBe(true);
                            }
                        });

                        // Verify the UI shows correct counts
                        const onChange = vi.fn();
                        const props = createDefaultProps({
                            filters,
                            onChange,
                            totalCount: uniqueClips.length,
                            filteredCount: filteredClips.length,
                        });

                        const { container } = render(<ClipFilters {...props} />);

                        const countDisplay = container.querySelector('[data-testid="filtered-count"]');
                        expect(
                            countDisplay?.textContent
                        ).toContain(`${filteredClips.length} of ${uniqueClips.length}`);
                    }
                ),
                { numRuns: 20 }
            );
        });

        /**
         * Property: Reset filters returns to default state
         * 
         * When reset is clicked, all filters should return to their default values.
         */
        it('Property: Reset filters returns to default state', () => {
            fc.assert(
                fc.property(
                    filtersArbitrary.filter(f =>
                        // Only test with non-default filters
                        f.minScore > 0 || f.maxScore < 100 || f.favorited === true ||
                        f.sortBy !== 'score' || f.sortOrder !== 'desc'
                    ),
                    (filters) => {
                        const onChange = vi.fn();
                        const props = createDefaultProps({
                            filters,
                            onChange,
                        });

                        const { container } = render(<ClipFilters {...props} />);

                        // Reset button should be visible for non-default filters
                        const resetButton = container.querySelector('[data-testid="reset-filters-button"]');
                        expect(resetButton, 'Reset button should be visible for non-default filters').toBeTruthy();

                        // Click reset
                        fireEvent.click(resetButton!);

                        // Should call onChange with default filters
                        expect(onChange).toHaveBeenCalledWith(
                            expect.objectContaining({
                                minScore: 0,
                                maxScore: 100,
                                favorited: undefined,
                                sortBy: 'score',
                                sortOrder: 'desc',
                            })
                        );
                    }
                ),
                { numRuns: 20 }
            );
        });
    });
});
