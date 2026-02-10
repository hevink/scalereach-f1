/**
 * Share Layout
 * Layout for public share pages
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        template: "%s | ScaleReach",
        default: "Shared Clips - ScaleReach",
    },
    description: "View and download viral clips",
};

export default function ShareLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
