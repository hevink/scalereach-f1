import { IconLoader } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const IconLoaderEl = IconLoader as React.ElementType;

function Spinner({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <IconLoaderEl
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      role="status"
      {...props}
    />
  );
}

export { Spinner };
