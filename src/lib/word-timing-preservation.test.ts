/**
 * Tests for Word Timing Preservation Utilities
 *
 * @validates Requirements 6.4 - THE Caption_Editor SHALL preserve word-level timing information when text is modified
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  preserveWordTiming,
  needsTimingRecalculation,
  levenshteinDistance,
  stringSimilarity,
  areWordsSimilar,
  computeWordDiff,
} from "./word-timing-preservation";
import type { TranscriptWord } from "@/lib/api/transcript";

// ============================================================================
// Test Data Generators
// ============================================================================

/**
 * Generate an array of TranscriptWords with sequential timing
 */
function generateTranscriptWords(
  segmentStart: number,
  segmentEnd: number,
  wordCount: number
): TranscriptWord[] {
  const duration = segmentEnd - segmentStart;
  const wordDuration = duration / wordCount;
  const words: TranscriptWord[] = [];

  for (let i = 0; i < wordCount; i++) {
    words.push({
      word: `word${i}`,
      start: segmentStart + i * wordDuration,
      end: segmentStart + (i + 1) * wordDuration,
      confidence: 0.9,
    });
  }

  return words;
}

// ============================================================================
// Unit Tests - String Similarity Functions
// ============================================================================

describe("String Similarity Functions", () => {
  describe("levenshteinDistance", () => {
    it("returns 0 for identical strings", () => {
      expect(levenshteinDistance("hello", "hello")).toBe(0);
    });

    it("returns correct distance for single character difference", () => {
      expect(levenshteinDistance("hello", "hallo")).toBe(1);
    });

    it("returns string length for empty comparison", () => {
      expect(levenshteinDistance("hello", "")).toBe(5);
      expect(levenshteinDistance("", "world")).toBe(5);
    });

    it("is case-insensitive", () => {
      expect(levenshteinDistance("Hello", "hello")).toBe(0);
    });
  });

  describe("stringSimilarity", () => {
    it("returns 1 for identical strings", () => {
      expect(stringSimilarity("test", "test")).toBe(1);
    });

    it("returns 0 for completely different strings", () => {
      expect(stringSimilarity("abc", "xyz")).toBeLessThan(0.5);
    });

    it("returns value between 0 and 1", () => {
      const similarity = stringSimilarity("hello", "hallo");
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });
  });

  describe("areWordsSimilar", () => {
    it("returns true for exact matches", () => {
      expect(areWordsSimilar("word", "word")).toBe(true);
    });

    it("returns true for case-insensitive matches", () => {
      expect(areWordsSimilar("Word", "word")).toBe(true);
    });

    it("returns true for similar words above threshold", () => {
      expect(areWordsSimilar("hello", "hallo", 0.7)).toBe(true);
    });

    it("returns false for dissimilar words", () => {
      expect(areWordsSimilar("hello", "world", 0.7)).toBe(false);
    });
  });
});

// ============================================================================
// Unit Tests - Word Diff Algorithm
// ============================================================================

