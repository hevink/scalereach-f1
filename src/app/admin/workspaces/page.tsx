"use client";

import { AdminWorkspacesTable } from "@/components/admin/admin-workspaces-table";

export default function AdminWorkspacesPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Workspaces</h1>
                <p className="text-sm text-muted-foreground">View and manage workspaces</p>
            </div>
            <AdminWorkspacesTable />
        </div>
    );
}
