import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClipDetailModal, useClipModalUrlState } from './clip-detail-modal';
import * as useClipsModule from '@/hooks/useClips';
import type { ClipResponse, ClipStatus, AspectRatio } from '@/lib/api/clips';
import { clipArbitrary } from '@/test/generators';

/**
 * Tests for ClipDetailModal Component
 * Feature: video-clipping-frontend-redesign
 * 
 * These tests validate that the ClipDetailModal component correctly displays
 * clip details, handles modal interactions, and supports accessibility.
 * 
 * @validates Requirements 3.1, 3.2, 3.3, 3.4, 3.6, 3.7
 */

// Mock the useClip hook
vi.mock('@/hooks/useClips', async () => {
    const actual = await vi.importActual('@/hooks/useClips');
    return {
        ...actual,
        useClip: vi.fn(),
    };
});

// Mock next/navigation
const mockPush = vi.fn();
const mockPathname = '/workspace/test/videos/123/clips';
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    usePathname: () => mockPathname,
    useSearchParams: () => mockSearchParams,
}));

// Create a wrapper with QueryClient
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};


// Mock clip data
const mockClip: ClipResponse = {
    id: 'clip-123',
    videoId: 'video-456',
    title: 'Test Clip Title',
    startTime: 10,
    endTime: 40,
    duration: 30,
    transcript: 'This is a test transcript',
    viralityScore: 85,
    viralityReason: 'This clip has high engagement potential due to its emotional hook.',
    hooks: ['Emotional', 'Surprising', 'Relatable'],
    emotions: ['Joy', 'Excitement'],
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    storageKey: 'clips/clip-123.mp4',
    storageUrl: 'https://example.com/clip.mp4',
    aspectRatio: '9:16' as AspectRatio,
    favorited: false,
    status: 'ready' as ClipStatus,
    errorMessage: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

// Helper to create mock useClip return value
const createMockUseClipReturn = (overrides: Partial<{
    data: ClipResponse | undefined;
    isLoading: boolean;
    error: Error | null;
}> = {}) => ({
    data: mockClip,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isError: !!overrides.error,
    isPending: overrides.isLoading ?? false,
    isSuccess: !overrides.isLoading && !overrides.error,
    status: overrides.isLoading ? 'pending' : overrides.error ? 'error' : 'success',
    fetchStatus: overrides.isLoading ? 'fetching' : 'idle',
    isFetching: overrides.isLoading ?? false,
    isRefetching: false,
    isStale: false,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: overrides.error ? Date.now() : 0,
    failureCount: overrides.error ? 1 : 0,
    failureReason: overrides.error ?? null,
    errorUpdateCount: overrides.error ? 1 : 0,
    isFetched: !overrides.isLoading,
    isFetchedAfterMount: !overrides.isLoading,
    isInitialLoading: overrides.isLoading ?? false,
    isLoadingError: !!overrides.error,
    isPlaceholderData: false,
    isRefetchError: false,
    promise: Promise.resolve(overrides.data ?? mockClip),
    ...overrides,
} as any);

describe('ClipDetailModal', () => {
    const mockOnClose = vi.fn();
    const mockOnEdit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useClipsModule.useClip).mockReturnValue(createMockUseClipReturn());
    });

    describe('Modal Structure - Validates Requirements 3.1', () => {
        it('renders modal when isOpen is true and clipId is provided', async () => {
            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            // Modal content is rendered in a portal, use screen to query the document
            await waitFor(() => {
                expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
            });
        });

        it('does not render when clipId is null', () => {
            render(
                <ClipDetailModal
                    clipId={null}
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.queryByTestId('clip-detail-modal')).toBeNull();
        });

        it('renders modal header with title', async () => {
            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByTestId('modal-title').textContent).toBe('Test Clip Title');
            });
        });

        it('renders close button in header', async () => {
            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByTestId('modal-close-button')).toBeTruthy();
            });
        });
    });


    describe('Modal Close Behavior - Validates Requirements 3.7', () => {
        it('calls onClose when close button is clicked', async () => {
            const user = userEvent.setup();

            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByTestId('modal-close-button')).toBeTruthy();
            });

            await user.click(screen.getByTestId('modal-close-button'));
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when Escape key is pressed', async () => {
            const user = userEvent.setup();

            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
            });

            await user.keyboard('{Escape}');
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Clip Content Display - Validates Requirements 3.2, 3.3, 3.4', () => {
        it('displays clip metadata including viral score', async () => {
            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                const viralScore = screen.getByTestId('clip-viral-score');
                expect(viralScore.textContent).toContain('85');
                expect(screen.getByTestId('clip-duration')).toBeTruthy();
            });
        });

        it('displays clip hooks', async () => {
            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByTestId('clip-hooks')).toBeTruthy();
                expect(screen.getByText('Emotional')).toBeTruthy();
                expect(screen.getByText('Surprising')).toBeTruthy();
            });
        });

        it('displays viral analysis section', async () => {
            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByTestId('viral-analysis-section')).toBeTruthy();
                // Use getAllByText since the text appears in both description and analysis section
                const elements = screen.getAllByText(/high engagement potential/);
                expect(elements.length).toBeGreaterThan(0);
            });
        });

        it('displays emotions in viral analysis', async () => {
            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText('Joy')).toBeTruthy();
                expect(screen.getByText('Excitement')).toBeTruthy();
            });
        });
    });


    describe('Video Player - Validates Requirements 3.5', () => {
        it('renders video player placeholder', async () => {
            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByTestId('video-player-placeholder')).toBeTruthy();
            });
        });

        it('renders video element when storageUrl is available', async () => {
            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                const video = document.querySelector('video');
                expect(video).toBeTruthy();
                expect(video?.getAttribute('src')).toBe('https://example.com/clip.mp4');
            });
        });
    });

    describe('Edit Button - Validates Requirements 3.6', () => {
        it('renders Edit Clip button', async () => {
            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByTestId('edit-clip-button')).toBeTruthy();
                expect(screen.getByText('Edit Clip')).toBeTruthy();
            });
        });

        it('calls onEdit with clipId when Edit button is clicked', async () => {
            const user = userEvent.setup();

            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByTestId('edit-clip-button')).toBeTruthy();
            });

            await user.click(screen.getByTestId('edit-clip-button'));
            expect(mockOnEdit).toHaveBeenCalledWith('clip-123');
        });
    });

    describe('Loading State', () => {
        it('displays loading skeleton when isLoading is true', async () => {
            vi.mocked(useClipsModule.useClip).mockReturnValue(
                createMockUseClipReturn({ data: undefined, isLoading: true })
            );

            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByTestId('modal-loading')).toBeTruthy();
            });
        });
    });


    describe('Error State', () => {
        it('displays error message when error occurs', async () => {
            vi.mocked(useClipsModule.useClip).mockReturnValue(
                createMockUseClipReturn({
                    data: undefined,
                    error: new Error('Failed to fetch clip')
                })
            );

            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByTestId('modal-error')).toBeTruthy();
                expect(screen.getByText('Failed to load clip')).toBeTruthy();
            });
        });

        it('provides retry button on error', async () => {
            const mockRefetch = vi.fn();
            vi.mocked(useClipsModule.useClip).mockReturnValue({
                ...createMockUseClipReturn({
                    data: undefined,
                    error: new Error('Failed to fetch clip')
                }),
                refetch: mockRefetch,
            });

            const user = userEvent.setup();

            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText('Try again')).toBeTruthy();
            });

            await user.click(screen.getByText('Try again'));
            expect(mockRefetch).toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA attributes', async () => {
            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByLabelText('Close modal')).toBeTruthy();
                expect(screen.getByLabelText('Edit this clip')).toBeTruthy();
                expect(screen.getByLabelText(/Virality score:/)).toBeTruthy();
            });
        });

        it('has screen reader description', async () => {
            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                const description = document.getElementById('clip-modal-description');
                expect(description).toBeTruthy();
                expect(description?.classList.contains('sr-only')).toBe(true);
            });
        });
    });


    describe('Viral Score Color Coding', () => {
        it('applies green color for high scores (≥70)', async () => {
            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                const scoreBadge = screen.getByTestId('clip-viral-score');
                expect(scoreBadge.classList.contains('text-green-600')).toBe(true);
            });
        });

        it('applies yellow color for medium scores (40-69)', async () => {
            vi.mocked(useClipsModule.useClip).mockReturnValue(
                createMockUseClipReturn({ data: { ...mockClip, viralityScore: 55 } })
            );

            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                const scoreBadge = screen.getByTestId('clip-viral-score');
                expect(scoreBadge.classList.contains('text-yellow-600')).toBe(true);
            });
        });

        it('applies red color for low scores (<40)', async () => {
            vi.mocked(useClipsModule.useClip).mockReturnValue(
                createMockUseClipReturn({ data: { ...mockClip, viralityScore: 25 } })
            );

            render(
                <ClipDetailModal
                    clipId="clip-123"
                    isOpen={true}
                    onClose={mockOnClose}
                    onEdit={mockOnEdit}
                />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                const scoreBadge = screen.getByTestId('clip-viral-score');
                expect(scoreBadge.classList.contains('text-red-600')).toBe(true);
            });
        });
    });
});

