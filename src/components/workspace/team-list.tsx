"use client";

import { useState, useEffect } from "react";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateTeamDialog } from "./create-team-dialog";
import { safeClientError } from "@/lib/client-logger";

interface Team {
  id: string;
  name: string;
  identifier: string | null;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamListProps {
  workspaceId: string;
}

export function TeamList({ workspaceId }: TeamListProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspace/${workspaceId}/teams`);
      const data = await response.json();

      if (response.ok && data.teams) {
        setTeams(data.teams);
      }
    } catch (error) {
      safeClientError("Error fetching teams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [workspaceId]);

  const handleTeamCreated = () => {
    fetchTeams();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-lg">Teams</h2>
          <p className="text-muted-foreground text-sm">
            Manage teams within this workspace
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <IconPlus className="size-4" />
          Create team
        </Button>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-muted-foreground text-center text-sm">
              No teams yet. Create your first team to get started.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline">
              <IconPlus className="size-4" />
              Create team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted text-2xl">
                  {team.icon || "👥"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate">{team.name}</h3>
                  {team.identifier && (
                    <p className="text-muted-foreground text-sm">
                      {team.identifier}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        workspaceId={workspaceId}
        onSuccess={handleTeamCreated}
      />
    </div>
  );
}

