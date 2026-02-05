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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    IconDotsVertical,
    IconShieldCheck,
    IconShieldOff,
    IconTrash,
    IconChevronLeft,
    IconChevronRight,
    IconSearch,
    IconMail,
    IconDownload,
} from "@tabler/icons-react";
import { useAdminUsers, useUpdateUserRole, useDeleteUser } from "@/hooks/useAdmin";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

export function AdminUsersTable() {
    const [page, setPage] = useState(1);
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const { data, isLoading } = useAdminUsers(page, 50);
    const updateRole = useUpdateUserRole();
    const deleteUser = useDeleteUser();

    // Client-side filtering
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
                u.name || "",
                u.email,
                u.username || "",
                u.role || "user",
                u.emailVerified ? "Yes" : "No",
                u.twoFactorEnabled ? "Yes" : "No",
                u.isOnboarded ? "Yes" : "No",
                format(new Date(u.createdAt), "yyyy-MM-dd"),
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
        } catch (error) {
            toast.error("Failed to update user role");
        }
    };

    const handleDelete = async () => {
        if (!deleteUserId) return;
        try {
            await deleteUser.mutateAsync(deleteUserId);
            toast.success("User deleted successfully");
            setDeleteUserId(null);
        } catch (error) {
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
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Users ({data?.total ?? 0})</CardTitle>
                            <CardDescription>Manage all users on the platform</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={exportUsers}>
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
                                placeholder="Search by name, email, or username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value ?? "all")}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
                            <SelectTrigger className="w-[150px]">
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

                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No users found matching your filters
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
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
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.image || undefined} />
                                                    <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    {user.username && (
                                                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                                {user.role || "user"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.emailVerified && (
                                                    <Badge variant="outline" className="text-xs">Verified</Badge>
                                                )}
                                                {user.twoFactorEnabled && (
                                                    <Badge variant="outline" className="text-xs">2FA</Badge>
                                                )}
                                                {user.isOnboarded && (
                                                    <Badge variant="outline" className="text-xs">Onboarded</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger>
                                                    <Button variant="ghost" size="icon">
                                                        <IconDotsVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone and will
                            remove all their data including workspaces, videos, and clips.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
