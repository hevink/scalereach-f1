import { api } from "../axios";

export interface MinutesBalance {
  id: string;
  workspaceId: string;
  minutesTotal: number;
  minutesUsed: number;
  minutesRemaining: number;
  minutesResetDate: string | null;
  editingOperationsUsed: number;
  updatedAt: string;
  plan: string;
  planLimits: {
    videoLength: number;
    uploadSize: number;
    storageDuration: number;
    regenerations: number;
    editing: number;
    watermark: boolean;
  };
  editingOperationsLimit: number;
}

export interface MinuteTransaction {
  id: string;
  workspaceId: string;
  userId: string | null;
  videoId: string | null;
  type: "upload" | "regenerate" | "refund" | "allocation" | "reset" | "adjustment";
  minutesAmount: number;
  minutesBefore: number;
  minutesAfter: number;
  description: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface UploadValidation {
  allowed: boolean;
  reason?: string;
  message?: string;
  upgrade?: boolean;
  minutesWillBeDeducted?: number;
}

export const minutesApi = {
  // Get workspace minutes balance
  getBalance: async (workspaceId: string) => {
    const response = await api.get<MinutesBalance>(`/api/minutes/workspaces/${workspaceId}/balance`);
    return response.data;
  },

  // Get minute transaction history
  getTransactions: async (workspaceId: string, params?: { limit?: number; offset?: number; type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    if (params?.type) searchParams.set("type", params.type);

    const response = await api.get<MinuteTransaction[]>(
      `/api/minutes/workspaces/${workspaceId}/transactions?${searchParams.toString()}`
    );
    return response.data;
  },

  // Validate upload before starting
  validateUpload: async (workspaceId: string, duration: number, size: number, effectiveDuration?: number) => {
    const response = await api.post<UploadValidation>(
      `/api/minutes/workspaces/${workspaceId}/validate-upload`,
      { duration, size, effectiveDuration }
    );
    return response.data;
  },
};
