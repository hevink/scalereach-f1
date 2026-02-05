"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    IconSearch,
    IconDownload,
    IconCoin,
    IconArrowUp,
    IconArrowDown,
    IconChevronLeft,
    IconChevronRight,
} from "@tabler/icons-react";
import { useCreditTransactions, useCreditAnalytics } from "@/hooks/useAdmin";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";

interface AdminPaymentsTableProps {
    dateRange: DateRange | undefined;
}

export function AdminPaymentsTable({ dateRange }: AdminPaymentsTableProps) {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    const days = dateRange?.from && dateRange?.to
        ? Math.max(1, differenceInDays(dateRange.to, dateRange.from))
        : 30;

    const { data: transactions, isLoading } = useCreditTransactions(page, 50);
    const { data: analytics } = useCreditAnalytics(days);

    const filteredTransactions = useMemo(() => {
        if (!transactions?.transactions) return [];
        return transactions.transactions.filter((tx) => {
            const matchesSearch = searchQuery === "" ||
                tx.workspaceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.description?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesType = typeFilter === "all" ||
                (typeFilter === "credit" && tx.amount > 0) ||
                (typeFilter === "debit" && tx.amount < 0);

            return matchesSearch && matchesType;
        });
    }, [transactions?.transactions, searchQuery, typeFilter]);

    const exportTransactions = () => {
        if (!filteredTransactions.length) return;
        const csv = [
            ["Date", "Workspace", "Type", "Amount", "Description"].join(","),
            ...filteredTransactions.map((tx) => [
                format(new Date(tx.createdAt), "yyyy-MM-dd HH:mm"),
                tx.workspaceName || "Unknown",
                tx.amount > 0 ? "Credit" : "Debit",
                Math.abs(tx.amount),
                tx.description || "",
            ].join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Transactions exported successfully");
    };

    const creditConfig: ChartConfig = {
        used: {
            label: "Used",
            color: "oklch(0.645 0.246 16.439)",
        },
        added: {
            label: "Added",
            color: "oklch(0.696 0.17 162.48)",
        },
    };

    const chartData = analytics?.creditsByDay?.map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        used: d.used,
        added: d.added,
    })) || [];

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Credits Added
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            +{analytics?.totalCreditsAdded?.toLocaleString() || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Last {days} days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Credits Used
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            -{analytics?.totalCreditsUsed?.toLocaleString() || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Last {days} days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Net Change
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${(analytics?.totalCreditsAdded || 0) - (analytics?.totalCreditsUsed || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                            }`}>
                            {((analytics?.totalCreditsAdded || 0) - (analytics?.totalCreditsUsed || 0)).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Last {days} days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg Daily Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.round((analytics?.totalCreditsUsed || 0) / days).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Credits per day</p>
                    </CardContent>
                </Card>
            </div>

            {/* Credit Usage Chart */}
            {chartData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Credit Flow</CardTitle>
                        <CardDescription>Credits added vs used over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={creditConfig} className="h-[300px] w-full">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area
                                    type="monotone"
                                    dataKey="added"
                                    stroke="var(--color-added)"
                                    fill="var(--color-added)"
                                    fillOpacity={0.3}
                                    stackId="1"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="used"
                                    stroke="var(--color-used)"
                                    fill="var(--color-used)"
                                    fillOpacity={0.3}
                                    stackId="2"
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}

            {/* Top Credit Users */}
            {analytics?.topCreditUsers && analytics.topCreditUsers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Top Credit Users</CardTitle>
                        <CardDescription>Workspaces with highest credit usage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Workspace</TableHead>
                                    <TableHead className="text-right">Credits Used</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analytics.topCreditUsers.slice(0, 5).map((user, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell className="text-right">{user.creditsUsed.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription>All credit transactions</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={exportTransactions}>
                            <IconDownload className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by workspace or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="credit">Credits Added</SelectItem>
                                <SelectItem value="debit">Credits Used</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No transactions found
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Workspace</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-muted-foreground">
                                            {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell className="font-medium">{tx.workspaceName || "Unknown"}</TableCell>
                                        <TableCell>{tx.description || "-"}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                variant={tx.amount > 0 ? "default" : "secondary"}
                                                className={tx.amount > 0 ? "bg-green-600" : "bg-orange-600"}
                                            >
                                                {tx.amount > 0 ? (
                                                    <IconArrowUp className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <IconArrowDown className="h-3 w-3 mr-1" />
                                                )}
                                                {Math.abs(tx.amount)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination */}
                    {transactions && transactions.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Page {transactions.page} of {transactions.totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <IconChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(transactions.totalPages, p + 1))}
                                    disabled={page === transactions.totalPages}
                                >
                                    Next
                                    <IconChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
