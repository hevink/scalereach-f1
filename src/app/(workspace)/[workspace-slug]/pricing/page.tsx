"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { creditsApi } from "@/lib/api/credits";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";
import { useMinutesBalance } from "@/hooks/useMinutes";
import { IconCreditCard } from "@tabler/icons-react";

// ============================================================================
// Types
// ============================================================================

type BillingPeriod = "monthly" | "annually";

import { plans, type Plan } from "@/lib/pricing-config";

// ============================================================================
// Pricing Data
// ============================================================================

// Scarcity data - update these numbers as spots fill up
const PLAN_SCARCITY: Record<string, { total: number; claimed: number } | null> = {
    agency: { total: 10, claimed: 4 },
    pro: { total: 100, claimed: 28 },
    starter: null,
};

const enterpriseFeatures = [
    "Unlimited video uploads",
    "Unlimited clip generation",
    "Custom video length limits",
    "White-label solution",
    "Custom AI training",
    "Dedicated account manager",
    "SLA guarantee",
    "Custom integrations",
    "Team collaboration",
];

// ============================================================================
// Pricing Components
// ============================================================================

function CornerDecoration({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
    const positionClasses = {
        "top-left": "-translate-x-[calc(50%+0.5px)] -translate-y-[calc(50%+0.5px)]",
        "top-right": "right-0 translate-x-[calc(50%+0.5px)] -translate-y-[calc(50%+0.5px)]",
        "bottom-left": "bottom-0 -translate-x-[calc(50%+0.5px)] translate-y-[calc(50%+0.5px)]",
        "bottom-right": "bottom-0 right-0 translate-x-[calc(50%+0.5px)] translate-y-[calc(50%+0.5px)]",
    };

    return (
        <div
            aria-hidden="true"
            className={`mask-radial-from-15% before:bg-foreground/25 after:bg-foreground/25 absolute size-3 before:absolute before:inset-0 before:m-auto before:h-px after:absolute after:inset-0 after:m-auto after:w-px ${positionClasses[position]}`}
        />
    );
}

// Scarcity - auto-increments from a base date
// Pro: +1/day from base of 28 on Feb 25 2026, cap at 100
// Agency: +1 every 3 days from base of 4 on Feb 25 2026, cap at 10
function getScarcityClaimed(base: number, total: number, daysInterval: number): number {
    const baseDate = new Date("2026-02-25");
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(total, base + Math.floor(daysPassed / daysInterval));
}

function ScarcityBar({ planKey }: { planKey: string }) {
    let claimed = 0;
    let total = 0;

    if (planKey === "pro") {
        total = 100;
        claimed = getScarcityClaimed(28, total, 1);
    } else if (planKey === "agency") {
        total = 10;
        claimed = getScarcityClaimed(4, total, 3);
    } else {
        return null;
    }

    const pct = Math.min(100, Math.round((claimed / total) * 100));
    const isSoldOut = claimed >= total;
    const remaining = total - claimed;

    return (
        <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className={isSoldOut ? "text-destructive font-medium" : "text-amber-600 dark:text-amber-400 font-medium"}>
                    {isSoldOut ? "🔒 Sold out - join waitlist" : `🔥 Only ${remaining} spot${remaining === 1 ? "" : "s"} left`}
                </span>
                <span className="text-muted-foreground">{claimed}/{total} claimed</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isSoldOut ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-primary"
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function PricingCard({
    planKey,
    plan,
    period,
    index,
    onSelect,
    isLoading,
    loadingPlanId,
    isCurrentPlanAndCycle,
    getButtonText,
}: {
    planKey: string;
    plan: Plan;
    period: BillingPeriod;
    index: number;
    onSelect: (planId: string, productId: string) => void;
    isLoading: boolean;
    loadingPlanId: string | null;
    isCurrentPlanAndCycle: (planKey: string) => boolean;
    getButtonText: (planKey: string, isThisLoading: boolean) => string;
}) {
    const price = period === "monthly" ? plan.monthly : plan.annually;
    const productId = period === "annually" ? plan.dodoProductIdYearly : plan.dodoProductIdMonthly;
    const isThisLoading = isLoading && loadingPlanId === planKey;
    const isCurrentCombination = isCurrentPlanAndCycle(planKey);
    const buttonText = getButtonText(planKey, isThisLoading);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`@max-4xl:p-9 row-span-4 grid grid-rows-subgrid gap-8 p-8 ${plan.featured
                ? "rounded-[--radius] ring-border bg-card @max-4xl:mx-1 shadow-black/6.5 shadow-xl ring-1 backdrop-blur"
                : ""
                }`}
        >
            {/* Plan name and description */}
            <div className="self-end">
                <div className="tracking-tight text-lg font-medium flex items-center gap-2">
                    {plan.name}
                    {plan.badge && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {plan.badge}
                        </span>
                    )}
                </div>
                <div className="text-muted-foreground mt-1 text-balance text-sm">
                    {plan.description}
                </div>
                <ScarcityBar planKey={planKey} />
            </div>

            {/* Price */}
            <div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${plan.name}-${period}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-baseline gap-2"
                    >
                        {plan.originalMonthly && plan.originalMonthly > price && (
                            <span className="text-lg text-muted-foreground line-through">${period === "monthly" ? plan.originalMonthly : plan.originalAnnually}</span>
                        )}
                        <span className="text-3xl font-semibold">${price}</span>
                        {price > 0 && <span className="text-lg font-normal text-muted-foreground">/month</span>}
                    </motion.div>
                </AnimatePresence>
                <div className="text-muted-foreground text-sm">
                    {price === 0 ? "Free forever" : period === "annually" ? `$${(price * 12).toFixed(2)} billed annually` : `$${price} billed monthly`}
                </div>
            </div>

            {/* CTA Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(planKey, productId)}
                disabled={isLoading || isCurrentCombination || plan.monthly === 0}
                className={`cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 w-full disabled:opacity-50 disabled:cursor-not-allowed ${plan.featured
                    ? "shadow-md border-[0.5px] border-white/10 shadow-black/15 bg-primary text-primary-foreground hover:bg-primary/90"
                    : "shadow-sm shadow-black/15 border border-transparent bg-card ring-1 ring-foreground/10 hover:bg-muted/50"
                    }`}
            >
                {isThisLoading ? (
                    <>
                        <Loader2 className="size-4 animate-spin" />
                        {buttonText}
                    </>
                ) : (
                    buttonText
                )}
            </motion.button>

            {/* Features list */}
            <ul role="list" className="space-y-2 text-sm">
                {plan.features.map((feature, i) => {
                    // Replace minutes text based on period for Pro and Starter plans
                    let displayFeature = feature;
                    if (period === "annually") {
                        if (planKey === "pro" && feature === "400 Minutes/Month") {
                            displayFeature = "4800 Minutes/Year";
                        } else if (planKey === "starter" && feature === "200 Minutes/Month") {
                            displayFeature = "1800 Minutes/Year";
                        }
                    }

                    // Check if this is a section header (starts with ────)
                    const isSectionHeader = feature.startsWith("────");

                    if (isSectionHeader) {
                        return (
                            <motion.li
                                key={feature}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: i * 0.02 }}
                                className="pt-3 pb-1 text-xs font-semibold text-primary/80 tracking-wide"
                            >
                                {feature.replace(/────/g, "").trim()}
                            </motion.li>
                        );
                    }

                    return (
                        <motion.li
                            key={feature}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: i * 0.02 }}
                            className="group flex items-center gap-2 first:font-medium"
                        >
                            <Check className="text-muted-foreground size-3 group-first:hidden" strokeWidth={3.5} />
                            {displayFeature}
                        </motion.li>
                    );
                })}
            </ul>
        </motion.div>
    );
}

function EnterpriseSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative mt-6"
        >
            <CornerDecoration position="top-right" />
            <div className="@4xl:grid-cols-3 @max-4xl:divide-y @4xl:divide-x grid border-t">
                <div className="space-y-6 p-8">
                    <div className="self-end">
                        <div className="tracking-tight text-lg font-medium">Enterprise</div>
                        <div className="text-muted-foreground mt-1 text-balance text-sm">
                            For media companies and agencies with custom requirements and high-volume needs.
                        </div>
                    </div>
                    <motion.a
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors shadow-sm shadow-black/15 border border-transparent bg-card ring-1 ring-foreground/10 hover:bg-muted/50 h-9 px-4 py-2 @max-4xl:w-full"
                        href="#"
                        onClick={(e) => { e.preventDefault(); if (window.$crisp) window.$crisp.push(["do", "chat:open"]); }}
                    >
                        Contact Sales
                    </motion.a>
                </div>
                <div className="col-span-2 p-8">
                    <ul role="list" className="@4xl:grid-cols-2 grid gap-x-14 gap-y-3 text-sm">
                        {enterpriseFeatures.map((feature, i) => (
                            <motion.li
                                key={feature}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                                className="flex items-center gap-2"
                            >
                                <Check className="text-muted-foreground size-3" strokeWidth={3.5} />
                                {feature}
                            </motion.li>
                        ))}
                    </ul>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Main Page
// ============================================================================

