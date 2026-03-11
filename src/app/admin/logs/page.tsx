"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    IconPlayerPause, IconPlayerPlay, IconTrash,
    IconArrowDown, IconArrowUp,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface LogLine {
    line: string;
    err: boolean;
    ts: string;
}

function colorClass(msg: string, isErr: boolean): string {
    if (isErr || /error|err:|failed|exception|fatal/i.test(msg)) return "text-red-400";
    if (/warn|warning/i.test(msg)) return "text-yellow-400";
    if (/✓|success|done|complete|started|running|healthy/i.test(msg)) return "text-emerald-400";
    if (/\[info\]|info:/i.test(msg)) return "text-blue-400";
    return "text-zinc-300";
}

export default function WorkerLogsPage() {
    const [lines, setLines] = useState<LogLine[]>([]);
    const [status, setStatus] = useState<"connecting" | "live" | "disconnected">("connecting");
    const [paused, setPaused] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [logType, setLogType] = useState("both");
    const [lineCount, setLineCount] = useState("100");
    const wrapRef = useRef<HTMLDivElement>(null);
    const esRef = useRef<EventSource | null>(null);
    const pausedRef = useRef(false);

    pausedRef.current = paused;

    const connect = useCallback(() => {
        if (esRef.current) esRef.current.close();
        setStatus("connecting");

        const url = `${API_BASE}/api/admin/worker-logs/stream?type=${logType}&lines=${lineCount}`;
        const es = new EventSource(url, { withCredentials: true });
        esRef.current = es;

        es.onopen = () => setStatus("live");
        es.onmessage = (e) => {
            if (pausedRef.current) return;
            const d = JSON.parse(e.data);
            const ts = new Date().toTimeString().slice(0, 8);
            setLines((prev) => {
                const next = [...prev, { line: d.line, err: d.err, ts }];
                return next.length > 2000 ? next.slice(-2000) : next;
            });
        };
        es.onerror = () => {
            setStatus("disconnected");
            setTimeout(() => {
                if (esRef.current === es) connect();
            }, 3000);
        };
    }, [logType, lineCount]);

    useEffect(() => {
        connect();
        return () => { esRef.current?.close(); };
    }, [connect]);

    useEffect(() => {
        if (autoScroll && wrapRef.current) {
            wrapRef.current.scrollTop = wrapRef.current.scrollHeight;
        }
    }, [lines, autoScroll]);

    const reconnect = () => {
        setLines([]);
        connect();
    };

    const byteCount = lines.reduce((acc, l) => acc + l.line.length, 0);

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
                            status === "live" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                            status === "connecting" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                            status === "disconnected" && "bg-red-500/10 text-red-600 border-red-500/20",
                        )}
                    >
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-full mr-1.5 inline-block",
                            status === "live" && "bg-emerald-500 animate-pulse",
                            status === "connecting" && "bg-amber-500 animate-pulse",
                            status === "disconnected" && "bg-red-500",
                        )} />
                        {status === "live" ? "Live" : status === "connecting" ? "Connecting…" : "Disconnected"}
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={logType} onValueChange={(v) => { setLogType(v); }}>
                        <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="out">stdout</SelectItem>
                            <SelectItem value="err">stderr</SelectItem>
                            <SelectItem value="both">both</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={lineCount} onValueChange={(v) => { setLineCount(v); }}>
                        <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="100">Last 100</SelectItem>
                            <SelectItem value="200">Last 200</SelectItem>
                            <SelectItem value="500">Last 500</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" className="h-8" onClick={reconnect}>
                        Reconnect
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

                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLines([])} title="Clear">
                        <IconTrash className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Log output */}
            <div
                ref={wrapRef}
                className="flex-1 overflow-y-auto rounded-lg border bg-zinc-950 p-3 font-mono text-xs leading-relaxed"
            >
                {lines.length === 0 ? (
                    <p className="text-zinc-600 text-center py-12">Waiting for logs…</p>
                ) : (
                    lines.map((l, i) => (
                        <div key={i} className="flex gap-3 py-px hover:bg-zinc-900/50 rounded">
                            <span className="text-zinc-600 select-none shrink-0 text-[11px]">{l.ts}</span>
                            <span className={cn("whitespace-pre-wrap break-all", colorClass(l.line, l.err))}>{l.line}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Status bar */}
            <div className="flex gap-4 pt-2 text-[11px] text-zinc-500 flex-shrink-0">
                <span>{lines.length} lines</span>
                <span>{(byteCount / 1024).toFixed(1)} KB</span>
                {lines.length > 0 && <span>Last: {lines[lines.length - 1].ts}</span>}
            </div>
        </div>
    );
}
