import { CreditUsageTable } from "@/components/credits/credit-usage-table";
import { CreditBalanceCard } from "@/components/credits/credit-balance-card";

export default async function CreditsPage({
    params,
}: {
    params: Promise<{ "workspace-slug": string }>;
}) {
    const { "workspace-slug": slug } = await params;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Minute Usage</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    View your minutes balance and transaction history
                </p>
            </div>

            <CreditBalanceCard workspaceSlug={slug} />
            <CreditUsageTable workspaceSlug={slug} />
        </div>
    );
}
