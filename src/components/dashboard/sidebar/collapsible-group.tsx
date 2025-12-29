"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface CollapsibleContentProps {
  children: React.ReactNode;
  isOpen: boolean;
}

function CollapsibleContent({ children, isOpen }: CollapsibleContentProps) {
  if (!isOpen) {
    return null;
  }

  return <div className="mt-1 ml-3 flex flex-col gap-0.5 pl-3">{children}</div>;
}

interface CollapsibleGroupProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  label: string;
}

export function CollapsibleGroup({
  children,
  defaultOpen = false,
  label,
}: CollapsibleGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <button
        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 font-medium text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{label}</span>
        {isOpen ? (
          <ChevronDown className="size-3 shrink-0" />
        ) : (
          <ChevronRight className="size-3 shrink-0" />
        )}
      </button>
      <CollapsibleContent isOpen={isOpen}>{children}</CollapsibleContent>
    </div>
  );
}

export { CollapsibleContent };
