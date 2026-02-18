"use client";

import { addDays, format, isToday, startOfWeek } from "date-fns";
import { useCalendarContext } from "./calendar-context";
import { getPostsForDate, WEEK_DAYS } from "./helpers";
import { PostBadge } from "./post-badge";
import { cn } from "@/lib/utils";

export function CalendarWeekView() {
  const { selectedDate, setSelectedDate, setView, posts, openCreateModal } = useCalendarContext();

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day, i) => {
          const today = isToday(day);
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 py-2">
              <span className="text-xs text-muted-foreground">{WEEK_DAYS[day.getDay()]}</span>
              <button
                type="button"
                onClick={() => { setSelectedDate(day); setView("day"); }}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-sm font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  today && "bg-primary text-primary-foreground hover:bg-primary"
                )}
              >
                {format(day, "d")}
              </button>
            </div>
          );
        })}
      </div>

      {/* Post rows */}
      <div className="grid grid-cols-7 divide-x">
        {weekDays.map((day, i) => {
          const dayPosts = getPostsForDate(posts, day);
          return (
            <div
              key={i}
              className="group flex min-h-[400px] cursor-pointer flex-col gap-1 p-1.5 hover:bg-muted/20"
              onClick={() => openCreateModal(day)}
            >
              {dayPosts.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-1">
                  <span className="text-[11px] text-muted-foreground/40">—</span>
                  <span className="hidden text-[10px] text-muted-foreground/40 group-hover:inline">
                    + add
                  </span>
                </div>
              ) : (
                <div
                  className="flex flex-col gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {dayPosts.map((post) => (
                    <PostBadge key={post.id} post={post} compact />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