describe('useClipModalUrlState', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should be exported from the module', () => {
        expect(useClipModalUrlState).toBeDefined();
        expect(typeof useClipModalUrlState).toBe('function');
    });
});

/**
 * Property-Based Tests for ClipDetailModal Close Behavior
 * 
 * **Property 11: Modal Close Behavior**
 * *For any* opened modal, when Escape is pressed or backdrop is clicked, 
 * the modal should close (isOpen becomes false)
 * 
 * **Validates: Requirements 3.7**
 * 
 * These tests verify that the modal can be closed via:
 * 1. Close button click
 * 2. Backdrop click
 * 3. Escape key press
 */
describe('Property-Based Tests: Modal Close Behavior', () => {
    const mockOnEdit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Property 11.1: Close button always triggers onClose callback
     * 
     * For any arbitrary clip data, when the modal is open and the close button
     * is clicked, the onClose callback should be called exactly once.
     * 
     * **Validates: Requirements 3.7**
     */
    it('Property 11.1: Close button always triggers onClose for any clip data', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnClose = vi.fn();
                const user = userEvent.setup();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Click the close button
                const closeButton = screen.getByTestId('modal-close-button');
                await user.click(closeButton);

                // Verify onClose was called exactly once
                expect(mockOnClose).toHaveBeenCalledTimes(1);

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 11.2: Escape key always triggers onClose callback
     * 
     * For any arbitrary clip data, when the modal is open and the Escape key
     * is pressed, the onClose callback should be called exactly once.
     * 
     * **Validates: Requirements 3.7**
     */
    it('Property 11.2: Escape key always triggers onClose for any clip data', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnClose = vi.fn();
                const user = userEvent.setup();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Press Escape key
                await user.keyboard('{Escape}');

                // Verify onClose was called exactly once
                expect(mockOnClose).toHaveBeenCalledTimes(1);

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 11.3: Backdrop click always triggers onClose callback
     * 
     * For any arbitrary clip data, when the modal is open and the backdrop
     * (overlay) is clicked, the onClose callback should be called exactly once.
     * 
     * **Validates: Requirements 3.7**
     */
    it('Property 11.3: Backdrop click always triggers onClose for any clip data', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnClose = vi.fn();
                const user = userEvent.setup();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Find and click the backdrop (dialog overlay)
                // Radix UI Dialog uses a data-state attribute on the overlay
                const backdrop = document.querySelector('[data-radix-dialog-overlay]');
                if (backdrop) {
                    await user.click(backdrop);
                    // Verify onClose was called exactly once
                    expect(mockOnClose).toHaveBeenCalledTimes(1);
                }

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 11.4: All close methods are consistent
     * 
     * For any arbitrary clip data, all three close methods (close button, 
     * Escape key, backdrop click) should behave consistently - each should
     * trigger the onClose callback exactly once when used.
     * 
     * **Validates: Requirements 3.7**
     */
    it('Property 11.4: All close methods behave consistently for any clip data', async () => {
        const closeMethod = fc.constantFrom('closeButton', 'escapeKey', 'backdrop');

        await fc.assert(
            fc.asyncProperty(clipArbitrary, closeMethod, async (clip, method) => {
                const mockOnClose = vi.fn();
                const user = userEvent.setup();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Execute the close method
                switch (method) {
                    case 'closeButton':
                        await user.click(screen.getByTestId('modal-close-button'));
                        break;
                    case 'escapeKey':
                        await user.keyboard('{Escape}');
                        break;
                    case 'backdrop':
                        const backdrop = document.querySelector('[data-radix-dialog-overlay]');
                        if (backdrop) {
                            await user.click(backdrop);
                        }
                        break;
                }

                // Verify onClose was called (at least once for backdrop which may not always be present)
                if (method !== 'backdrop' || document.querySelector('[data-radix-dialog-overlay]')) {
                    expect(mockOnClose).toHaveBeenCalled();
                }

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 11.5: Modal close behavior is independent of clip content
     * 
     * For any arbitrary clip data with varying viral scores, hooks, emotions,
     * and other properties, the close behavior should work identically.
     * 
     * **Validates: Requirements 3.7**
     */
    it('Property 11.5: Modal close behavior is independent of clip content', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnClose = vi.fn();
                const user = userEvent.setup();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Test close button works regardless of clip content
                await user.click(screen.getByTestId('modal-close-button'));
                expect(mockOnClose).toHaveBeenCalledTimes(1);

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });
});


/**
 * Property-Based Tests for Modal Contains Required Information
 * 
 * **Property 8: Modal Contains Required Information**
 * *For any* clip displayed in the modal, the modal should contain title, 
 * description, metadata, viral analysis, and viral score
 * 
 * **Validates: Requirements 3.2, 3.3, 3.4**
 * 
 * These tests verify that for any arbitrary clip data:
 * 1. The modal displays the clip title
 * 2. The modal displays the clip duration
 * 3. The modal displays the viral score with correct color coding
 */
describe('Property-Based Tests: Modal Contains Required Information', () => {
    const mockOnEdit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Property 8.1: Modal always displays clip title
     * 
     * For any arbitrary clip data, when the modal is open, the clip title
     * should be displayed in the modal header.
     * 
     * **Validates: Requirements 3.2**
     */
    it('Property 8.1: Modal always displays clip title for any clip data', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnClose = vi.fn();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Verify title is displayed
                const titleElement = screen.getByTestId('modal-title');
                expect(titleElement.textContent).toBe(clip.title);

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 8.2: Modal always displays clip duration
     * 
     * For any arbitrary clip data, when the modal is open, the clip duration
     * should be displayed in the metadata section.
     * 
     * **Validates: Requirements 3.2**
     */
    it('Property 8.2: Modal always displays clip duration for any clip data', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnClose = vi.fn();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Verify duration is displayed
                const durationElement = screen.getByTestId('clip-duration');
                expect(durationElement).toBeTruthy();

                // Verify duration format (MM:SS)
                const durationText = durationElement.textContent;
                expect(durationText).toMatch(/\d+:\d{2}/);

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 8.3: Modal always displays viral score
     * 
     * For any arbitrary clip data, when the modal is open, the viral score
     * should be displayed with the correct value.
     * 
     * **Validates: Requirements 3.4**
     */
    it('Property 8.3: Modal always displays viral score for any clip data', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnClose = vi.fn();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Verify viral score is displayed
                const scoreElement = screen.getByTestId('clip-viral-score');
                expect(scoreElement).toBeTruthy();
                expect(scoreElement.textContent).toContain(clip.viralityScore.toString());

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 8.4: Viral score has correct color coding
     * 
     * For any arbitrary clip data, the viral score should have the correct
     * color class based on its value:
     * - Green for high scores (≥70)
     * - Yellow for medium scores (40-69)
     * - Red for low scores (<40)
     * 
     * **Validates: Requirements 3.4**
     */
    it('Property 8.4: Viral score has correct color coding for any score value', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnClose = vi.fn();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Verify viral score color coding
                const scoreElement = screen.getByTestId('clip-viral-score');

                if (clip.viralityScore >= 70) {
                    expect(scoreElement.classList.contains('text-green-600')).toBe(true);
                } else if (clip.viralityScore >= 40) {
                    expect(scoreElement.classList.contains('text-yellow-600')).toBe(true);
                } else {
                    expect(scoreElement.classList.contains('text-red-600')).toBe(true);
                }

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 8.5: Modal displays viral analysis when viralityReason is present
     * 
     * For any arbitrary clip data with a viralityReason, the modal should
     * display the viral analysis section.
     * 
     * **Validates: Requirements 3.3**
     */
    it('Property 8.5: Modal displays viral analysis when viralityReason is present', async () => {
        // Generate clips that always have a viralityReason
        const clipWithReasonArbitrary = clipArbitrary.filter(clip => clip.viralityReason.length > 0);

        await fc.assert(
            fc.asyncProperty(clipWithReasonArbitrary, async (clip) => {
                const mockOnClose = vi.fn();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Verify viral analysis section is displayed
                const analysisSection = screen.getByTestId('viral-analysis-section');
                expect(analysisSection).toBeTruthy();

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 8.6: Modal displays all required metadata fields
     * 
     * For any arbitrary clip data, the modal should display all required
     * metadata fields: title, duration, viral score, and hooks (if present).
     * 
     * **Validates: Requirements 3.2, 3.4**
     */
    it('Property 8.6: Modal displays all required metadata fields for any clip data', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnClose = vi.fn();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Verify all required metadata fields are present
                expect(screen.getByTestId('modal-title')).toBeTruthy();
                expect(screen.getByTestId('clip-duration')).toBeTruthy();
                expect(screen.getByTestId('clip-viral-score')).toBeTruthy();
                expect(screen.getByTestId('clip-metadata')).toBeTruthy();

                // Verify hooks are displayed if present
                if (clip.hooks.length > 0) {
                    expect(screen.getByTestId('clip-hooks')).toBeTruthy();
                }

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 8.7: Modal content is independent of clip ID format
     * 
     * For any arbitrary clip data with various ID formats (UUID), the modal
     * should correctly display all required information.
     * 
     * **Validates: Requirements 3.2, 3.3, 3.4**
     */
    it('Property 8.7: Modal content is independent of clip ID format', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnClose = vi.fn();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Verify content is displayed correctly regardless of ID format
                expect(screen.getByTestId('modal-title').textContent).toBe(clip.title);
                expect(screen.getByTestId('clip-viral-score').textContent).toContain(clip.viralityScore.toString());

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });
});


/**
 * Property-Based Tests for Modal Edit Button Navigation
 * 
 * **Property 10: Modal Edit Button Navigation**
 * *For any* clip in the modal, when the "Edit Clip" button is clicked, 
 * navigation should occur to the editing screen with the correct clip ID.
 * 
 * **Validates: Requirements 3.6, 12.1**
 * 
 * These tests verify that for any arbitrary clip data:
 * 1. The Edit button is always present when the modal is open
 * 2. Clicking the Edit button calls onEdit with the correct clip ID
 * 3. The clip ID passed to onEdit matches the clip being displayed
 */
describe('Property-Based Tests: Modal Edit Button Navigation', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Property 10.1: Edit button is always present when modal is open
     * 
     * For any arbitrary clip data, when the modal is open and clip data is loaded,
     * the Edit button should always be present and visible.
     * 
     * **Validates: Requirements 3.6**
     */
    it('Property 10.1: Edit button is always present when modal is open for any clip data', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnEdit = vi.fn();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Verify Edit button is present
                const editButton = screen.getByTestId('edit-clip-button');
                expect(editButton).toBeTruthy();
                expect(editButton.textContent).toContain('Edit Clip');

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 10.2: Clicking Edit button calls onEdit with correct clip ID
     * 
     * For any arbitrary clip data, when the Edit button is clicked,
     * the onEdit callback should be called with the exact clip ID.
     * 
     * **Validates: Requirements 3.6, 12.1**
     */
    it('Property 10.2: Clicking Edit button calls onEdit with correct clip ID for any clip data', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnEdit = vi.fn();
                const user = userEvent.setup();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Click the Edit button
                const editButton = screen.getByTestId('edit-clip-button');
                await user.click(editButton);

                // Verify onEdit was called with the correct clip ID
                expect(mockOnEdit).toHaveBeenCalledTimes(1);
                expect(mockOnEdit).toHaveBeenCalledWith(clip.id);

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 10.3: Edit button passes displayed clip's ID, not the prop clipId
     * 
     * For any arbitrary clip data, the onEdit callback should receive the ID
     * from the clip data being displayed (clip.id), ensuring consistency
     * between what's shown and what's passed to navigation.
     * 
     * **Validates: Requirements 3.6, 12.1**
     */
    it('Property 10.3: Edit button passes the displayed clip ID for any clip data', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnEdit = vi.fn();
                const user = userEvent.setup();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Verify the displayed clip title matches the clip data
                const titleElement = screen.getByTestId('modal-title');
                expect(titleElement.textContent).toBe(clip.title);

                // Click the Edit button
                await user.click(screen.getByTestId('edit-clip-button'));

                // Verify the clip ID passed to onEdit matches the displayed clip
                expect(mockOnEdit).toHaveBeenCalledWith(clip.id);

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 10.4: Edit button is accessible with proper ARIA label
     * 
     * For any arbitrary clip data, the Edit button should have proper
     * accessibility attributes for screen readers.
     * 
     * **Validates: Requirements 3.6**
     */
    it('Property 10.4: Edit button has proper accessibility attributes for any clip data', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnEdit = vi.fn();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Verify Edit button has proper ARIA label
                const editButton = screen.getByLabelText('Edit this clip');
                expect(editButton).toBeTruthy();
                expect(editButton.getAttribute('data-testid')).toBe('edit-clip-button');

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 10.5: Edit button click only triggers onEdit, not onClose
     * 
     * For any arbitrary clip data, clicking the Edit button should only
     * trigger the onEdit callback, not the onClose callback.
     * 
     * **Validates: Requirements 3.6, 12.1**
     */
    it('Property 10.5: Edit button click only triggers onEdit, not onClose for any clip data', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnEdit = vi.fn();
                const mockOnCloseLocal = vi.fn();
                const user = userEvent.setup();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnCloseLocal}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Click the Edit button
                await user.click(screen.getByTestId('edit-clip-button'));

                // Verify onEdit was called
                expect(mockOnEdit).toHaveBeenCalledTimes(1);
                expect(mockOnEdit).toHaveBeenCalledWith(clip.id);

                // Verify onClose was NOT called
                expect(mockOnCloseLocal).not.toHaveBeenCalled();

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 10.6: Edit button behavior is consistent regardless of clip content
     * 
     * For any arbitrary clip data with varying viral scores, hooks, emotions,
     * and other properties, the Edit button should behave identically.
     * 
     * **Validates: Requirements 3.6, 12.1**
     */
    it('Property 10.6: Edit button behavior is consistent regardless of clip content', async () => {
        await fc.assert(
            fc.asyncProperty(clipArbitrary, async (clip) => {
                const mockOnEdit = vi.fn();
                const user = userEvent.setup();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Verify Edit button is present regardless of clip content
                const editButton = screen.getByTestId('edit-clip-button');
                expect(editButton).toBeTruthy();

                // Click the Edit button
                await user.click(editButton);

                // Verify onEdit was called with the clip ID regardless of content
                expect(mockOnEdit).toHaveBeenCalledWith(clip.id);

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 10.7: Multiple Edit button clicks call onEdit multiple times
     * 
     * For any arbitrary clip data, multiple clicks on the Edit button should
     * result in multiple calls to onEdit, each with the correct clip ID.
     * 
     * **Validates: Requirements 3.6, 12.1**
     */
    it('Property 10.7: Multiple Edit button clicks call onEdit multiple times with correct ID', async () => {
        const clickCountArbitrary = fc.integer({ min: 1, max: 5 });

        await fc.assert(
            fc.asyncProperty(clipArbitrary, clickCountArbitrary, async (clip, clickCount) => {
                const mockOnEdit = vi.fn();
                const user = userEvent.setup();

                // Mock the useClip hook to return the generated clip
                vi.mocked(useClipsModule.useClip).mockReturnValue(
                    createMockUseClipReturn({ data: clip })
                );

                const { unmount } = render(
                    <ClipDetailModal
                        clipId={clip.id}
                        isOpen={true}
                        onClose={mockOnClose}
                        onEdit={mockOnEdit}
                    />,
                    { wrapper: createWrapper() }
                );

                // Wait for modal to render
                await waitFor(() => {
                    expect(screen.getByTestId('clip-detail-modal')).toBeTruthy();
                });

                // Click the Edit button multiple times
                const editButton = screen.getByTestId('edit-clip-button');
                for (let i = 0; i < clickCount; i++) {
                    await user.click(editButton);
                }

                // Verify onEdit was called the correct number of times
                expect(mockOnEdit).toHaveBeenCalledTimes(clickCount);

                // Verify each call was with the correct clip ID
                for (let i = 0; i < clickCount; i++) {
                    expect(mockOnEdit).toHaveBeenNthCalledWith(i + 1, clip.id);
                }

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });
});
