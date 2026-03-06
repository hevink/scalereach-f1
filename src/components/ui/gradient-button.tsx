import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";
import type { ComponentPropsWithoutRef } from "react";

const gradientButtonVariants = cva(
  "group/button inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md font-medium text-sm outline-none transition-all will-change-transform focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95 disabled:pointer-events-none disabled:opacity-50 text-white border-none [background:radial-gradient(228.571%_228.571%_at_50%_-9.32995e-07%,#2553cb_0%,#1a3d8f_100%)] [box-shadow:rgba(255,255,255,0.2)_0px_1px_0px_0px_inset,rgba(0,0,0,0.4)_0px_1.25px_2.5px_0px,#2553cb_0px_0px_0px_1.25px] hover:opacity-90 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "h-10 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-3.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-12 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-9",
        "icon-xs": "size-6 rounded-[min(var(--radius-md),8px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-[min(var(--radius-md),10px)]",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

type ButtonPrimitiveProps = ComponentPropsWithoutRef<typeof ButtonPrimitive>;

export interface GradientButtonProps
  extends Omit<ButtonPrimitiveProps, 'size'>,
    VariantProps<typeof gradientButtonVariants> {
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function GradientButton({
  className,
  size = "default",
  loading = false,
  disabled,
  children,
  ...props
}: GradientButtonProps) {
  return (
    <ButtonPrimitive
      className={cn(gradientButtonVariants({ size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </ButtonPrimitive>
  );
}
