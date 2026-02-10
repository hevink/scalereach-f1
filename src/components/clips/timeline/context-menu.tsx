"use client";

import * as React from "react";
import { useTimelineContext } from "./timeline-container";

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
}

export function ContextMenu({ x, y, onClose }: ContextMenuProps) {
    const {
        currentTime,
        addMarker,
        setLoopRegion,
        setZoom,
        setScrollLeft,
        state,
        clipDuration,
    } = useTimelineContext();

    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    const items: { label: string; shortcut?: string; action: () => void; disabled?: boolean; separator?: boolean }[] = [
        {
            label: "Add marker here",
            shortcut: "M",
            action: () => {
                addMarker(currentTime);
                onClose();
            },
        },
        {
            label: "Set loop in-point",
            shortcut: "[",
            action: () => {
                setLoopRegion({
                    inPoint: currentTime,
                    outPoint: state.loopRegion?.outPoint ?? clipDuration,
                    enabled: true,
                });
                onClose();
            },
        },
        {
            label: "Set loop out-point",
            shortcut: "]",
            action: () => {
                setLoopRegion({
                    inPoint: state.loopRegion?.inPoint ?? 0,
                    outPoint: currentTime,
                    enabled: true,
                });
                onClose();
            },
        },
        {
            label: "Clear loop region",
            disabled: !state.loopRegion,
            action: () => {
                setLoopRegion(null);
                onClose();
            },
            separator: true,
        },
        {
            label: "Zoom to fit",
            action: () => {
                // Fit entire clip in view: set zoom to 1 and scroll to start
                setZoom(1);
                setScrollLeft(0);
                onClose();
            },
        },
        {
            label: "Reset zoom to 1x",
            disabled: state.zoomLevel === 1,
            action: () => {
                // Reset zoom without changing scroll position
                setZoom(1);
                onClose();
            },
        },
    ];

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] bg-zinc-800 border border-zinc-700 rounded-md shadow-xl py-1 min-w-[200px] animate-in fade-in duration-150"
            style={{ left: x, top: y }}
        >
            {items.map((item, i) => (
                <React.Fragment key={i}>
                    <button
                        className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-zinc-700 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={item.action}
                        disabled={item.disabled}
                    >
                        <span className="text-zinc-200">{item.label}</span>
                        {item.shortcut && (
                            <span className="text-zinc-500 text-[10px] ml-4 font-mono">{item.shortcut}</span>
                        )}
                    </button>
                    {item.separator && <div className="h-px bg-zinc-700 my-1" />}
                </React.Fragment>
            ))}
        </div>
    );
}
