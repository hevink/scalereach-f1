"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
    IconCreditCard,
    IconHistory,
    IconExternalLink,
    IconCheck,
    IconTrendingUp,
    IconInfoCircle,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { useCreditBalance, useCreditTransactions } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";

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
            { text: "Upload 10 videos monthly" },
            { text: "Up to 45 minutes long videos" },
            { text: "Generate 100 clips monthly", highlighted: true },
            { text: "HD download" },
        ],
    },
    {
        id: "pro",
        name: "ScaleReach",
        badge: "Pro",
        monthlyPrice: 79,
        yearlyPrice: 47,
        features: [
            { text: "Upload 30 videos monthly" },
            { text: "Up to 2 hours long videos" },
            { text: "Generate 300 clips monthly", highlighted: true },
            { text: "4K download" },
            { text: "Translate to 29 languages (AI Dubbing)" },
        ],
        highlighted: true,
    },
    {
        id: "pro-plus",
        name: "ScaleReach",
        badge: "Pro+",
        monthlyPrice: 189,
        yearlyPrice: 113,
        features: [
            { text: "Upload 100 videos monthly" },
            { text: "Up to 3 hours long videos" },
            { text: "Generate 1000 clips monthly", highlighted: true },
            { text: "4K download" },
            { text: "Translate to 29 languages (AI Dubbing)" },
        ],
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
        <div className="inline-flex items-center rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 p-1">
            <button
                onClick={() => onToggle(false)}
                className={cn(
                    "rounded-full px-5 py-2 text-sm font-medium transition-all",
                    !isYearly
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                )}
            >
                Monthly
            </button>
            <button
                onClick={() => onToggle(true)}
                className={cn(
                    "rounded-full px-5 py-2 text-sm font-medium transition-all flex items-center gap-2",
                    isYearly
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                )}
            >
                Yearly
                <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-0 text-xs">
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
                feature.highlighted ? "bg-emerald-500/10" : "bg-zinc-200 dark:bg-zinc-700"
            )}>
                <IconCheck className={cn(
                    "size-3",
                    feature.highlighted ? "text-emerald-500" : "text-zinc-500 dark:text-zinc-400"
                )} />
            </div>
            <span className={cn(
                "text-sm flex-1",
                feature.highlighted ? "text-zinc-900 dark:text-white font-medium" : "text-zinc-600 dark:text-zinc-400"
            )}>
                {feature.text}
            </span>
            {feature.tooltip && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <IconInfoCircle className="size-4 text-zinc-400 dark:text-zinc-500 shrink-0 cursor-help" />
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
}: {
    plan: PricingPlan;
    isYearly: boolean;
    isCurrentPlan?: boolean;
    onSelect: (planId: string) => void;
}) {
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

    return (
        <div
            className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-all",
                plan.highlighted
                    ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 shadow-2xl scale-105 z-10"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
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
                    plan.highlighted ? "bg-zinc-900/10 dark:bg-white/10" : "bg-zinc-100 dark:bg-zinc-800"
                )}>
                    <svg className="size-5 text-zinc-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>
                <span className="text-lg font-semibold text-zinc-900 dark:text-white">{plan.name}</span>
                {plan.badge && (
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">{plan.badge}</span>
                )}
            </div>

            {/* Price */}
            <div className="mb-2">
                <span className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">${price}</span>
                <span className="text-lg text-zinc-500 dark:text-zinc-400">/month</span>
            </div>

            {/* Billing info */}
            <p className="text-sm mb-6 text-zinc-500 dark:text-zinc-400">
                Billed {isYearly ? "yearly" : "monthly"}
            </p>

            {/* CTA Button */}
            <Button
                onClick={() => onSelect(plan.id)}
                variant={plan.highlighted ? "secondary" : "outline"}
                disabled={isCurrentPlan}
                className={cn(
                    "w-full mb-8",
                    plan.highlighted
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
                        : "border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
            >
                {isCurrentPlan ? "Current Plan" : "Upgrade"}
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

function UsageCard({ workspaceId }: { workspaceId: string }) {
    const { data: balance, isLoading } = useCreditBalance(workspaceId);

    const currentBalance = balance?.balance ?? 0;
    const lifetimeCredits = balance?.lifetimeCredits ?? 100;
    const usedCredits = lifetimeCredits - currentBalance;
    const usagePercent = lifetimeCredits > 0 ? (usedCredits / lifetimeCredits) * 100 : 0;

    return (
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
                    <IconTrendingUp className="size-5" />
                    Credit Balance
                </CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">
                    Your available credits for clip generation
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                        <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500 dark:text-zinc-400">Credits Used</span>
                            <span className="text-zinc-900 dark:text-white font-medium">
                                {usedCredits} / {lifetimeCredits}
                            </span>
                        </div>
                        <Progress value={usagePercent} className="h-2 bg-zinc-200 dark:bg-zinc-800" />
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">
                            {currentBalance} credits remaining
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TransactionHistoryCard({ workspaceId }: { workspaceId: string }) {
    const { data: transactions, isLoading } = useCreditTransactions(workspaceId);

    return (
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
                    <IconHistory className="size-5" />
                    Recent Activity
                </CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">
                    Your recent billing and usage activity
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : transactions && transactions.length > 0 ? (
                    <div className="space-y-3">
                        {transactions.slice(0, 5).map((tx) => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between py-2 border-b border-zinc-200 dark:border-zinc-800 last:border-0"
                            >
                                <div>
                                    <p className="text-sm text-zinc-900 dark:text-white">{tx.description}</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                        {new Date(tx.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={cn(
                                    "text-sm font-medium",
                                    tx.amount > 0 ? "text-emerald-500" : "text-zinc-500 dark:text-zinc-400"
                                )}>
                                    {tx.amount > 0 ? "+" : ""}{tx.amount} credits
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 text-center py-4">
                        No recent activity
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function ManageBillingCard() {
    return (
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
                    <IconCreditCard className="size-5" />
                    Payment Method
                </CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">
                    Manage your payment methods and billing information
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    variant="outline"
                    className="w-full border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                    <IconExternalLink className="size-4 mr-2" />
                    Manage Billing
                </Button>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Main Page
// ============================================================================

export default function BillingPage() {
    const params = useParams();
    const workspaceSlug = params["workspace-slug"] as string;
    const { data: workspace } = useWorkspaceBySlug(workspaceSlug);
    const [isYearly, setIsYearly] = useState(true);

    const currentPlanId = workspace?.plan ?? "starter";

    const handleSelectPlan = (planId: string) => {
        // TODO: Integrate with Polar checkout
        console.log("Selected plan:", planId, "Yearly:", isYearly);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Billing</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Manage your subscription and billing information
                </p>
            </div>

            {/* Usage & Activity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UsageCard workspaceId={workspace?.id ?? ""} />
                <TransactionHistoryCard workspaceId={workspace?.id ?? ""} />
            </div>

            {/* Manage Billing */}
            <ManageBillingCard />

            {/* Plans Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Plans</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Choose the plan that works best for you
                        </p>
                    </div>
                    <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {plans.map((plan) => (
                        <PricingCard
                            key={plan.id}
                            plan={plan}
                            isYearly={isYearly}
                            isCurrentPlan={plan.id === currentPlanId}
                            onSelect={handleSelectPlan}
                        />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
                Need more?{" "}
                <a href="mailto:support@scalereach.com" className="text-emerald-500 hover:underline">
                    Let&apos;s talk!
                </a>
            </p>
        </div>
    );
}