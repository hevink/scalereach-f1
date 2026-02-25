"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMinutesBalance } from "@/hooks/useMinutes";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { IconClock, IconPlus, IconTrendingUp, IconSparkles } from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CreditBalanceCardProps {
    workspaceSlug: string;
}

export function CreditBalanceCard({ workspaceSlug }: CreditBalanceCardProps) {
    const router = useRouter();
    const { data: workspace } = useWorkspaceBySlug(workspaceSlug);
    const { data: balance, isLoading } = useMinutesBalance(workspace?.id);

    const isAgency = workspace?.plan === "agency";

    const usagePercentage = !isAgency && balance?.minutesTotal
        ? Math.round((balance.minutesUsed / balance.minutesTotal) * 100)
        : 0;

    const remainingPercentage = 100 - usagePercentage;
    const isLow = !isAgency && remainingPercentage < 20;

    const resetDateFormatted = balance?.minutesResetDate
        ? new Date(balance.minutesResetDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
        : null;

    if (isLoading) {
        return (
            <Card className="border-border/50 shadow-sm">
                <CardHeader className="border-b border-border/50 bg-muted/20">
                    <CardTitle className="flex items-center gap-2">
                        <IconClock className="h-5 w-5" />
                        Minutes Balance
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
        <Card className="border-border/50 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

            <CardHeader className="relative border-b border-border/50 bg-muted/20 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                            <IconClock className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Minutes Remaining</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isAgency
                                    ? "Unlimited (Agency plan)"
                                    : resetDateFormatted
                                        ? `Resets ${resetDateFormatted}`
                                        : "One-time allocation"}
                            </p>
                        </div>
                    </div>
                    {!isAgency && (
                        <Button
                            size="sm"
                            className="gap-1.5 shadow-sm"
                            onClick={() => router.push(`/${workspaceSlug}/pricing`)}
                        >
                            <IconPlus className="h-4 w-4" />
                            Upgrade Plan
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="relative pt-6 pb-6">
                <div className="space-y-6">
                    {/* Main Balance Display */}
                    <div className="flex items-baseline gap-2">
                        <div className={cn(
                            "text-4xl font-bold bg-gradient-to-br bg-clip-text text-transparent",
                            isLow ? "from-rose-600 to-rose-400" : "from-foreground to-foreground/70"
                        )}>
                            {isAgency ? "∞" : (balance?.minutesRemaining || 0).toLocaleString()}
                        </div>
                        {!isAgency && (
                            <div className="text-sm text-muted-foreground font-medium">
                                / {(balance?.minutesTotal || 0).toLocaleString()} min
                            </div>
                        )}
                    </div>

                    {/* Progress Bar - hidden for agency */}
                    {!isAgency && balance?.minutesTotal && balance.minutesTotal > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Usage</span>
                                <span className="font-medium">{usagePercentage}% used</span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
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

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg border border-border/50 bg-emerald-500/5">
                            <div className="flex items-center gap-2 mb-1">
                                <IconTrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs text-muted-foreground font-medium">Total</span>
                            </div>
                            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                                {isAgency ? "∞" : `${(balance?.minutesTotal || 0).toLocaleString()} min`}
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border border-border/50 bg-rose-500/5">
                            <div className="flex items-center gap-2 mb-1">
                                <IconSparkles className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                                <span className="text-xs text-muted-foreground font-medium">Used</span>
                            </div>
                            <div className="text-lg font-bold text-rose-700 dark:text-rose-400">
                                {(balance?.minutesUsed || 0).toLocaleString()} min
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border border-border/50 bg-primary/5">
                            <div className="flex items-center gap-2 mb-1">
                                <IconClock className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs text-muted-foreground font-medium">Rate</span>
                            </div>
                            <div className="text-lg font-bold text-primary">
                                {usagePercentage}%
                            </div>
                        </div>
                    </div>

                    {/* Low minutes warning */}
                    {isLow && (
                        <p className="text-xs text-destructive">
                            Running low on minutes.{" "}
                            <a href={`/${workspaceSlug}/pricing`} className="underline font-medium">
                                Upgrade now
                            </a>
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
