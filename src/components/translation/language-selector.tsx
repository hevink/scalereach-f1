"use client";

import { useState } from "react";
import {
  IconLanguage,
  IconSearch,
  IconCheck,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ALL_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" },
  { code: "cs", name: "Czech" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "nb", name: "Norwegian" },
  { code: "fi", name: "Finnish" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "uk", name: "Ukrainian" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
  { code: "el", name: "Greek" },
];

interface LanguageSelectorProps {
  sourceLanguage?: string;
  disabledLanguages?: string[];
  onSelect: (languageCode: string) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  sourceLanguage,
  disabledLanguages = [],
  onSelect,
  disabled = false,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredLanguages = ALL_LANGUAGES.filter((lang) => {
    if (lang.code === sourceLanguage) return false;
    if (search) {
      return lang.name.toLowerCase().includes(search.toLowerCase()) ||
        lang.code.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button variant="outline" className="gap-2" disabled={disabled}>
          <IconLanguage className="size-4" />
          Translate
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search languages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filteredLanguages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No languages found
            </p>
          ) : (
            filteredLanguages.map((lang) => {
              const isDisabled = disabledLanguages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md",
                    isDisabled
                      ? "text-muted-foreground cursor-not-allowed opacity-50"
                      : "hover:bg-accent cursor-pointer"
                  )}
                  disabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled) {
                      onSelect(lang.code);
                      setOpen(false);
                      setSearch("");
                    }
                  }}
                >
                  <span>{lang.name}</span>
                  {isDisabled && <IconCheck className="size-4 text-green-500" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
