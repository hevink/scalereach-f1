"use client";

/**
 * Copy Interface Component
 * Provides clipboard copy functionality with visual feedback
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { useState, useEffect } from "react";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export interface CopyInterfaceProps {
    text: string;
    label?: string;
    className?: string;
}

export function CopyInterface({ text, label, className }: CopyInterfaceProps) {
    const [copied, setCopied] = useState(false);

    // Reset copied state after 2 seconds
    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timeout);
        }
    }, [copied]);

    const handleCopy = async () => {
        try {
            // Try using the Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                toast.success("Link copied to clipboard!");
            } else {
                // Fallback: select the text for manual copying
                const input = document.getElementById("copy-input") as HTMLInputElement;
                if (input) {
                    input.select();
                    input.setSelectionRange(0, 99999); // For mobile devices

                    // Try the old execCommand method
                    const success = document.execCommand("copy");
                    if (success) {
                        setCopied(true);
                        toast.success("Link copied to clipboard!");
                    } else {
                        throw new Error("Copy failed");
                    }
                }
            }
        } catch (error) {
            console.error("Failed to copy:", error);
            toast.error("Failed to copy link. Please copy manually.");

            // Select the text so user can copy manually
            const input = document.getElementById("copy-input") as HTMLInputElement;
            if (input) {
                input.select();
            }
        }
    };

    // Handle keyboard shortcut (Cmd/Ctrl+C)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "c") {
            handleCopy();
        }
    };

    return (
        <div className={className}>
            {label && (
                <label className="text-sm font-medium mb-2 block">
                    {label}
                </label>
            )}
            <div className="flex gap-2">
                <Input
                    id="copy-input"
                    type="text"
                    value={text}
                    readOnly
                    onKeyDown={handleKeyDown}
                    className="font-mono text-sm"
                    onClick={(e) => e.currentTarget.select()}
                />
                <Button
                    onClick={handleCopy}
                    variant={copied ? "default" : "outline"}
                    className="shrink-0 gap-2"
                >
                    {copied ? (
                        <>
                            <IconCheck className="size-4" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <IconCopy className="size-4" />
                            Copy
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
