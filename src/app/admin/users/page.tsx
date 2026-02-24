"use client";

import { AdminUsersTable } from "@/components/admin/admin-users-table";

export default function AdminUsersPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Users</h1>
                <p className="text-sm text-muted-foreground">Manage all users on the platform</p>
            </div>
            <AdminUsersTable />
        </div>
    );
}
