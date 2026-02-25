"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconAlertCircle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface InsufficientMinutesModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan: string;
    minutesRemaining: number;
    minutesNeeded: number;
    workspaceSlug: string;
    errorType?: "duration" | "fileSize" | "minutes";
    currentLimit?: string;
    attemptedValue?: string;
}

type BillingPeriod = "monthly" | "annually";

interface Plan {
    name: string;
    description: string;
    monthly: number;
    annually: number;
    features: string[];
    featured: boolean;
    badge?: string;
}

const plans: Record<string, Plan> = {
    pro: {
        name: "Pro",
        badge: "Super offer",
        description: "Step up your game with bigger volume",
        monthly: 18,
        annually: 12.5,
        features: [
            "4800 Minutes/Year (or 400/Month)",
            "Without Watermark",
            "Up to 3h File Length",
            "Up to 4GB File Size Upload",
            "Storage: 6 Months (then auto-deleted)",
            "Unlimited Editing",
            "4K Clip Quality",
        ],
        featured: true,
    },
    agency: {
        name: "Agency",
        badge: "Unlimited",
        description: "For agencies and teams that need it all",
        monthly: 99,
        annually: 49,
        features: [
            "Unlimited Minutes",
            "Without Watermark",
            "Unlimited File Length",
            "Unlimited File Size Upload",
            "Storage: 6 Months (then auto-deleted)",
            "Unlimited Editing",
            "4K Clip Quality",
        ],
        featured: false,
    },
    starter: {
        name: "Starter",
        description: "Unlock access to all powerful features",
        monthly: 12,
        annually: 10,
        features: [
            "1800 Minutes/Year (or 200/Month)",
            "Without Watermark",
            "Up to 2h File Length",
            "Up to 4GB File Size Upload",
            "Storage: 3 Months (then auto-deleted)",
            "Unlimited Editing",
            "1080p Clip Quality",
        ],
        featured: false,
    },
};

function PricingCard({
    planKey,
    plan,
    period,
    index,
    onSelect,
}: {
    planKey: string;
    plan: Plan;
    period: BillingPeriod;
    index: number;
    onSelect: (planId: string) => void;
}) {
    const price = period === "monthly" ? plan.monthly : plan.annually;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`row-span-4 grid grid-rows-subgrid gap-8 p-8 ${plan.featured
                ? "rounded-[--radius] ring-border bg-card shadow-black/6.5 shadow-xl ring-1 backdrop-blur"
                : ""
                }`}
        >
            {/* Plan name and description */}
            <div className="self-end">
                <div className="tracking-tight text-lg font-medium flex items-center gap-2">
                    {plan.name}
                    {plan.badge && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {plan.badge}
                        </span>
                    )}
                </div>
                <div className="text-muted-foreground mt-1 text-balance text-sm">
                    {plan.description}
                </div>
            </div>

            {/* Price */}
            <div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${plan.name}-${period}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="text-3xl font-semibold"
                    >
                        ${price}
                        {price > 0 && <span className="text-lg font-normal text-muted-foreground">/month</span>}
                    </motion.div>
                </AnimatePresence>
                <div className="text-muted-foreground text-sm">
                    {price === 0 ? "Free forever" : `billed ${period}`}
                </div>
            </div>

            {/* CTA Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(planKey)}
                className={`cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 w-full ${plan.featured
                    ? "shadow-md border-[0.5px] border-white/10 shadow-black/15 bg-primary text-primary-foreground hover:bg-primary/90"
                    : "shadow-sm shadow-black/15 border border-transparent bg-card ring-1 ring-foreground/10 hover:bg-muted/50"
                    }`}
            >
                Upgrade to {plan.name}
            </motion.button>

            {/* Features list */}
            <ul role="list" className="space-y-3 text-sm">
                {plan.features.map((feature, i) => (
                    <motion.li
                        key={feature}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="group flex items-center gap-2 first:font-medium"
                    >
                        <Check className="text-muted-foreground size-3 group-first:hidden" strokeWidth={3.5} />
                        {feature}
                    </motion.li>
                ))}
            </ul>
        </motion.div>
    );
}

