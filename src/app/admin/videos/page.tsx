"use client";

import { useState } from "react";
import { AdminVideosTable } from "@/components/admin/admin-videos-table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IconCalendar } from "@tabler/icons-react";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";

export default function AdminVideosPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Videos</h1>
                    <p className="text-sm text-muted-foreground">Video processing and analytics</p>
                </div>
                <Popover>
                    <PopoverTrigger className="inline-flex items-center justify-start gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal hover:bg-accent hover:text-accent-foreground">
                        <IconCalendar className="h-4 w-4" />
                        {dateRange?.from && dateRange?.to
                            ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                            : "Pick a date range"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <div className="flex">
                            <div className="border-r p-2 space-y-1">
                                {[{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }].map((p) => (
                                    <Button key={p.days} variant="ghost" size="sm" className="w-full justify-start"
                                        onClick={() => setDateRange({ from: subDays(new Date(), p.days), to: new Date() })}>
                                        {p.label}
                                    </Button>
                                ))}
                            </div>
                            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from}
                                selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <AdminVideosTable dateRange={dateRange} />
        </div>
    );
}
