"use client";

import { ChevronDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { getGroupedTimezoneOptions } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import {
    Combobox,
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxGroupLabel,
    ComboboxInput,
    ComboboxItem,
    ComboboxItemIndicator,
    ComboboxList,
    ComboboxPopup,
    ComboboxPositioner,
} from "./combobox";

interface TimezoneSelectorProps {
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
}

export function TimezoneSelector({
    value,
    onValueChange,
    disabled = false,
    className,
    placeholder = "Select timezone",
}: TimezoneSelectorProps) {
    const [open, setOpen] = useState(false);
    const groupedOptions = useMemo(() => getGroupedTimezoneOptions(), []);

    return (
        <Combobox
            disabled={disabled}
            onOpenChange={setOpen}
            onValueChange={(newValue) => {
                if (newValue !== value) {
                    onValueChange(newValue || "");
                    setOpen(false);
                }
            }}
            open={open}
            value={value || null}
        >
            <div className={cn("relative", className)}>
                <ComboboxInput className="pr-8" placeholder={placeholder} />
                <ComboboxPositioner>
                    <ComboboxPopup className="max-h-[300px]">
                        <ComboboxList>
                            {Object.entries(groupedOptions).map(([group, options]) => (
                                <ComboboxGroup key={group}>
                                    <ComboboxGroupLabel>{group}</ComboboxGroupLabel>
                                    {options.map((option) => (
                                        <ComboboxItem key={option.value} value={option.value}>
                                            <ComboboxItemIndicator />
                                            <div className="flex w-full flex-col items-start gap-0.5">
                                                <span className="w-full text-sm leading-tight">
                                                    {option.label}
                                                </span>
                                                <span className="w-full text-muted-foreground text-xs leading-tight">
                                                    {option.offset}
                                                </span>
                                            </div>
                                            <span className="sr-only">
                                                {`${option.label} ${option.offset} ${option.value} ${group}`}
                                            </span>
                                        </ComboboxItem>
                                    ))}
                                </ComboboxGroup>
                            ))}
                            <ComboboxEmpty>No timezone found</ComboboxEmpty>
                        </ComboboxList>
                    </ComboboxPopup>
                </ComboboxPositioner>
                <div className="pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2">
                    <ChevronDownIcon
                        className={cn(
                            "size-4 opacity-50 transition-transform duration-200",
                            open && "rotate-180"
                        )}
                    />
                </div>
            </div>
        </Combobox>
    );
}
