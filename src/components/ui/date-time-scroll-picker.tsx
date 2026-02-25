"use client";

import { format } from "date-fns";
import { IconCalendar } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DateTimeScrollPickerProps {
    value: Date | undefined;
    onChange: (date: Date) => void;
    placeholder?: string;
    className?: string;
}

export function DateTimeScrollPicker({
    value,
    onChange,
    placeholder = "MM/DD/YYYY hh:mm aa",
    className,
}: DateTimeScrollPickerProps) {
    function setHour(hour: number) {
        const d = new Date(value || new Date());
        d.setHours(d.getHours() >= 12 ? hour + 12 : hour);
        onChange(d);
    }

    function setMinute(minute: number) {
        const d = new Date(value || new Date());
        d.setMinutes(minute);
        onChange(d);
    }

    function setAmPm(ampm: "AM" | "PM") {
        const d = new Date(value || new Date());
        const h = d.getHours();
        if (ampm === "AM" && h >= 12) d.setHours(h - 12);
        else if (ampm === "PM" && h < 12) d.setHours(h + 12);
        onChange(d);
    }

    return (
        <Popover>
            <PopoverTrigger
                className={cn(
                    "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    !value && "text-muted-foreground",
                    className
                )}
            >
                <span>{value ? format(value, "MM/dd/yyyy hh:mm aa") : placeholder}</span>
                <IconCalendar size={15} className="opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="sm:flex">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={(date) => { if (date) onChange(date); }}
                        initialFocus
                    />
                    <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                        {/* Hours */}
                        <ScrollArea className="w-64 sm:w-auto">
                            <div className="flex sm:flex-col p-2">
                                {Array.from({ length: 12 }, (_, i) => i + 1).reverse().map((hour) => (
                                    <Button
                                        key={hour}
                                        size="icon"
                                        variant={value && value.getHours() % 12 === hour % 12 ? "default" : "ghost"}
                                        className="sm:w-full shrink-0 aspect-square"
                                        onClick={() => setHour(hour)}
                                    >
                                        {hour}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="sm:hidden" />
                        </ScrollArea>
                        {/* Minutes */}
                        <ScrollArea className="w-64 sm:w-auto">
                            <div className="flex sm:flex-col p-2">
                                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                                    <Button
                                        key={minute}
                                        size="icon"
                                        variant={value && value.getMinutes() === minute ? "default" : "ghost"}
                                        className="sm:w-full shrink-0 aspect-square"
                                        onClick={() => setMinute(minute)}
                                    >
                                        {minute.toString().padStart(2, "0")}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="sm:hidden" />
                        </ScrollArea>
                        {/* AM/PM */}
                        <ScrollArea>
                            <div className="flex sm:flex-col p-2">
                                {(["AM", "PM"] as const).map((ampm) => (
                                    <Button
                                        key={ampm}
                                        size="icon"
                                        variant={value && ((ampm === "AM" && value.getHours() < 12) || (ampm === "PM" && value.getHours() >= 12)) ? "default" : "ghost"}
                                        className="sm:w-full shrink-0 aspect-square"
                                        onClick={() => setAmPm(ampm)}
                                    >
                                        {ampm}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
