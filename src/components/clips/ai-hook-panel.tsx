"use client";

import { useState, useEffect } from "react";
import { IconSparkles, IconLoader2 } from "@tabler/icons-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface AiHookPanelProps {
    introTitle: string;
    onSave: (introTitle: string) => void;
    isSaving?: boolean;
    disabled?: boolean;
}

export function AiHookPanel({ introTitle, onSave, isSaving, disabled }: AiHookPanelProps) {
    const [text, setText] = useState(introTitle || "");
    const [enabled, setEnabled] = useState(!!introTitle);
    const hasChanges = text !== (introTitle || "");

    useEffect(() => {
        setText(introTitle || "");
        setEnabled(!!introTitle);
    }, [introTitle]);

    const handleSave = () => {
        onSave(enabled ? text.trim() : "");
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm text-zinc-300">Show hook overlay</Label>
                <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => {
                        setEnabled(checked);
                        if (!checked) onSave("");
                    }}
                    disabled={disabled}
                />
            </div>

            {enabled && (
                <>
                    <div className="space-y-2">
                        <Label className="text-xs text-zinc-400">Hook text (first 3 seconds)</Label>
                        <Textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Wait for it... 🔥"
                            className="bg-zinc-800 border-zinc-700 text-white text-sm resize-none"
                            rows={2}
                            maxLength={60}
                            disabled={disabled}
                        />
                        <p className="text-[10px] text-zinc-500">{text.length}/60 characters</p>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving || disabled}
                        className="w-full gap-2"
                        size="sm"
                    >
                        {isSaving ? (
                            <IconLoader2 className="size-3.5 animate-spin" />
                        ) : (
                            <IconSparkles className="size-3.5" />
                        )}
                        {isSaving ? "Saving..." : "Update Hook"}
                    </Button>

                    <div className="rounded-lg bg-zinc-800/50 p-3 space-y-1.5">
                        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Tips</p>
                        <ul className="text-[11px] text-zinc-500 space-y-1 list-disc pl-3">
                            <li>Keep it under 7 words for max impact</li>
                            <li>Use curiosity gaps: "Nobody talks about this"</li>
                            <li>Promise value: "This changed everything"</li>
                            <li>Add emojis for visual punch 🔥</li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}
