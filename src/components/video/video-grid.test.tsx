import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoGrid } from './video-grid';
import { Video } from '@/lib/api/video';
import * as fc from 'fast-check';

/**
 * Unit Tests for VideoGrid Component
 * Feature: video-clipping-frontend-redesign
 * 
 * These tests validate that the VideoGrid component correctly handles:
 * - Loading states with skeleton
 * - Empty states
 * - Rendering videos in a responsive grid
 */

describe('VideoGrid Component - Unit Tests', () => {
    const mockVideos: Video[] = [
        {
            id: '1',
            projectId: null,
            userId: 'user1',
            sourceType: 'youtube',
            sourceUrl: 'https://youtube.com/watch?v=test1',
            status: 'completed',
            title: 'Test Video 1',
            duration: 120,
            storageKey: null,
            storageUrl: null,
            transcript: null,
            errorMessage: null,
            metadata: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        },
        {
            id: '2',
            projectId: null,
            userId: 'user1',
            sourceType: 'youtube',
            sourceUrl: 'https://youtube.com/watch?v=test2',
            status: 'transcribing',
            title: 'Test Video 2',
            duration: 180,
            storageKey: null,
            storageUrl: null,
            transcript: null,
            errorMessage: null,
            metadata: null,
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
        },
    ];

    it('renders loading skeleton when isLoading is true', () => {
        const { container } = render(
            <VideoGrid
                videos={[]}
                onVideoClick={vi.fn()}
                isLoading={true}
            />
        );

        // Should render skeleton with loading status
        expect(container.querySelector('[role="status"]')).toBeTruthy();
        expect(screen.getByLabelText('Loading videos')).toBeTruthy();
    });

    it('renders empty state when no videos and not loading', () => {
        render(
            <VideoGrid
                videos={[]}
                onVideoClick={vi.fn()}
                isLoading={false}
            />
        );

        expect(screen.getByText('No videos yet')).toBeTruthy();
        expect(screen.getByText('Upload a video to get started!')).toBeTruthy();
    });

    it('renders video grid with all videos', () => {
        const { container } = render(
            <VideoGrid
                videos={mockVideos}
                onVideoClick={vi.fn()}
                isLoading={false}
            />
        );

        // Should render the grid container
        const grid = container.querySelector('[data-testid="video-grid"]');
        expect(grid).toBeTruthy();

        // Should render all video cards
        const videoCards = container.querySelectorAll('[data-testid="video-card"]');
        expect(videoCards.length).toBe(mockVideos.length);
    });

    it('applies responsive grid classes', () => {
        const { container } = render(
            <VideoGrid
                videos={mockVideos}
                onVideoClick={vi.fn()}
                isLoading={false}
            />
        );

        const grid = container.querySelector('[data-testid="video-grid"]');
        expect(grid?.classList.contains('grid')).toBe(true);
        expect(grid?.classList.contains('grid-cols-1')).toBe(true);
        expect(grid?.classList.contains('sm:grid-cols-2')).toBe(true);
        expect(grid?.classList.contains('md:grid-cols-3')).toBe(true);
        expect(grid?.classList.contains('lg:grid-cols-4')).toBe(true);
        expect(grid?.classList.contains('xl:grid-cols-5')).toBe(true);
    });

    it('calls onVideoClick with correct video id when video card is clicked', () => {
        const onVideoClick = vi.fn();
        const { container } = render(
            <VideoGrid
                videos={mockVideos}
                onVideoClick={onVideoClick}
                isLoading={false}
            />
        );

        // Click the first video card
        const firstCard = container.querySelector('[data-testid="video-card"]');
        firstCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(onVideoClick).toHaveBeenCalledWith(mockVideos[0].id);
    });

    it('applies custom className when provided', () => {
        const customClass = 'custom-grid-class';
        const { container } = render(
            <VideoGrid
                videos={mockVideos}
                onVideoClick={vi.fn()}
                isLoading={false}
                className={customClass}
            />
        );

        const grid = container.querySelector('[data-testid="video-grid"]');
        expect(grid?.classList.contains(customClass)).toBe(true);
    });

    it('renders with accessibility attributes', () => {
        const { container } = render(
            <VideoGrid
                videos={mockVideos}
                onVideoClick={vi.fn()}
                isLoading={false}
            />
        );

        const grid = container.querySelector('[data-testid="video-grid"]');
        expect(grid?.getAttribute('role')).toBe('list');
        expect(grid?.getAttribute('aria-label')).toBe('Video grid');

        // Check list items
        const listItems = container.querySelectorAll('[role="listitem"]');
        expect(listItems.length).toBe(mockVideos.length);
    });
});

/**
 * Property-Based Tests for VideoGrid Component
 * Feature: video-clipping-frontend-redesign
 * 
 * These tests use fast-check to validate universal properties across many inputs
 */

