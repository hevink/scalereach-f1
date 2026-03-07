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
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
    DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    IconDotsVertical, IconShieldCheck, IconShieldOff, IconTrash,
    IconChevronLeft, IconChevronRight, IconSearch, IconDownload, IconEye,
    IconMail, IconCalendar,
} from "@tabler/icons-react";
import { useAdminUsers, useUpdateUserRole, useDeleteUser } from "@/hooks/useAdmin";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AdminUsersTable() {
    const [page, setPage] = useState(1);
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const router = useRouter();
    const { data, isLoading } = useAdminUsers(page, 50);
    const updateRole = useUpdateUserRole();
    const deleteUser = useDeleteUser();

    const filteredUsers = useMemo(() => {
        if (!data?.users) return [];
        return data.users.filter((user) => {
            const matchesSearch = searchQuery === "" ||
                user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.username?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === "all" || user.role === roleFilter;
            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "verified" && user.emailVerified) ||
                (statusFilter === "unverified" && !user.emailVerified) ||
                (statusFilter === "2fa" && user.twoFactorEnabled) ||
                (statusFilter === "onboarded" && user.isOnboarded);
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [data?.users, searchQuery, roleFilter, statusFilter]);

    const exportUsers = () => {
        if (!filteredUsers.length) return;
        const csv = [
            ["Name", "Email", "Username", "Role", "Verified", "2FA", "Onboarded", "Joined"].join(","),
            ...filteredUsers.map((u) => [
                u.name || "", u.email, u.username || "", u.role || "user",
                u.emailVerified ? "Yes" : "No", u.twoFactorEnabled ? "Yes" : "No",
                u.isOnboarded ? "Yes" : "No", format(new Date(u.createdAt), "yyyy-MM-dd"),
            ].join(","))
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Users exported successfully");
    };

    const handleRoleChange = async (userId: string, newRole: "user" | "admin") => {
        try {
            await updateRole.mutateAsync({ userId, role: newRole });
            toast.success(`User role updated to ${newRole}`);
        } catch {
            toast.error("Failed to update user role");
        }
    };

    const handleDelete = async () => {
        if (!deleteUserId) return;
        try {
            await deleteUser.mutateAsync(deleteUserId);
            toast.success("User deleted successfully");
            setDeleteUserId(null);
        } catch {
            toast.error("Failed to delete user");
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Manage all users on the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle>Users <span className="text-muted-foreground font-normal text-base">({data?.total ?? 0})</span></CardTitle>
                            <CardDescription>Manage all users on the platform</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={exportUsers} className="gap-2 self-start sm:self-auto">
                            <IconDownload className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <div className="relative flex-1">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search name, email, username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="unverified">Unverified</SelectItem>
                                    <SelectItem value="2fa">2FA Enabled</SelectItem>
                                    <SelectItem value="onboarded">Onboarded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <IconSearch className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p>No users found matching your filters</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="w-[50px]" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow
                                                key={user.id}
                                                className="cursor-pointer hover:bg-muted/40"
                                                onClick={() => router.push(`/admin/users/${user.id}`)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={user.image || undefined} />
                                                            <AvatarFallback className="text-xs">{user.name?.charAt(0) || "U"}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium text-sm">{user.name}</div>
                                                            {user.username && (
                                                                <div className="text-xs text-muted-foreground">@{user.username}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                                                        {user.role || "user"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.emailVerified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                                                        {user.twoFactorEnabled && <Badge variant="outline" className="text-xs">2FA</Badge>}
                                                        {user.isOnboarded && <Badge variant="outline" className="text-xs">Onboarded</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                                                </TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <IconDotsVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuGroup>
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                                                                    <IconEye className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                {user.role === "admin" ? (
                                                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, "user")}>
                                                                        <IconShieldOff className="mr-2 h-4 w-4" />
                                                                        Remove Admin
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, "admin")}>
                                                                        <IconShieldCheck className="mr-2 h-4 w-4" />
                                                                        Make Admin
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => setDeleteUserId(user.id)}
                                                                >
                                                                    <IconTrash className="mr-2 h-4 w-4" />
                                                                    Delete User
                                                                </DropdownMenuItem>
                                                            </DropdownMenuGroup>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile card list */}
                            <div className="md:hidden space-y-2">
                                {filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="border rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/40 transition-colors"
                                        onClick={() => router.push(`/admin/users/${user.id}`)}
                                    >
                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarImage src={user.image || undefined} />
                                            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm truncate">{user.name}</span>
                                                <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                                                    {user.role || "user"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                <IconMail className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                <IconCalendar className="h-3 w-3 shrink-0" />
                                                {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                                            </div>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                                        <IconDotsVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                                                        <IconEye className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {user.role === "admin" ? (
                                                        <DropdownMenuItem onClick={() => handleRoleChange(user.id, "user")}>
                                                            <IconShieldOff className="mr-2 h-4 w-4" /> Remove Admin
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleRoleChange(user.id, "admin")}>
                                                            <IconShieldCheck className="mr-2 h-4 w-4" /> Make Admin
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteUserId(user.id)}>
                                                        <IconTrash className="mr-2 h-4 w-4" /> Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    {data && data.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <span className="text-sm text-muted-foreground">
                                Page {data.page} of {data.totalPages}
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                                    <IconChevronLeft className="h-4 w-4" /> Previous
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
                                    Next <IconChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!deleteUserId} onOpenChange={(open) => { if (!deleteUser.isPending) setDeleteUserId(open ? deleteUserId : null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure? This will permanently remove the user and all their data including workspaces, videos, and clips.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteUser.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            disabled={deleteUser.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteUser.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
