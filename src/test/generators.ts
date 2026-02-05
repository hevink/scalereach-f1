import * as fc from 'fast-check';
import { Video } from '@/lib/api/video';
import type { ClipResponse, ClipStatus, AspectRatio } from '@/lib/api/clips';
import type { ViralAnalysis, KeyMoment, EngagementMetrics } from '@/components/clips/viral-analysis-panel';

/**
 * Fast-check arbitrary for generating Video objects
 * Used for property-based testing
 */
export const videoArbitrary = fc.record({
  id: fc.uuid(),
  projectId: fc.oneof(fc.uuid(), fc.constant(null)),
  userId: fc.uuid(),
  sourceType: fc.constantFrom('youtube' as const, 'upload' as const),
  sourceUrl: fc.oneof(
    // YouTube URLs with valid 11-character video IDs
    fc.string({ minLength: 11, maxLength: 11 }).filter(id => /^[a-zA-Z0-9_-]{11}$/.test(id)).map(id => `https://www.youtube.com/watch?v=${id}`),
    // Upload URLs
    fc.webUrl()
  ),
  status: fc.constantFrom(
    'pending' as const,
    'downloading' as const,
    'uploading' as const,
    'transcribing' as const,
    'analyzing' as const,
    'completed' as const,
    'failed' as const
  ),
  title: fc.oneof(
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.constant(null)
  ),
  duration: fc.oneof(
    fc.integer({ min: 1, max: 7200 }), // 1 second to 2 hours
    fc.constant(null)
  ),
  storageKey: fc.oneof(fc.string(), fc.constant(null)),
  storageUrl: fc.oneof(fc.webUrl(), fc.constant(null)),
  transcript: fc.oneof(fc.string(), fc.constant(null)),
  errorMessage: fc.oneof(fc.string(), fc.constant(null)),
  metadata: fc.oneof(
    fc.dictionary(fc.string(), fc.anything()),
    fc.constant(null)
  ),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString()),
}) as fc.Arbitrary<Video>;

/**
 * Fast-check arbitrary for generating ClipResponse objects
 * Used for property-based testing of clip-related components
 */
export const clipArbitrary = fc.record({
  id: fc.uuid(),
  videoId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  startTime: fc.integer({ min: 0, max: 3600 }),
  endTime: fc.integer({ min: 1, max: 7200 }),
  duration: fc.integer({ min: 1, max: 300 }), // 1 second to 5 minutes
  transcript: fc.string({ minLength: 0, maxLength: 500 }),
  viralityScore: fc.integer({ min: 0, max: 100 }),
  viralityReason: fc.string({ minLength: 10, maxLength: 200 }),
  hooks: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 5 }),
  emotions: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
  thumbnailUrl: fc.option(fc.webUrl(), { nil: undefined }),
  storageKey: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: null }),
  storageUrl: fc.option(fc.webUrl(), { nil: null }),
  aspectRatio: fc.option(fc.constantFrom('9:16' as AspectRatio, '1:1' as AspectRatio, '16:9' as AspectRatio), { nil: null }),
  favorited: fc.boolean(),
  status: fc.constantFrom('detected' as ClipStatus, 'generating' as ClipStatus, 'ready' as ClipStatus, 'exported' as ClipStatus, 'failed' as ClipStatus),
  errorMessage: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: null }),
  // Use integer timestamps to avoid invalid date values, then convert to ISO string
  createdAt: fc.integer({ min: 1577836800000, max: 1924905600000 }).map(ts => new Date(ts).toISOString()),
  updatedAt: fc.integer({ min: 1577836800000, max: 1924905600000 }).map(ts => new Date(ts).toISOString()),
}).filter(clip => clip.endTime > clip.startTime) as fc.Arbitrary<ClipResponse>;


/**
 * Fast-check arbitrary for generating KeyMoment objects
 * Used for property-based testing of viral analysis components
 */
export const keyMomentArbitrary = fc.record({
  timestamp: fc.integer({ min: 0, max: 3600 }),
  description: fc.string({ minLength: 5, maxLength: 100 }),
  importance: fc.option(fc.constantFrom('high' as const, 'medium' as const, 'low' as const), { nil: undefined }),
}) as fc.Arbitrary<KeyMoment>;

/**
 * Fast-check arbitrary for generating EngagementMetrics objects
 * Used for property-based testing of viral analysis components
 */
export const engagementMetricsArbitrary = fc.record({
  views: fc.option(fc.integer({ min: 0, max: 10000000 }), { nil: undefined }),
  likes: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined }),
  shares: fc.option(fc.integer({ min: 0, max: 500000 }), { nil: undefined }),
  comments: fc.option(fc.integer({ min: 0, max: 100000 }), { nil: undefined }),
  retentionRate: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
}) as fc.Arbitrary<EngagementMetrics>;

/**
 * Fast-check arbitrary for generating ViralAnalysis objects
 * Used for property-based testing of viral analysis components
 * 
 * @validates Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 */
export const viralAnalysisArbitrary = fc.record({
  reasons: fc.array(fc.string({ minLength: 10, maxLength: 150 }), { minLength: 1, maxLength: 5 }),
  hooks: fc.option(fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 0, maxLength: 5 }), { nil: undefined }),
  emotions: fc.option(fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 0, maxLength: 5 }), { nil: undefined }),
  keyMoments: fc.array(keyMomentArbitrary, { minLength: 1, maxLength: 5 }),
  suggestions: fc.array(fc.string({ minLength: 10, maxLength: 150 }), { minLength: 1, maxLength: 5 }),
  estimatedRetention: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  engagementPrediction: fc.option(engagementMetricsArbitrary, { nil: undefined }),
}) as fc.Arbitrary<ViralAnalysis>;

/**
 * Fast-check arbitrary for generating ViralAnalysis with all required fields populated
 * Ensures all fields have at least one value for comprehensive testing
 * 
 * @validates Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 */
export const viralAnalysisWithAllFieldsArbitrary = fc.record({
  reasons: fc.array(fc.string({ minLength: 10, maxLength: 150 }), { minLength: 1, maxLength: 5 }),
  hooks: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
  emotions: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
  keyMoments: fc.array(keyMomentArbitrary, { minLength: 1, maxLength: 5 }),
  suggestions: fc.array(fc.string({ minLength: 10, maxLength: 150 }), { minLength: 1, maxLength: 5 }),
  estimatedRetention: fc.integer({ min: 0, max: 100 }),
  engagementPrediction: fc.record({
    views: fc.integer({ min: 0, max: 10000000 }),
    likes: fc.integer({ min: 0, max: 1000000 }),
    shares: fc.integer({ min: 0, max: 500000 }),
    comments: fc.integer({ min: 0, max: 100000 }),
    retentionRate: fc.integer({ min: 0, max: 100 }),
  }),
}) as fc.Arbitrary<ViralAnalysis>;
