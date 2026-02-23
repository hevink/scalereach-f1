"use client";

import { isToday } from "date-fns";
import { useCalendarContext } from "./calendar-context";
import { getCalendarCells, getPostsForDate, WEEK_DAYS } from "./helpers";
import { PostBadge } from "./post-badge";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 3;

export function CalendarMonthView() {
  const { selectedDate, setSelectedDate, setView, posts, openCreateModal } = useCalendarContext();
  const cells = getCalendarCells(selectedDate);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="flex items-center justify-center py-2">
            <span className="text-xs font-medium text-muted-foreground">{d}</span>
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const dayPosts = getPostsForDate(posts, cell.date);
          const isSunday = cell.date.getDay() === 0;
          const today = isToday(cell.date);

          const handleDayClick = () => {
            setSelectedDate(cell.date);
            setView("day");
          };

          return (
            <div
              key={cell.date.toISOString()}
              className={cn(
                "group flex min-h-[100px] flex-col gap-1 border-l border-t p-1.5 lg:min-h-[120px]",
                isSunday && "border-l-0",
                !cell.currentMonth && "bg-muted/20"
              )}
              onClick={() => openCreateModal(cell.date)}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDayClick(); }}
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    !cell.currentMonth && "opacity-30",
                    today && "bg-primary text-primary-foreground hover:bg-primary"
                  )}
                >
                  {cell.day}
                </button>
                <span className="hidden text-[10px] text-muted-foreground/50 group-hover:inline">
                  + add
                </span>
              </div>

              <div
                className={cn("flex flex-col gap-0.5", !cell.currentMonth && "opacity-50")}
                onClick={(e) => e.stopPropagation()}
              >
                {dayPosts.slice(0, MAX_VISIBLE).map((post) => (
                  <PostBadge key={post.id} post={post} compact />
                ))}
                {dayPosts.length > MAX_VISIBLE && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDayClick(); }}
                    className="text-left text-[11px] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none"
                  >
                    +{dayPosts.length - MAX_VISIBLE} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
