"use client";

import { useState } from "react";
import { EmojiPicker } from "frimousse";
import { IconMoodSmile } from "@tabler/icons-react";
import { Button } from "./button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { cn } from "@/lib/utils";

interface EmojiSelectorProps {
  value?: string | null;
  onEmojiSelect: (emoji: string) => void;
  className?: string;
  disabled?: boolean;
}

export function EmojiSelector({
  value,
  onEmojiSelect,
  className,
  disabled,
}: EmojiSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiSelect = ({ emoji }: { emoji: string }) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn("size-10 text-xl", className)}
            disabled={disabled}
          >
            {value || <IconMoodSmile className="size-5" />}
          </Button>
        }
      />
      <PopoverContent className="w-fit p-0" align="start">
        <EmojiPicker.Root
          className="flex h-[368px] w-[352px] flex-col"
          onEmojiSelect={handleEmojiSelect}
          columns={10}
        >
          <EmojiPicker.Search
            className="mx-4 my-2 mt-4 h-10 w-[calc(100%-2rem)] min-w-0 rounded-md border border-input bg-transparent px-3.5 py-1 font-normal text-base outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
            placeholder="Search emojis..."
          />
          <EmojiPicker.Viewport className="relative flex-1 overflow-y-auto outline-hidden">
            <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Loading…
            </EmojiPicker.Loading>
            <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              No emoji found.
            </EmojiPicker.Empty>
            <EmojiPicker.List
              className="select-none pb-1.5"
              components={{
                CategoryHeader: ({ category, ...props }) => (
                  <div
                    className="bg-background px-3 py-2 font-medium text-muted-foreground text-xs"
                    {...props}
                  >
                    {category.label}
                  </div>
                ),
                Row: ({ children, ...props }) => (
                  <div className="scroll-my-2 px-1.5" {...props}>
                    {children}
                  </div>
                ),
                Emoji: ({ emoji, ...props }) => (
                  <button
                    className="flex size-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-accent data-active:bg-accent"
                    type="button"
                    {...props}
                  >
                    {emoji.emoji}
                  </button>
                ),
              }}
            />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
      </PopoverContent>
    </Popover>
  );
}
