const isLiveMode = process.env.NEXT_PUBLIC_DODO_ENVIRONMENT === "live_mode";

export const PRODUCT_IDS = isLiveMode
    ? {
          starterMonthly: "pdt_0NZGBR6GtydxMB2lNeh09",
          starterAnnual: "pdt_0NZGBRV0VGyAffgoPOiMx",
          proMonthly: "pdt_0NZGBRrun07eXzoWlmzm2",
          proAnnual: "pdt_0NZGBSH8bWPajakeSOO8B",
          agencyMonthly: "pdt_0NZGBScekA4L6yNm7r3BX",
          agencyAnnual: "pdt_0NZGBSvywqWyfQBbnGecS",
      }
    : {
          starterMonthly: "pdt_0NY6k5d7b4MxSsVM7KzEV",
          starterAnnual: "pdt_0NY6kJuPXxJUv7SFNbQOB",
          proMonthly: "pdt_0NY6llF7a0oFiFsaeVOW7",
          proAnnual: "pdt_0NY6lyuXXpnq6BWWOeDTy",
          agencyMonthly: "pdt_0NZFx5ffGwT1YxA1hGbe4",
          agencyAnnual: "pdt_0NZFxhZt01qOI9OLNEaSd",
      };

export interface Plan {
    name: string;
    description: string;
    monthly: number;
    annually: number;
    features: string[];
    featured: boolean;
    badge?: string;
    dodoProductIdMonthly: string;
    dodoProductIdYearly: string;
}

export const plans: Record<string, Plan> = {
    pro: {
        name: "Pro",
        badge: "Super offer",
        description: "Step up your game with bigger volume",
        monthly: 18,
        annually: 12.5,
        features: [
            "400 Minutes/Month",
            "Without Watermark",
            "Up to 3h File Length",
            "Up to 4GB File Size Upload",
            "Storage: 6 Months (then auto-deleted)",
            "Unlimited Editing",
            "4K Clip Quality",
            "5 Social Accounts",
            "Highest Queue Priority",
        ],
        featured: true,
        dodoProductIdMonthly: PRODUCT_IDS.proMonthly,
        dodoProductIdYearly: PRODUCT_IDS.proAnnual,
    },
    agency: {
        name: "Agency",
        badge: "Unlimited",
        description: "For agencies and teams that need it all",
        monthly: 99,
        annually: 49,
        features: [
            "Unlimited Minutes",
            "Without Watermark",
            "Up to 3h File Length",
            "Up to 4GB File Size Upload",
            "Storage: 6 Months (then auto-deleted)",
            "Unlimited Editing",
            "4K Clip Quality",
            "Unlimited Social Accounts",
            "Highest Queue Priority",
        ],
        featured: false,
        dodoProductIdMonthly: PRODUCT_IDS.agencyMonthly,
        dodoProductIdYearly: PRODUCT_IDS.agencyAnnual,
    },
    starter: {
        name: "Starter",
        description: "Unlock access to all powerful features",
        monthly: 12,
        annually: 10,
        features: [
            "200 Minutes/Month",
            "Without Watermark",
            "Up to 2h File Length",
            "Up to 4GB File Size Upload",
            "Storage: 3 Months (then auto-deleted)",
            "Unlimited Editing",
            "1080p Clip Quality",
            "1 Social Account",
            "High Queue Priority",
        ],
        featured: false,
        dodoProductIdMonthly: PRODUCT_IDS.starterMonthly,
        dodoProductIdYearly: PRODUCT_IDS.starterAnnual,
    },
};
