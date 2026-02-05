"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconCheck, IconInfoCircle, IconLoader2, IconArrowLeft } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { creditsApi } from "@/lib/api/credits";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { useCreditBalance } from "@/hooks/useCredits";
import { toast } from "sonner";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

interface PlanFeature {
    text: string;
    tooltip?: string;
    highlighted?: boolean;
}

interface PricingPlan {
    id: string;
    name: string;
    badge?: string;
    monthlyPrice: number;
    yearlyPrice: number;
    monthlyCredits: number;
    features: PlanFeature[];
    highlighted?: boolean;
    dodoProductIdMonthly: string;
    dodoProductIdYearly: string;
}

// ============================================================================
// Pricing Data - Update these with your Dodo Payments product IDs
// ============================================================================

const plans: PricingPlan[] = [
    {
        id: "starter",
        name: "ScaleReach",
        monthlyPrice: 29,
        yearlyPrice: 17,
        monthlyCredits: 100,
        features: [
            { text: "Upload 10 videos monthly", tooltip: "Maximum 10 videos per month" },
            { text: "Up to 45 minutes long videos", tooltip: "Each video can be up to 45 minutes" },
            { text: "Generate 100 clips monthly", highlighted: true, tooltip: "AI generates up to 100 viral clips" },
            { text: "HD download", tooltip: "Download clips in 1080p HD quality" },
        ],
        dodoProductIdMonthly: "pdt_0NXOu8euwYE6EmEoLs6eQ",
        dodoProductIdYearly: "pdt_starter_yearly", // TODO: Create in Dodo dashboard
    },
    {
        id: "pro",
        name: "ScaleReach",
        badge: "Pro",
        monthlyPrice: 79,
        yearlyPrice: 47,
        monthlyCredits: 300,
        features: [
            { text: "Upload 30 videos monthly", tooltip: "Maximum 30 videos per month" },
            { text: "Up to 2 hours long videos", tooltip: "Each video can be up to 2 hours" },
            { text: "Generate 300 clips monthly", highlighted: true, tooltip: "AI generates up to 300 viral clips" },
            { text: "4K download", tooltip: "Download clips in 4K ultra HD quality" },
            { text: "Translate to 29 languages (AI Dubbing)", tooltip: "AI-powered dubbing in 29 languages" },
        ],
        highlighted: true,
        dodoProductIdMonthly: "pdt_pro_monthly", // TODO: Create in Dodo dashboard
        dodoProductIdYearly: "pdt_pro_yearly",   // TODO: Create in Dodo dashboard
    },
    {
        id: "pro-plus",
        name: "ScaleReach",
        badge: "Pro+",
        monthlyPrice: 189,
        yearlyPrice: 113,
        monthlyCredits: 1000,
        features: [
            { text: "Upload 100 videos monthly", tooltip: "Maximum 100 videos per month" },
            { text: "Up to 3 hours long videos", tooltip: "Each video can be up to 3 hours" },
            { text: "Generate 1000 clips monthly", highlighted: true, tooltip: "AI generates up to 1000 viral clips" },
            { text: "4K download", tooltip: "Download clips in 4K ultra HD quality" },
            { text: "Translate to 29 languages (AI Dubbing)", tooltip: "AI-powered dubbing in 29 languages" },
        ],
        dodoProductIdMonthly: "pdt_pro_plus_monthly", // TODO: Create in Dodo dashboard
        dodoProductIdYearly: "pdt_pro_plus_yearly",   // TODO: Create in Dodo dashboard
    },
];

// ============================================================================
// Components
// ============================================================================

