"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";

interface CollapsibleContentProps {
  children: React.ReactNode;
  isOpen: boolean;
}

function CollapsibleContent({ children, isOpen }: CollapsibleContentProps) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
      `}
    >
      <div className="overflow-hidden">
        <div className="ml-2 flex flex-col gap-0.5 pl-2 font-[490] text-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

interface CollapsibleGroupProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  label: string;
  headerAction?: React.ReactNode;
}

export function CollapsibleGroup({
  children,
  defaultOpen = false,
  label,
  headerAction,
}: CollapsibleGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <div className="flex w-full items-center justify-between rounded-md px-2 py-1.5">
        <button
          className="flex flex-1 items-center gap-2 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          <span>{label}</span>
          <IconChevronDown
            className={`size-3 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
          />
        </button>

        {headerAction && (
          <button
            className="contents"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
          >
            {headerAction}
          </button>
        )}
      </div>

      <CollapsibleContent isOpen={isOpen}>{children}</CollapsibleContent>
    </div>
  );
}

export { CollapsibleContent };
