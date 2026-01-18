"use client";

import { useState } from "react";
import { IconCheck, IconSparkles, IconRocket, IconBuilding } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { creditsApi } from "@/lib/api/credits";

interface PricingPlan {
    name: string;
    description: string;
    icon: React.ReactNode;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
    highlighted?: boolean;
    buttonText: string;
    polarProductIdMonthly?: string;
    polarProductIdYearly?: string;
}

const plans: PricingPlan[] = [
    {
        name: "Free",
        description: "Get started with basic features",
        icon: <IconSparkles className="size-5" />,
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
            "5 videos per month",
            "30 min max video length",
            "20 clips per month",
            "720p download",
            "Basic support",
        ],
        buttonText: "Current Plan",
    },
    {
        name: "Pro",
        description: "Perfect for content creators",
        icon: <IconRocket className="size-5" />,
        monthlyPrice: 29,
        yearlyPrice: 290,
        features: [
            "30 videos per month",
            "2 hours max video length",
            "300 clips per month",
            "4K download",
            "AI Dubbing (29 languages)",
            "Priority support",
        ],
        highlighted: true,
        buttonText: "Upgrade to Pro",
        polarProductIdMonthly: "pro_monthly_product_id",
        polarProductIdYearly: "pro_yearly_product_id",
    },
    {
        name: "Agency",
        description: "For teams and agencies",
        icon: <IconBuilding className="size-5" />,
        monthlyPrice: 99,
        yearlyPrice: 990,
        features: [
            "100 videos per month",
            "3 hours max video length",
            "1000 clips per month",
            "4K download",
            "AI Dubbing (29 languages)",
            "Dedicated account manager",
            "Custom integrations",
        ],
        buttonText: "Upgrade to Agency",
        polarProductIdMonthly: "agency_monthly_product_id",
        polarProductIdYearly: "agency_yearly_product_id",
    },
];

function PricingCard({
    plan,
    isYearly,
    onSelect,
    currentPlan,
    isLoading,
    loadingPlan,
}: {
    plan: PricingPlan;
    isYearly: boolean;
    onSelect: (plan: PricingPlan, isYearly: boolean) => void;
    currentPlan?: string;
    isLoading?: boolean;
    loadingPlan?: string;
}) {
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const isCurrentPlan = currentPlan?.toLowerCase() === plan.name.toLowerCase();
    const savings = isYearly && plan.monthlyPrice > 0
        ? Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)
        : 0;
    const isThisLoading = isLoading && loadingPlan === plan.name;

    return (
        <div
            className={cn(
                "relative flex flex-col rounded-xl border p-5",
                plan.highlighted
                    ? "border-primary bg-primary/5 shadow-lg ring-1 ring-primary/20"
                    : "border-border bg-card"
            )}
        >
            {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                        Most Popular
                    </span>
                </div>
            )}

            <div className="flex items-center gap-2 mb-1">
                <div className={cn(
                    "flex size-8 items-center justify-center rounded-lg shrink-0",
                    plan.highlighted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                    {plan.icon}
                </div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

            <div className="mb-5">
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${price}</span>
                    {price > 0 && (
                        <span className="text-muted-foreground text-sm">
                            /{isYearly ? "yr" : "mo"}
                        </span>
                    )}
                </div>
                {isYearly && savings > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Save {savings}% yearly
                    </p>
                )}
                {price === 0 && <p className="text-sm text-muted-foreground mt-1">Free forever</p>}
            </div>

            <ul className="flex-1 space-y-2.5 mb-5">
                {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                        <IconCheck className="size-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                variant={plan.highlighted ? "default" : "outline"}
                className="w-full"
                disabled={isCurrentPlan || plan.monthlyPrice === 0 || isLoading}
                loading={isThisLoading}
                onClick={() => onSelect(plan, isYearly)}
            >
                {isCurrentPlan ? "Current Plan" : plan.buttonText}
            </Button>
        </div>
    );
}

interface PricingDialogProps {
    trigger?: React.ReactNode;
    currentPlan?: string;
    workspaceId?: string;
    onSelectPlan?: (planName: string, productId: string, isYearly: boolean) => void;
}

export function PricingDialog({
    trigger,
    currentPlan = "free",
    workspaceId,
    onSelectPlan,
}: PricingDialogProps) {
    const [open, setOpen] = useState(false);
    const [isYearly, setIsYearly] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState<string>();

    const handleSelectPlan = async (plan: PricingPlan, yearly: boolean) => {
        const productId = yearly ? plan.polarProductIdYearly : plan.polarProductIdMonthly;

        if (!productId) {
            toast.error("This plan is not available yet");
            return;
        }

        // If external handler provided, use it
        if (onSelectPlan) {
            onSelectPlan(plan.name, productId, yearly);
            setOpen(false);
            return;
        }

        // Otherwise handle checkout internally
        if (!workspaceId) {
            toast.error("Please select a workspace first");
            return;
        }

        setIsLoading(true);
        setLoadingPlan(plan.name);

        try {
            const checkout = await creditsApi.createCheckout(workspaceId, productId);
            // Redirect to Polar checkout
            window.location.href = checkout.checkoutUrl;
        } catch (error: any) {
            toast.error(error.message || "Failed to start checkout");
            setIsLoading(false);
            setLoadingPlan(undefined);
        }
    };

    const defaultTrigger = (
        <Button variant="outline" size="sm">
            <IconSparkles className="size-4 mr-2" />
            Upgrade
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={trigger as React.ReactElement || defaultTrigger} />
            <DialogContent className="max-w-7xl! w-[95vw]! md:w-full p-0 gap-0 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="p-6 pb-4 text-center">
                    <DialogTitle className="text-2xl">Choose your plan</DialogTitle>
                    <DialogDescription>
                        Select the plan that best fits your needs. Upgrade or downgrade anytime.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-center gap-3 pb-4">
                    <Label
                        htmlFor="billing-toggle"
                        className={cn(
                            "text-sm cursor-pointer transition-colors",
                            !isYearly ? "text-foreground font-medium" : "text-muted-foreground"
                        )}
                    >
                        Monthly
                    </Label>
                    <Switch
                        id="billing-toggle"
                        checked={isYearly}
                        onCheckedChange={setIsYearly}
                    />
                    <Label
                        htmlFor="billing-toggle"
                        className={cn(
                            "text-sm cursor-pointer transition-colors flex items-center gap-1.5",
                            isYearly ? "text-foreground font-medium" : "text-muted-foreground"
                        )}
                    >
                        Yearly
                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600 dark:text-green-400 font-medium">
                            Save 17%
                        </span>
                    </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pt-2 bg-muted/30">
                    {plans.map((plan) => (
                        <PricingCard
                            key={plan.name}
                            plan={plan}
                            isYearly={isYearly}
                            onSelect={handleSelectPlan}
                            currentPlan={currentPlan}
                            isLoading={isLoading}
                            loadingPlan={loadingPlan}
                        />
                    ))}
                </div>

                <p className="text-center text-xs text-muted-foreground p-4 border-t">
                    All plans include a 14-day free trial. No credit card required to start.
                </p>
            </DialogContent>
        </Dialog>
    );
}
