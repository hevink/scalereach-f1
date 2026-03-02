import { CreditUsageTable } from "@/components/credits/credit-usage-table";
import { CreditBalanceCard } from "@/components/credits/credit-balance-card";
import { IconClock } from "@tabler/icons-react";

export default async function CreditsPage({
    params,
}: {
    params: Promise<{ "workspace-slug": string }>;
}) {
    const { "workspace-slug": slug } = await params;

    return (
        <div className="flex flex-col gap-8 p-6 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10">
                    <IconClock className="size-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Minute Usage</h1>
                    <p className="text-sm text-muted-foreground">
                        Track your balance and transaction history
                    </p>
                </div>
            </div>

            <CreditBalanceCard workspaceSlug={slug} />
            <CreditUsageTable workspaceSlug={slug} />
        </div>
    );
}
