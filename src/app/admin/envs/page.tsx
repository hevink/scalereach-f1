"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRefresh, IconCloud, IconBolt, IconSearch } from "@tabler/icons-react";
import { useBaseEnvs, useBurstEnvs } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";

function EnvTable({ envs, filter }: { envs: Record<string, string | undefined>; filter: string }) {
    const entries = Object.entries(envs || {})
        .filter(([key]) => !filter || key.toLowerCase().includes(filter.toLowerCase()))
        .sort(([a], [b]) => a.localeCompare(b));

    if (entries.length === 0) {
        return <p className="text-sm text-muted-foreground py-4 text-center">No matching env vars</p>;
    }

    return (
        <div className="divide-y max-h-[600px] overflow-y-auto">
            {entries.map(([key, value]) => (
                <div key={key} className="flex items-start gap-3 py-2 px-1 text-xs hover:bg-muted/50 rounded">
                    <span className="font-mono font-medium text-foreground min-w-[200px] shrink-0 break-all">{key}</span>
                    <span className="font-mono text-muted-foreground break-all">{value ?? <span className="italic">undefined</span>}</span>
                </div>
            ))}
        </div>
    );
}

function EnvCard({
    title,
    icon: Icon,
    color,
    data,
    isLoading,
    isError,
    error,
    filter,
}: {
    title: string;
    icon: React.ElementType;
    color: string;
    data: { mode: string; envs: Record<string, string | undefined> } | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    filter: string;
}) {
    const envCount = data ? Object.keys(data.envs).length : 0;

    return (
        <Card className="relative overflow-hidden">
            <div className={cn("absolute top-0 left-0 right-0 h-0.5", color)} />
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Icon className="h-4 w-4" /> {title}
                    </CardTitle>
                    {data && (
                        <Badge variant="outline" className="text-[10px]">
                            {envCount} vars · {data.mode}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-5 w-full" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center">
                        <p className="text-sm text-red-600 font-medium">Failed to load</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {(error as any)?.response?.status === 502 || (error as any)?.code === "ERR_NETWORK"
                                ? "Instance appears to be offline"
                                : error?.message || "Unknown error"}
                        </p>
                    </div>
                ) : data ? (
                    <EnvTable envs={data.envs} filter={filter} />
                ) : null}
            </CardContent>
        </Card>
    );
}

export default function EnvsPage() {
    const base = useBaseEnvs();
    const burst = useBurstEnvs();
    const [filter, setFilter] = useState("");

    const refreshAll = () => {
        base.refetch();
        burst.refetch();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">Environment Variables</h1>
                    <p className="text-sm text-muted-foreground">View env vars on Base (8GB) and Burst (32GB) instances</p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshAll} disabled={base.isRefetching || burst.isRefetching}>
                    <IconRefresh className={cn("h-4 w-4 mr-2", (base.isRefetching || burst.isRefetching) && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <div className="relative max-w-sm">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter env vars..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pl-9 h-9 text-sm"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <EnvCard
                    title="Base (8GB)"
                    icon={IconCloud}
                    color="bg-blue-500"
                    data={base.data}
                    isLoading={base.isLoading}
                    isError={base.isError}
                    error={base.error}
                    filter={filter}
                />
                <EnvCard
                    title="Burst (32GB)"
                    icon={IconBolt}
                    color="bg-amber-500"
                    data={burst.data}
                    isLoading={burst.isLoading}
                    isError={burst.isError}
                    error={burst.error}
                    filter={filter}
                />
            </div>
        </div>
    );
}
