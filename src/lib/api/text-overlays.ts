import { api } from "../axios";
import type { TextOverlay } from "@/components/text/text-overlay-panel";

export interface TextOverlaysResponse {
  clipId: string;
  overlays: TextOverlay[];
}

export const textOverlaysApi = {
  getTextOverlays: async (clipId: string): Promise<TextOverlaysResponse> => {
    const response = await api.get<TextOverlaysResponse>(`/api/clips/${clipId}/text-overlays`);
    return response.data;
  },

  updateTextOverlays: async (clipId: string, overlays: TextOverlay[]): Promise<TextOverlaysResponse> => {
    const response = await api.put<TextOverlaysResponse>(`/api/clips/${clipId}/text-overlays`, { overlays });
    return response.data;
  },
};
