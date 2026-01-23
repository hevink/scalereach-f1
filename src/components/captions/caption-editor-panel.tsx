"use client";

import { useState, useCallback } from "react";
import { useCaptionEditor } from "@/hooks/useCaptionEditor";
import { WordTimeline } from "./word-timeline";
import { WordEditor } from "./word-editor";
import { CaptionStylePanel } from "./caption-style-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Undo2, Redo2, RotateCcw, Save, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CaptionEditorPanelProps {
  clipId: string;
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

export function CaptionEditorPanel({
  clipId,
  duration,
  currentTime,
  onSeek,
}: CaptionEditorPanelProps) {
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const {
    words,
    style,
    templateId,
    isEdited,
    isDirty,
    isLoading,
    isSaving,
    updateWord,
    addWord,
    removeWord,
    updateStyle,
    applyTemplate,
    save,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useCaptionEditor(clipId);

  const handleWordTimingChange = useCallback(
    (wordId: string, start: number, end: number) => {
      updateWord(wordId, { start, end });
    },
    [updateWord]
  );

  const handleWordEdit = useCallback(
    (wordId: string, text: string) => {
      updateWord(wordId, { word: text });
    },
    [updateWord]
  );

  const handleAddWord = useCallback(
    (afterWordId: string | null) => {
      // Find a good default timing
      let start = currentTime;
      let end = currentTime + 0.5;

      if (afterWordId) {
        const afterWord = words.find((w) => w.id === afterWordId);
        if (afterWord) {
          start = afterWord.end;
          end = afterWord.end + 0.5;
        }
      }

      addWord("word", start, Math.min(end, duration), afterWordId ?? undefined);
    },
    [words, currentTime, duration, addWord]
  );

  const handleStyleChange = useCallback(
    (newStyle: typeof style) => {
      if (newStyle) {
        updateStyle(newStyle);
      }
    },
    [updateStyle]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResetDialog(true)}
            title="Reset to original"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-muted-foreground">Unsaved changes</span>
          )}
          {isEdited && !isDirty && (
            <span className="text-xs text-amber-500">Edited</span>
          )}
          <Button
            size="sm"
            onClick={save}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Reset Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Captions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all caption edits to the original transcript. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { reset(false); setShowResetDialog(false); }}>
              Reset Words Only
            </AlertDialogAction>
            <AlertDialogAction onClick={() => { reset(true); setShowResetDialog(false); }}>
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue="words" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="words">Words & Timing</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
        </TabsList>

        <TabsContent value="words" className="space-y-4 mt-4">
          {/* Timeline */}
          <WordTimeline
            words={words}
            duration={duration}
            currentTime={currentTime}
            selectedWordId={selectedWordId}
            onWordSelect={setSelectedWordId}
            onWordTimingChange={handleWordTimingChange}
            onSeek={onSeek}
          />

          {/* Word Editor */}
          <WordEditor
            words={words}
            selectedWordId={selectedWordId}
            currentTime={currentTime}
            onWordSelect={setSelectedWordId}
            onWordEdit={handleWordEdit}
            onWordDelete={removeWord}
            onWordAdd={handleAddWord}
          />

          {/* Selected word timing */}
          {selectedWordId && (
            <SelectedWordTiming
              word={words.find((w) => w.id === selectedWordId)}
              onTimingChange={(start, end) =>
                handleWordTimingChange(selectedWordId, start, end)
              }
            />
          )}
        </TabsContent>

        <TabsContent value="style" className="mt-4">
          {style && (
            <CaptionStylePanel
              style={style}
              onChange={handleStyleChange}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SelectedWordTiming({
  word,
  onTimingChange,
}: {
  word?: { id: string; word: string; start: number; end: number };
  onTimingChange: (start: number, end: number) => void;
}) {
  if (!word) return null;

  return (
    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium">"{word.word}"</span>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Start:</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={word.start.toFixed(1)}
          onChange={(e) => onTimingChange(parseFloat(e.target.value), word.end)}
          className="w-20 h-7 px-2 text-sm rounded border bg-background"
        />
        <span className="text-xs text-muted-foreground">s</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">End:</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={word.end.toFixed(1)}
          onChange={(e) => onTimingChange(word.start, parseFloat(e.target.value))}
          className="w-20 h-7 px-2 text-sm rounded border bg-background"
        />
        <span className="text-xs text-muted-foreground">s</span>
      </div>
      <span className="text-xs text-muted-foreground">
        Duration: {(word.end - word.start).toFixed(1)}s
      </span>
    </div>
  );
}
