import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { ClipListItem } from './clip-list-item';
import type { ClipResponse } from '@/lib/api/clips';

/**
 * Tests for ClipListItem Component
 * Feature: video-clipping-frontend-redesign
 * 
 * These tests validate that the ClipListItem component correctly renders
 * clip information in a table-like row layout (NOT card format).
 * 
 * @validates Requirements 2.2, 2.3
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
const clipArbitrary = fc.record({
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
        fc.constantFrom('9:16' as const, '1:1' as const, '16:9' as const),
        fc.constant(null)
    ),
    favorited: fc.boolean(),
    status: fc.constantFrom(
        'detected' as const,
        'generating' as const,
        'ready' as const,
        'exported' as const,
        'failed' as const
    ),
    errorMessage: fc.oneof(fc.string(), fc.constant(null)),
    createdAt: fc.date().map(d => d.toISOString()),
    updatedAt: fc.date().map(d => d.toISOString()),
}) as fc.Arbitrary<ClipResponse>;

describe('ClipListItem Component', () => {
    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            const clip = createTestClip();
            const { container } = render(
                <ClipListItem clip={clip} onClick={vi.fn()} />
            );
            expect(container.querySelector('[data-testid="clip-list-item"]')).toBeTruthy();
        });

        it('renders in table-like row layout (NOT card format)', () => {
            const clip = createTestClip();
            const { container } = render(
                <ClipListItem clip={clip} onClick={vi.fn()} />
            );

            const listItem = container.querySelector('[data-testid="clip-list-item"]');
            expect(listItem).toBeTruthy();

            // Verify it uses flex layout for horizontal row arrangement
            expect(listItem?.classList.contains('flex')).toBe(true);
            expect(listItem?.classList.contains('items-center')).toBe(true);
        });
    });

    describe('Required Information Display', () => {
        /**
         * @validates Requirements 2.2, 2.3
         * Clip items should display: thumbnail, title, viral score, duration, hooks
         */
        it('displays thumbnail', () => {
            const clip = createTestClip({ thumbnailUrl: 'https://example.com/thumb.jpg' });
            const { container } = render(
                <ClipListItem clip={clip} onClick={vi.fn()} />
            );

            const thumbnail = container.querySelector('[data-testid="clip-thumbnail"]');
            expect(thumbnail).toBeTruthy();

            const img = thumbnail?.querySelector('img');
            expect(img).toBeTruthy();
            expect(img?.getAttribute('src')).toBe('https://example.com/thumb.jpg');
        });

        it('displays placeholder when no thumbnail', () => {
            const clip = createTestClip({ thumbnailUrl: undefined, storageUrl: null });
            const { container } = render(
                <ClipListItem clip={clip} onClick={vi.fn()} />
            );

            const thumbnail = container.querySelector('[data-testid="clip-thumbnail"]');
            expect(thumbnail).toBeTruthy();

            // Should have a placeholder icon (SVG)
            const svg = thumbnail?.querySelector('svg');
            expect(svg).toBeTruthy();
        });

        it('displays title', () => {
            const clip = createTestClip({ title: 'My Amazing Clip' });
            const { container } = render(
                <ClipListItem clip={clip} onClick={vi.fn()} />
            );

            const title = container.querySelector('[data-testid="clip-title"]');
            expect(title).toBeTruthy();
            expect(title?.textContent).toBe('My Amazing Clip');
        });

        it('displays viral score with correct color coding', () => {
            // Test high score (green)
            const highScoreClip = createTestClip({ viralityScore: 85 });
            const { container: highContainer } = render(
                <ClipListItem clip={highScoreClip} onClick={vi.fn()} />
            );
            const highScore = highContainer.querySelector('[data-testid="clip-viral-score"]');
            expect(highScore).toBeTruthy();
            expect(highScore?.textContent).toContain('85');
            expect(highScore?.classList.toString()).toContain('green');

            // Test medium score (yellow)
            const mediumScoreClip = createTestClip({ viralityScore: 55 });
            const { container: medContainer } = render(
                <ClipListItem clip={mediumScoreClip} onClick={vi.fn()} />
            );
            const medScore = medContainer.querySelector('[data-testid="clip-viral-score"]');
            expect(medScore?.textContent).toContain('55');
            expect(medScore?.classList.toString()).toContain('yellow');

            // Test low score (red)
            const lowScoreClip = createTestClip({ viralityScore: 25 });
            const { container: lowContainer } = render(
                <ClipListItem clip={lowScoreClip} onClick={vi.fn()} />
            );
            const lowScore = lowContainer.querySelector('[data-testid="clip-viral-score"]');
            expect(lowScore?.textContent).toContain('25');
            expect(lowScore?.classList.toString()).toContain('red');
        });

        it('displays duration', () => {
            const clip = createTestClip({ duration: 125 }); // 2:05
            const { container } = render(
                <ClipListItem clip={clip} onClick={vi.fn()} />
            );

            const duration = container.querySelector('[data-testid="clip-duration"]');
            expect(duration).toBeTruthy();
            expect(duration?.textContent).toContain('2:05');
        });

        it('displays hooks', () => {
            const clip = createTestClip({ hooks: ['Hook A', 'Hook B', 'Hook C'] });
            const { container } = render(
                <ClipListItem clip={clip} onClick={vi.fn()} />
            );

            const hooks = container.querySelector('[data-testid="clip-hooks"]');
            expect(hooks).toBeTruthy();
            expect(hooks?.textContent).toContain('Hook A');
            expect(hooks?.textContent).toContain('Hook B');
            expect(hooks?.textContent).toContain('Hook C');
        });

        it('shows +N indicator when more than 3 hooks', () => {
            const clip = createTestClip({
                hooks: ['Hook 1', 'Hook 2', 'Hook 3', 'Hook 4', 'Hook 5']
            });
            const { container } = render(
                <ClipListItem clip={clip} onClick={vi.fn()} />
            );

            const hooks = container.querySelector('[data-testid="clip-hooks"]');
            expect(hooks?.textContent).toContain('+2');
        });
    });

    describe('Click Handler', () => {
        /**
         * @validates Requirements 2.4
         * Clicking a clip should trigger the onClick handler (to open modal)
         */
        it('calls onClick when clicked', () => {
            const clip = createTestClip();
            const handleClick = vi.fn();
            const { container } = render(
                <ClipListItem clip={clip} onClick={handleClick} />
            );

            const listItem = container.querySelector('[data-testid="clip-list-item"]');
            fireEvent.click(listItem!);

            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('calls onClick when Enter key is pressed', () => {
            const clip = createTestClip();
            const handleClick = vi.fn();
            const { container } = render(
                <ClipListItem clip={clip} onClick={handleClick} />
            );

            const listItem = container.querySelector('[data-testid="clip-list-item"]');
            fireEvent.keyDown(listItem!, { key: 'Enter' });

            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('calls onClick when Space key is pressed', () => {
            const clip = createTestClip();
            const handleClick = vi.fn();
            const { container } = render(
                <ClipListItem clip={clip} onClick={handleClick} />
            );

            const listItem = container.querySelector('[data-testid="clip-list-item"]');
            fireEvent.keyDown(listItem!, { key: ' ' });

            expect(handleClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('Selection State', () => {
        it('applies selected styles when isSelected is true', () => {
            const clip = createTestClip();
            const { container } = render(
                <ClipListItem clip={clip} onClick={vi.fn()} isSelected={true} />
            );

            const listItem = container.querySelector('[data-testid="clip-list-item"]');
            expect(listItem?.classList.toString()).toContain('border-primary');
            expect(listItem?.getAttribute('aria-selected')).toBe('true');
        });

        it('does not apply selected styles when isSelected is false', () => {
            const clip = createTestClip();
            const { container } = render(
                <ClipListItem clip={clip} onClick={vi.fn()} isSelected={false} />
            );

            const listItem = container.querySelector('[data-testid="clip-list-item"]');
            expect(listItem?.getAttribute('aria-selected')).toBe('false');
        });
    });

    describe('Action Buttons', () => {
        it('renders favorite button when onFavorite is provided', () => {
            const clip = createTestClip();
            const { container } = render(
                <ClipListItem
                    clip={clip}
                    onClick={vi.fn()}
                    onFavorite={vi.fn()}
                />
            );

            const favoriteButton = container.querySelector('[data-testid="clip-favorite-button"]');
            expect(favoriteButton).toBeTruthy();
        });

        it('calls onFavorite when favorite button is clicked', () => {
            const clip = createTestClip();
            const handleFavorite = vi.fn();
            const handleClick = vi.fn();
            const { container } = render(
                <ClipListItem
                    clip={clip}
                    onClick={handleClick}
                    onFavorite={handleFavorite}
                />
            );

            const favoriteButton = container.querySelector('[data-testid="clip-favorite-button"]');
            fireEvent.click(favoriteButton!);

            expect(handleFavorite).toHaveBeenCalledTimes(1);
            // Should not trigger the main onClick
            expect(handleClick).not.toHaveBeenCalled();
        });

        it('renders delete button when onDelete is provided', () => {
            const clip = createTestClip();
            const { container } = render(
                <ClipListItem
                    clip={clip}
                    onClick={vi.fn()}
                    onDelete={vi.fn()}
                />
            );

            const deleteButton = container.querySelector('[data-testid="clip-delete-button"]');
            expect(deleteButton).toBeTruthy();
        });

        it('calls onDelete when delete button is clicked', () => {
            const clip = createTestClip();
            const handleDelete = vi.fn();
            const handleClick = vi.fn();
            const { container } = render(
                <ClipListItem
                    clip={clip}
                    onClick={handleClick}
                    onDelete={handleDelete}
                />
            );

            const deleteButton = container.querySelector('[data-testid="clip-delete-button"]');
            fireEvent.click(deleteButton!);

            expect(handleDelete).toHaveBeenCalledTimes(1);
            // Should not trigger the main onClick
            expect(handleClick).not.toHaveBeenCalled();
        });

        it('shows loading state when isFavoriting is true', () => {
            const clip = createTestClip();
            const { container } = render(
                <ClipListItem
                    clip={clip}
                    onClick={vi.fn()}
                    onFavorite={vi.fn()}
                    isFavoriting={true}
                />
            );

            const favoriteButton = container.querySelector('[data-testid="clip-favorite-button"]');
            expect(favoriteButton?.getAttribute('disabled')).toBe('');
            // Should have a spinning loader
            const spinner = favoriteButton?.querySelector('.animate-spin');
            expect(spinner).toBeTruthy();
        });

        it('shows loading state when isDeleting is true', () => {
            const clip = createTestClip();
            const { container } = render(
                <ClipListItem
                    clip={clip}
                    onClick={vi.fn()}
                    onDelete={vi.fn()}
                    isDeleting={true}
                />
            );

            const deleteButton = container.querySelector('[data-testid="clip-delete-button"]');
            expect(deleteButton?.getAttribute('disabled')).toBe('');
            // Should have a spinning loader
            const spinner = deleteButton?.querySelector('.animate-spin');
            expect(spinner).toBeTruthy();
        });
    });

    describe('Favorited State', () => {
        it('shows favorited indicator when clip is favorited', () => {
            const clip = createTestClip({ favorited: true });
            const { container } = render(
                <ClipListItem clip={clip} onClick={vi.fn()} />
            );

            const favoritedIndicator = container.querySelector('[data-testid="clip-favorited"]');
            expect(favoritedIndicator).toBeTruthy();
        });

        it('does not show favorited indicator when clip is not favorited', () => {
            const clip = createTestClip({ favorited: false });
            const { container } = render(
                <ClipListItem clip={clip} onClick={vi.fn()} />
            );

            const favoritedIndicator = container.querySelector('[data-testid="clip-favorited"]');
            expect(favoritedIndicator).toBeNull();
        });
    });

    describe('Accessibility', () => {
        it('has correct ARIA attributes', () => {
            const clip = createTestClip({ title: 'Accessible Clip' });
            const { container } = render(
                <ClipListItem clip={clip} onClick={vi.fn()} />
            );

            const listItem = container.querySelector('[data-testid="clip-list-item"]');
            expect(listItem?.getAttribute('role')).toBe('button');
            expect(listItem?.getAttribute('tabindex')).toBe('0');
            expect(listItem?.getAttribute('aria-label')).toBe('Clip: Accessible Clip');
        });

        it('has accessible labels for action buttons', () => {
            const clip = createTestClip({ favorited: false });
            const { container } = render(
                <ClipListItem
                    clip={clip}
                    onClick={vi.fn()}
                    onFavorite={vi.fn()}
                    onDelete={vi.fn()}
                />
            );

            const favoriteButton = container.querySelector('[data-testid="clip-favorite-button"]');
            expect(favoriteButton?.getAttribute('aria-label')).toBe('Add to favorites');

            const deleteButton = container.querySelector('[data-testid="clip-delete-button"]');
            expect(deleteButton?.getAttribute('aria-label')).toBe('Delete clip');
        });

        it('has correct aria-label for favorited clip', () => {
            const clip = createTestClip({ favorited: true });
            const { container } = render(
                <ClipListItem
                    clip={clip}
                    onClick={vi.fn()}
                    onFavorite={vi.fn()}
                />
            );

            const favoriteButton = container.querySelector('[data-testid="clip-favorite-button"]');
            expect(favoriteButton?.getAttribute('aria-label')).toBe('Remove from favorites');
        });
    });

    describe('Property-Based Tests', () => {
        /**
         * Property 5: Clip Items Contain Required Information
         * 
         * **Validates: Requirements 2.3**
         * 
         * For any clip in the list, the rendered clip item should contain:
         * - Thumbnail (or placeholder)
         * - Title
         * - Viral score
         * - Duration
         * - Hooks (if available)
         */
        it('Property 5: Clip Items Contain Required Information', () => {
            fc.assert(
                fc.property(clipArbitrary, (clip: ClipResponse) => {
                    const { container } = render(
                        <ClipListItem clip={clip} onClick={vi.fn()} />
                    );

                    // 1. Verify the clip list item exists
                    const listItem = container.querySelector('[data-testid="clip-list-item"]');
                    expect(listItem, 'Clip list item should exist').not.toBeNull();

                    // 2. Verify thumbnail container exists
                    const thumbnail = container.querySelector('[data-testid="clip-thumbnail"]');
                    expect(thumbnail, 'Thumbnail container should exist').not.toBeNull();

                    // 3. Verify title is displayed
                    const title = container.querySelector('[data-testid="clip-title"]');
                    expect(title, 'Title should exist').not.toBeNull();
                    expect(title?.textContent, 'Title should match clip title').toBe(clip.title);

                    // 4. Verify viral score is displayed
                    const viralScore = container.querySelector('[data-testid="clip-viral-score"]');
                    expect(viralScore, 'Viral score should exist').not.toBeNull();
                    expect(viralScore?.textContent, 'Viral score should contain the score value').toContain(clip.viralityScore.toString());

                    // 5. Verify duration is displayed
                    const duration = container.querySelector('[data-testid="clip-duration"]');
                    expect(duration, 'Duration should exist').not.toBeNull();

                    // 6. Verify hooks are displayed if present
                    if (clip.hooks.length > 0) {
                        const hooks = container.querySelector('[data-testid="clip-hooks"]');
                        expect(hooks, 'Hooks should exist when clip has hooks').not.toBeNull();
                    }
                }),
                {
                    numRuns: 20, // Run 100 iterations as specified in design doc
                }
            );
        });

        /**
         * Property: Click handler is always called on interaction
         * 
         * For any clip, clicking the item should trigger the onClick callback
         */
        it('Property: Click handler is called for any clip', () => {
            fc.assert(
                fc.property(clipArbitrary, (clip: ClipResponse) => {
                    const handleClick = vi.fn();
                    const { container } = render(
                        <ClipListItem clip={clip} onClick={handleClick} />
                    );

                    const listItem = container.querySelector('[data-testid="clip-list-item"]');
                    fireEvent.click(listItem!);

                    expect(handleClick).toHaveBeenCalledTimes(1);
                }),
                {
                    numRuns: 50,
                }
            );
        });

        /**
         * Property: Viral score color coding is consistent
         * 
         * For any clip:
         * - Score >= 70 should have green color
         * - Score 40-69 should have yellow color
         * - Score < 40 should have red color
         */
        it('Property: Viral score color coding is consistent', () => {
            fc.assert(
                fc.property(clipArbitrary, (clip: ClipResponse) => {
                    const { container } = render(
                        <ClipListItem clip={clip} onClick={vi.fn()} />
                    );

                    const viralScore = container.querySelector('[data-testid="clip-viral-score"]');
                    const classList = viralScore?.classList.toString() || '';

                    if (clip.viralityScore >= 70) {
                        expect(classList, 'High score should have green color').toContain('green');
                    } else if (clip.viralityScore >= 40) {
                        expect(classList, 'Medium score should have yellow color').toContain('yellow');
                    } else {
                        expect(classList, 'Low score should have red color').toContain('red');
                    }
                }),
                {
                    numRuns: 20,
                }
            );
        });

        /**
         * Property 6: Clip Click Opens Modal
         * 
         * **Validates: Requirements 2.4, 3.1**
         * 
         * For any clip item, when clicked, the onClick callback should be invoked
         * exactly once, which triggers the modal to open (isOpen state set to true).
         * 
         * This property verifies that:
         * 1. Clicking any clip triggers the onClick callback
         * 2. The callback is called exactly once per click
         * 3. This behavior is consistent across all possible clip data
         */
        it('Property 6: Clip Click Opens Modal', () => {
            fc.assert(
                fc.property(clipArbitrary, (clip: ClipResponse) => {
                    // Track modal open state
                    let isModalOpen = false;
                    const handleClick = vi.fn(() => {
                        isModalOpen = true;
                    });

                    const { container } = render(
                        <ClipListItem clip={clip} onClick={handleClick} />
                    );

                    // Verify the clip list item exists and is clickable
                    const listItem = container.querySelector('[data-testid="clip-list-item"]');
                    expect(listItem, 'Clip list item should exist').not.toBeNull();
                    expect(listItem?.getAttribute('role'), 'Should have button role').toBe('button');
                    expect(listItem?.getAttribute('tabindex'), 'Should be focusable').toBe('0');

                    // Initial state: modal should be closed
                    expect(isModalOpen, 'Modal should be closed initially').toBe(false);
                    expect(handleClick, 'onClick should not be called initially').not.toHaveBeenCalled();

                    // Click the clip item
                    fireEvent.click(listItem!);

                    // Verify onClick was called exactly once
                    expect(handleClick, 'onClick should be called exactly once').toHaveBeenCalledTimes(1);

                    // Verify modal state changed to open
                    expect(isModalOpen, 'Modal should be open after click').toBe(true);
                }),
                {
                    numRuns: 20, // Run 100 iterations as specified in design doc
                }
            );
        });

        /**
         * Property 6 (Extended): Clip Click Opens Modal via Keyboard
         * 
         * **Validates: Requirements 2.4, 3.1, 20.1**
         * 
         * For any clip item, when activated via keyboard (Enter or Space),
         * the onClick callback should be invoked, which triggers the modal to open.
         * This ensures accessibility compliance for keyboard navigation.
         */
        it('Property 6 (Extended): Clip Click Opens Modal via Keyboard', () => {
            fc.assert(
                fc.property(
                    clipArbitrary,
                    fc.constantFrom('Enter', ' '), // Test both Enter and Space keys
                    (clip: ClipResponse, key: string) => {
                        let isModalOpen = false;
                        const handleClick = vi.fn(() => {
                            isModalOpen = true;
                        });

                        const { container } = render(
                            <ClipListItem clip={clip} onClick={handleClick} />
                        );

                        const listItem = container.querySelector('[data-testid="clip-list-item"]');
                        expect(listItem, 'Clip list item should exist').not.toBeNull();

                        // Initial state: modal should be closed
                        expect(isModalOpen, 'Modal should be closed initially').toBe(false);

                        // Activate via keyboard
                        fireEvent.keyDown(listItem!, { key });

                        // Verify onClick was called exactly once
                        expect(handleClick, `onClick should be called when ${key === ' ' ? 'Space' : key} is pressed`).toHaveBeenCalledTimes(1);

                        // Verify modal state changed to open
                        expect(isModalOpen, 'Modal should be open after keyboard activation').toBe(true);
                    }
                ),
                {
                    numRuns: 20, // Run 100 iterations as specified in design doc
                }
            );
        });
    });
});
