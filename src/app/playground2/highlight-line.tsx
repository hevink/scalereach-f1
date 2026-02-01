import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const highlightLineVariants = cva(
    "mr-2 mb-[3px] inline-flex h-5 items-center rounded border px-1.5 align-middle font-medium font-mono text-[10px] uppercase shrink-0",
    {
        variants: {
            variant: {
                new: "border-green-500/30 bg-green-500/20 text-green-700 dark:text-green-400",
                updated: "border-blue-500/30 bg-blue-500/20 text-blue-700 dark:text-blue-400",
                fixed: "border-yellow-500/30 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
                removed: "border-red-500/30 bg-red-500/20 text-red-700 dark:text-red-400",
            },
        },
        defaultVariants: {
            variant: "new",
        },
    }
);

export type HighlightLineProps = React.ComponentProps<"span"> &
    VariantProps<typeof highlightLineVariants>;

export function HighlightLine({
    children,
    variant,
    className,
    ...props
}: HighlightLineProps) {
    return (
        <span className={cn("flex items-start text-foreground/80", className)} {...props}>
            <span className={cn(highlightLineVariants({ variant }))}>
                {variant ?? "new"}
            </span>
            <span className="pt-0.5">{children}</span>
        </span>
    );
}
