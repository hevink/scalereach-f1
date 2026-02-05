"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CaptionWord } from "@/lib/api/captions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface WordEditorProps {
  words: CaptionWord[];
  selectedWordId: string | null;
  currentTime: number;
  onWordSelect: (wordId: string | null) => void;
  onWordEdit: (wordId: string, text: string) => void;
  onWordDelete: (wordId: string) => void;
  onWordAdd: (afterWordId: string | null) => void;
}

export function WordEditor({
  words,
  selectedWordId,
  currentTime,
  onWordSelect,
  onWordEdit,
  onWordDelete,
  onWordAdd,
}: WordEditorProps) {
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = useCallback((word: CaptionWord) => {
    setEditingWordId(word.id);
    setEditText(word.word);
    onWordSelect(word.id);
  }, [onWordSelect]);

  const finishEditing = useCallback(() => {
    if (editingWordId && editText.trim()) {
      onWordEdit(editingWordId, editText.trim());
    }
    setEditingWordId(null);
    setEditText("");
  }, [editingWordId, editText, onWordEdit]);

  const cancelEditing = useCallback(() => {
    setEditingWordId(null);
    setEditText("");
  }, []);

  useEffect(() => {
    if (editingWordId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingWordId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, wordIndex: number) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishEditing();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEditing();
      } else if (e.key === "Tab") {
        e.preventDefault();
        finishEditing();
        const nextWord = e.shiftKey ? words[wordIndex - 1] : words[wordIndex + 1];
        if (nextWord) {
          startEditing(nextWord);
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (editText === "" && editingWordId) {
          e.preventDefault();
          onWordDelete(editingWordId);
          cancelEditing();
        }
      }
    },
    [finishEditing, cancelEditing, words, startEditing, editText, editingWordId, onWordDelete]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Words</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onWordAdd(selectedWordId)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Word
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 p-3 bg-muted/50 rounded-lg min-h-[80px]">
        {words.map((word, index) => {
          const isSelected = word.id === selectedWordId;
          const isEditing = word.id === editingWordId;
          const isCurrent = currentTime >= word.start && currentTime <= word.end;

          return (
            <div key={word.id} className="relative group">
              {isEditing ? (
                <Input
                  ref={inputRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={finishEditing}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="h-7 w-auto min-w-[60px] text-sm px-2"
                  style={{ width: `${Math.max(editText.length * 8 + 20, 60)}px` }}
                />
              ) : (
                <button
                  className={cn(
                    "px-2 py-1 rounded text-sm transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-primary/20 text-primary"
                      : "bg-background hover:bg-accent"
                  )}
                  onClick={() => onWordSelect(word.id)}
                  onDoubleClick={() => startEditing(word)}
                >
                  {word.word}
                </button>
              )}

              {isSelected && !isEditing && (
                <button
                  className="absolute -top-2 -right-2 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWordDelete(word.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}

        {words.length === 0 && (
          <span className="text-sm text-muted-foreground">
            No words. Click "Add Word" to add captions.
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Click to select • Double-click to edit • Tab to move between words • Delete to remove
      </p>
    </div>
  );
}
