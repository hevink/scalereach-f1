"use client";

import { IconSparkles } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PricingDialog } from "./pricing-dialog";
import { useCreateCheckout } from "@/hooks/useCredits";

interface UpgradeButtonProps {
    workspaceId?: string;
    currentPlan?: string;
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    showIcon?: boolean;
    children?: React.ReactNode;
}

export function UpgradeButton({
    workspaceId,
    currentPlan = "free",
    variant = "outline",
    size = "sm",
    className,
    showIcon = true,
    children,
}: UpgradeButtonProps) {
    const createCheckout = useCreateCheckout();

    const handleSelectPlan = async (planName: string, productId: string, isYearly: boolean) => {
        if (!workspaceId) {
            toast.error("Please select a workspace first");
            return;
        }

        try {
            // This will redirect to Polar checkout
            await createCheckout.mutateAsync({
                workspaceId,
                packageId: productId,
            });
        } catch (error) {
            // Error is handled by the hook
        }
    };

    return (
        <PricingDialog
            currentPlan={currentPlan}
            workspaceId={workspaceId}
            onSelectPlan={handleSelectPlan}
            trigger={
                <Button variant={variant} size={size} className={className}>
                    {showIcon && <IconSparkles className="size-4 mr-2" />}
                    {children || "Upgrade"}
                </Button>
            }
        />
    );
}
