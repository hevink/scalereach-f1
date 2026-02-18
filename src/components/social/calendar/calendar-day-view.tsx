"use client";

import { format, isToday } from "date-fns";
import { useCalendarContext } from "./calendar-context";
import { getPostsForDate } from "./helpers";
import { PostBadge } from "./post-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CalendarDayView() {
  const { selectedDate, posts, openCreateModal } = useCalendarContext();
  const dayPosts = getPostsForDate(posts, selectedDate);
  const today = isToday(selectedDate);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Day header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-12 flex-col items-center justify-center rounded-xl border",
              today && "border-primary"
            )}
          >
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

      {/* Posts */}
      {dayPosts.length === 0 ? (
        <button
          type="button"
          onClick={() => openCreateModal(selectedDate)}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/10 py-16 text-muted-foreground hover:bg-muted/20 hover:text-foreground transition-colors"
        >
          <p className="text-sm">No posts scheduled. Click to add one.</p>
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          {dayPosts.map((post) => (
            <PostBadge key={post.id} post={post} />
          ))}
          <button
            type="button"
            onClick={() => openCreateModal(selectedDate)}
            className="mt-1 rounded-lg border border-dashed py-2 text-xs text-muted-foreground hover:bg-muted/20 hover:text-foreground transition-colors"
          >
            + Add another post
          </button>
        </div>
      )}
    </div>
  );
}
