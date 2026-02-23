"use client";

import { format } from "date-fns";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useCalendarContext } from "./calendar-context";
import { navigateDate, rangeText, getPostsForView } from "./helpers";
import type { TCalendarView } from "./types";

const VIEW_LABELS: Record<TCalendarView, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
};

export function CalendarHeader() {
  const { selectedDate, setSelectedDate, view, setView, posts } = useCalendarContext();

  const visiblePosts = getPostsForView(posts, selectedDate, view);

  const handlePrev = () => setSelectedDate(navigateDate(selectedDate, view, "previous"));
  const handleNext = () => setSelectedDate(navigateDate(selectedDate, view, "next"));
  const handleToday = () => setSelectedDate(new Date());

  return (
    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: today + nav */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleToday}>
          Today
        </Button>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8" onClick={handlePrev}>
            <IconChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={handleNext}>
            <IconChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-base leading-tight">
            {format(selectedDate, "MMMM yyyy")}
          </span>
          <span className="text-xs text-muted-foreground">
            {rangeText(view, selectedDate)} · {visiblePosts.length} post{visiblePosts.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Right: view switcher */}
      <div className="flex items-center gap-1 rounded-lg border p-0.5">
        {(["month", "week", "day"] as TCalendarView[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              view === v
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  );
}
