"use client";

interface WorkspaceProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
}

export function WorkspaceDashboard({ workspace }: WorkspaceProps) {
  return (
    <div className="w-full p-4">
      <div className="flex w-full flex-col gap-6">
        <div>
          <h1 className="font-medium text-2xl">Welcome to {workspace.name}</h1>
          {workspace.description && (
            <p className="mt-2 text-muted-foreground">
              {workspace.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
