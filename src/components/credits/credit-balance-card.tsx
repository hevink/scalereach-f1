"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMinutesBalance } from "@/hooks/useMinutes";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { IconClock, IconPlus, IconFlame, IconInfinity, IconCalendar } from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CreditBalanceCardProps {
    workspaceSlug: string;
}

function RadialProgress({ percentage, size = 120, strokeWidth = 10, isLow }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    isLow?: boolean;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

    const color = isLow ? "#f43f5e" : percentage > 70 ? "#f59e0b" : "#10b981";

    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/30"
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
        </svg>
    );
}

export function CreditBalanceCard({ workspaceSlug }: CreditBalanceCardProps) {
    const router = useRouter();
    const { data: workspace } = useWorkspaceBySlug(workspaceSlug);
    const { data: balance, isLoading } = useMinutesBalance(workspace?.id);

    const isAgency = workspace?.plan === "agency";
    const used = balance?.minutesUsed ?? 0;
    const total = balance?.minutesTotal ?? 0;
    const remaining = balance?.minutesRemaining ?? 0;
    const usagePercentage = !isAgency && total > 0 ? Math.round((used / total) * 100) : 0;
    const isLow = !isAgency && usagePercentage > 80;

    const resetDateFormatted = balance?.minutesResetDate
        ? new Date(balance.minutesResetDate).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
        })
        : null;

    if (isLoading) {
        return (
            <Card className="border-border/50">
                <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                        <Skeleton className="size-[120px] rounded-full shrink-0" />
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-8 w-28" />
                            <Skeleton className="h-4 w-52" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 shrink-0">
                            <Skeleton className="h-16 w-28 rounded-lg" />
                            <Skeleton className="h-16 w-28 rounded-lg" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn(
            "border-border/50 overflow-hidden",
            isLow && "border-rose-500/30"
        )}>
            <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-stretch">
                    {/* Left: radial + balance */}
                    <div className="flex items-center gap-5 p-6 flex-1">
                        {/* Radial chart */}
                        <div className="relative shrink-0">
                            {isAgency ? (
                                <div className="size-[120px] rounded-full border-10 border-primary/20 flex items-center justify-center">
                                    <IconInfinity className="size-8 text-primary" />
                                </div>
                            ) : (
                                <>
                                    <RadialProgress
                                        percentage={usagePercentage}
                                        size={120}
                                        strokeWidth={10}
                                        isLow={isLow}
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={cn(
                                            "text-xl font-bold tabular-nums leading-none",
                                            isLow ? "text-rose-500" : "text-foreground"
                                        )}>
                                            {usagePercentage}%
                                        </span>
                                        <span className="text-[10px] text-muted-foreground mt-0.5">used</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Balance text */}
                        <div className="space-y-1.5">
                            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                                <IconClock className="size-3.5" />
                                Minutes Remaining
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className={cn(
                                    "text-4xl font-bold tabular-nums tracking-tight",
                                    isLow ? "text-rose-500" : "text-foreground"
                                )}>
                                    {isAgency ? "∞" : remaining.toLocaleString()}
                                </span>
                                {!isAgency && (
                                    <span className="text-sm text-muted-foreground">
                                        / {total.toLocaleString()} min
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {isAgency ? (
                                    <span className="text-primary font-medium">Agency plan — unlimited</span>
                                ) : resetDateFormatted ? (
                                    <span className="flex items-center gap-1">
                                        <IconCalendar className="size-3" />
                                        Resets {resetDateFormatted}
                                    </span>
                                ) : (
                                    <span>One-time allocation</span>
                                )}
                                {isLow && (
                                    <span className="flex items-center gap-1 text-rose-500 font-medium">
                                        <IconFlame className="size-3" />
                                        Running low
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block w-px bg-border/50 my-4" />
                    <div className="block sm:hidden h-px bg-border/50 mx-6" />

                    {/* Right: stats + CTA */}
                    <div className="flex flex-col justify-center gap-3 p-6 sm:w-64">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Total</p>
                                <p className="text-sm font-bold tabular-nums">
                                    {isAgency ? "∞" : `${total.toLocaleString()}`}
                                    <span className="text-[10px] font-normal text-muted-foreground ml-1">min</span>
                                </p>
                            </div>
                            <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Used</p>
                                <p className="text-sm font-bold tabular-nums text-rose-500">
                                    {used.toLocaleString()}
                                    <span className="text-[10px] font-normal text-muted-foreground ml-1">min</span>
                                </p>
                            </div>
                        </div>
                        {!isAgency && (
                            <Button
                                size="sm"
                                className="w-full gap-1.5"
                                onClick={() => router.push(`/${workspaceSlug}/pricing`)}
                            >
                                <IconPlus className="size-3.5" />
                                Upgrade Plan
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
