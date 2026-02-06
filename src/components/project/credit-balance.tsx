"use client";

import {
    IconClock,
    IconAlertTriangle,
    IconPlus,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMinutesBalance } from "@/hooks/useMinutes";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface CreditBalanceProps {
    workspaceId: string;
    workspaceSlug: string;
    showWarning?: boolean;
    variant?: "compact" | "expanded";
    minuteCost?: number;
    className?: string;
}

function formatBalance(minutes: number): string {
    if (minutes >= 1000) {
        return `${(minutes / 1000).toFixed(1)}k`;
    }
    return minutes.toString();
}

function CreditBalanceSkeleton({ variant }: { variant: "compact" | "expanded" }) {
    if (variant === "compact") {
        return (
            <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-full" />
                <Skeleton className="h-4 w-12" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
        </div>
    );
}

function CompactCreditBalance({
    minutesRemaining,
    isLow,
    showWarning,
    workspaceSlug,
    className,
}: {
    minutesRemaining: number;
    isLow: boolean;
    showWarning: boolean;
    workspaceSlug: string;
    className?: string;
}) {
    return (
        <TooltipProvider>
            <div className={cn("flex items-center gap-2", className)}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium transition-colors",
                                isLow && showWarning
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    : "bg-muted text-foreground"
                            )}
                        >
                            <IconClock className="size-4" />
                            <span>{formatBalance(minutesRemaining)} min</span>
                            {isLow && showWarning && (
                                <IconAlertTriangle className="size-3.5 text-amber-500" />
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            {minutesRemaining} minutes remaining
                            {isLow && showWarning && " - Running low!"}
                        </p>
                    </TooltipContent>
                </Tooltip>

                <Link href={`/${workspaceSlug}/pricing`}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                    >
                        <IconPlus className="size-3" />
                        Upgrade
                    </Button>
                </Link>
            </div>
        </TooltipProvider>
    );
}

function ExpandedCreditBalance({
    minutesRemaining,
    minutesTotal,
    isLow,
    showWarning,
    minuteCost,
    workspaceSlug,
    className,
}: {
    minutesRemaining: number;
    minutesTotal: number;
    isLow: boolean;
    showWarning: boolean;
    minuteCost?: number;
    workspaceSlug: string;
    className?: string;
}) {
    const hasEnoughMinutes = minuteCost === undefined || minutesRemaining >= minuteCost;
    const remainingAfterCost = minuteCost !== undefined ? minutesRemaining - minuteCost : minutesRemaining;

    return (
        <div
            className={cn(
                "flex flex-col gap-3 rounded-lg border p-4",
                isLow && showWarning && "border-amber-500/50 bg-amber-500/5",
                className
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            "flex size-8 items-center justify-center rounded-full",
                            isLow && showWarning
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-primary/10 text-primary"
                        )}
                    >
                        <IconClock className="size-4" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                        Minutes Remaining
                    </span>
                </div>
                {isLow && showWarning && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400">
                        <IconAlertTriangle className="mr-1 size-3" />
                        Low Minutes
                    </Badge>
                )}
            </div>

            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{minutesRemaining.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">/ {minutesTotal.toLocaleString()} min</span>
            </div>

            {minuteCost !== undefined && (
                <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-2.5">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">This will use:</span>
                        <span className="font-medium">-{minuteCost} min</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">After processing:</span>
                        <span
                            className={cn(
                                "font-medium",
                                !hasEnoughMinutes && "text-destructive"
                            )}
                        >
                            {remainingAfterCost.toLocaleString()} min
                        </span>
                    </div>
                    {!hasEnoughMinutes && (
                        <p className="mt-1 text-xs text-destructive">
                            Insufficient minutes. Please upgrade your plan to continue.
                        </p>
                    )}
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Minutes used: {(minutesTotal - minutesRemaining).toLocaleString()} of {minutesTotal.toLocaleString()}
            </p>

            {isLow && showWarning && (
                <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2.5 text-sm text-amber-600 dark:text-amber-400">
                    <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <p>
                        Your minutes are running low. Upgrade your plan to continue
                        processing videos without interruption.
                    </p>
                </div>
            )}

            <Link href={`/${workspaceSlug}/pricing`}>
                <Button className="w-full gap-2">
                    <IconPlus className="size-4" />
                    Upgrade Plan
                </Button>
            </Link>
        </div>
    );
}

export function CreditBalance({
    workspaceId,
    workspaceSlug,
    showWarning = true,
    variant = "compact",
    minuteCost,
    className,
}: CreditBalanceProps) {
    const { data: minutesData, isLoading, error } = useMinutesBalance(workspaceId);

    if (isLoading) {
        return <CreditBalanceSkeleton variant={variant} />;
    }

    if (error || !minutesData) {
        return (
            <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
                <IconClock className="size-4" />
                <span className="text-sm">--</span>
            </div>
        );
    }

    const minutesRemaining = minutesData.minutesRemaining;
    const minutesTotal = minutesData.minutesTotal;
    const isLow = minutesTotal > 0 && (minutesRemaining / minutesTotal) < 0.2;

    if (variant === "compact") {
        return (
            <CompactCreditBalance
                minutesRemaining={minutesRemaining}
                isLow={isLow}
                showWarning={showWarning}
                workspaceSlug={workspaceSlug}
                className={className}
            />
        );
    }

    return (
        <ExpandedCreditBalance
            minutesRemaining={minutesRemaining}
            minutesTotal={minutesTotal}
            isLow={isLow}
            showWarning={showWarning}
            minuteCost={minuteCost}
            workspaceSlug={workspaceSlug}
            className={className}
        />
    );
}

export default CreditBalance;
