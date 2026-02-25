"use client";

import { Badge } from "@/components/ui/badge";
import { IconCrown, IconSparkles } from "@tabler/icons-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PlanBadgeProps {
    plan: "free" | "starter" | "pro" | "agency";
    workspaceSlug: string;
}

export function PlanBadge({ plan, workspaceSlug }: PlanBadgeProps) {
    const router = useRouter();

    const config = {
        free: {
            label: "Free",
            icon: null,
            variant: "secondary" as const,
            limits: ["2GB uploads", "30 min videos", "50 minutes one-time"],
        },
        starter: {
            label: "Starter",
            icon: <IconSparkles className="size-3" />,
            variant: "default" as const,
            limits: ["4GB uploads", "2h videos", "200 min/month"],
        },
        pro: {
            label: "Pro",
            icon: <IconCrown className="size-3" />,
            variant: "default" as const,
            limits: ["4GB uploads", "3h videos", "400 min/month"],
        },
        agency: {
            label: "Agency",
            icon: <IconCrown className="size-3" />,
            variant: "default" as const,
            limits: ["Unlimited uploads", "Unlimited video length", "Unlimited minutes", "Unlimited social accounts"],
        },
    };

    const { label, icon, variant, limits } = config[plan] ?? config.free;

    return (
        <Popover>
            <PopoverTrigger>
                <Badge
                    variant={variant}
                    className="cursor-pointer gap-1 hover:opacity-80 transition-opacity"
                >
                    {icon}
                    {label}
                </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="space-y-3">
                    <div>
                        <h4 className="font-semibold mb-2">{label} Plan</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            {limits.map((limit, i) => (
                                <li key={i}>• {limit}</li>
                            ))}
                        </ul>
                    </div>

                    {plan !== "pro" && plan !== "agency" && (
                        <Button
                            size="sm"
                            className="w-full"
                            onClick={() => router.push(`/${workspaceSlug}/pricing`)}
                        >
                            Upgrade Plan
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
