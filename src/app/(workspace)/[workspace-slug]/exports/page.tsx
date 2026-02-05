"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
    IconDownload,
    IconScissors,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

interface ExportsPageProps {
    params: Promise<{ "workspace-slug": string }>;
}

export default function ExportsPage({ params }: ExportsPageProps) {
    const { "workspace-slug": slug } = use(params);
    const router = useRouter();

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-3">
                    <IconDownload className="size-6" />
                    <h1 className="text-xl font-semibold">Exports</h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <EmptyState
                    icon={<IconScissors className="size-6" />}
                    title="Export clips from the editor"
                    description="To export a clip, open it in the clip editor and use the export button. Your exports will be available for download there."
                    action={{
                        label: "View Clips",
                        onClick: () => router.push(`/${slug}/clips`),
                    }}
                />
            </div>
        </div>
    );
}
