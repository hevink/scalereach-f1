"use client";

import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconAlertCircle, IconSparkles } from "@tabler/icons-react";

interface UploadLimitErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    errorType: "fileSize" | "duration";
    currentLimit: string;
    attemptedValue: string;
    currentPlan: string;
    recommendedPlan?: string;
    workspaceSlug: string;
}

export function UploadLimitErrorModal(props: UploadLimitErrorModalProps) {
    const router = useRouter();

    const handleUpgrade = () => {
        router.push(`/${props.workspaceSlug}/settings/billing`);
        props.onClose();
    };

    const getUpgradeBenefits = () => {
        if (props.recommendedPlan === "starter") {
            return [
                "4GB file uploads",
                "Up to 2 hour videos",
                "200 minutes/month",
                "No watermark",
                "Unlimited editing",
            ];
        }
        if (props.recommendedPlan === "pro") {
            return [
                "Up to 3 hour videos",
                "300 minutes/month",
                "Priority processing",
                "Advanced features",
            ];
        }
        return [];
    };

    return (
        <Dialog open={props.isOpen} onOpenChange={props.onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <IconAlertCircle className="size-5 text-destructive" />
                        <DialogTitle>Upload Limit Exceeded</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-lg bg-muted p-4">
                        <p className="text-sm">
                            {props.errorType === "fileSize"
                                ? `File size (${props.attemptedValue}) exceeds your ${props.currentPlan} plan limit of ${props.currentLimit}`
                                : `Video duration (${props.attemptedValue}) exceeds your ${props.currentPlan} plan limit of ${props.currentLimit}`}
                        </p>
                    </div>

                    {props.recommendedPlan && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <IconSparkles className="size-4 text-primary" />
                                <p className="text-sm font-medium">
                                    Upgrade to{" "}
                                    {props.recommendedPlan.charAt(0).toUpperCase() +
                                        props.recommendedPlan.slice(1)}{" "}
                                    for:
                                </p>
                            </div>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                                {getUpgradeBenefits().map((benefit, i) => (
                                    <li key={i}>• {benefit}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={props.onClose}
                            className="flex-1"
                        >
                            Try Another File
                        </Button>
                        {props.recommendedPlan && (
                            <Button onClick={handleUpgrade} className="flex-1">
                                Upgrade Now
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
