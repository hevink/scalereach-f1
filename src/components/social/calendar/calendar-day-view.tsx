"use client";

import { format, isToday, parseISO } from "date-fns";
import { useCalendarContext } from "./calendar-context";
import { getPostsForDate } from "./helpers";
import { PostBadge } from "./post-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ScheduledPost } from "@/lib/api/social";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getPostHour(post: ScheduledPost): number {
  const d = post.scheduledAt ? parseISO(post.scheduledAt) : parseISO(post.createdAt);
  return d.getHours();
}

export function CalendarDayView() {
  const { selectedDate, posts, openCreateModal } = useCalendarContext();
  const dayPosts = getPostsForDate(posts, selectedDate);
  const today = isToday(selectedDate);
  const currentHour = new Date().getHours();

  // Group posts by hour
  const postsByHour = new Map<number, ScheduledPost[]>();
  for (const post of dayPosts) {
    const h = getPostHour(post);
    if (!postsByHour.has(h)) postsByHour.set(h, []);
    postsByHour.get(h)!.push(post);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("flex size-12 flex-col items-center justify-center rounded-xl border", today && "border-primary")}>
            <span className={cn("text-xs font-semibold uppercase", today && "text-primary")}>
              {format(selectedDate, "EEE")}
            </span>
            <span className={cn("text-xl font-bold leading-none", today && "text-primary")}>
              {format(selectedDate, "d")}
            </span>
          </div>
          <div>
            <p className="font-semibold">{format(selectedDate, "MMMM d, yyyy")}</p>
            <p className="text-sm text-muted-foreground">
              {dayPosts.length} post{dayPosts.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => openCreateModal(selectedDate)}>
          + Schedule Post
        </Button>
      </div>

      {/* 24-hour timeline */}
      <div className="flex-1 overflow-y-auto">
        {HOURS.map((hour) => {
          const hourPosts = postsByHour.get(hour) ?? [];
          const isCurrentHour = today && hour === currentHour;
          const label = hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;

          return (
            <div
              key={hour}
              className={cn(
                "group flex min-h-[56px] border-b",
                isCurrentHour && "bg-primary/5"
              )}
            >
              {/* Hour label */}
              <div className="flex w-16 shrink-0 items-start justify-end pr-3 pt-2">
                <span className={cn(
                  "text-[11px] font-medium tabular-nums",
                  isCurrentHour ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {label}
                </span>
              </div>

              {/* Divider */}
              <div className={cn("w-px shrink-0 self-stretch", isCurrentHour ? "bg-primary" : "bg-border")} />

              {/* Posts in this hour */}
              <div
                className="flex flex-1 cursor-pointer flex-col gap-1.5 px-3 py-2 hover:bg-muted/20"
                onClick={() => openCreateModal(selectedDate)}
              >
                {hourPosts.length > 0 && (
                  <div
                    className="flex flex-col gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hourPosts.map((post) => (
                      <PostBadge key={post.id} post={post} />
                    ))}
                  </div>
                )}
                {hourPosts.length === 0 && (
                  <span className="hidden text-[11px] text-muted-foreground/40 group-hover:inline">
                    + add
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
