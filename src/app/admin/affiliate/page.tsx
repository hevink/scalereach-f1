"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
    IconGift, IconChevronDown, IconChevronRight, IconCheck,
    IconCurrencyDollar, IconUsers, IconArrowsExchange,
} from "@tabler/icons-react";
import { useAdminAffiliates, useAdminAffiliateReferrals, useMarkCommissionPaid } from "@/hooks/useAdmin";
import { format } from "date-fns";

function fmt(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}

function ReferralDropdown({ userId }: { userId: string }) {
    const { data, isLoading } = useAdminAffiliateReferrals(userId);
    const markPaid = useMarkCommissionPaid();

    if (isLoading) {
        return (
            <tr>
                <td colSpan={7} className="px-5 py-6 text-center">
                    <Spinner className="mx-auto" />
                </td>
            </tr>
        );
    }

    const referrals = data?.referrals || [];
    if (referrals.length === 0) {
        return (
            <tr>
                <td colSpan={7} className="px-5 py-4 text-center text-sm text-muted-foreground">
                    No referral details found.
                </td>
            </tr>
        );
    }

    return (
        <>
            {referrals.map((ref) => (
                <tr key={ref.id} className="bg-muted/20 border-b last:border-0">
                    <td className="pl-10 pr-5 py-3" />
                    <td className="px-5 py-3" colSpan={2}>
                        <div className="text-sm font-medium">{ref.referredName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{ref.referredEmail}</div>
                    </td>
                    <td className="px-5 py-3">
                        <Badge variant={ref.status === "converted" ? "default" : "secondary"} className="text-xs">
                            {ref.status === "converted" ? "Converted" : "Signed Up"}
                        </Badge>
                    </td>
                    <td className="px-5 py-3 text-sm tabular-nums">{fmt(ref.totalPaymentCents)}</td>
                    <td className="px-5 py-3 text-sm tabular-nums font-medium text-green-500">{fmt(ref.totalCommissionCents)}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                        {format(new Date(ref.createdAt), "MMM d, yyyy")}
                    </td>
                </tr>
            ))}
            {referrals.flatMap((ref) =>
                ref.commissions.map((c) => (
                    <tr key={c.id} className="bg-muted/10 border-b last:border-0">
                        <td className="pl-14 pr-5 py-2" />
                        <td className="px-5 py-2 text-xs text-muted-foreground" colSpan={2}>
                            {c.planName || "—"} — {c.paymentId ? `#${c.paymentId.slice(0, 12)}…` : "—"}
                        </td>
                        <td className="px-5 py-2">
                            <Badge
                                variant={c.status === "paid" ? "default" : c.status === "pending" ? "secondary" : "outline"}
                                className="text-xs"
                            >
                                {c.status}
                            </Badge>
                        </td>
                        <td className="px-5 py-2 text-xs tabular-nums">{fmt(c.paymentAmountCents)}</td>
                        <td className="px-5 py-2 text-xs tabular-nums text-green-500">{fmt(c.commissionAmountCents)}</td>
                        <td className="px-5 py-2">
                            {c.status === "pending" && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-xs gap-1"
                                    disabled={markPaid.isPending}
                                    onClick={() => {
                                        markPaid.mutate(c.id, {
                                            onSuccess: () => toast.success("Commission marked as paid"),
                                            onError: () => toast.error("Failed to mark as paid"),
                                        });
                                    }}
                                >
                                    <IconCheck className="size-3" /> Pay
                                </Button>
                            )}
                            {c.status === "paid" && c.paidAt && (
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(c.paidAt), "MMM d")}
                                </span>
                            )}
                        </td>
                    </tr>
                ))
            )}
        </>
    );
}

export default function AdminAffiliatePage() {
    const { data, isLoading } = useAdminAffiliates();
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    const affiliates = data?.affiliates || [];
    const totalEarned = affiliates.reduce((s, a) => s + Number(a.totalEarnedCents), 0);
    const totalPending = affiliates.reduce((s, a) => s + Number(a.pendingCents), 0);
    const totalRevenue = affiliates.reduce((s, a) => s + Number(a.revenueGeneratedCents), 0);
    const totalReferrals = affiliates.reduce((s, a) => s + Number(a.totalReferrals), 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Affiliate Program</h1>
                <p className="text-sm text-muted-foreground">Track all affiliates, referrals, and commissions</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <IconUsers className="size-3.5" /> Affiliates
                    </div>
                    <div className="text-2xl font-bold tabular-nums">{affiliates.length}</div>
                    <div className="text-xs text-muted-foreground">{totalReferrals} total referrals</div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <IconArrowsExchange className="size-3.5" /> Revenue Generated
                    </div>
                    <div className="text-2xl font-bold tabular-nums">{fmt(totalRevenue)}</div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <IconCurrencyDollar className="size-3.5" /> Total Commissions
                    </div>
                    <div className="text-2xl font-bold tabular-nums text-green-500">{fmt(totalEarned)}</div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <IconGift className="size-3.5" /> Pending Payout
                    </div>
                    <div className="text-2xl font-bold tabular-nums text-yellow-500">{fmt(totalPending)}</div>
                </div>
            </div>

            {/* Main table */}
            {isLoading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
            ) : affiliates.length === 0 ? (
                <div className="rounded-xl border p-10 text-center text-muted-foreground">
                    No affiliates yet. Users will appear here once they refer someone.
                </div>
            ) : (
                <div className="rounded-xl border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                                    <th className="px-5 py-3 font-medium w-10" />
                                    <th className="px-5 py-3 font-medium">Affiliate</th>
                                    <th className="px-5 py-3 font-medium">Code</th>
                                    <th className="px-5 py-3 font-medium">Referrals</th>
                                    <th className="px-5 py-3 font-medium">Revenue</th>
                                    <th className="px-5 py-3 font-medium">Earned</th>
                                    <th className="px-5 py-3 font-medium">Pending</th>
                                </tr>
                            </thead>
                            <tbody>
                                {affiliates.map((a) => {
                                    const isExpanded = expandedUser === a.userId;
                                    return (
                                        <>
                                            <tr
                                                key={a.userId}
                                                className="border-b cursor-pointer hover:bg-muted/20 transition-colors"
                                                onClick={() => setExpandedUser(isExpanded ? null : a.userId)}
                                            >
                                                <td className="px-5 py-3">
                                                    {isExpanded ? (
                                                        <IconChevronDown className="size-4 text-muted-foreground" />
                                                    ) : (
                                                        <IconChevronRight className="size-4 text-muted-foreground" />
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="font-medium">{a.name || "—"}</div>
                                                    <div className="text-xs text-muted-foreground">{a.email}</div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                        /r/{a.referralCode || "—"}
                                                    </code>
                                                </td>
                                                <td className="px-5 py-3 tabular-nums">
                                                    {Number(a.totalReferrals)}
                                                    {Number(a.convertedReferrals) > 0 && (
                                                        <span className="text-green-500 ml-1 text-xs">
                                                            ({Number(a.convertedReferrals)} converted)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 tabular-nums">{fmt(Number(a.revenueGeneratedCents))}</td>
                                                <td className="px-5 py-3 tabular-nums font-medium text-green-500">{fmt(Number(a.totalEarnedCents))}</td>
                                                <td className="px-5 py-3 tabular-nums text-yellow-500">{fmt(Number(a.pendingCents))}</td>
                                            </tr>
                                            {isExpanded && <ReferralDropdown userId={a.userId} />}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
