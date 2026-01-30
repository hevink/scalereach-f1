"use client";

import {
    IconCoin,
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
import { useCreditBalance } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * Low credit threshold for warning display
 */
const LOW_CREDIT_THRESHOLD = 10;

export interface CreditBalanceProps {
    workspaceId: string;
    workspaceSlug: string;
    showWarning?: boolean;
    variant?: "compact" | "expanded";
    creditCost?: number;
    className?: string;
}

function formatBalance(balance: number): string {
    if (balance >= 1000) {
        return `${(balance / 1000).toFixed(1)}k`;
    }
    return balance.toString();
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
    balance,
    isLowBalance,
    showWarning,
    workspaceSlug,
    className,
}: {
    balance: number;
    isLowBalance: boolean;
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
                                isLowBalance && showWarning
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    : "bg-muted text-foreground"
                            )}
                        >
                            <IconCoin className="size-4" />
                            <span>{formatBalance(balance)}</span>
                            {isLowBalance && showWarning && (
                                <IconAlertTriangle className="size-3.5 text-amber-500" />
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            {balance} credits available
                            {isLowBalance && showWarning && " - Low balance!"}
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
                        Buy
                    </Button>
                </Link>
            </div>
        </TooltipProvider>
    );
}

function ExpandedCreditBalance({
    balance,
    lifetimeCredits,
    isLowBalance,
    showWarning,
    creditCost,
    workspaceSlug,
    className,
}: {
    balance: number;
    lifetimeCredits: number;
    isLowBalance: boolean;
    showWarning: boolean;
    creditCost?: number;
    workspaceSlug: string;
    className?: string;
}) {
    const hasEnoughCredits = creditCost === undefined || balance >= creditCost;
    const remainingAfterCost = creditCost !== undefined ? balance - creditCost : balance;

    return (
        <div
            className={cn(
                "flex flex-col gap-3 rounded-lg border p-4",
                isLowBalance && showWarning && "border-amber-500/50 bg-amber-500/5",
                className
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            "flex size-8 items-center justify-center rounded-full",
                            isLowBalance && showWarning
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-primary/10 text-primary"
                        )}
                    >
                        <IconCoin className="size-4" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                        Credit Balance
                    </span>
                </div>
                {isLowBalance && showWarning && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400">
                        <IconAlertTriangle className="mr-1 size-3" />
                        Low Balance
                    </Badge>
                )}
            </div>

            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{balance.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">credits</span>
            </div>

            {creditCost !== undefined && (
                <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-2.5">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Processing cost:</span>
                        <span className="font-medium">-{creditCost} credits</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">After processing:</span>
                        <span
                            className={cn(
                                "font-medium",
                                !hasEnoughCredits && "text-destructive"
                            )}
                        >
                            {remainingAfterCost.toLocaleString()} credits
                        </span>
                    </div>
                    {!hasEnoughCredits && (
                        <p className="mt-1 text-xs text-destructive">
                            Insufficient credits. Please purchase more to continue.
                        </p>
                    )}
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Lifetime credits used: {(lifetimeCredits - balance).toLocaleString()}
            </p>

            {isLowBalance && showWarning && (
                <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2.5 text-sm text-amber-600 dark:text-amber-400">
                    <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <p>
                        Your credit balance is running low. Purchase more credits to continue
                        processing videos without interruption.
                    </p>
                </div>
            )}

            <Link href={`/${workspaceSlug}/pricing`}>
                <Button className="w-full gap-2">
                    <IconPlus className="size-4" />
                    Buy Credits
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
    creditCost,
    className,
}: CreditBalanceProps) {
    const { data: creditData, isLoading, error } = useCreditBalance(workspaceId);

    if (isLoading) {
        return <CreditBalanceSkeleton variant={variant} />;
    }

    if (error || !creditData) {
        return (
            <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
                <IconCoin className="size-4" />
                <span className="text-sm">--</span>
            </div>
        );
    }

    const balance = creditData.balance;
    const lifetimeCredits = creditData.lifetimeCredits;
    const isLowBalance = balance < LOW_CREDIT_THRESHOLD;

    if (variant === "compact") {
        return (
            <CompactCreditBalance
                balance={balance}
                isLowBalance={isLowBalance}
                showWarning={showWarning}
                workspaceSlug={workspaceSlug}
                className={className}
            />
        );
    }

    return (
        <ExpandedCreditBalance
            balance={balance}
            lifetimeCredits={lifetimeCredits}
            isLowBalance={isLowBalance}
            showWarning={showWarning}
            creditCost={creditCost}
            workspaceSlug={workspaceSlug}
            className={className}
        />
    );
}

export default CreditBalance;
