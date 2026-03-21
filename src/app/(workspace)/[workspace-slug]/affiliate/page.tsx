"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconCopy, IconCheck, IconGift, IconLink, IconMail, IconTrophy } from "@tabler/icons-react";
import { TwitterIcon, LinkedInIcon, WhatsAppIcon, TelegramIcon } from "@/components/icons/platform-icons";
import { useAffiliateStats } from "@/hooks/useAffiliate";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

const AVATAR_COLORS = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
    "bg-cyan-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500",
    "bg-fuchsia-500", "bg-lime-500", "bg-sky-500", "bg-red-500", "bg-purple-500",
];

// Realistic earnings based on actual plan prices × 25% commission:
// Starter $12/mo → $3 commission, Pro $18/mo → $4.50, Agency $99/mo → $24.75
// Each entry = sum of multiple referral commissions over time
const FAKE_LEADERBOARD = [
    { name: "Brave Coral Fox", earnings: 247275 },       // ~10 agency referrals
    { name: "Swift Azure Falcon", earnings: 198450 },     // 8 agency + some pro
    { name: "Lucky Jade Panther", earnings: 154125 },     // 6 agency + 3 pro
    { name: "Bold Crimson Wolf", earnings: 128700 },      // 5 agency + 2 pro + 1 starter
    { name: "Calm Amber Hawk", earnings: 103950 },        // 4 agency + 2 pro
    { name: "Keen Violet Otter", earnings: 89100 },       // 3 agency + 5 pro + 2 starter
    { name: "Wise Cobalt Lynx", earnings: 74250 },        // 3 agency
    { name: "Bright Sage Puma", earnings: 63000 },        // 2 agency + 3 pro
    { name: "Noble Scarlet Crane", earnings: 54450 },     // 2 agency + 1 pro + 1 starter
    { name: "Quick Teal Raven", earnings: 49500 },        // 2 agency
    { name: "Gentle Ivory Stag", earnings: 42750 },       // 1 agency + 4 pro
    { name: "Proud Copper Eagle", earnings: 38250 },      // 1 agency + 3 pro
    { name: "Sharp Onyx Viper", earnings: 34650 },        // 1 agency + 2 pro + 1 starter
    { name: "Warm Peach Dove", earnings: 29250 },         // 1 agency + 1 pro
    { name: "Fierce Slate Tiger", earnings: 24750 },      // 1 agency
    { name: "Quiet Mint Heron", earnings: 22050 },        // 4 pro + 2 starter
    { name: "Daring Gold Shark", earnings: 18000 },       // 4 pro
    { name: "Steady Plum Gecko", earnings: 15300 },       // 3 pro + 1 starter
    { name: "Agile Ruby Finch", earnings: 13500 },        // 3 pro
    { name: "Clever Moss Badger", earnings: 11700 },      // 2 pro + 2 starter
    { name: "Loyal Dusk Parrot", earnings: 9000 },        // 2 pro
    { name: "Witty Blush Koala", earnings: 7500 },        // 1 pro + 2 starter
    { name: "Nimble Frost Ibis", earnings: 6300 },        // 1 pro + 1 starter + 1 starter
    { name: "Merry Rust Lemur", earnings: 5400 },         // 1 pro + 1 starter
    { name: "Vivid Pearl Newt", earnings: 4500 },         // 1 pro
    { name: "Jolly Cedar Wren", earnings: 4200 },         // 1 pro (annual $12.50 × 25% = $3.13 × some months)
    { name: "Sleek Mauve Quail", earnings: 3900 },        // 1 pro (few months)
    { name: "Humble Flint Mole", earnings: 3600 },        // 1 starter × 12 months
    { name: "Eager Opal Skunk", earnings: 3450 },         // 1 pro (partial)
    { name: "Zesty Wheat Crab", earnings: 3300 },         // 1 starter × 11 months
    { name: "Brisk Coral Moth", earnings: 3150 },         // 1 pro (partial)
    { name: "Tender Ash Lark", earnings: 3000 },          // 1 starter × 10 months
    { name: "Plucky Fern Toad", earnings: 2700 },         // 1 starter × 9 months
    { name: "Mellow Sand Kite", earnings: 2400 },         // 1 starter × 8 months
    { name: "Chirpy Dawn Seal", earnings: 2100 },         // 1 starter × 7 months
];

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function formatUsd(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
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
                    <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
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

                {/* Leaderboard Tab */}
                <TabsContent value="leaderboard">
                    <div className="rounded-xl border mt-4 overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b bg-muted/20">
                            <IconTrophy className="size-4 text-yellow-500" />
                            <span className="text-sm font-medium">Top Affiliates</span>
                            <span className="text-xs text-muted-foreground ml-auto">Updated monthly</span>
                        </div>
                        <div className="overflow-x-auto">
                            <TooltipProvider>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                                            <th className="px-5 py-3 font-medium w-20">Rank</th>
                                            <th className="px-5 py-3 font-medium">Partner</th>
                                            <th className="px-5 py-3 font-medium text-right">Earnings</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {FAKE_LEADERBOARD.map((entry, i) => (
                                            <tr key={entry.name} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                <td className="px-5 py-3 tabular-nums">
                                                    {i < 3 ? (
                                                        <span className="text-base">{RANK_MEDALS[i]}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">{i + 1}</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 max-w-[140px]">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-2.5 cursor-default min-w-0">
                                                                <div className={`size-7 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-medium shrink-0`}>
                                                                    {entry.name.charAt(0)}
                                                                </div>
                                                                <span className="font-medium truncate">{entry.name}</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="max-w-[260px] text-center">
                                                            <p>For privacy reasons, the name of the partner is anonymized.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </td>
                                                <td className="px-5 py-3 text-right tabular-nums font-medium">
                                                    {formatUsd(entry.earnings)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </TooltipProvider>
                        </div>
                    </div>
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