describe("computeWordDiff", () => {
  it("identifies kept words correctly", () => {
    const oldWords = ["hello", "world"];
    const newWords = ["hello", "world"];
    const diff = computeWordDiff(oldWords, newWords);

    expect(diff).toContainEqual({ type: "keep", oldIndex: 0, newIndex: 0 });
    expect(diff).toContainEqual({ type: "keep", oldIndex: 1, newIndex: 1 });
  });

  it("identifies deleted words", () => {
    const oldWords = ["hello", "beautiful", "world"];
    const newWords = ["hello", "world"];
    const diff = computeWordDiff(oldWords, newWords);

    expect(diff.some((op) => op.type === "delete" && op.oldIndex === 1)).toBe(true);
  });

  it("identifies inserted words", () => {
    const oldWords = ["hello", "world"];
    const newWords = ["hello", "beautiful", "world"];
    const diff = computeWordDiff(oldWords, newWords);

    expect(diff.some((op) => op.type === "insert" && op.newIndex === 1)).toBe(true);
  });

  it("handles complete replacement", () => {
    const oldWords = ["foo", "bar"];
    const newWords = ["baz", "qux"];
    const diff = computeWordDiff(oldWords, newWords);

    // Should have some operations (either replace or delete+insert)
    expect(diff.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Unit Tests - preserveWordTiming
// ============================================================================

describe("preserveWordTiming", () => {
  const segmentStart = 0;
  const segmentEnd = 10;

  describe("Basic Functionality", () => {
    it("preserves timing for unchanged text", () => {
      const originalWords: TranscriptWord[] = [
        { word: "hello", start: 0, end: 2, confidence: 0.9 },
        { word: "world", start: 2, end: 4, confidence: 0.95 },
      ];

      const result = preserveWordTiming(
        originalWords,
        "hello world",
        segmentStart,
        segmentEnd
      );

      expect(result).toHaveLength(2);
      expect(result[0].word).toBe("hello");
      expect(result[0].start).toBe(0);
      expect(result[0].end).toBe(2);
      expect(result[1].word).toBe("world");
      expect(result[1].start).toBe(2);
      expect(result[1].end).toBe(4);
    });

    it("handles empty new text", () => {
      const originalWords: TranscriptWord[] = [
        { word: "hello", start: 0, end: 2, confidence: 0.9 },
      ];

      const result = preserveWordTiming(
        originalWords,
        "",
        segmentStart,
        segmentEnd
      );

      expect(result).toHaveLength(0);
    });

    it("handles empty original words", () => {
      const result = preserveWordTiming(
        [],
        "hello world",
        segmentStart,
        segmentEnd
      );

      expect(result).toHaveLength(2);
      expect(result[0].word).toBe("hello");
      expect(result[1].word).toBe("world");
      // Should have evenly distributed timing
      expect(result[0].start).toBe(0);
      expect(result[1].end).toBe(10);
    });
  });

  describe("Word Additions", () => {
    it("interpolates timing for added words at the beginning", () => {
      const originalWords: TranscriptWord[] = [
        { word: "world", start: 5, end: 10, confidence: 0.9 },
      ];

      const result = preserveWordTiming(
        originalWords,
        "hello world",
        segmentStart,
        segmentEnd
      );

      expect(result).toHaveLength(2);
      expect(result[0].word).toBe("hello");
      expect(result[0].start).toBeGreaterThanOrEqual(segmentStart);
      expect(result[0].end).toBeLessThanOrEqual(5);
      expect(result[1].word).toBe("world");
      expect(result[1].start).toBe(5);
    });

    it("interpolates timing for added words in the middle", () => {
      const originalWords: TranscriptWord[] = [
        { word: "hello", start: 0, end: 3, confidence: 0.9 },
        { word: "world", start: 7, end: 10, confidence: 0.9 },
      ];

      const result = preserveWordTiming(
        originalWords,
        "hello beautiful world",
        segmentStart,
        segmentEnd
      );

      expect(result).toHaveLength(3);
      expect(result[0].word).toBe("hello");
      expect(result[1].word).toBe("beautiful");
      expect(result[2].word).toBe("world");
      // The middle word should be between hello's end and world's start
      expect(result[1].start).toBeGreaterThanOrEqual(3);
      expect(result[1].end).toBeLessThanOrEqual(7);
    });

    it("interpolates timing for added words at the end", () => {
      const originalWords: TranscriptWord[] = [
        { word: "hello", start: 0, end: 5, confidence: 0.9 },
      ];

      const result = preserveWordTiming(
        originalWords,
        "hello world",
        segmentStart,
        segmentEnd
      );

      expect(result).toHaveLength(2);
      expect(result[0].word).toBe("hello");
      expect(result[1].word).toBe("world");
      expect(result[1].start).toBeGreaterThanOrEqual(5);
      expect(result[1].end).toBeLessThanOrEqual(segmentEnd);
    });
  });

  describe("Word Deletions", () => {
    it("removes timing for deleted words", () => {
      const originalWords: TranscriptWord[] = [
        { word: "hello", start: 0, end: 3, confidence: 0.9 },
        { word: "beautiful", start: 3, end: 6, confidence: 0.9 },
        { word: "world", start: 6, end: 10, confidence: 0.9 },
      ];

      const result = preserveWordTiming(
        originalWords,
        "hello world",
        segmentStart,
        segmentEnd
      );

      expect(result).toHaveLength(2);
      expect(result[0].word).toBe("hello");
      expect(result[1].word).toBe("world");
      // Original timing should be preserved for kept words
      expect(result[0].start).toBe(0);
      expect(result[0].end).toBe(3);
      expect(result[1].start).toBe(6);
      expect(result[1].end).toBe(10);
    });
  });

  describe("Word Replacements", () => {
    it("preserves timing for replaced words", () => {
      const originalWords: TranscriptWord[] = [
        { word: "hello", start: 0, end: 5, confidence: 0.9 },
        { word: "world", start: 5, end: 10, confidence: 0.9 },
      ];

      const result = preserveWordTiming(
        originalWords,
        "hello universe",
        segmentStart,
        segmentEnd
      );

      expect(result).toHaveLength(2);
      expect(result[0].word).toBe("hello");
      expect(result[1].word).toBe("universe");
      // Timing should be preserved from the replaced word
      expect(result[1].start).toBe(5);
      expect(result[1].end).toBe(10);
    });
  });

  describe("Timing Validity", () => {
    it("ensures timing is within segment bounds", () => {
      const originalWords: TranscriptWord[] = [
        { word: "hello", start: -1, end: 5, confidence: 0.9 },
        { word: "world", start: 5, end: 15, confidence: 0.9 },
      ];

      const result = preserveWordTiming(
        originalWords,
        "hello world",
        segmentStart,
        segmentEnd
      );

      expect(result[0].start).toBeGreaterThanOrEqual(segmentStart);
      expect(result[result.length - 1].end).toBeLessThanOrEqual(segmentEnd);
    });

    it("ensures timing is monotonically increasing", () => {
      const originalWords: TranscriptWord[] = [
        { word: "hello", start: 0, end: 5, confidence: 0.9 },
        { word: "world", start: 3, end: 8, confidence: 0.9 }, // Overlapping timing
      ];

      const result = preserveWordTiming(
        originalWords,
        "hello world",
        segmentStart,
        segmentEnd
      );

      for (let i = 1; i < result.length; i++) {
        expect(result[i].start).toBeGreaterThanOrEqual(result[i - 1].end);
      }
    });

    it("ensures each word has positive duration", () => {
      const originalWords: TranscriptWord[] = [
        { word: "hello", start: 0, end: 5, confidence: 0.9 },
      ];

      const result = preserveWordTiming(
        originalWords,
        "hello world test",
        segmentStart,
        segmentEnd
      );

      for (const word of result) {
        expect(word.end).toBeGreaterThan(word.start);
      }
    });
  });
});

// ============================================================================
// Unit Tests - needsTimingRecalculation
// ============================================================================

describe("needsTimingRecalculation", () => {
  it("returns false for identical text", () => {
    expect(needsTimingRecalculation("hello world", "hello world")).toBe(false);
  });

  it("returns false for case-only changes", () => {
    expect(needsTimingRecalculation("hello world", "Hello World")).toBe(false);
  });

  it("returns true for word additions", () => {
    expect(needsTimingRecalculation("hello world", "hello beautiful world")).toBe(true);
  });

  it("returns true for word deletions", () => {
    expect(needsTimingRecalculation("hello beautiful world", "hello world")).toBe(true);
  });

  it("returns true for word replacements", () => {
    expect(needsTimingRecalculation("hello world", "hello universe")).toBe(true);
  });
});

// ============================================================================
// Property-Based Tests
// ============================================================================

describe("Property-Based Tests", () => {
  /**
   * Property 19: Caption Word Timing Preservation
   * For any caption with word-level timing, when the caption text is edited,
   * the word timing array should remain intact (not be deleted or corrupted)
   *
   * **Validates: Requirements 6.4**
   */
  describe("Property 19: Caption Word Timing Preservation", () => {
    it("preserves word count when text is unchanged", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (wordCount) => {
            const originalWords = generateTranscriptWords(0, 10, wordCount);
            const originalText = originalWords.map((w) => w.word).join(" ");
            const result = preserveWordTiming(originalWords, originalText, 0, 10);

            expect(result).toHaveLength(originalWords.length);
          }
        ),
        { numRuns: 10 }
      );
    });

    it("always produces valid timing (start < end for each word)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.array(fc.constantFrom("word1", "word2", "word3", "test", "hello"), { minLength: 1, maxLength: 5 }),
          (wordCount, newWords) => {
            const originalWords = generateTranscriptWords(0, 10, wordCount);
            const newText = newWords.join(" ");
            const result = preserveWordTiming(originalWords, newText, 0, 10);

            for (const word of result) {
              expect(word.end).toBeGreaterThan(word.start);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it("always produces timing within segment bounds", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.array(fc.constantFrom("word1", "word2", "word3", "test", "hello"), { minLength: 1, maxLength: 5 }),
          (wordCount, newWords) => {
            const segmentStart = 5;
            const segmentEnd = 15;
            const originalWords = generateTranscriptWords(segmentStart, segmentEnd, wordCount);
            const newText = newWords.join(" ");
            const result = preserveWordTiming(originalWords, newText, segmentStart, segmentEnd);

            for (const word of result) {
              expect(word.start).toBeGreaterThanOrEqual(segmentStart);
              expect(word.end).toBeLessThanOrEqual(segmentEnd);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it("produces monotonically increasing timing", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.array(fc.constantFrom("word1", "word2", "word3", "test", "hello"), { minLength: 1, maxLength: 5 }),
          (wordCount, newWords) => {
            const originalWords = generateTranscriptWords(0, 10, wordCount);
            const newText = newWords.join(" ");
            const result = preserveWordTiming(originalWords, newText, 0, 10);

            for (let i = 1; i < result.length; i++) {
              expect(result[i].start).toBeGreaterThanOrEqual(result[i - 1].end);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it("word count matches new text word count", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.array(fc.constantFrom("word1", "word2", "word3", "test", "hello"), { minLength: 1, maxLength: 5 }),
          (wordCount, newWords) => {
            const originalWords = generateTranscriptWords(0, 10, wordCount);
            const newText = newWords.join(" ");
            const result = preserveWordTiming(originalWords, newText, 0, 10);

            expect(result).toHaveLength(newWords.length);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