function BillingToggle({
    isYearly,
    onToggle,
}: {
    isYearly: boolean;
    onToggle: (yearly: boolean) => void;
}) {
    return (
        <div className="inline-flex items-center rounded-full border bg-muted/50 p-1">
            <button
                onClick={() => onToggle(false)}
                className={cn(
                    "rounded-full px-5 py-2 text-sm font-medium transition-all",
                    !isYearly
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Monthly
            </button>
            <button
                onClick={() => onToggle(true)}
                className={cn(
                    "rounded-full px-5 py-2 text-sm font-medium transition-all flex items-center gap-2",
                    isYearly
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Yearly
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-0 text-xs">
                    40% off
                </Badge>
            </button>
        </div>
    );
}

function FeatureItem({ feature }: { feature: PlanFeature }) {
    return (
        <li className="flex items-start gap-3">
            <div className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full mt-0.5",
                feature.highlighted
                    ? "bg-emerald-500/10"
                    : "bg-muted"
            )}>
                <IconCheck className={cn(
                    "size-3",
                    feature.highlighted ? "text-emerald-500" : "text-muted-foreground"
                )} />
            </div>
            <span className={cn(
                "text-sm flex-1",
                feature.highlighted ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
                {feature.text}
            </span>
            {feature.tooltip && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <IconInfoCircle className="size-4 text-muted-foreground/50 shrink-0 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{feature.tooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </li>
    );
}

function PricingCard({
    plan,
    isYearly,
    isCurrentPlan,
    onSelect,
    isLoading,
    loadingPlanId,
}: {
    plan: PricingPlan;
    isYearly: boolean;
    isCurrentPlan: boolean;
    onSelect: (planId: string, productId: string) => void;
    isLoading: boolean;
    loadingPlanId: string | null;
}) {
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const productId = isYearly ? plan.dodoProductIdYearly : plan.dodoProductIdMonthly;
    const isThisLoading = isLoading && loadingPlanId === plan.id;

    return (
        <div
            className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-all",
                plan.highlighted
                    ? "bg-zinc-900 text-white border-zinc-800 shadow-2xl scale-105 z-10"
                    : "bg-card border-border hover:border-primary/30"
            )}
        >
            {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                        Current Plan
                    </Badge>
                </div>
            )}

            {/* Plan Name */}
            <div className="flex items-center gap-2 mb-6">
                <div className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    plan.highlighted ? "bg-white/10" : "bg-muted"
                )}>
                    <svg
                        className={cn("size-5", plan.highlighted ? "text-white" : "text-foreground")}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>
                <span className={cn(
                    "text-lg font-semibold",
                    plan.highlighted ? "text-white" : "text-foreground"
                )}>
                    {plan.name}
                </span>
                {plan.badge && (
                    <span className={cn(
                        "text-sm",
                        plan.highlighted ? "text-zinc-400" : "text-muted-foreground"
                    )}>
                        {plan.badge}
                    </span>
                )}
            </div>

            {/* Price */}
            <div className="mb-2">
                <span className={cn(
                    "text-5xl font-bold tracking-tight",
                    plan.highlighted ? "text-white" : "text-foreground"
                )}>
                    ${price}
                </span>
                <span className={cn(
                    "text-lg",
                    plan.highlighted ? "text-zinc-400" : "text-muted-foreground"
                )}>
                    /month
                </span>
            </div>

            {/* Billing info */}
            <p className={cn(
                "text-sm mb-6",
                plan.highlighted ? "text-zinc-400" : "text-muted-foreground"
            )}>
                Billed {isYearly ? "yearly" : "monthly"} • {plan.monthlyCredits} credits/month
            </p>

            {/* CTA Button */}
            <Button
                onClick={() => onSelect(plan.id, productId)}
                disabled={isCurrentPlan || isLoading}
                variant={plan.highlighted ? "secondary" : "outline"}
                className={cn(
                    "w-full mb-8",
                    plan.highlighted
                        ? "bg-white text-zinc-900 hover:bg-zinc-100"
                        : ""
                )}
            >
                {isThisLoading ? (
                    <>
                        <IconLoader2 className="size-4 mr-2 animate-spin" />
                        Processing...
                    </>
                ) : isCurrentPlan ? (
                    "Current Plan"
                ) : (
                    "Subscribe"
                )}
            </Button>

            {/* Features */}
            <ul className="space-y-4 flex-1">
                {plan.features.map((feature, index) => (
                    <FeatureItem key={index} feature={feature} />
                ))}
            </ul>
        </div>
    );
}

function CurrentPlanBanner({
    plan,
    credits,
    workspaceSlug
}: {
    plan: PricingPlan | undefined;
    credits: number;
    workspaceSlug: string;
}) {
    if (!plan) return null;

    return (
        <div className="bg-muted/50 border rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                    <h2 className="text-2xl font-bold">
                        {plan.name} {plan.badge && <span className="text-muted-foreground">{plan.badge}</span>}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        {credits} credits remaining • {plan.monthlyCredits} credits/month
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href={`/${workspaceSlug}/settings/billing`}>
                        <Button variant="outline">
                            Manage Billing
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
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
    const { data: creditBalance } = useCreditBalance(workspace?.id ?? "");

    const [isYearly, setIsYearly] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

    const currentPlanId = workspace?.plan ?? "free";
    const currentPlan = plans.find(p => p.id === currentPlanId);
    const currentCredits = creditBalance?.balance ?? 0;

    const handleSelectPlan = async (planId: string, productId: string) => {
        if (!workspace?.id) {
            toast.error("Workspace not found");
            return;
        }

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
                <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 md:py-16">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => router.back()}
                >
                    <IconArrowLeft className="size-4 mr-2" />
                    Back
                </Button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Upgrade your workspace to unlock more features
                    </p>
                </div>

                {/* Current Plan Banner */}
                {currentPlan && (
                    <CurrentPlanBanner
                        plan={currentPlan}
                        credits={currentCredits}
                        workspaceSlug={workspaceSlug}
                    />
                )}

                {/* Billing Toggle */}
                <div className="flex justify-center mb-12">
                    <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
                    {plans.map((plan) => (
                        <PricingCard
                            key={plan.id}
                            plan={plan}
                            isYearly={isYearly}
                            isCurrentPlan={plan.id === currentPlanId}
                            onSelect={handleSelectPlan}
                            isLoading={isLoading}
                            loadingPlanId={loadingPlanId}
                        />
                    ))}
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-12">
                    Need more?{" "}
                    <a href="mailto:support@scalereach.com" className="text-primary hover:underline">
                        Let&apos;s talk!
                    </a>
                </p>
            </div>
        </div>
    );
}
