"use client";

import { IconSparkles } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface UpgradeButtonProps {
    workspaceSlug?: string;
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    showIcon?: boolean;
    children?: React.ReactNode;
}

export function UpgradeButton({
    workspaceSlug,
    variant = "outline",
    size = "sm",
    className,
    showIcon = true,
    children,
}: UpgradeButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        if (workspaceSlug) {
            router.push(`/${workspaceSlug}/pricing`);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            className={className}
            onClick={handleClick}
        >
            {showIcon && <IconSparkles className="size-4 mr-2" />}
            {children || "Upgrade"}
        </Button>
    );
}
