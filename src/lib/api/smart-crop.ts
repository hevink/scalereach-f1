import { api } from "../axios";

export type SmartCropStatus = "not_started" | "pending" | "processing" | "done" | "failed";

export interface SmartCropStatusResponse {
  status: SmartCropStatus;
  progress: number;
  smartCropStorageUrl: string | null;
}

export interface SmartCropTriggerResponse {
  status: SmartCropStatus;
  jobId?: string;
  smartCropStorageUrl?: string;
}

export const smartCropApi = {
  trigger: async (clipId: string): Promise<SmartCropTriggerResponse> => {
    const response = await api.post<SmartCropTriggerResponse>(
      `/api/clips/${clipId}/smart-crop`
    );
    return response.data;
  },

  getStatus: async (clipId: string): Promise<SmartCropStatusResponse> => {
    const response = await api.get<SmartCropStatusResponse>(
      `/api/clips/${clipId}/smart-crop/status`
    );
    return response.data;
  },
};
