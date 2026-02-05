import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { ClipsGrid } from './clips-grid';
import type { ClipResponse, ClipStatus, AspectRatio } from '@/lib/api/clips';

/**
 * Tests for ClipsGrid Component
 * Feature: video-clipping-frontend-redesign
 * 
 * These tests validate that the ClipsGrid component correctly displays all clips
 * associated with a video in a list layout (NOT card format).
 * 
 * @validates Requirements 2.1, 2.2, 2.3
 */

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
    // Use integer timestamps to avoid invalid date issues
    createdAt: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts).toISOString()),
    updatedAt: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts).toISOString()),
});

describe('ClipsGrid Component', () => {
    describe('Unit Tests', () => {
        it('renders loading state when isLoading is true', () => {
            const { container } = render(
                <ClipsGrid
                    clips={[]}
                    onClipClick={vi.fn()}
                    isLoading={true}
                />
            );

            const loadingElement = container.querySelector('[data-testid="clips-grid-loading"]');
            expect(loadingElement).toBeTruthy();
            expect(loadingElement?.getAttribute('role')).toBe('status');
            expect(loadingElement?.getAttribute('aria-label')).toBe('Loading clips');
        });

        it('renders empty state when no clips and not loading', () => {
            const { container } = render(
                <ClipsGrid
                    clips={[]}
                    onClipClick={vi.fn()}
                    isLoading={false}
                />
            );

            const emptyElement = container.querySelector('[data-testid="clips-grid-empty"]');
            expect(emptyElement).toBeTruthy();
        });

        it('renders all clips when clips are provided', () => {
            const testClips = [
                createTestClip({ id: 'clip-1', title: 'Clip One' }),
                createTestClip({ id: 'clip-2', title: 'Clip Two' }),
                createTestClip({ id: 'clip-3', title: 'Clip Three' }),
            ];

            const { container } = render(
                <ClipsGrid
                    clips={testClips}
                    onClipClick={vi.fn()}
                />
            );

            // Should render the grid container
            const grid = container.querySelector('[data-testid="clips-grid"]');
            expect(grid).toBeTruthy();

            // Should render all clip items
            const clipItems = container.querySelectorAll('[data-testid="clip-list-item"]');
            expect(clipItems.length).toBe(testClips.length);
        });

        it('renders clips in list layout (NOT card format)', () => {
            const testClips = [
                createTestClip({ id: 'clip-1' }),
                createTestClip({ id: 'clip-2' }),
            ];

            const { container } = render(
                <ClipsGrid
                    clips={testClips}
                    onClipClick={vi.fn()}
                />
            );

            const grid = container.querySelector('[data-testid="clips-grid"]');
            expect(grid).toBeTruthy();

            // Should use flex column layout for list view
            expect(grid?.classList.contains('flex')).toBe(true);
            expect(grid?.classList.contains('flex-col')).toBe(true);
        });

        it('calls onClipClick with correct clip id when clip is clicked', () => {
            const testClips = [
                createTestClip({ id: 'clip-1', title: 'Clip One' }),
                createTestClip({ id: 'clip-2', title: 'Clip Two' }),
            ];
            const onClipClick = vi.fn();

            const { container } = render(
                <ClipsGrid
                    clips={testClips}
                    onClipClick={onClipClick}
                />
            );

            // Click the first clip
            const firstClip = container.querySelector('[data-testid="clip-list-item"]');
            fireEvent.click(firstClip!);

            expect(onClipClick).toHaveBeenCalledTimes(1);
            expect(onClipClick).toHaveBeenCalledWith('clip-1');
        });

        it('applies selected state to the correct clip', () => {
            const testClips = [
                createTestClip({ id: 'clip-1' }),
                createTestClip({ id: 'clip-2' }),
            ];

            const { container } = render(
                <ClipsGrid
                    clips={testClips}
                    onClipClick={vi.fn()}
                    selectedClipId="clip-2"
                />
            );

            const clipItems = container.querySelectorAll('[data-testid="clip-list-item"]');

            // First clip should not be selected
            expect(clipItems[0].getAttribute('aria-selected')).toBe('false');

            // Second clip should be selected
            expect(clipItems[1].getAttribute('aria-selected')).toBe('true');
        });

        it('renders with accessibility attributes', () => {
            const testClips = [
                createTestClip({ id: 'clip-1' }),
                createTestClip({ id: 'clip-2' }),
            ];

            const { container } = render(
                <ClipsGrid
                    clips={testClips}
                    onClipClick={vi.fn()}
                />
            );

            const grid = container.querySelector('[data-testid="clips-grid"]');
            expect(grid?.getAttribute('role')).toBe('list');
            expect(grid?.getAttribute('aria-label')).toBe('Clips list');

            // Check list items
            const listItems = container.querySelectorAll('[role="listitem"]');
            expect(listItems.length).toBe(testClips.length);
        });

        it('applies custom className when provided', () => {
            const customClass = 'custom-clips-class';
            const testClips = [createTestClip({ id: 'clip-1' })];

            const { container } = render(
                <ClipsGrid
                    clips={testClips}
                    onClipClick={vi.fn()}
                    className={customClass}
                />
            );

            const grid = container.querySelector('[data-testid="clips-grid"]');
            expect(grid?.classList.contains(customClass)).toBe(true);
        });
    });

    describe('Property-Based Tests', () => {
        /**
         * Property 4: Clips Page Displays All Clips
         * 
         * **Validates: Requirements 2.1**
         * 
         * For ANY video with associated clips, when the clips page is rendered,
         * all clips should appear in the clips list.
         * 
         * This property ensures that:
         * - No clips are lost during rendering
         * - The grid displays exactly the number of clips provided
         * - This holds true regardless of the number of clips (1 to 50+)
         * - Each clip is rendered as a ClipListItem component
         */
        it('Property 4: Clips Page Displays All Clips', () => {
            fc.assert(
                fc.property(
                    // Generate an array of 1-50 clips
                    fc.array(clipArbitrary, { minLength: 1, maxLength: 50 }),
                    (clips) => {
                        // Ensure unique IDs for each clip
                        const uniqueClips = clips.map((clip, index) => ({
                            ...clip,
                            id: `clip-${index}`,
                        }));

                        const { container } = render(
                            <ClipsGrid
                                clips={uniqueClips}
                                onClipClick={vi.fn()}
                            />
                        );

                        // The grid should be rendered
                        const grid = container.querySelector('[data-testid="clips-grid"]');
                        expect(grid, 'Clips grid should be rendered').toBeTruthy();

                        // All clips should be rendered as clip list items
                        const clipItems = container.querySelectorAll('[data-testid="clip-list-item"]');
                        expect(
                            clipItems.length,
                            `Expected ${uniqueClips.length} clips to be rendered, but found ${clipItems.length}`
                        ).toBe(uniqueClips.length);

                        // Each clip should have a corresponding list item
                        const listItems = container.querySelectorAll('[role="listitem"]');
                        expect(
                            listItems.length,
                            `Expected ${uniqueClips.length} list items, but found ${listItems.length}`
                        ).toBe(uniqueClips.length);
                    }
                ),
                { numRuns: 20 } // Run 100 iterations as specified in the design
            );
        });

        /**
         * Property: Click handler is called with correct clip ID for any clip
         * 
         * For ANY clip in the list, clicking it should trigger onClipClick
         * with the correct clip ID.
         */
        it('Property: Click handler is called with correct clip ID', () => {
            fc.assert(
                fc.property(
                    fc.array(clipArbitrary, { minLength: 1, maxLength: 20 }),
                    fc.integer({ min: 0, max: 19 }), // Index of clip to click
                    (clips, clickIndexRaw) => {
                        // Ensure we have at least one clip and a valid index
                        if (clips.length === 0) return true;

                        const clickIndex = clickIndexRaw % clips.length;

                        // Ensure unique IDs
                        const uniqueClips = clips.map((clip, index) => ({
                            ...clip,
                            id: `clip-${index}`,
                        }));

                        const targetClip = uniqueClips[clickIndex];
                        const onClipClick = vi.fn();

                        const { container } = render(
                            <ClipsGrid
                                clips={uniqueClips}
                                onClipClick={onClipClick}
                            />
                        );

                        // Get all clip items
                        const clipItems = container.querySelectorAll('[data-testid="clip-list-item"]');
                        expect(clipItems.length).toBe(uniqueClips.length);

                        // Click the target clip
                        fireEvent.click(clipItems[clickIndex]);

                        // Verify onClipClick was called with the correct clip ID
                        expect(onClipClick).toHaveBeenCalledTimes(1);
                        expect(onClipClick).toHaveBeenCalledWith(targetClip.id);
                    }
                ),
                { numRuns: 20 } // Run 100 iterations as specified in the design
            );
        });

        /**
         * Property: Empty clips array shows empty state
         * 
         * When clips array is empty, the empty state should be displayed.
         */
        it('Property: Empty clips array shows empty state', () => {
            const { container } = render(
                <ClipsGrid
                    clips={[]}
                    onClipClick={vi.fn()}
                />
            );

            const emptyElement = container.querySelector('[data-testid="clips-grid-empty"]');
            expect(emptyElement).toBeTruthy();

            const gridElement = container.querySelector('[data-testid="clips-grid"]');
            expect(gridElement).toBeNull();
        });

        /**
         * Property: Loading state is shown when isLoading is true regardless of clips
         * 
         * When isLoading is true, loading state should be shown even if clips are provided.
         */
        it('Property: Loading state takes precedence', () => {
            fc.assert(
                fc.property(
                    fc.array(clipArbitrary, { minLength: 0, maxLength: 10 }),
                    (clips) => {
                        const uniqueClips = clips.map((clip, index) => ({
                            ...clip,
                            id: `clip-${index}`,
                        }));

                        const { container } = render(
                            <ClipsGrid
                                clips={uniqueClips}
                                onClipClick={vi.fn()}
                                isLoading={true}
                            />
                        );

                        // Loading state should be shown
                        const loadingElement = container.querySelector('[data-testid="clips-grid-loading"]');
                        expect(loadingElement).toBeTruthy();

                        // Grid should not be shown
                        const gridElement = container.querySelector('[data-testid="clips-grid"]');
                        expect(gridElement).toBeNull();
                    }
                ),
                { numRuns: 50 }
            );
        });

        /**
         * Property: Each clip's title is rendered
         * 
         * For any set of clips, each clip's title should be visible.
         */
        it('Property: Each clip title is rendered', () => {
            fc.assert(
                fc.property(
                    fc.array(clipArbitrary, { minLength: 1, maxLength: 10 }),
                    (clips) => {
                        // Ensure unique IDs and titles
                        const uniqueClips = clips.map((clip, index) => ({
                            ...clip,
                            id: `clip-${index}`,
                            title: `Unique Title ${index}`,
                        }));

                        const { container } = render(
                            <ClipsGrid
                                clips={uniqueClips}
                                onClipClick={vi.fn()}
                            />
                        );

                        // Check that each clip's title is present
                        const titleElements = container.querySelectorAll('[data-testid="clip-title"]');
                        expect(titleElements.length).toBe(uniqueClips.length);

                        // Verify each title matches
                        uniqueClips.forEach((clip, index) => {
                            expect(titleElements[index].textContent).toBe(clip.title);
                        });
                    }
                ),
                { numRuns: 50 }
            );
        });
    });
});
