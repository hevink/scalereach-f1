"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { IconChevronLeft, IconChevronRight, IconExternalLink, IconSearch, IconDownload } from "@tabler/icons-react";
import { useAdminWorkspaces } from "@/hooks/useAdmin";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

const planVariants: Record<string, "default" | "secondary" | "outline"> = {
    free: "outline",
    starter: "secondary",
    pro: "default",
    "pro-plus": "default",
};

export function AdminWorkspacesTable() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [planFilter, setPlanFilter] = useState<string>("all");
    const { data, isLoading } = useAdminWorkspaces(page, 50);

    // Client-side filtering
    const filteredWorkspaces = useMemo(() => {
        if (!data?.workspaces) return [];
        return data.workspaces.filter((workspace) => {
            const matchesSearch = searchQuery === "" ||
                workspace.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                workspace.slug?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesPlan = planFilter === "all" || (workspace.plan || "free") === planFilter;

            return matchesSearch && matchesPlan;
        });
    }, [data?.workspaces, searchQuery, planFilter]);

    const exportWorkspaces = () => {
        if (!filteredWorkspaces.length) return;
        const csv = [
            ["Name", "Slug", "Plan", "Created"].join(","),
            ...filteredWorkspaces.map((w) => [
                w.name || "",
                w.slug,
                w.plan || "free",
                format(new Date(w.createdAt), "yyyy-MM-dd"),
            ].join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `workspaces-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Workspaces exported successfully");
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Workspaces</CardTitle>
                    <CardDescription>All workspaces on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Workspaces ({data?.total ?? 0})</CardTitle>
                        <CardDescription>All workspaces on the platform</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportWorkspaces}>
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
                            placeholder="Search by name or slug..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={planFilter} onValueChange={setPlanFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Plan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Plans</SelectItem>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="pro-plus">Pro Plus</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {filteredWorkspaces.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No workspaces found matching your filters
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Workspace</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="w-[50px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredWorkspaces.map((workspace) => (
                                <TableRow key={workspace.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={workspace.logo || undefined} />
                                                <AvatarFallback>{workspace.name?.charAt(0) || "W"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{workspace.name}</div>
                                                {workspace.description && (
                                                    <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                                        {workspace.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{workspace.slug}</code>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={planVariants[workspace.plan || "free"] || "outline"}>
                                            {workspace.plan || "free"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDistanceToNow(new Date(workspace.createdAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/${workspace.slug}`} target="_blank">
                                            <Button variant="ghost" size="icon">
                                                <IconExternalLink className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                            Page {data.page} of {data.totalPages}
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
                                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                disabled={page === data.totalPages}
                            >
                                Next
                                <IconChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
