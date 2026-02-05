import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { ViralAnalysisPanel, type ViralAnalysis } from './viral-analysis-panel';
import {
    viralAnalysisArbitrary,
    viralAnalysisWithAllFieldsArbitrary,
    keyMomentArbitrary,
} from '@/test/generators';

/**
 * Tests for ViralAnalysisPanel Component
 * Feature: video-clipping-frontend-redesign
 * 
 * These tests validate that the ViralAnalysisPanel component correctly displays
 * viral analysis data including reasons, key moments, engagement metrics, and suggestions.
 * 
 * @validates Requirements 3.3, 16.1, 16.2, 16.3, 16.4, 16.5
 */

describe('ViralAnalysisPanel', () => {
    const mockOnKeyMomentClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic Rendering', () => {
        it('renders the panel with viral analysis data', () => {
            const analysis: ViralAnalysis = {
                reasons: ['Strong hook in first 3 seconds'],
                keyMoments: [{ timestamp: 0, description: 'Opening hook', importance: 'high' }],
                suggestions: ['Add captions for accessibility'],
                estimatedRetention: 75,
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            expect(screen.getByTestId('viral-analysis-panel')).toBeTruthy();
            expect(screen.getByText('Viral Analysis')).toBeTruthy();
        });

        it('renders empty state when no content is available', () => {
            const analysis: ViralAnalysis = {
                reasons: [],
                keyMoments: [],
                suggestions: [],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            expect(screen.getByTestId('viral-analysis-panel-empty')).toBeTruthy();
            expect(screen.getByText('No viral analysis data available for this clip.')).toBeTruthy();
        });

        it('is expanded by default', () => {
            const analysis: ViralAnalysis = {
                reasons: ['Test reason'],
                keyMoments: [],
                suggestions: [],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            expect(screen.getByTestId('viral-analysis-content')).toBeTruthy();
        });

        it('can be collapsed by default', () => {
            const analysis: ViralAnalysis = {
                reasons: ['Test reason'],
                keyMoments: [],
                suggestions: [],
            };

            render(<ViralAnalysisPanel analysis={analysis} defaultExpanded={false} />);

            expect(screen.queryByTestId('viral-analysis-content')).toBeNull();
        });
    });

    describe('Reasons Section - Validates Requirements 16.1', () => {
        it('displays viral reasons list', () => {
            const analysis: ViralAnalysis = {
                reasons: ['Strong emotional hook', 'Trending topic', 'Relatable content'],
                keyMoments: [],
                suggestions: [],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            expect(screen.getByTestId('viral-reasons-list')).toBeTruthy();
            expect(screen.getByText('Strong emotional hook')).toBeTruthy();
            expect(screen.getByText('Trending topic')).toBeTruthy();
            expect(screen.getByText('Relatable content')).toBeTruthy();
        });

        it('displays correct count badge for reasons', () => {
            const analysis: ViralAnalysis = {
                reasons: ['Reason 1', 'Reason 2', 'Reason 3'],
                keyMoments: [],
                suggestions: [],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            const header = screen.getByTestId('section-header-why-this-clip-is-viral');
            expect(header.textContent).toContain('3');
        });
    });

    describe('Key Moments Section - Validates Requirements 16.2', () => {
        it('displays key moments list', () => {
            const analysis: ViralAnalysis = {
                reasons: [],
                keyMoments: [
                    { timestamp: 0, description: 'Opening hook', importance: 'high' },
                    { timestamp: 15, description: 'Key reveal', importance: 'medium' },
                ],
                suggestions: [],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            expect(screen.getByTestId('key-moments-list')).toBeTruthy();
            expect(screen.getByText('Opening hook')).toBeTruthy();
            expect(screen.getByText('Key reveal')).toBeTruthy();
        });

        it('displays timestamps in MM:SS format', () => {
            const analysis: ViralAnalysis = {
                reasons: [],
                keyMoments: [
                    { timestamp: 65, description: 'Test moment' },
                ],
                suggestions: [],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            expect(screen.getByText('1:05')).toBeTruthy();
        });

        it('calls onKeyMomentClick when a moment is clicked', async () => {
            const user = userEvent.setup();
            const analysis: ViralAnalysis = {
                reasons: [],
                keyMoments: [
                    { timestamp: 30, description: 'Test moment' },
                ],
                suggestions: [],
            };

            render(
                <ViralAnalysisPanel
                    analysis={analysis}
                    onKeyMomentClick={mockOnKeyMomentClick}
                />
            );

            await user.click(screen.getByTestId('key-moment-0'));
            expect(mockOnKeyMomentClick).toHaveBeenCalledWith(30);
        });

        it('shows sparkle icon for high importance moments', () => {
            const analysis: ViralAnalysis = {
                reasons: [],
                keyMoments: [
                    { timestamp: 0, description: 'High importance', importance: 'high' },
                ],
                suggestions: [],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            const moment = screen.getByTestId('key-moment-0');
            expect(moment.querySelector('[aria-label="High importance"]')).toBeTruthy();
        });
    });

    describe('Engagement Metrics Section - Validates Requirements 16.3', () => {
        it('displays retention rate', () => {
            const analysis: ViralAnalysis = {
                reasons: [],
                keyMoments: [],
                suggestions: [],
                estimatedRetention: 75,
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            expect(screen.getByTestId('retention-rate')).toBeTruthy();
            expect(screen.getByText('75%')).toBeTruthy();
        });

        it('displays engagement predictions', () => {
            const analysis: ViralAnalysis = {
                reasons: [],
                keyMoments: [],
                suggestions: [],
                engagementPrediction: {
                    views: 50000,
                    likes: 5000,
                    shares: 1200,
                    comments: 300,
                },
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            expect(screen.getByTestId('engagement-predictions')).toBeTruthy();
            expect(screen.getByTestId('metric-views')).toBeTruthy();
            expect(screen.getByTestId('metric-likes')).toBeTruthy();
            expect(screen.getByTestId('metric-shares')).toBeTruthy();
            expect(screen.getByTestId('metric-comments')).toBeTruthy();
        });

        it('formats large numbers with K/M suffix', () => {
            const analysis: ViralAnalysis = {
                reasons: [],
                keyMoments: [],
                suggestions: [],
                engagementPrediction: {
                    views: 1500000,
                    likes: 50000,
                },
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            expect(screen.getByText('1.5M')).toBeTruthy();
            expect(screen.getByText('50.0K')).toBeTruthy();
        });
    });

    describe('Suggestions Section - Validates Requirements 16.4', () => {
        it('displays improvement suggestions', () => {
            const analysis: ViralAnalysis = {
                reasons: [],
                keyMoments: [],
                suggestions: ['Add captions', 'Shorten duration', 'Add music'],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            expect(screen.getByTestId('suggestions-list')).toBeTruthy();
            expect(screen.getByText('Add captions')).toBeTruthy();
            expect(screen.getByText('Shorten duration')).toBeTruthy();
            expect(screen.getByText('Add music')).toBeTruthy();
        });

        it('displays correct count badge for suggestions', () => {
            const analysis: ViralAnalysis = {
                reasons: [],
                keyMoments: [],
                suggestions: ['Suggestion 1', 'Suggestion 2'],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            const header = screen.getByTestId('section-header-improvement-suggestions');
            expect(header.textContent).toContain('2');
        });
    });

    describe('Emotions and Hooks Display', () => {
        it('displays emotions as badges', () => {
            const analysis: ViralAnalysis = {
                reasons: ['Test'],
                keyMoments: [],
                suggestions: [],
                emotions: ['Joy', 'Excitement', 'Surprise'],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            expect(screen.getByTestId('emotions-display')).toBeTruthy();
            expect(screen.getByText('Joy')).toBeTruthy();
            expect(screen.getByText('Excitement')).toBeTruthy();
            expect(screen.getByText('Surprise')).toBeTruthy();
        });

        it('displays hooks as badges', () => {
            const analysis: ViralAnalysis = {
                reasons: ['Test'],
                keyMoments: [],
                suggestions: [],
                hooks: ['Emotional', 'Surprising', 'Relatable'],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            expect(screen.getByTestId('hooks-display')).toBeTruthy();
            expect(screen.getByText('Emotional')).toBeTruthy();
            expect(screen.getByText('Surprising')).toBeTruthy();
            expect(screen.getByText('Relatable')).toBeTruthy();
        });
    });

    describe('Collapsible Behavior', () => {
        it('toggles panel expansion when header is clicked', async () => {
            const user = userEvent.setup();
            const analysis: ViralAnalysis = {
                reasons: ['Test reason'],
                keyMoments: [],
                suggestions: [],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            // Initially expanded
            expect(screen.getByTestId('viral-analysis-content')).toBeTruthy();

            // Click to collapse
            await user.click(screen.getByTestId('viral-analysis-panel-toggle'));
            expect(screen.queryByTestId('viral-analysis-content')).toBeNull();

            // Click to expand
            await user.click(screen.getByTestId('viral-analysis-panel-toggle'));
            expect(screen.getByTestId('viral-analysis-content')).toBeTruthy();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA attributes', () => {
            const analysis: ViralAnalysis = {
                reasons: ['Test reason'],
                keyMoments: [{ timestamp: 0, description: 'Test moment' }],
                suggestions: ['Test suggestion'],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            const panel = screen.getByTestId('viral-analysis-panel');
            expect(panel.getAttribute('role')).toBe('region');
            expect(panel.getAttribute('aria-label')).toBe('Viral analysis panel');

            const toggle = screen.getByTestId('viral-analysis-panel-toggle');
            expect(toggle.getAttribute('aria-expanded')).toBe('true');
            expect(toggle.getAttribute('aria-controls')).toBe('viral-analysis-content');
        });

        it('has accessible lists with proper roles', () => {
            const analysis: ViralAnalysis = {
                reasons: ['Test reason'],
                keyMoments: [{ timestamp: 0, description: 'Test moment' }],
                suggestions: ['Test suggestion'],
            };

            render(<ViralAnalysisPanel analysis={analysis} />);

            const reasonsList = screen.getByTestId('viral-reasons-list');
            expect(reasonsList.getAttribute('role')).toBe('list');
            expect(reasonsList.getAttribute('aria-label')).toBe('Viral reasons');

            const momentsList = screen.getByTestId('key-moments-list');
            expect(momentsList.getAttribute('role')).toBe('list');
            expect(momentsList.getAttribute('aria-label')).toBe('Key moments in the clip');

            const suggestionsList = screen.getByTestId('suggestions-list');
            expect(suggestionsList.getAttribute('role')).toBe('list');
            expect(suggestionsList.getAttribute('aria-label')).toBe('Improvement suggestions');
        });
    });
});


/**
 * Property-Based Tests for Viral Analysis Contains Required Fields
 * 
 * **Property 53: Viral Analysis Contains Required Fields**
 * *For any* viral analysis data, it should contain reasons, key moments, 
 * suggestions, and engagement metrics
 * 
 * **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**
 * 
 * These tests verify that for any arbitrary viral analysis data:
 * 1. The panel displays all viral reasons
 * 2. The panel displays all key moments
 * 3. The panel displays engagement metrics when present
 * 4. The panel displays all improvement suggestions
 * 5. The panel displays data in an easy-to-understand format
 */
describe('Property-Based Tests: Viral Analysis Contains Required Fields', () => {
    const mockOnKeyMomentClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Property 53.1: Panel displays all viral reasons
     * 
     * For any arbitrary viral analysis data with reasons, all reasons
     * should be displayed in the reasons list.
     * 
     * **Validates: Requirements 16.1**
     */
    it('Property 53.1: Panel displays all viral reasons for any analysis data', async () => {
        await fc.assert(
            fc.asyncProperty(viralAnalysisArbitrary, async (analysis) => {
                const { unmount } = render(<ViralAnalysisPanel analysis={analysis} />);

                // If there are reasons, verify they are all displayed
                if (analysis.reasons.length > 0) {
                    await waitFor(() => {
                        expect(screen.getByTestId('viral-reasons-list')).toBeTruthy();
                    });

                    // Verify each reason is displayed
                    analysis.reasons.forEach((reason, index) => {
                        const reasonElement = screen.getByTestId(`viral-reason-${index}`);
                        expect(reasonElement).toBeTruthy();
                        expect(reasonElement.textContent).toContain(reason);
                    });
                }

                // Cleanup
                unmount();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 53.2: Panel displays all key moments
     * 
     * For any arbitrary viral analysis data with key moments, all key moments
     * should be displayed with their timestamps and descriptions.
     * 
     * **Validates: Requirements 16.2**
     */
    it('Property 53.2: Panel displays all key moments for any analysis data', async () => {
        await fc.assert(
            fc.asyncProperty(viralAnalysisArbitrary, async (analysis) => {
                const { unmount } = render(
                    <ViralAnalysisPanel
                        analysis={analysis}
                        onKeyMomentClick={mockOnKeyMomentClick}
                    />
                );

                // If there are key moments, verify they are all displayed
                if (analysis.keyMoments.length > 0) {
                    await waitFor(() => {
                        expect(screen.getByTestId('key-moments-list')).toBeTruthy();
                    });

                    // Verify each key moment is displayed
                    analysis.keyMoments.forEach((moment, index) => {
                        const momentElement = screen.getByTestId(`key-moment-${index}`);
                        expect(momentElement).toBeTruthy();
                        expect(momentElement.textContent).toContain(moment.description);
                    });
                }

                // Cleanup
                unmount();
                vi.clearAllMocks();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 53.3: Panel displays engagement metrics when present
     * 
     * For any arbitrary viral analysis data with engagement metrics,
     * the metrics should be displayed correctly.
     * 
     * **Validates: Requirements 16.3**
     */
    it('Property 53.3: Panel displays engagement metrics when present', async () => {
        await fc.assert(
            fc.asyncProperty(viralAnalysisWithAllFieldsArbitrary, async (analysis) => {
                const { unmount } = render(<ViralAnalysisPanel analysis={analysis} />);

                // Verify retention rate is displayed
                if (analysis.estimatedRetention !== undefined) {
                    await waitFor(() => {
                        expect(screen.getByTestId('retention-rate')).toBeTruthy();
                    });
                    expect(screen.getByText(`${analysis.estimatedRetention}%`)).toBeTruthy();
                }

                // Verify engagement predictions are displayed
                if (analysis.engagementPrediction) {
                    await waitFor(() => {
                        expect(screen.getByTestId('engagement-predictions')).toBeTruthy();
                    });

                    if (analysis.engagementPrediction.views !== undefined) {
                        expect(screen.getByTestId('metric-views')).toBeTruthy();
                    }
                    if (analysis.engagementPrediction.likes !== undefined) {
                        expect(screen.getByTestId('metric-likes')).toBeTruthy();
                    }
                    if (analysis.engagementPrediction.shares !== undefined) {
                        expect(screen.getByTestId('metric-shares')).toBeTruthy();
                    }
                    if (analysis.engagementPrediction.comments !== undefined) {
                        expect(screen.getByTestId('metric-comments')).toBeTruthy();
                    }
                }

                // Cleanup
                unmount();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 53.4: Panel displays all improvement suggestions
     * 
     * For any arbitrary viral analysis data with suggestions, all suggestions
     * should be displayed in the suggestions list.
     * 
     * **Validates: Requirements 16.4**
     */
    it('Property 53.4: Panel displays all improvement suggestions for any analysis data', async () => {
        await fc.assert(
            fc.asyncProperty(viralAnalysisArbitrary, async (analysis) => {
                const { unmount } = render(<ViralAnalysisPanel analysis={analysis} />);

                // If there are suggestions, verify they are all displayed
                if (analysis.suggestions.length > 0) {
                    await waitFor(() => {
                        expect(screen.getByTestId('suggestions-list')).toBeTruthy();
                    });

                    // Verify each suggestion is displayed
                    analysis.suggestions.forEach((suggestion, index) => {
                        const suggestionElement = screen.getByTestId(`suggestion-${index}`);
                        expect(suggestionElement).toBeTruthy();
                        expect(suggestionElement.textContent).toContain(suggestion);
                    });
                }

                // Cleanup
                unmount();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 53.5: Panel displays data in easy-to-understand format
     * 
     * For any arbitrary viral analysis data, the panel should display
     * data in an organized, accessible format with proper sections.
     * 
     * **Validates: Requirements 16.5**
     */
    it('Property 53.5: Panel displays data in easy-to-understand format', async () => {
        await fc.assert(
            fc.asyncProperty(viralAnalysisWithAllFieldsArbitrary, async (analysis) => {
                const { unmount } = render(<ViralAnalysisPanel analysis={analysis} />);

                // Verify panel structure exists
                await waitFor(() => {
                    expect(screen.getByTestId('viral-analysis-panel')).toBeTruthy();
                });

                // Verify panel has proper ARIA attributes for accessibility
                const panel = screen.getByTestId('viral-analysis-panel');
                expect(panel.getAttribute('role')).toBe('region');
                expect(panel.getAttribute('aria-label')).toBe('Viral analysis panel');

                // Verify content is organized in sections
                expect(screen.getByTestId('viral-analysis-content')).toBeTruthy();

                // Verify emotions and hooks are displayed as badges (easy to scan)
                if (analysis.emotions && analysis.emotions.length > 0) {
                    expect(screen.getByTestId('emotions-display')).toBeTruthy();
                }
                if (analysis.hooks && analysis.hooks.length > 0) {
                    expect(screen.getByTestId('hooks-display')).toBeTruthy();
                }

                // Cleanup
                unmount();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 53.6: Key moments display timestamps in readable format
     * 
     * For any arbitrary key moment with a timestamp, the timestamp should
     * be displayed in MM:SS format for easy understanding.
     * 
     * **Validates: Requirements 16.2, 16.5**
     */
    it('Property 53.6: Key moments display timestamps in readable MM:SS format', async () => {
        await fc.assert(
            fc.asyncProperty(keyMomentArbitrary, async (moment) => {
                const analysis: ViralAnalysis = {
                    reasons: [],
                    keyMoments: [moment],
                    suggestions: [],
                };

                const { unmount } = render(<ViralAnalysisPanel analysis={analysis} />);

                await waitFor(() => {
                    expect(screen.getByTestId('key-moments-list')).toBeTruthy();
                });

                // Calculate expected timestamp format
                const mins = Math.floor(moment.timestamp / 60);
                const secs = Math.floor(moment.timestamp % 60);
                const expectedFormat = `${mins}:${secs.toString().padStart(2, '0')}`;

                // Verify timestamp is displayed in MM:SS format
                expect(screen.getByText(expectedFormat)).toBeTruthy();

                // Cleanup
                unmount();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 53.7: All required fields are present when analysis has content
     * 
     * For any arbitrary viral analysis data with all fields populated,
     * all sections should be rendered and accessible.
     * 
     * **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**
     */
    it('Property 53.7: All required fields are present when analysis has content', async () => {
        await fc.assert(
            fc.asyncProperty(viralAnalysisWithAllFieldsArbitrary, async (analysis) => {
                const { unmount } = render(<ViralAnalysisPanel analysis={analysis} />);

                await waitFor(() => {
                    expect(screen.getByTestId('viral-analysis-panel')).toBeTruthy();
                });

                // Verify all main sections are present
                expect(screen.getByTestId('viral-analysis-content')).toBeTruthy();

                // Reasons section (16.1)
                expect(screen.getByTestId('viral-reasons-list')).toBeTruthy();

                // Key moments section (16.2)
                expect(screen.getByTestId('key-moments-list')).toBeTruthy();

                // Engagement metrics section (16.3)
                expect(screen.getByTestId('engagement-metrics')).toBeTruthy();

                // Suggestions section (16.4)
                expect(screen.getByTestId('suggestions-list')).toBeTruthy();

                // Cleanup
                unmount();
            }),
            { numRuns: 20 }
        );
    });

    /**
     * Property 53.8: Panel handles varying data sizes gracefully
     * 
     * For any arbitrary viral analysis data with varying numbers of items
     * in each field, the panel should render correctly without errors.
     * 
     * **Validates: Requirements 16.5**
     */
    it('Property 53.8: Panel handles varying data sizes gracefully', async () => {
        await fc.assert(
            fc.asyncProperty(viralAnalysisArbitrary, async (analysis) => {
                // This should not throw any errors
                const { unmount } = render(<ViralAnalysisPanel analysis={analysis} />);

                // Verify panel renders (either with content or empty state)
                const hasContent =
                    analysis.reasons.length > 0 ||
                    analysis.keyMoments.length > 0 ||
                    analysis.suggestions.length > 0 ||
                    analysis.estimatedRetention !== undefined ||
                    analysis.engagementPrediction !== undefined;

                if (hasContent) {
                    await waitFor(() => {
                        expect(screen.getByTestId('viral-analysis-panel')).toBeTruthy();
                    });
                } else {
                    await waitFor(() => {
                        expect(screen.getByTestId('viral-analysis-panel-empty')).toBeTruthy();
                    });
                }

                // Cleanup
                unmount();
            }),
            { numRuns: 20 }
        );
    });
});
