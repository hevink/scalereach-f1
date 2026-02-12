"use client";

import { useState, useMemo } from "react";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useMinuteTransactions } from "@/hooks/useMinutes";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { Skeleton } from "@/components/ui/skeleton";
import {
    IconArrowDown,
    IconArrowUp,
    IconRefresh,
    IconClock,
    IconUpload,
    IconSparkles,
    IconReceipt,
    IconAdjustments,
    IconPlayerPlay,
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconArrowsSort,
    IconSortAscending,
    IconSortDescending,
    IconRotate,
} from "@tabler/icons-react";
import { format } from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MinuteTransaction } from "@/lib/api/minutes";

interface CreditUsageTableProps {
    workspaceSlug: string;
}

const TRANSACTION_TYPES = [
    { value: "all", label: "All Types" },
    { value: "upload", label: "Upload" },
    { value: "regenerate", label: "Regenerate" },
    { value: "refund", label: "Refund" },
    { value: "allocation", label: "Allocation" },
    { value: "reset", label: "Reset" },
    { value: "adjustment", label: "Adjustment" },
];

const getTypeConfig = (type: string) => {
    switch (type) {
        case "upload":
            return {
                color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
                icon: IconUpload,
            };
        case "regenerate":
            return {
                color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
                icon: IconRotate,
            };
        case "refund":
            return {
                color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
                icon: IconReceipt,
            };
        case "allocation":
            return {
                color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                icon: IconSparkles,
            };
        case "reset":
            return {
                color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
                icon: IconPlayerPlay,
            };
        case "adjustment":
            return {
                color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
                icon: IconAdjustments,
            };
        default:
            return {
                color: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
                icon: IconClock,
            };
    }
};

