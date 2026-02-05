import { api } from "../axios";

// Types based on design document
export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  words: TranscriptWord[];
}

export interface TranscriptResponse {
  videoId: string;
  transcript: string;
  transcriptWords: TranscriptWord[] | null;
  transcriptLanguage: string | null;
  transcriptConfidence: number | null;
  segments: TranscriptSegment[];
}

export interface UpdateTranscriptTextRequest {
  segmentId: string;
  text: string;
}

export interface UpdateTranscriptTextResponse {
  message: string;
  segment: TranscriptSegment;
}

export interface UpdateWordTimingRequest {
  segmentId: string;
  wordIndex: number;
  start: number;
  end: number;
}

export interface UpdateWordTimingResponse {
  message: string;
  segment: TranscriptSegment;
}

export const transcriptApi = {
  /**
   * Get the transcript for a video
   * Requirements: 4.1
   */
  getTranscript: async (videoId: string): Promise<TranscriptResponse> => {
    const response = await api.get<TranscriptResponse>(
      `/api/videos/${videoId}/transcript`
    );
    return response.data;
  },

  /**
   * Update transcript text for a segment
   * Requirements: 5.4
   */
  updateTranscriptText: async (
    videoId: string,
    request: UpdateTranscriptTextRequest
  ): Promise<UpdateTranscriptTextResponse> => {
    const response = await api.patch<UpdateTranscriptTextResponse>(
      `/api/videos/${videoId}/transcript/text`,
      request
    );
    return response.data;
  },

  /**
   * Update word timing within a transcript segment
   * Requirements: 5.4
   */
  updateWordTiming: async (
    videoId: string,
    request: UpdateWordTimingRequest
  ): Promise<UpdateWordTimingResponse> => {
    const response = await api.patch<UpdateWordTimingResponse>(
      `/api/videos/${videoId}/transcript/timing`,
      request
    );
    return response.data;
  },
};
