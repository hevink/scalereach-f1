"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconInfoCircle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
    features: PlanFeature[];
    highlighted?: boolean;
    polarProductIdMonthly?: string;
    polarProductIdYearly?: string;
}

// ============================================================================
// Pricing Data
// ============================================================================

const plans: PricingPlan[] = [
    {
        id: "starter",
        name: "ScaleReach",
        monthlyPrice: 29,
        yearlyPrice: 17,
        features: [
            { text: "Upload 10 videos monthly", tooltip: "Maximum 10 videos per month" },
            { text: "Up to 45 minutes long videos", tooltip: "Each video can be up to 45 minutes" },
            { text: "Generate 100 clips monthly", highlighted: true, tooltip: "AI generates up to 100 viral clips" },
            { text: "HD download", tooltip: "Download clips in 1080p HD quality" },
        ],
        polarProductIdMonthly: "starter_monthly",
        polarProductIdYearly: "starter_yearly",
    },
    {
        id: "pro",
        name: "ScaleReach",
        badge: "Pro",
        monthlyPrice: 79,
        yearlyPrice: 47,
        features: [
            { text: "Upload 30 videos monthly", tooltip: "Maximum 30 videos per month" },
            { text: "Up to 2 hours long videos", tooltip: "Each video can be up to 2 hours" },
            { text: "Generate 300 clips monthly", highlighted: true, tooltip: "AI generates up to 300 viral clips" },
            { text: "4K download", tooltip: "Download clips in 4K ultra HD quality" },
            { text: "Translate to 29 languages (AI Dubbing)", tooltip: "AI-powered dubbing in 29 languages" },
        ],
        highlighted: true,
        polarProductIdMonthly: "pro_monthly",
        polarProductIdYearly: "pro_yearly",
    },
    {
        id: "pro-plus",
        name: "ScaleReach",
        badge: "Pro+",
        monthlyPrice: 189,
        yearlyPrice: 113,
        features: [
            { text: "Upload 100 videos monthly", tooltip: "Maximum 100 videos per month" },
            { text: "Up to 3 hours long videos", tooltip: "Each video can be up to 3 hours" },
            { text: "Generate 1000 clips monthly", highlighted: true, tooltip: "AI generates up to 1000 viral clips" },
            { text: "4K download", tooltip: "Download clips in 4K ultra HD quality" },
            { text: "Translate to 29 languages (AI Dubbing)", tooltip: "AI-powered dubbing in 29 languages" },
        ],
        polarProductIdMonthly: "pro_plus_monthly",
        polarProductIdYearly: "pro_plus_yearly",
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
    onSelect,
}: {
    plan: PricingPlan;
    isYearly: boolean;
    onSelect: (planId: string) => void;
}) {
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

    return (
        <div
            className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-all",
                plan.highlighted
                    ? "bg-zinc-900 text-white border-zinc-800 shadow-2xl scale-105 z-10"
                    : "bg-card border-border hover:border-primary/30"
            )}
        >
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
                Billed {isYearly ? "yearly" : "monthly"}
            </p>

            {/* CTA Button */}
            <Button
                onClick={() => onSelect(plan.id)}
                variant={plan.highlighted ? "secondary" : "outline"}
                className={cn(
                    "w-full mb-8",
                    plan.highlighted
                        ? "bg-white text-zinc-900 hover:bg-zinc-100"
                        : ""
                )}
            >
                Get Started
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

// ============================================================================
// Main Page
// ============================================================================

export default function PricingPage() {
    const router = useRouter();
    const [isYearly, setIsYearly] = useState(true);

    const handleSelectPlan = (planId: string) => {
        // TODO: Integrate with Polar checkout
        console.log("Selected plan:", planId, "Yearly:", isYearly);
        router.push("/sign-up");
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-16 md:py-24">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Plans
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        No hidden fees. Cancel anytime.
                    </p>
                </div>

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
                            onSelect={handleSelectPlan}
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