export default function WorkspacePricingPage() {
    const params = useParams();
    const router = useRouter();
    const workspaceSlug = params["workspace-slug"] as string;

    const { data: workspace, isLoading: workspaceLoading } = useWorkspaceBySlug(workspaceSlug);
    const { data: minutesBalance } = useMinutesBalance(workspace?.id ?? "");

    const [period, setPeriod] = useState<BillingPeriod>("annually");
    const [isLoading, setIsLoading] = useState(false);
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
    const [isBillingPortalLoading, setIsBillingPortalLoading] = useState(false);

    const currentPlanId = workspace?.plan ?? "free";
    const currentBillingCycle = workspace?.billingCycle; // 'monthly' | 'annual' | null

    // Determine if user is on current plan + billing cycle combination
    const isCurrentPlanAndCycle = (planKey: string) => {
        if (planKey === "free") return currentPlanId === "free";
        if (planKey !== currentPlanId) return false;

        // Check billing cycle match
        const cycleMatch = period === "annually"
            ? currentBillingCycle === "annual"
            : currentBillingCycle === "monthly";

        return cycleMatch;
    };

    // Determine button text based on plan relationship
    const getButtonText = (planKey: string, isThisLoading: boolean) => {
        if (isThisLoading) return "Processing...";
        if (planKey === "free") return "Start for free";

        const isCurrentCombination = isCurrentPlanAndCycle(planKey);
        if (isCurrentCombination) return "Current Plan";

        // Check if it's an upgrade, downgrade, or cycle switch
        const planOrder = { free: 0, starter: 1, pro: 2, agency: 3 };
        const currentOrder = planOrder[currentPlanId as keyof typeof planOrder] || 0;
        const targetOrder = planOrder[planKey as keyof typeof planOrder] || 0;

        if (planKey === currentPlanId) {
            // Same plan, different cycle
            return period === "annually" ? "Switch to Annual" : "Switch to Monthly";
        } else if (targetOrder > currentOrder) {
            return "Upgrade Plan";
        } else {
            return "Downgrade Plan";
        }
    };

    // Track pricing page view
    useEffect(() => {
        analytics.pricingViewed();
    }, []);

    const handleManageBilling = async () => {
        if (!workspace?.id) {
            toast.error("Workspace not found");
            return;
        }

        setIsBillingPortalLoading(true);

        try {
            const response = await creditsApi.getCustomerPortal(workspace.id);
            if (response.portalUrl) {
                window.open(response.portalUrl, "_blank");
            } else {
                throw new Error("No portal URL received");
            }
        } catch (error: any) {
            console.error("Billing portal error:", error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to open billing portal";
            toast.error(errorMessage);
        } finally {
            setIsBillingPortalLoading(false);
        }
    };

    const handleSelectPlan = async (planId: string, productId: string) => {
        if (!workspace?.id) {
            toast.error("Workspace not found");
            return;
        }

        const plan = plans[planId];
        const price = period === "annually" ? plan?.annually : plan?.monthly;

        // Track plan selection
        analytics.planSelected({
            planId,
            planName: plan?.name || planId,
            price: price || 0,
            billing: period === "annually" ? "yearly" : "monthly",
        });

        setIsLoading(true);
        setLoadingPlanId(planId);

        try {
            const response = await creditsApi.createCheckout(workspace.id, productId, {
                isSubscription: true,
                successUrl: `${window.location.origin}/checkout/success?workspace=${workspaceSlug}`,
                cancelUrl: `${window.location.origin}/checkout/cancel?workspace=${workspaceSlug}`,
            });

            if (response.checkoutUrl) {
                window.location.href = response.checkoutUrl;
            } else {
                throw new Error("No checkout URL received");
            }
        } catch (error: any) {
            console.error("Checkout error:", error);
            toast.error(error.response?.data?.error || "Failed to create checkout. Please try again.");
            setIsLoading(false);
            setLoadingPlanId(null);
        }
    };

    if (workspaceLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-5xl p-6">
                {/* Back Button */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="size-4 mr-2" />
                        Back
                    </Button>

                    {currentPlanId !== "free" && (
                        <Button
                            variant="outline"
                            onClick={handleManageBilling}
                            disabled={isBillingPortalLoading}
                        >
                            {isBillingPortalLoading ? (
                                <Loader2 className="size-4 mr-2 animate-spin" />
                            ) : (
                                <IconCreditCard className="size-4 mr-2" />
                            )}
                            Manage Billing
                        </Button>
                    )}
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <h1 className="text-balance text-3xl font-bold md:text-4xl lg:text-5xl lg:tracking-tight">
                        Simple pricing for every creator
                    </h1>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-balance text-lg">
                        Turn your long-form content into viral clips. No hidden fees, cancel anytime.
                    </p>

                    {/* Billing Toggle */}
                    <div className="my-12">
                        <div className="bg-foreground/5 relative mx-auto grid w-fit grid-cols-2 rounded-full p-1">
                            <motion.div
                                className="bg-card ring-foreground/5 pointer-events-none absolute inset-1 w-[calc(50%-4px)] rounded-full border border-transparent shadow ring-1"
                                animate={{ x: period === "monthly" ? 0 : "100%" }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                            <button
                                onClick={() => setPeriod("monthly")}
                                className={`relative z-10 block h-8 w-24 rounded-full text-sm transition-colors ${period === "monthly" ? "text-foreground font-medium" : "text-foreground/75 hover:opacity-75"
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setPeriod("annually")}
                                className={`relative z-10 block h-8 w-24 rounded-full text-sm transition-colors ${period === "annually" ? "text-foreground font-medium" : "text-foreground/75 hover:opacity-75"
                                    }`}
                            >
                                Annually
                            </button>
                        </div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-3 text-center text-xs"
                        >
                            <span className="text-primary font-medium">Save up to 50%</span> with annual billing
                        </motion.div>
                    </div>
                </motion.div>

                {/* Free plan removed notice */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8 rounded-xl border border-orange-500/30 bg-orange-500/10 px-5 py-4 text-sm text-orange-600 dark:text-orange-400 text-center"
                >
                    <span className="font-semibold">Free plan temporarily unavailable.</span>{" "}
                    Due to extremely high usage, we&apos;ve paused the free tier while we scale our infrastructure. Pick a paid plan to get started - all plans come with a full feature set.
                </motion.div>

                {/* Pricing Cards Container */}
                <div className="@container">
                    <div className="@max-4xl:max-w-sm relative mx-auto border">
                        {/* Corner decorations */}
                        <CornerDecoration position="top-left" />
                        <CornerDecoration position="top-right" />
                        <CornerDecoration position="bottom-left" />
                        <CornerDecoration position="bottom-right" />

                        {/* Main pricing cards */}
                        <div className="relative mx-auto border-b">
                            <CornerDecoration position="bottom-left" />
                            <div className="@4xl:grid-cols-3 grid">
                                {Object.entries(plans).map(([key, plan], index) => (
                                    <PricingCard
                                        key={key}
                                        planKey={key}
                                        plan={plan}
                                        period={period}
                                        index={index}
                                        onSelect={handleSelectPlan}
                                        isLoading={isLoading}
                                        loadingPlanId={loadingPlanId}
                                        isCurrentPlanAndCycle={isCurrentPlanAndCycle}
                                        getButtonText={getButtonText}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Enterprise section */}
                        <EnterpriseSection />
                    </div>
                </div>

                {/* FAQ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mt-20"
                >
                    <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
                    <div className="grid gap-4 max-w-2xl mx-auto">
                        {[
                            {
                                q: "Do my minutes expire?",
                                a: "Free plan minutes expire after 60 days from account creation. Paid plan (Starter & Pro) minutes reset every month and never expire while your subscription is active.",
                            },
                            {
                                q: "What happens to my videos when storage expires?",
                                a: "Videos are automatically deleted from our servers after the storage period ends - 15 days for Free, and 6 months for all paid plans. Download your clips before then.",
                            },
                            {
                                q: "Can I upgrade or downgrade anytime?",
                                a: "Yes. You can switch plans at any time. Upgrades take effect immediately. Downgrades apply at the end of your current billing cycle.",
                            },
                            {
                                q: "What counts as a minute?",
                                a: "1 minute of video processed = 1 minute deducted. A 10-minute YouTube video costs 10 minutes. Regenerating clips costs additional minutes.",
                            },
                            {
                                q: "What is the watermark on the Free plan?",
                                a: "Free plan clips include a small ScaleReach watermark in the corner. Upgrade to Starter or Pro to remove it.",
                            },
                            {
                                q: "Do unused monthly minutes roll over?",
                                a: "No. Monthly minutes reset at the start of each billing cycle and do not roll over.",
                            },
                        ].map(({ q, a }) => (
                            <div key={q} className="rounded-lg border bg-card p-5">
                                <p className="font-medium text-sm">{q}</p>
                                <p className="text-muted-foreground text-sm mt-1.5">{a}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-12">
                    Need more?{" "}
                    <a href="#" onClick={(e) => { e.preventDefault(); if (window.$crisp) window.$crisp.push(["do", "chat:open"]); }} className="text-primary hover:underline">
                        Let&apos;s talk!
                    </a>
                </p>
            </div>
        </div>
    );
}