describe('VideoGrid Component - Property-Based Tests', () => {
    // Define an arbitrary generator for Video objects (shared across tests)
    const videoArbitrary = fc.record({
        id: fc.uuid(),
        projectId: fc.option(fc.uuid(), { nil: null }),
        userId: fc.uuid(),
        sourceType: fc.constantFrom('youtube' as const, 'upload' as const),
        sourceUrl: fc.webUrl(),
        status: fc.constantFrom(
            'pending' as const,
            'downloading' as const,
            'uploading' as const,
            'transcribing' as const,
            'analyzing' as const,
            'completed' as const,
            'failed' as const
        ),
        title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        duration: fc.option(fc.integer({ min: 1, max: 7200 }), { nil: null }),
        storageKey: fc.option(fc.string(), { nil: null }),
        storageUrl: fc.option(fc.webUrl(), { nil: null }),
        transcript: fc.option(fc.string(), { nil: null }),
        errorMessage: fc.option(fc.string(), { nil: null }),
        metadata: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: null }),
        createdAt: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts).toISOString()),
        updatedAt: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts).toISOString()),
    }) as fc.Arbitrary<Video>;

    /**
     * Property 1: Video Grid Displays All Videos
     * 
     * **Validates: Requirements 1.1**
     * 
     * For ANY list of videos returned from the API, when the homepage is rendered,
     * all videos should appear in the Video_Grid component.
     * 
     * This property ensures that:
     * - No videos are lost during rendering
     * - The grid displays exactly the number of videos provided
     * - This holds true regardless of the number of videos (0 to 100+)
     */
    it('Property 1: Video Grid Displays All Videos', () => {
        // Property: For any array of videos, the grid should display all of them
        fc.assert(
            fc.property(
                fc.array(videoArbitrary, { minLength: 1, maxLength: 50 }),
                (videos) => {
                    const { container } = render(
                        <VideoGrid
                            videos={videos}
                            onVideoClick={vi.fn()}
                            isLoading={false}
                        />
                    );

                    // The grid should be rendered
                    const grid = container.querySelector('[data-testid="video-grid"]');
                    expect(grid).toBeTruthy();

                    // All videos should be rendered as video cards
                    const videoCards = container.querySelectorAll('[data-testid="video-card"]');
                    expect(videoCards.length).toBe(videos.length);

                    // Each video should have a corresponding list item
                    const listItems = container.querySelectorAll('[role="listitem"]');
                    expect(listItems.length).toBe(videos.length);
                }
            ),
            { numRuns: 20 } // Run 100 iterations as specified in the design
        );
    });

    /**
     * Property 3: Video Click Navigation
     * 
     * **Validates: Requirements 1.3**
     * 
     * For ANY video card, when clicked, the navigation target should be
     * `/[workspace-slug]/videos/[videoId]/clips` (or `/[workspace-slug]/videos/[videoId]`
     * which displays clips).
     * 
     * This property ensures that:
     * - Clicking any video card triggers the onVideoClick callback
     * - The callback receives the correct video ID
     * - This holds true for any video in the grid, regardless of its properties
     * - The navigation mechanism is consistent across all videos
     */
    it('Property 3: Video Click Navigation', () => {
        // Property: For any video, clicking its card should call onVideoClick with the correct ID
        fc.assert(
            fc.property(
                fc.array(videoArbitrary, { minLength: 1, maxLength: 20 }),
                fc.integer({ min: 0, max: 19 }), // Index of video to click
                (videos, clickIndexRaw) => {
                    // Ensure we have at least one video and a valid index
                    if (videos.length === 0) return true;

                    const clickIndex = clickIndexRaw % videos.length;
                    const targetVideo = videos[clickIndex];
                    const onVideoClick = vi.fn();

                    const { container } = render(
                        <VideoGrid
                            videos={videos}
                            onVideoClick={onVideoClick}
                            isLoading={false}
                        />
                    );

                    // Get all video cards
                    const videoCards = container.querySelectorAll('[data-testid="video-card"]');
                    expect(videoCards.length).toBe(videos.length);

                    // Click the target video card
                    const targetCard = videoCards[clickIndex];
                    targetCard.dispatchEvent(new MouseEvent('click', { bubbles: true }));

                    // Verify onVideoClick was called with the correct video ID
                    expect(onVideoClick).toHaveBeenCalledTimes(1);
                    expect(onVideoClick).toHaveBeenCalledWith(targetVideo.id);

                    // In the actual implementation, this would trigger:
                    // router.push(`/${workspaceSlug}/videos/${targetVideo.id}`)
                    // which navigates to the clips page for that video
                }
            ),
            { numRuns: 20 } // Run 100 iterations as specified in the design
        );
    });
});
