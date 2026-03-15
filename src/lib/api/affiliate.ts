import { api } from "../axios";

export interface AffiliateStats {
  referralLink: string | null;
  referralCode: string | null;
  username: string | null;
  commissionRate: number;
  totalReferrals: number;
  convertedReferrals: number;
  totalEarnedCents: number;
  pendingCents: number;
  paidCents: number;
  referrals: Array<{
    id: string;
    referredUserId: string;
    status: string;
    createdAt: string;
    convertedAt: string | null;
    referredName: string | null;
    referredEmail: string | null;
  }>;
  commissions: Array<{
    id: string;
    referralId: string;
    referrerUserId: string;
    paymentAmountCents: number;
    commissionAmountCents: number;
    commissionRate: number;
    status: string;
    planName: string | null;
    paymentId: string | null;
    paidAt: string | null;
    createdAt: string;
  }>;
}

export interface ReferrerInfo {
  valid: boolean;
  referralCode: string;
  name: string;
}

export const affiliateApi = {
  getStats: async () => {
    const response = await api.get<AffiliateStats>("/api/affiliate/stats");
    return response.data;
  },

  resolveReferrer: async (username: string) => {
    const response = await api.get<ReferrerInfo>(`/api/affiliate/resolve/${username}`);
    return response.data;
  },

  trackReferral: async (referrerUsername: string, referredUserId: string) => {
    const response = await api.post("/api/affiliate/track", {
      referrerUsername,
      referredUserId,
    });
    return response.data;
  },
};
