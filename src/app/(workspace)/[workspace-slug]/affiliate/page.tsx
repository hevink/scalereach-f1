"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconCopy, IconCheck, IconGift, IconLink, IconMail } from "@tabler/icons-react";
import { TwitterIcon, LinkedInIcon, WhatsAppIcon, TelegramIcon } from "@/components/icons/platform-icons";
import { useAffiliateStats } from "@/hooks/useAffiliate";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";

function formatCurrency(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}

function StatCard({
    label,
    value,
    sub,
    accent,
}: {
    label: string;
    value: string | number;
    sub?: string;
    accent: string;
}) {
    return (
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-5">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <span className="text-2xl font-semibold tracking-tight">{value}</span>
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
            <div className={`mt-1 h-1 w-full rounded-full ${accent}`} />
        </div>
    );
}

export default function AffiliatePage() {
    const { data: stats, isLoading, error } = useAffiliateStats();
    const [copied, setCopied] = useState(false);

    const copyLink = async () => {
        if (!stats?.referralLink) return;
        await navigator.clipboard.writeText(stats.referralLink);
        setCopied(true);
        toast.success("Referral link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnTwitter = () => {
        const text = encodeURIComponent(
            `Check out ScaleReach — the easiest way to repurpose long-form videos into viral short clips. Use my link and get started: ${stats?.referralLink}`
        );
        window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
    };

    const shareOnWhatsapp = () => {
        const text = encodeURIComponent(
            `Hey! Check out ScaleReach for turning long videos into viral clips: ${stats?.referralLink}`
        );
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    const shareOnTelegram = () => {
        const url = encodeURIComponent(stats?.referralLink || "");
        const text = encodeURIComponent("Check out ScaleReach — repurpose videos into viral clips!");
        window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
    };

    const shareOnLinkedin = () => {
        const url = encodeURIComponent(stats?.referralLink || "");
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
    };

    const shareViaEmail = () => {
        const subject = encodeURIComponent("Check out ScaleReach");
        const body = encodeURIComponent(
            `Hey,\n\nI've been using ScaleReach to repurpose long-form videos into short clips. You should try it out:\n\n${stats?.referralLink}\n\nCheers!`
        );
        window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-10 text-center text-muted-foreground">
                Failed to load affiliate data.
            </div>
        );
    }

    if (!stats?.referralLink) {
        return (
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10">
                        <IconGift className="size-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Affiliate Program</h1>
                        <p className="text-sm text-muted-foreground">
                            Your referral link is being generated. Please refresh the page.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10">
                    <IconGift className="size-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Affiliate Program</h1>
                    <p className="text-sm text-muted-foreground">
                        Earn {stats.commissionRate}% lifetime commission on every referral
                    </p>
                </div>
            </div>

            {/* Top Section: Referral Link + Earnings */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Referral Link Card */}
                <div className="lg:col-span-2 rounded-xl border bg-card p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <IconLink className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Referral link</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            readOnly
                            value={stats.referralLink}
                            className="flex-1 bg-muted/50 font-mono text-sm"
                            onClick={copyLink}
                        />
                        <Button onClick={copyLink} variant="default" className="shrink-0 gap-2">
                            {copied ? (
                                <>
                                    <IconCheck className="size-4" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <IconCopy className="size-4" />
                                    Copy link
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Rewards */}
                    <div className="mt-2 rounded-lg bg-muted/40 p-4">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rewards</span>
                        <ul className="mt-2 space-y-1.5 text-sm">
                            <li className="flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-green-500" />
                                {stats.commissionRate}% commission per sale — for life
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-blue-500" />
                                Payouts processed manually each month
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-purple-500" />
                                No cap on earnings
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Earnings Panel */}
                <div className="rounded-xl border bg-card p-6 flex flex-col gap-5">
                    <span className="text-sm font-medium">Earnings</span>
                    <div className="flex flex-col gap-4">
                        <div>
                            <span className="text-xs text-muted-foreground">Pending</span>
                            <p className="text-2xl font-semibold tracking-tight text-yellow-500">
                                {formatCurrency(stats.pendingCents)}
                            </p>
                        </div>
                        <div className="h-px bg-border" />
                        <div>
                            <span className="text-xs text-muted-foreground">Paid</span>
                            <p className="text-2xl font-semibold tracking-tight text-green-500">
                                {formatCurrency(stats.paidCents)}
                            </p>
                        </div>
                        <div className="h-px bg-border" />
                        <div>
                            <span className="text-xs text-muted-foreground">Total earned</span>
                            <p className="text-2xl font-semibold tracking-tight">
                                {formatCurrency(stats.totalEarnedCents)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    label="Referrals"
                    value={stats.totalReferrals}
                    sub="Total sign-ups"
                    accent="bg-blue-500/30"
                />
                <StatCard
                    label="Converted"
                    value={stats.convertedReferrals}
                    sub="Paid customers"
                    accent="bg-green-500/30"
                />
                <StatCard
                    label="Revenue generated"
                    value={formatCurrency(stats.commissionRate > 0 ? stats.totalEarnedCents * (100 / stats.commissionRate) : 0)}
                    sub={`${formatCurrency(stats.totalEarnedCents)} earned`}
                    accent="bg-purple-500/30"
                />
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="referrals">
                <TabsList variant="line">
                    <TabsTrigger value="referrals">Referrals</TabsTrigger>
                    <TabsTrigger value="commissions">Commissions</TabsTrigger>
                    <TabsTrigger value="share">Share</TabsTrigger>
                </TabsList>

                {/* Referrals Tab */}
                <TabsContent value="referrals">
                    {stats.referrals.length === 0 ? (
                        <div className="rounded-xl border p-10 text-center text-muted-foreground mt-4">
                            No referrals yet. Share your link to start earning.
                        </div>
                    ) : (
                        <div className="rounded-xl border mt-4 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                                            <th className="px-5 py-3 font-medium">User</th>
                                            <th className="px-5 py-3 font-medium">Status</th>
                                            <th className="px-5 py-3 font-medium">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.referrals.map((ref) => (
                                            <tr key={ref.id} className="border-b last:border-0">
                                                <td className="px-5 py-3">
                                                    <div className="font-medium">{ref.referredName || "—"}</div>
                                                    <div className="text-muted-foreground text-xs">{ref.referredEmail || "—"}</div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ref.status === "converted"
                                                            ? "bg-green-500/10 text-green-500"
                                                            : "bg-yellow-500/10 text-yellow-500"
                                                            }`}
                                                    >
                                                        {ref.status === "converted" ? "Converted" : "Signed Up"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-muted-foreground">
                                                    {format(new Date(ref.createdAt), "MMM d, yyyy")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Commissions Tab */}
                <TabsContent value="commissions">
                    {stats.commissions.length === 0 ? (
                        <div className="rounded-xl border p-10 text-center text-muted-foreground mt-4">
                            No commissions yet. When your referrals subscribe, commissions will appear here.
                        </div>
                    ) : (
                        <div className="rounded-xl border mt-4 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                                            <th className="px-5 py-3 font-medium">Plan</th>
                                            <th className="px-5 py-3 font-medium">Payment</th>
                                            <th className="px-5 py-3 font-medium">Commission</th>
                                            <th className="px-5 py-3 font-medium">Status</th>
                                            <th className="px-5 py-3 font-medium">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.commissions.map((c) => (
                                            <tr key={c.id} className="border-b last:border-0">
                                                <td className="px-5 py-3">{c.planName || "—"}</td>
                                                <td className="px-5 py-3">{formatCurrency(c.paymentAmountCents)}</td>
                                                <td className="px-5 py-3 font-medium text-green-500">
                                                    +{formatCurrency(c.commissionAmountCents)}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c.status === "paid"
                                                            ? "bg-green-500/10 text-green-500"
                                                            : c.status === "pending"
                                                                ? "bg-yellow-500/10 text-yellow-500"
                                                                : "bg-muted text-muted-foreground"
                                                            }`}
                                                    >
                                                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-muted-foreground">
                                                    {format(new Date(c.createdAt), "MMM d, yyyy")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Share Tab */}
                <TabsContent value="share">
                    <div className="mt-4 rounded-xl border bg-card p-6">
                        <h3 className="text-sm font-medium mb-4">Share your referral link</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <button
                                type="button"
                                onClick={shareOnTwitter}
                                className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                            >
                                <TwitterIcon className="size-5" />
                                <span className="text-xs text-muted-foreground">Twitter / X</span>
                            </button>
                            <button
                                type="button"
                                onClick={shareOnWhatsapp}
                                className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                            >
                                <WhatsAppIcon className="size-5" />
                                <span className="text-xs text-muted-foreground">WhatsApp</span>
                            </button>
                            <button
                                type="button"
                                onClick={shareOnTelegram}
                                className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                            >
                                <TelegramIcon className="size-5" />
                                <span className="text-xs text-muted-foreground">Telegram</span>
                            </button>
                            <button
                                type="button"
                                onClick={shareOnLinkedin}
                                className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                            >
                                <LinkedInIcon className="size-5" />
                                <span className="text-xs text-muted-foreground">LinkedIn</span>
                            </button>
                            <button
                                type="button"
                                onClick={shareViaEmail}
                                className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                            >
                                <IconMail className="size-5" />
                                <span className="text-xs text-muted-foreground">Email</span>
                            </button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
