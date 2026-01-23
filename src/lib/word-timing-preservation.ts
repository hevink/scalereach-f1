/**
 * Word Timing Preservation Utilities
 *
 * This module provides algorithms for preserving word-level timing information
 * when caption text is modified. It implements smart word matching to:
 * - Match unchanged words to their original timing
 * - Handle word additions by interpolating timing
 * - Handle word deletions by removing timing entries
 *
 * @validates Requirements 6.4 - THE Caption_Editor SHALL preserve word-level timing information when text is modified
 */

import type { TranscriptWord } from "@/lib/api/transcript";

// ============================================================================
// Types
// ============================================================================

/**
 * Result of the word matching algorithm
 */
export interface WordMatchResult {
  /** The new word text */
  word: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Confidence score (0-1), lower for interpolated words */
  confidence: number;
  /** Whether this word was matched from original timing */
  isMatched: boolean;
  /** Whether this word's timing was interpolated */
  isInterpolated: boolean;
  /** Index of the original word this was matched to (-1 if new) */
  originalIndex: number;
}

/**
 * Edit operation types for the diff algorithm
 */
type EditOperation =
  | { type: "keep"; oldIndex: number; newIndex: number }
  | { type: "delete"; oldIndex: number }
  | { type: "insert"; newIndex: number }
  | { type: "replace"; oldIndex: number; newIndex: number };

