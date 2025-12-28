"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  const mask =
    orientation === "vertical"
      ? "linear-gradient(to bottom, transparent 0%, black 2%, black 98%, transparent 100%)"
      : "linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)";

  return (
    <SeparatorPrimitive
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch",
        "[-webkit-mask-image:_var(--separator-mask)] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:100%_100%] [mask-image:_var(--separator-mask)] [mask-repeat:no-repeat] [mask-size:100%_100%]",
        className
      )}
      data-slot="separator"
      orientation={orientation}
      style={
        {
          ...(props.style || {}),
          "--separator-mask": mask,
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Separator };
