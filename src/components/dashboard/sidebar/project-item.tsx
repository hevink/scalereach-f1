"use client";

import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { useState } from "react";
import { CollapsibleContent } from "./collapsible-group";

interface ProjectItemProps {
  children?: React.ReactNode;
  defaultOpen?: boolean;
  iconColor: string;
  name: string;
}

export function ProjectItem({
  children,
  defaultOpen = false,
  iconColor,
  name,
}: ProjectItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasChildren = Boolean(children);

  return (
    <div className="flex flex-col">
      <button
        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        type="button"
      >
        <div className="flex items-center gap-2">
          <div
            className="size-5 shrink-0 rounded"
            style={{ backgroundColor: iconColor }}
          />
          <span className="font-medium">{name}</span>
        </div>
        {hasChildren &&
          (isOpen ? (
            <IconChevronDown className="size-3 shrink-0" />
          ) : (
            <IconChevronRight className="size-3 shrink-0" />
          ))}
      </button>
      {hasChildren && (
        <CollapsibleContent isOpen={isOpen}>{children}</CollapsibleContent>
      )}
    </div>
  );
}