// ============================================================================
// String Similarity Functions
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy word matching
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  if (aLower === bLower) return 0;
  if (aLower.length === 0) return bLower.length;
  if (bLower.length === 0) return aLower.length;

  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= aLower.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= bLower.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= aLower.length; i++) {
    for (let j = 1; j <= bLower.length; j++) {
      const cost = aLower[i - 1] === bLower[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[aLower.length][bLower.length];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 * 1 = identical, 0 = completely different
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

/**
 * Check if two words are similar enough to be considered a match
 * Uses a threshold-based approach for fuzzy matching
 */
export function areWordsSimilar(
  word1: string,
  word2: string,
  threshold: number = 0.7
): boolean {
  // Exact match (case-insensitive)
  if (word1.toLowerCase() === word2.toLowerCase()) return true;

  // Check similarity ratio
  return stringSimilarity(word1, word2) >= threshold;
}

// ============================================================================
// Diff Algorithm (Longest Common Subsequence based)
// ============================================================================

/**
 * Find the longest common subsequence of words between old and new text
 * Returns indices of matching words in both arrays
 */
function findLCS(
  oldWords: string[],
  newWords: string[]
): Array<{ oldIndex: number; newIndex: number }> {
  const m = oldWords.length;
  const n = newWords.length;

  // Build LCS length matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (areWordsSimilar(oldWords[i - 1], newWords[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find the actual LCS
  const matches: Array<{ oldIndex: number; newIndex: number }> = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (areWordsSimilar(oldWords[i - 1], newWords[j - 1])) {
      matches.unshift({ oldIndex: i - 1, newIndex: j - 1 });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return matches;
}

/**
 * Compute edit operations needed to transform old words to new words
 * Uses LCS-based diff algorithm
 */
export function computeWordDiff(
  oldWords: string[],
  newWords: string[]
): EditOperation[] {
  const lcs = findLCS(oldWords, newWords);
  const operations: EditOperation[] = [];

  let oldIdx = 0;
  let newIdx = 0;
  let lcsIdx = 0;

  while (oldIdx < oldWords.length || newIdx < newWords.length) {
    const nextMatch = lcs[lcsIdx];

    if (nextMatch && oldIdx === nextMatch.oldIndex && newIdx === nextMatch.newIndex) {
      // This is a matched word (keep)
      operations.push({ type: "keep", oldIndex: oldIdx, newIndex: newIdx });
      oldIdx++;
      newIdx++;
      lcsIdx++;
    } else if (nextMatch && oldIdx < nextMatch.oldIndex && newIdx < nextMatch.newIndex) {
      // Both indices need to advance - this is a replacement
      operations.push({ type: "replace", oldIndex: oldIdx, newIndex: newIdx });
      oldIdx++;
      newIdx++;
    } else if (!nextMatch || oldIdx < nextMatch.oldIndex) {
      // Old word was deleted
      if (oldIdx < oldWords.length) {
        operations.push({ type: "delete", oldIndex: oldIdx });
        oldIdx++;
      }
    } else {
      // New word was inserted
      if (newIdx < newWords.length) {
        operations.push({ type: "insert", newIndex: newIdx });
        newIdx++;
      }
    }
  }

  return operations;
}

// ============================================================================
// Timing Interpolation
// ============================================================================

/**
 * Interpolate timing for a new word based on surrounding words
 */
function interpolateTiming(
  newWordIndex: number,
  newWords: string[],
  results: WordMatchResult[],
  segmentStartTime: number,
  segmentEndTime: number
): { start: number; end: number } {
  // Find the nearest matched words before and after this position
  let prevMatched: WordMatchResult | null = null;
  let nextMatched: WordMatchResult | null = null;

  for (let i = newWordIndex - 1; i >= 0; i--) {
    if (results[i] && results[i].isMatched) {
      prevMatched = results[i];
      break;
    }
  }

  for (let i = newWordIndex + 1; i < newWords.length; i++) {
    if (results[i] && results[i].isMatched) {
      nextMatched = results[i];
      break;
    }
  }

  // Calculate timing based on available anchors
  if (prevMatched && nextMatched) {
    // Interpolate between two matched words
    const gapStart = prevMatched.end;
    const gapEnd = nextMatched.start;
    const gapDuration = gapEnd - gapStart;

    // Count unmatched words in the gap (including this one)
    let unmatchedCount = 0;
    let unmatchedPosition = 0;
    for (let i = 0; i < newWords.length; i++) {
      if (!results[i] || !results[i].isMatched) {
        if (i === newWordIndex) {
          unmatchedPosition = unmatchedCount;
        }
        if (
          (prevMatched === null || i > newWords.indexOf(prevMatched.word)) &&
          (nextMatched === null || i < newWords.indexOf(nextMatched.word))
        ) {
          unmatchedCount++;
        }
      }
    }

    // Distribute time evenly among unmatched words
    const wordDuration = gapDuration / Math.max(unmatchedCount, 1);
    const start = gapStart + wordDuration * unmatchedPosition;
    const end = start + wordDuration;

    return { start: Math.max(start, segmentStartTime), end: Math.min(end, segmentEndTime) };
  } else if (prevMatched) {
    // Only have a previous anchor - place after it
    const remainingDuration = segmentEndTime - prevMatched.end;
    const unmatchedAfter = newWords.length - newWordIndex;
    const wordDuration = remainingDuration / Math.max(unmatchedAfter, 1);
    const positionAfterPrev = newWordIndex - newWords.findIndex((_, i) => results[i]?.isMatched && results[i] === prevMatched) - 1;
    const start = prevMatched.end + wordDuration * positionAfterPrev;
    const end = start + wordDuration;

    return { start: Math.max(start, segmentStartTime), end: Math.min(end, segmentEndTime) };
  } else if (nextMatched) {
    // Only have a next anchor - place before it
    const availableDuration = nextMatched.start - segmentStartTime;
    const unmatchedBefore = newWordIndex + 1;
    const wordDuration = availableDuration / Math.max(unmatchedBefore, 1);
    const start = segmentStartTime + wordDuration * newWordIndex;
    const end = start + wordDuration;

    return { start: Math.max(start, segmentStartTime), end: Math.min(end, segmentEndTime) };
  } else {
    // No anchors - distribute evenly across segment
    const segmentDuration = segmentEndTime - segmentStartTime;
    const wordDuration = segmentDuration / Math.max(newWords.length, 1);
    const start = segmentStartTime + wordDuration * newWordIndex;
    const end = start + wordDuration;

    return { start, end };
  }
}

// ============================================================================
// Main Word Timing Preservation Function
// ============================================================================

/**
 * Preserve word-level timing when caption text is modified
 *
 * This function implements a smart word matching algorithm that:
 * 1. Matches unchanged words to their original timing
 * 2. Handles word additions by interpolating timing from surrounding words
 * 3. Handles word deletions by removing timing entries
 *
 * @param originalWords - The original word timing array
 * @param newText - The new caption text after editing
 * @param segmentStartTime - Start time of the segment (for bounds)
 * @param segmentEndTime - End time of the segment (for bounds)
 * @returns Array of words with preserved/interpolated timing
 *
 * @validates Requirements 6.4 - Preserve word-level timing information when text is modified
 */
export function preserveWordTiming(
  originalWords: TranscriptWord[],
  newText: string,
  segmentStartTime: number,
  segmentEndTime: number
): TranscriptWord[] {
  // Handle edge cases
  if (!newText.trim()) {
    return [];
  }

  if (!originalWords || originalWords.length === 0) {
    // No original timing - create evenly distributed timing
    const words = newText.trim().split(/\s+/);
    const duration = segmentEndTime - segmentStartTime;
    const wordDuration = duration / words.length;

    return words.map((word, index) => ({
      word,
      start: segmentStartTime + wordDuration * index,
      end: segmentStartTime + wordDuration * (index + 1),
      confidence: 0.5, // Lower confidence for generated timing
    }));
  }

  // Parse new text into words
  const newWords = newText.trim().split(/\s+/);
  const oldWords = originalWords.map((w) => w.word);

  // Compute the diff between old and new words
  const operations = computeWordDiff(oldWords, newWords);

  // Build the result array with timing information
  const results: WordMatchResult[] = new Array(newWords.length);

  // First pass: handle matched and replaced words
  for (const op of operations) {
    if (op.type === "keep") {
      // Word was kept - preserve original timing
      const originalWord = originalWords[op.oldIndex];
      results[op.newIndex] = {
        word: newWords[op.newIndex],
        start: originalWord.start,
        end: originalWord.end,
        confidence: originalWord.confidence,
        isMatched: true,
        isInterpolated: false,
        originalIndex: op.oldIndex,
      };
    } else if (op.type === "replace") {
      // Word was replaced - use original timing but mark as modified
      const originalWord = originalWords[op.oldIndex];
      results[op.newIndex] = {
        word: newWords[op.newIndex],
        start: originalWord.start,
        end: originalWord.end,
        confidence: originalWord.confidence * 0.8, // Slightly lower confidence
        isMatched: true,
        isInterpolated: false,
        originalIndex: op.oldIndex,
      };
    }
  }

  // Second pass: handle inserted words (interpolate timing)
  for (const op of operations) {
    if (op.type === "insert") {
      const timing = interpolateTiming(
        op.newIndex,
        newWords,
        results,
        segmentStartTime,
        segmentEndTime
      );

      results[op.newIndex] = {
        word: newWords[op.newIndex],
        start: timing.start,
        end: timing.end,
        confidence: 0.5, // Lower confidence for interpolated timing
        isMatched: false,
        isInterpolated: true,
        originalIndex: -1,
      };
    }
  }

  // Fill any remaining gaps (shouldn't happen, but safety check)
  for (let i = 0; i < newWords.length; i++) {
    if (!results[i]) {
      const timing = interpolateTiming(
        i,
        newWords,
        results,
        segmentStartTime,
        segmentEndTime
      );

      results[i] = {
        word: newWords[i],
        start: timing.start,
        end: timing.end,
        confidence: 0.5,
        isMatched: false,
        isInterpolated: true,
        originalIndex: -1,
      };
    }
  }

  // Ensure timing is monotonically increasing and within bounds
  const finalResults = ensureValidTiming(results, segmentStartTime, segmentEndTime);

  // Convert to TranscriptWord format
  return finalResults.map((result) => ({
    word: result.word,
    start: result.start,
    end: result.end,
    confidence: result.confidence,
  }));
}

/**
 * Ensure timing values are valid and monotonically increasing
 */
function ensureValidTiming(
  results: WordMatchResult[],
  segmentStartTime: number,
  segmentEndTime: number
): WordMatchResult[] {
  if (results.length === 0) return results;

  const adjusted = [...results];

  // Ensure first word starts at or after segment start
  if (adjusted[0].start < segmentStartTime) {
    adjusted[0] = { ...adjusted[0], start: segmentStartTime };
  }

  // Ensure last word ends at or before segment end
  const lastIdx = adjusted.length - 1;
  if (adjusted[lastIdx].end > segmentEndTime) {
    adjusted[lastIdx] = { ...adjusted[lastIdx], end: segmentEndTime };
  }

  // Ensure monotonically increasing timing
  for (let i = 1; i < adjusted.length; i++) {
    const prev = adjusted[i - 1];
    const curr = adjusted[i];

    // Ensure start is after previous end
    if (curr.start < prev.end) {
      adjusted[i] = { ...curr, start: prev.end };
    }

    // Ensure end is after start
    if (adjusted[i].end <= adjusted[i].start) {
      // Give minimum duration of 0.05 seconds
      adjusted[i] = { ...adjusted[i], end: adjusted[i].start + 0.05 };
    }
  }

  // Final bounds check
  for (let i = 0; i < adjusted.length; i++) {
    adjusted[i] = {
      ...adjusted[i],
      start: Math.max(segmentStartTime, Math.min(adjusted[i].start, segmentEndTime)),
      end: Math.max(segmentStartTime, Math.min(adjusted[i].end, segmentEndTime)),
    };
  }

  return adjusted;
}

/**
 * Quick check if word timing needs to be recalculated
 * Returns true if the text has changed in a way that affects word count
 */
export function needsTimingRecalculation(
  originalText: string,
  newText: string
): boolean {
  const originalWords = originalText.trim().split(/\s+/);
  const newWords = newText.trim().split(/\s+/);

  // Different word count means timing needs recalculation
  if (originalWords.length !== newWords.length) {
    return true;
  }

  // Check if any words changed
  for (let i = 0; i < originalWords.length; i++) {
    if (originalWords[i].toLowerCase() !== newWords[i].toLowerCase()) {
      return true;
    }
  }

  return false;
}