export function CreditUsageTable({ workspaceSlug }: CreditUsageTableProps) {
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [sorting, setSorting] = useState<SortingState>([
        { id: "createdAt", desc: true }
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const { data: workspace } = useWorkspaceBySlug(workspaceSlug);
    const { data: transactions = [], isLoading, refetch } = useMinuteTransactions(
        workspace?.id,
        {
            limit: 100,
            type: typeFilter === "all" ? undefined : typeFilter,
        }
    );

    const columns = useMemo<ColumnDef<MinuteTransaction>[]>(
        () => [
            {
                accessorKey: "createdAt",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Date & Time
                            {column.getIsSorted() === "asc" ? (
                                <IconSortAscending className="ml-2 h-4 w-4" />
                            ) : column.getIsSorted() === "desc" ? (
                                <IconSortDescending className="ml-2 h-4 w-4" />
                            ) : (
                                <IconArrowsSort className="ml-2 h-4 w-4" />
                            )}
                        </Button>
                    );
                },
                cell: ({ row }) => {
                    const date = new Date(row.getValue("createdAt"));
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">
                                {format(date, "MMM d, yyyy")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {format(date, "h:mm a")}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "type",
                header: "Type",
                cell: ({ row }) => {
                    const type = row.getValue("type") as string;
                    const config = getTypeConfig(type);
                    const TypeIcon = config.icon;

                    return (
                        <Badge
                            variant="secondary"
                            className={cn(
                                "border font-medium capitalize gap-1.5",
                                config.color
                            )}
                        >
                            <TypeIcon className="h-3.5 w-3.5" />
                            {type}
                        </Badge>
                    );
                },
                filterFn: (row, id, value) => {
                    return value.includes(row.getValue(id));
                },
            },
            {
                accessorKey: "description",
                header: "Description",
                cell: ({ row }) => {
                    const description = row.getValue("description") as string | null;
                    const type = row.getValue("type") as string;
                    const videoId = row.original.videoId;
                    const config = getTypeConfig(type);
                    const TypeIcon = config.icon;

                    if (!description) {
                        return (
                            <span className="text-sm text-muted-foreground italic">
                                No description
                            </span>
                        );
                    }

                    const isLong = description.length > 60;

                    return (
                        <div className="max-w-xs">
                            <div className="flex items-start gap-2">
                                <div className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-md shrink-0 mt-0.5",
                                    config.color
                                )}>
                                    <TypeIcon className="h-3 w-3" />
                                </div>
                                <div className="min-w-0">
                                    {isLong ? (
                                        <TooltipProvider delayDuration={300}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <p className="text-sm text-foreground/90 leading-snug truncate cursor-default">
                                                        {description}
                                                    </p>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="max-w-sm">
                                                    <p className="text-sm">{description}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <p className="text-sm text-foreground/90 leading-snug">
                                            {description}
                                        </p>
                                    )}
                                    {videoId && (
                                        <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                                            {videoId}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "minutesAmount",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Minutes
                            {column.getIsSorted() === "asc" ? (
                                <IconSortAscending className="ml-2 h-4 w-4" />
                            ) : column.getIsSorted() === "desc" ? (
                                <IconSortDescending className="ml-2 h-4 w-4" />
                            ) : (
                                <IconArrowsSort className="ml-2 h-4 w-4" />
                            )}
                        </Button>
                    );
                },
                cell: ({ row }) => {
                    const amount = row.getValue("minutesAmount") as number;
                    const isPositive = amount > 0;

                    return (
                        <div className="flex items-center gap-1.5">
                            <div className={cn(
                                "flex items-center justify-center w-5 h-5 rounded-full",
                                isPositive
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            )}>
                                {isPositive ? (
                                    <IconArrowUp className="h-3 w-3" />
                                ) : (
                                    <IconArrowDown className="h-3 w-3" />
                                )}
                            </div>
                            <span className={cn(
                                "font-semibold tabular-nums text-sm",
                                isPositive
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-rose-700 dark:text-rose-400"
                            )}>
                                {isPositive ? "+" : ""}{Math.abs(amount).toLocaleString()} min
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "minutesAfter",
                header: ({ column }) => {
                    return (
                        <div className="text-right">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="-mr-3 h-8 data-[state=open]:bg-accent"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            >
                                Minutes After
                                {column.getIsSorted() === "asc" ? (
                                    <IconSortAscending className="ml-2 h-4 w-4" />
                                ) : column.getIsSorted() === "desc" ? (
                                    <IconSortDescending className="ml-2 h-4 w-4" />
                                ) : (
                                    <IconArrowsSort className="ml-2 h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    );
                },
                cell: ({ row }) => {
                    const balance = row.getValue("minutesAfter") as number;
                    return (
                        <div className="text-right">
                            <div className="text-sm font-semibold tabular-nums">
                                {balance.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                min remaining
                            </div>
                        </div>
                    );
                },
            },
        ],
        []
    );

    const table = useReactTable({
        data: transactions,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        state: {
            sorting,
            columnFilters,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    return (
        <div className="space-y-4">
            {/* Header with filters */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <IconClock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold">Transaction History</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {transactions.length} total transactions
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value || "all")}>
                        <SelectTrigger className="w-[140px] h-9">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            {TRANSACTION_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={table.getState().pagination.pageSize.toString()}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger className="w-[100px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 25, 50, 100].map((pageSize) => (
                                <SelectItem key={pageSize} value={pageSize.toString()}>
                                    {pageSize} rows
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <IconRefresh className={cn(
                            "h-4 w-4",
                            isLoading && "animate-spin"
                        )} />
                    </Button>
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="rounded-lg border border-border/50 bg-card">
                    <div className="space-y-0 divide-y divide-border/50">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-4 flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                                <Skeleton className="h-6 w-20" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : table.getRowModel().rows?.length === 0 ? (
                <div className="rounded-lg border border-border/50 bg-card">
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                            <IconClock className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="font-medium text-sm mb-1">No transactions found</h3>
                        <p className="text-xs text-muted-foreground max-w-sm">
                            {typeFilter !== "all"
                                ? `No ${typeFilter} transactions to display. Try changing the filter.`
                                : "Your transaction history will appear here once you start using minutes."
                            }
                        </p>
                    </div>
                </div>
            ) : (
                <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border/50 bg-muted/20">
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="h-11">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.map((row, index) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={cn(
                                        "border-b border-border/50 transition-colors hover:bg-muted/30",
                                        "animate-in fade-in slide-in-from-bottom-1"
                                    )}
                                    style={{
                                        animationDelay: `${index * 30}ms`,
                                        animationFillMode: "backwards"
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-4 border-t border-border/50 bg-muted/20">
                        <div className="text-sm text-muted-foreground">
                            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                            {Math.min(
                                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                table.getFilteredRowModel().rows.length
                            )}{" "}
                            of {table.getFilteredRowModel().rows.length} transactions
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <IconChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <IconChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1 text-sm">
                                <span className="font-medium">
                                    {table.getState().pagination.pageIndex + 1}
                                </span>
                                <span className="text-muted-foreground">of</span>
                                <span className="font-medium">
                                    {table.getPageCount()}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <IconChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <IconChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
