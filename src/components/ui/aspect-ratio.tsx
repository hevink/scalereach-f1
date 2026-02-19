import { cn } from "@/lib/utils";

function AspectRatio({
  ratio,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ratio: number }) {
  return (
    <div
      className={cn("relative aspect-(--ratio)", className)}
      style={{ "--ratio": ratio, ...style } as React.CSSProperties}
      {...props}
    />
  );
}

export { AspectRatio };
