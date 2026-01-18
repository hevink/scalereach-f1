"use client";

import { use } from "react";
import {
    IconCreditCard,
    IconSparkles,
    IconHistory,
    IconExternalLink,
    IconRocket,
    IconBuilding,
    IconCheck,
    IconTrendingUp,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { useCreditBalance, useCreditTransactions } from "@/hooks/useCredits";
import { PricingDialog } from "@/components/pricing/pricing-dialog";
import { creditsApi } from "@/lib/api/credits";
import { cn } from "@/lib/utils";

// Plan configurations
const planConfig = {
    free: {
        name: "Free",
        icon: IconSparkles,
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        limits: {
            videos: 5,
            videoLength: "30 min",
            clips: 20,
            download: "720p",
        },
    },
    pro: {
        name: "Pro",
        icon: IconRocket,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        limits: {
            videos: 30,
            videoLength: "2 hours",
            clips: 300,
            download: "4K",
        },
    },
    agency: {
        name: "Agency",
        icon: IconBuilding,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        limits: {
            videos: 100,
            videoLength: "3 hours",
            clips: 1000,
            download: "4K",
        },
    },
};

function CurrentPlanCard({ workspaceId, currentPlan = "free" }: { workspaceId?: string; currentPlan?: string }) {
    const plan = planConfig[currentPlan as keyof typeof planConfig] || planConfig.free;
    const PlanIcon = plan.icon;

    const handleManageBilling = async () => {
        if (!workspaceId) return;

        try {
            const { portalUrl } = await creditsApi.getCustomerPortal(workspaceId);
            window.open(portalUrl, "_blank");
        } catch (error) {
            toast.error("Failed to open billing portal");
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("flex size-10 items-center justify-center rounded-lg", plan.bgColor)}>
                            <PlanIcon className={cn("size-5", plan.color)} />
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {plan.name} Plan
                                {currentPlan !== "free" && (
                                    <Badge variant="secondary" className="text-xs">Active</Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {currentPlan === "free"
                                    ? "Upgrade to unlock more features"
                                    : "Your current subscription plan"}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {currentPlan !== "free" && (
                            <Button variant="outline" size="sm" onClick={handleManageBilling}>
                                <IconCreditCard className="size-4 mr-2" />
                                Manage Billing
                                <IconExternalLink className="size-3 ml-1" />
                            </Button>
                        )}
                        <PricingDialog
                            workspaceId={workspaceId}
                            currentPlan={currentPlan}
                            trigger={
                                <Button size="sm" variant={currentPlan === "free" ? "default" : "outline"}>
                                    <IconSparkles className="size-4 mr-2" />
                                    {currentPlan === "free" ? "Upgrade" : "Change Plan"}
                                </Button>
                            }
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Videos/month</span>
                        <span className="text-lg font-semibold">{plan.limits.videos}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Max length</span>
                        <span className="text-lg font-semibold">{plan.limits.videoLength}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Clips/month</span>
                        <span className="text-lg font-semibold">{plan.limits.clips}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Download</span>
                        <span className="text-lg font-semibold">{plan.limits.download}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function UsageCard({ workspaceId, currentPlan = "free" }: { workspaceId?: string; currentPlan?: string }) {
    const { data: balance, isLoading } = useCreditBalance(workspaceId);
    const plan = planConfig[currentPlan as keyof typeof planConfig] || planConfig.free;

    // Mock usage data - replace with actual usage tracking
    const usage = {
        videos: { used: 3, limit: plan.limits.videos },
        clips: { used: 45, limit: plan.limits.clips },
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IconTrendingUp className="size-5" />
                    Usage This Month
                </CardTitle>
                <CardDescription>Track your resource consumption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Videos uploaded</span>
                        <span className="font-medium">{usage.videos.used} / {usage.videos.limit}</span>
                    </div>
                    <Progress value={(usage.videos.used / usage.videos.limit) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Clips generated</span>
                        <span className="font-medium">{usage.clips.used} / {usage.clips.limit}</span>
                    </div>
                    <Progress value={(usage.clips.used / usage.clips.limit) * 100} className="h-2" />
                </div>
                {balance && (
                    <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Credit Balance</p>
                                <p className="text-2xl font-bold">{balance.balance.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Lifetime Credits</p>
                                <p className="text-lg font-medium text-muted-foreground">{balance.lifetimeCredits.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TransactionHistoryCard({ workspaceId }: { workspaceId?: string }) {
    const { data: transactions, isLoading } = useCreditTransactions(workspaceId, { limit: 5 });

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case "purchase":
                return <IconCreditCard className="size-4 text-green-500" />;
            case "usage":
                return <IconSparkles className="size-4 text-orange-500" />;
            case "bonus":
                return <IconSparkles className="size-4 text-blue-500" />;
            default:
                return <IconHistory className="size-4 text-muted-foreground" />;
        }
    };

    const getTransactionColor = (amount: number) => {
        return amount > 0 ? "text-green-600" : "text-orange-600";
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IconHistory className="size-5" />
                    Recent Transactions
                </CardTitle>
                <CardDescription>Your credit transaction history</CardDescription>
            </CardHeader>
            <CardContent>
                {!transactions || transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <IconHistory className="size-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No transactions yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div className="flex items-center gap-3">
                                    {getTransactionIcon(tx.type)}
                                    <div>
                                        <p className="text-sm font-medium">{tx.description || tx.type}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn("text-sm font-semibold", getTransactionColor(tx.amount))}>
                                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Balance: {tx.balanceAfter}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function PlanComparisonCard({ currentPlan = "free" }: { currentPlan?: string }) {
    const features = [
        { name: "Videos per month", free: "5", pro: "30", agency: "100" },
        { name: "Max video length", free: "30 min", pro: "2 hours", agency: "3 hours" },
        { name: "Clips per month", free: "20", pro: "300", agency: "1000" },
        { name: "Download quality", free: "720p", pro: "4K", agency: "4K" },
        { name: "AI Dubbing", free: false, pro: true, agency: true },
        { name: "Priority support", free: false, pro: true, agency: true },
        { name: "Custom integrations", free: false, pro: false, agency: true },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Plan Comparison</CardTitle>
                <CardDescription>Compare features across all plans</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 font-medium">Feature</th>
                                <th className={cn("text-center py-3 font-medium", currentPlan === "free" && "text-primary")}>Free</th>
                                <th className={cn("text-center py-3 font-medium", currentPlan === "pro" && "text-primary")}>Pro</th>
                                <th className={cn("text-center py-3 font-medium", currentPlan === "agency" && "text-primary")}>Agency</th>
                            </tr>
                        </thead>
                        <tbody>
                            {features.map((feature, index) => (
                                <tr key={index} className="border-b last:border-0">
                                    <td className="py-3 text-muted-foreground">{feature.name}</td>
                                    <td className="text-center py-3">
                                        {typeof feature.free === "boolean" ? (
                                            feature.free ? <IconCheck className="size-4 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>
                                        ) : (
                                            feature.free
                                        )}
                                    </td>
                                    <td className="text-center py-3">
                                        {typeof feature.pro === "boolean" ? (
                                            feature.pro ? <IconCheck className="size-4 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>
                                        ) : (
                                            feature.pro
                                        )}
                                    </td>
                                    <td className="text-center py-3">
                                        {typeof feature.agency === "boolean" ? (
                                            feature.agency ? <IconCheck className="size-4 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>
                                        ) : (
                                            feature.agency
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

export default function BillingPage({ params }: { params: Promise<{ "workspace-slug": string }> }) {
    const { "workspace-slug": slug } = use(params);
    const { data: workspace, isLoading } = useWorkspaceBySlug(slug);

    // TODO: Get actual plan from subscription data
    const currentPlan = "free";

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-48 w-full" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="flex flex-col gap-6">
                <h1 className="font-medium text-2xl">Workspace not found</h1>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="font-medium text-2xl">Billing & Plans</h1>
                <p className="text-muted-foreground text-sm">
                    Manage your subscription and view usage
                </p>
            </div>

            <CurrentPlanCard workspaceId={workspace.id} currentPlan={currentPlan} />

            <div className="grid md:grid-cols-2 gap-6">
                <UsageCard workspaceId={workspace.id} currentPlan={currentPlan} />
                <TransactionHistoryCard workspaceId={workspace.id} />
            </div>

            <PlanComparisonCard currentPlan={currentPlan} />
        </div>
    );
}
