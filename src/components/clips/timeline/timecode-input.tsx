"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatTime, parseTime, clamp } from "./utils";

interface TimecodeInputProps {
    value: number;
    duration: number;
    onSeek: (time: number) => void;
}

export function TimecodeInput({ value, duration, onSeek }: TimecodeInputProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const [isInvalid, setIsInvalid] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleStartEdit = () => {
        setIsEditing(true);
        setIsInvalid(false);
        setInputValue(formatTime(value));
        setTimeout(() => inputRef.current?.select(), 0);
    };

    const handleSubmit = () => {
        const parsed = parseTime(inputValue);
        if (parsed !== null) {
            onSeek(clamp(parsed, 0, duration));
            setIsEditing(false);
            setIsInvalid(false);
        } else {
            setIsInvalid(true);
            // Shake animation resets after 500ms
            setTimeout(() => setIsInvalid(false), 500);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === "Escape") {
            setIsEditing(false);
            setIsInvalid(false);
        }
    };

    const handleBlur = () => {
        const parsed = parseTime(inputValue);
        if (parsed !== null) {
            onSeek(clamp(parsed, 0, duration));
        }
        setIsEditing(false);
        setIsInvalid(false);
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                className={cn(
                    "w-[60px] bg-zinc-800 text-white text-xs font-mono px-1 py-0.5 rounded border outline-none transition-colors",
                    isInvalid
                        ? "border-red-500 animate-[shake_0.3s_ease-in-out]"
                        : "border-zinc-600 focus:border-blue-500",
                )}
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsInvalid(false);
                }}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                autoFocus
            />
        );
    }

    return (
        <button
            className="text-white text-xs font-mono px-1 py-0.5 rounded hover:bg-zinc-800 transition-colors duration-150 cursor-text"
            onClick={handleStartEdit}
            title="Click to enter exact time"
        >
            {formatTime(value)}
        </button>
    );
}
