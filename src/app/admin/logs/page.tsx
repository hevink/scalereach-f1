"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    IconPlayerPause, IconPlayerPlay,
    IconArrowDown, IconArrowUp, IconRefresh, IconLoader2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useWorkerLogsLive } from "@/hooks/useAdmin";

function colorClass(msg: string, isErr: boolean): string {
    if (isErr || /error|err:|failed|exception|fatal/i.test(msg)) return "text-red-400";
    if (/warn|warning/i.test(msg)) return "text-yellow-400";
    if (/✓|success|done|complete|started|running|healthy/i.test(msg)) return "text-emerald-400";
    if (/\[info\]|info:/i.test(msg)) return "text-blue-400";
    return "text-zinc-300";
}

export default function WorkerLogsPage() {
    const [paused, setPaused] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [logType, setLogType] = useState<"out" | "err" | "both">("both");
    const [lineCount, setLineCount] = useState("100");
    const wrapRef = useRef<HTMLDivElement>(null);
    const { data, isLoading, error, refetch, isRefetching } = useWorkerLogsLive(logType, Number(lineCount), !paused);

    const rawLines = data ? data.split("\n") : [];
    if (rawLines.at(-1) === "") rawLines.pop();

    let inErrSection = false;
    const lines = rawLines.map((line) => {
        if (line.includes("==> stdout <==")) inErrSection = false;
        if (line.includes("==> stderr <==")) inErrSection = true;

        return {
            text: line,
            isErr: inErrSection || line.includes("==> stderr <=="),
        };
    });

    useEffect(() => {
        if (autoScroll && wrapRef.current) {
            wrapRef.current.scrollTop = wrapRef.current.scrollHeight;
        }
    }, [lines, autoScroll]);
    const byteCount = lines.reduce((acc, line) => acc + line.text.length, 0);

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem-3rem)]">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 pb-3 flex-shrink-0 flex-wrap">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold">Live Logs</h1>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-[10px]",
                            paused && "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
                            !paused && error && "bg-red-500/10 text-red-600 border-red-500/20",
                            !paused && !error && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                        )}
                    >
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-full mr-1.5 inline-block",
                            paused && "bg-zinc-500",
                            !paused && error && "bg-red-500",
                            !paused && !error && "bg-emerald-500 animate-pulse",
                        )} />
                        {paused ? "Paused" : error ? "Refresh failed" : "Auto-refresh 15s"}
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={logType} onValueChange={(v) => { if (v) setLogType(v); }}>
                        <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="out">stdout</SelectItem>
                            <SelectItem value="err">stderr</SelectItem>
                            <SelectItem value="both">both</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={lineCount} onValueChange={(v) => { if (v) setLineCount(v); }}>
                        <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="100">Last 100</SelectItem>
                            <SelectItem value="200">Last 200</SelectItem>
                            <SelectItem value="500">Last 500</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" className="h-8" onClick={() => refetch()} disabled={isRefetching}>
                        {isRefetching ? <IconLoader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <IconRefresh className="h-3.5 w-3.5 mr-1.5" />}
                        Refresh
                    </Button>

                    <Button
                        variant={autoScroll ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setAutoScroll(!autoScroll)}
                        title={autoScroll ? "Auto-scroll on" : "Auto-scroll off"}
                    >
                        {autoScroll ? <IconArrowDown className="h-3.5 w-3.5" /> : <IconArrowUp className="h-3.5 w-3.5" />}
                    </Button>

                    <Button
                        variant={paused ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPaused(!paused)}
                        title={paused ? "Resume" : "Pause"}
                    >
                        {paused ? <IconPlayerPlay className="h-3.5 w-3.5" /> : <IconPlayerPause className="h-3.5 w-3.5" />}
                    </Button>
                </div>
            </div>

            {/* Log output */}
            <div
                ref={wrapRef}
                className="flex-1 overflow-y-auto rounded-lg border bg-zinc-950 p-3 font-mono text-xs leading-relaxed"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center py-12 text-zinc-500">
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2">Loading latest logs…</span>
                    </div>
                ) : error ? (
                    <p className="text-red-400 text-center py-12">
                        {(error as any)?.response?.data?.error || (error as any)?.message || "Failed to load logs"}
                    </p>
                ) : lines.length === 0 ? (
                    <p className="text-zinc-600 text-center py-12">No log content</p>
                ) : (
                    lines.map((line, i) => {
                        return (
                        <div key={i} className="flex gap-3 py-px hover:bg-zinc-900/50 rounded">
                            <span className="text-zinc-600 select-none shrink-0 text-[11px] w-10 text-right tabular-nums">{i + 1}</span>
                            <span className={cn("whitespace-pre-wrap break-all", colorClass(line.text, line.isErr))}>{line.text}</span>
                        </div>
                        );
                    })
                )}
            </div>

            {/* Status bar */}
            <div className="flex gap-4 pt-2 text-[11px] text-zinc-500 flex-shrink-0">
                <span>{lines.length} lines</span>
                <span>{(byteCount / 1024).toFixed(1)} KB</span>
                <span>{logType === "both" ? "stdout + stderr" : logType === "err" ? "stderr" : "stdout"}</span>
            </div>
        </div>
    );
}
