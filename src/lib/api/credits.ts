import { api } from "../axios";

export interface CreditBalance {
  id: string;
  workspaceId: string;
  balance: number;
  lifetimeCredits: number;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  workspaceId: string;
  userId: string | null;
  type: "purchase" | "usage" | "refund" | "bonus" | "adjustment";
  amount: number;
  balanceAfter: number;
  description: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceInCents: number;
  polarProductId: string;
  isActive: number;
  createdAt: string;
}

export interface CheckoutResponse {
  checkoutId: string;
  checkoutUrl: string;
}

export const creditsApi = {
  // Get workspace credit balance
  getBalance: async (workspaceId: string) => {
    const response = await api.get<CreditBalance>(`/api/credits/workspaces/${workspaceId}/balance`);
    return response.data;
  },

  // Get transaction history
  getTransactions: async (workspaceId: string, params?: { limit?: number; offset?: number; type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    if (params?.type) searchParams.set("type", params.type);

    const response = await api.get<CreditTransaction[]>(
      `/api/credits/workspaces/${workspaceId}/transactions?${searchParams.toString()}`
    );
    return response.data;
  },

  // Get available packages
  getPackages: async () => {
    const response = await api.get<CreditPackage[]>("/api/credits/packages");
    return response.data;
  },

  // Create checkout session
  createCheckout: async (workspaceId: string, packageId: string) => {
    const response = await api.post<CheckoutResponse>(`/api/credits/workspaces/${workspaceId}/checkout`, {
      packageId,
      successUrl: `${window.location.origin}/credits/success?checkout_id={CHECKOUT_ID}`,
      cancelUrl: `${window.location.origin}/credits`,
    });
    return response.data;
  },

  // Add bonus credits (admin only)
  addBonusCredits: async (workspaceId: string, amount: number, description?: string) => {
    const response = await api.post<{ balance: number; transaction: CreditTransaction }>(
      `/api/credits/workspaces/${workspaceId}/bonus`,
      { amount, description }
    );
    return response.data;
  },
};