function CornerDecoration({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
    const positionClasses = {
        "top-left": "-translate-x-[calc(50%+0.5px)] -translate-y-[calc(50%+0.5px)]",
        "top-right": "right-0 translate-x-[calc(50%+0.5px)] -translate-y-[calc(50%+0.5px)]",
        "bottom-left": "bottom-0 -translate-x-[calc(50%+0.5px)] translate-y-[calc(50%+0.5px)]",
        "bottom-right": "bottom-0 right-0 translate-x-[calc(50%+0.5px)] translate-y-[calc(50%+0.5px)]",
    };

    return (
        <div
            aria-hidden="true"
            className={`mask-radial-from-15% before:bg-foreground/25 after:bg-foreground/25 absolute size-3 before:absolute before:inset-0 before:m-auto before:h-px after:absolute after:inset-0 after:m-auto after:w-px ${positionClasses[position]}`}
        />
    );
}

export function InsufficientMinutesModal(props: InsufficientMinutesModalProps) {
    const router = useRouter();
    const [period, setPeriod] = useState<BillingPeriod>("annually");

    const handleUpgrade = (planKey: string) => {
        router.push(`/${props.workspaceSlug}/pricing?plan=${planKey}`);
        props.onClose();
    };

    // Determine the title and message based on error type
    const getModalContent = () => {
        if (props.errorType === "duration") {
            return {
                title: "Upload Limit Exceeded",
                message: `This video is ${props.attemptedValue}, but your ${props.currentPlan} plan supports videos up to ${props.currentLimit}.`,
                subtitle: "Upgrade to a higher plan for longer videos and more features.",
            };
        }

        if (props.errorType === "fileSize") {
            return {
                title: "Upload Limit Exceeded",
                message: `This file is ${props.attemptedValue}, but your ${props.currentPlan} plan supports files up to ${props.currentLimit}.`,
                subtitle: "Upgrade to a higher plan for larger files and more features.",
            };
        }

        // Default: minutes error
        return {
            title: "Not Enough Minutes",
            message: `You have ${props.minutesRemaining} minutes remaining, but this video needs ${props.minutesNeeded} minutes to process.`,
            subtitle: props.currentPlan === "Free"
                ? "Free plan includes 50 one-time minutes. Upgrade to Starter (200/month) or Pro (300/month) for more."
                : "Your monthly minutes will reset on your renewal date. Upgrade for more minutes per month.",
        };
    };

    const content = getModalContent();

    return (
        <Dialog open={props.isOpen} onOpenChange={props.onClose}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <IconAlertCircle className="size-5 text-destructive" />
                        <DialogTitle>{content.title}</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Current Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-muted p-4"
                    >
                        <p className="text-sm font-medium">
                            {content.message}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            {content.subtitle}
                        </p>
                    </motion.div>

                    {/* Billing Toggle */}
                    <div className="flex justify-center">
                        <div className="bg-foreground/5 relative grid w-fit grid-cols-2 rounded-full p-1">
                            <motion.div
                                className="bg-card ring-foreground/5 pointer-events-none absolute inset-1 w-[calc(50%-4px)] rounded-full border border-transparent shadow ring-1"
                                animate={{ x: period === "monthly" ? 0 : "100%" }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                            <button
                                onClick={() => setPeriod("monthly")}
                                className={cn(
                                    "relative z-10 block h-8 w-24 rounded-full text-sm transition-colors",
                                    period === "monthly" ? "text-foreground font-medium" : "text-foreground/75 hover:opacity-75"
                                )}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setPeriod("annually")}
                                className={cn(
                                    "relative z-10 block h-8 w-24 rounded-full text-sm transition-colors",
                                    period === "annually" ? "text-foreground font-medium" : "text-foreground/75 hover:opacity-75"
                                )}
                            >
                                Annually
                            </button>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-xs"
                    >
                        <span className="text-primary font-medium">Save up to 30%</span> with annual billing
                    </motion.div>

                    {/* Pricing Cards Container - Exact same as pricing page */}
                    <div className="relative border">
                        {/* Corner decorations */}
                        <CornerDecoration position="top-left" />
                        <CornerDecoration position="top-right" />
                        <CornerDecoration position="bottom-left" />
                        <CornerDecoration position="bottom-right" />

                        {/* Main pricing cards */}
                        <div className="relative mx-auto">
                            <div className="grid md:grid-cols-3">
                                {Object.entries(plans).map(([key, plan], index) => (
                                    <PricingCard
                                        key={key}
                                        planKey={key}
                                        plan={plan}
                                        period={period}
                                        index={index}
                                        onSelect={handleUpgrade}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Cancel Button */}
                    <div className="flex justify-center">
                        <Button
                            variant="ghost"
                            onClick={props.onClose}
                            className="text-muted-foreground"
                        >
                            Maybe Later
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
