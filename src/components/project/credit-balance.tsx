"use client";

import { useState } from "react";
import {
    IconCoin,
    IconAlertTriangle,
    IconPlus,
    IconExternalLink,
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
import { PricingDialog } from "@/components/pricing/pricing-dialog";

/**
 * Low credit threshold for warning display
 * @validates Requirement 27.3
 */
const LOW_CREDIT_THRESHOLD = 10;

/**
 * CreditBalanceProps interface
 *
 * @validates Requirements 27.1, 27.2, 27.3, 27.4, 27.5
 */
export interface CreditBalanceProps {
    /** The workspace ID to fetch credit balance for */
    workspaceId: string;
    /** Whether to show warning when balance is low */
    showWarning?: boolean;
    /** Display mode - compact for header, expanded for detailed view */
    variant?: "compact" | "expanded";
    /** Credit cost to display before processing (optional) */
    creditCost?: number;
    /** Additional className */
    className?: string;
}

/**
 * Format credit balance for display
 * @validates Requirement 27.1
 */
function formatBalance(balance: number): string {
    if (balance >= 1000) {
        return `${(balance / 1000).toFixed(1)}k`;
    }
    return balance.toString();
}

/**
 * CreditBalanceSkeleton Component
 *
 * Loading skeleton for credit balance display.
 */
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

/**
 * CompactCreditBalance Component
 *
 * Compact display for header showing current balance with optional warning.
 *
 * @validates Requirements 27.1, 27.3, 27.4
 */
function CompactCreditBalance({
    balance,
    isLowBalance,
    showWarning,
    workspaceId,
    className,
}: {
    balance: number;
    isLowBalance: boolean;
    showWarning: boolean;
    workspaceId: string;
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

                {/* Buy Credits Button - Requirement 27.4 */}
                <PricingDialog
                    workspaceId={workspaceId}
                    trigger={
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                        >
                            <IconPlus className="size-3" />
                            Buy
                        </Button>
                    }
                />
            </div>
        </TooltipProvider>
    );
}

/**
 * ExpandedCreditBalance Component
 *
 * Expanded display showing detailed credit information with cost preview.
 *
 * @validates Requirements 27.1, 27.2, 27.3, 27.4
 */
function ExpandedCreditBalance({
    balance,
    lifetimeCredits,
    isLowBalance,
    showWarning,
    creditCost,
    workspaceId,
    className,
}: {
    balance: number;
    lifetimeCredits: number;
    isLowBalance: boolean;
    showWarning: boolean;
    creditCost?: number;
    workspaceId: string;
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
            {/* Header with icon and warning */}
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
                {/* Low balance warning badge - Requirement 27.3 */}
                {isLowBalance && showWarning && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400">
                        <IconAlertTriangle className="mr-1 size-3" />
                        Low Balance
                    </Badge>
                )}
            </div>

            {/* Current Balance - Requirement 27.1 */}
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{balance.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">credits</span>
            </div>

            {/* Credit Cost Preview - Requirement 27.2 */}
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

            {/* Lifetime credits info */}
            <p className="text-xs text-muted-foreground">
                Lifetime credits used: {(lifetimeCredits - balance).toLocaleString()}
            </p>

            {/* Low balance warning message - Requirement 27.3 */}
            {isLowBalance && showWarning && (
                <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2.5 text-sm text-amber-600 dark:text-amber-400">
                    <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <p>
                        Your credit balance is running low. Purchase more credits to continue
                        processing videos without interruption.
                    </p>
                </div>
            )}

            {/* Buy Credits Button - Requirement 27.4 */}
            <PricingDialog
                workspaceId={workspaceId}
                trigger={
                    <Button className="w-full gap-2">
                        <IconPlus className="size-4" />
                        Buy Credits
                        <IconExternalLink className="size-3.5" />
                    </Button>
                }
            />
        </div>
    );
}

/**
 * CreditBalance Component
 *
 * A credit balance display component that shows:
 * - Current balance in header (Requirement 27.1)
 * - Credit cost before processing (Requirement 27.2)
 * - Warning when below 10 credits (Requirement 27.3)
 * - Link to purchase credits (Requirement 27.4)
 * - Updates after processing starts (Requirement 27.5)
 *
 * Supports two display modes:
 * - `compact`: Minimal display for header/navigation
 * - `expanded`: Detailed view with cost preview and warnings
 *
 * @example
 * ```tsx
 * // Compact mode for header
 * <CreditBalance
 *   workspaceId="workspace-123"
 *   variant="compact"
 * />
 *
 * // Expanded mode with cost preview
 * <CreditBalance
 *   workspaceId="workspace-123"
 *   variant="expanded"
 *   creditCost={5}
 *   showWarning
 * />
 * ```
 *
 * @validates Requirements 27.1, 27.2, 27.3, 27.4, 27.5
 */
export function CreditBalance({
    workspaceId,
    showWarning = true,
    variant = "compact",
    creditCost,
    className,
}: CreditBalanceProps) {
    /**
     * Fetch credit balance data
     * Uses React Query for automatic updates after processing (Requirement 27.5)
     */
    const { data: creditData, isLoading, error } = useCreditBalance(workspaceId);

    // Loading state
    if (isLoading) {
        return <CreditBalanceSkeleton variant={variant} />;
    }

    // Error state - show minimal fallback
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

    // Render based on variant
    if (variant === "compact") {
        return (
            <CompactCreditBalance
                balance={balance}
                isLowBalance={isLowBalance}
                showWarning={showWarning}
                workspaceId={workspaceId}
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
            workspaceId={workspaceId}
            className={className}
        />
    );
}

export default CreditBalance;
