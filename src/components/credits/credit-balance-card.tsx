"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreditBalance } from "@/hooks/useCredits";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { IconCoins, IconPlus, IconTrendingUp, IconSparkles } from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CreditBalanceCardProps {
    workspaceSlug: string;
}

export function CreditBalanceCard({ workspaceSlug }: CreditBalanceCardProps) {
    const router = useRouter();
    const { data: workspace } = useWorkspaceBySlug(workspaceSlug);
    const { data: balance, isLoading } = useCreditBalance(workspace?.id);

    const usedCredits = (balance?.lifetimeCredits || 0) - (balance?.balance || 0);
    const usagePercentage = balance?.lifetimeCredits
        ? Math.round((usedCredits / balance.lifetimeCredits) * 100)
        : 0;

    if (isLoading) {
        return (
            <Card className="border-border/50 shadow-sm">
                <CardHeader className="border-b border-border/50 bg-muted/20">
                    <CardTitle className="flex items-center gap-2">
                        <IconCoins className="h-5 w-5" />
                        Credit Balance
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-48" />
                        <div className="grid grid-cols-3 gap-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

            <CardHeader className="relative border-b border-border/50 bg-muted/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                            <IconCoins className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Credit Balance</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Your available credits
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        className="gap-1.5 shadow-sm"
                        onClick={() => router.push(`/${workspaceSlug}/pricing`)}
                    >
                        <IconPlus className="h-4 w-4" />
                        Buy Credits
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="relative pt-6 pb-6">
                <div className="space-y-6">
                    {/* Main Balance Display */}
                    <div className="flex items-baseline gap-2">
                        <div className="text-5xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {(balance?.balance || 0).toLocaleString()}
                        </div>
                        <div className="text-muted-foreground font-medium">credits</div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Lifetime Credits */}
                        <div className="relative group">
                            <div className={cn(
                                "p-4 rounded-xl border border-border/50 bg-gradient-to-br transition-all duration-200",
                                "from-emerald-500/5 to-emerald-500/0",
                                "hover:from-emerald-500/10 hover:to-emerald-500/5 hover:border-emerald-500/20"
                            )}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10">
                                        <IconTrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                                    {(balance?.lifetimeCredits || 0).toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">
                                    Lifetime Credits
                                </div>
                            </div>
                        </div>

                        {/* Used Credits */}
                        <div className="relative group">
                            <div className={cn(
                                "p-4 rounded-xl border border-border/50 bg-gradient-to-br transition-all duration-200",
                                "from-rose-500/5 to-rose-500/0",
                                "hover:from-rose-500/10 hover:to-rose-500/5 hover:border-rose-500/20"
                            )}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500/10">
                                        <IconSparkles className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 mb-1">
                                    {usedCredits.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">
                                    Credits Used
                                </div>
                            </div>
                        </div>

                        {/* Usage Percentage */}
                        <div className="relative group">
                            <div className={cn(
                                "p-4 rounded-xl border border-border/50 bg-gradient-to-br transition-all duration-200",
                                "from-primary/5 to-primary/0",
                                "hover:from-primary/10 hover:to-primary/5 hover:border-primary/20"
                            )}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                                        <IconCoins className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-primary mb-1">
                                    {usagePercentage}%
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">
                                    Usage Rate
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {balance?.lifetimeCredits && balance.lifetimeCredits > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Credit Usage</span>
                                <span className="font-medium">{usagePercentage}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-500 ease-out",
                                        usagePercentage > 80
                                            ? "bg-gradient-to-r from-rose-500 to-rose-600"
                                            : usagePercentage > 50
                                                ? "bg-gradient-to-r from-amber-500 to-amber-600"
                                                : "bg-gradient-to-r from-emerald-500 to-emerald-600"
                                    )}
                                    style={{ width: `${usagePercentage}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
