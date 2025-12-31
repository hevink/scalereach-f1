"use client";

import { IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CollapsibleGroup } from "./collapsible-group";
import { NavLink } from "./nav-link";
import { safeClientError } from "@/lib/client-logger";
import { CreateTeamDialog } from "@/components/workspace/create-team-dialog";

interface Team {
    id: string;
    name: string;
    identifier: string | null;
    icon: string | null;
}

interface TeamsSectionProps {
    workspaceId: string | null;
    workspaceSlug: string | null;
    pathname: string;
}

export function TeamsSection({
    workspaceId,
    workspaceSlug,
    pathname,
}: TeamsSectionProps) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchTeams = async () => {
        if (!workspaceId) {
            setIsLoading(false);
            return;
        }

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceId]);

    const handleTeamCreated = () => {
        fetchTeams();
    };

    if (!workspaceId || !workspaceSlug) {
        return null;
    }

    const buildTeamUrl = (team: Team) => {
        // Use identifier if available, otherwise fallback to ID
        const teamSlug = team.identifier || team.id;
        return `/${workspaceSlug}/${teamSlug}`;
    };

    const isTeamActive = (team: Team) => {
        const teamSlug = team.identifier || team.id;
        const teamBasePath = `/${workspaceSlug}/${teamSlug}`;
        return pathname === teamBasePath || pathname.startsWith(`${teamBasePath}/`);
    };

    return (
        <>
            <CollapsibleGroup
                defaultOpen={teams.length > 0}
                headerAction={
                    <Button
                        className="size-6 p-0"
                        onClick={() => setIsDialogOpen(true)}
                        size="icon"
                        variant="ghost"
                    >
                        <IconPlus className="size-4" />
                    </Button>
                }
                label="Your teams"
            >
                {isLoading ? (
                    <div className="flex flex-col gap-0.5">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5"
                            >
                                <Skeleton className="size-4 shrink-0" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </div>
                ) : teams.length === 0 ? (
                    <div className="px-2 py-1.5 text-muted-foreground text-xs">
                        No teams yet
                    </div>
                ) : (
                    teams.map((team) => (
                        <NavLink
                            href={buildTeamUrl(team)}
                            icon={
                                <span className="text-xs">
                                    {team.icon || "👥"}
                                </span>
                            }
                            isActive={isTeamActive(team)}
                            key={team.id}
                        >
                            <span className="font-[480] text-[12.5px]">{team.name}</span>
                        </NavLink>
                    ))
                )}
            </CollapsibleGroup>

            {workspaceId && (
                <CreateTeamDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    workspaceId={workspaceId}
                    onSuccess={handleTeamCreated}
                />
            )}
        </>
    );
}

