"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface NavLinkProps {
  children: React.ReactNode;
  href: string;
  icon: LucideIcon;
  isActive?: boolean;
}

export function NavLink({
  children,
  href,
  icon: Icon,
  isActive = false,
}: NavLinkProps) {
  return (
    <li className="list-none">
      <Link
        className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 font-[450] text-[13px] transition-colors ${
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent"
        }`}
        href={href}
      >
        <Icon className="size-4 shrink-0" />
        <span>{children}</span>
      </Link>
    </li>
  );
}
