"use client";

import { format, parseISO } from "date-fns";
import { useCalendarContext } from "./calendar-context";
import { getPostDate, PLATFORM_LABELS, POST_STATUS_STYLES } from "./helpers";
import type { ScheduledPost } from "@/lib/api/social";

interface PostBadgeProps {
  post: ScheduledPost;
  compact?: boolean;
}

export function PostBadge({ post, compact = false }: PostBadgeProps) {
  const { setSelectedDate, setView } = useCalendarContext();
  const styles = POST_STATUS_STYLES[post.status] ?? POST_STATUS_STYLES.pending;
  const postDate = getPostDate(post);
  const platformLabel = PLATFORM_LABELS[post.platform] ?? post.platform;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(postDate);
    setView("day");
  };

  if (compact) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick(e as unknown as React.MouseEvent)}
        className={`flex cursor-pointer items-center gap-1 truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${styles.bg} ${styles.text} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
      >
        <span className={`size-1.5 shrink-0 rounded-full ${styles.dot}`} />
        <span className="truncate">{platformLabel}</span>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick(e as unknown as React.MouseEvent)}
      className={`flex cursor-pointer select-none items-start justify-between gap-3 rounded-lg border p-3 text-sm ${styles.bg} ${styles.text} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
    >
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`size-2 shrink-0 rounded-full ${styles.dot}`} />
          <span className="font-semibold truncate">{platformLabel}</span>
          <span className="text-[11px] opacity-70 capitalize">{post.status}</span>
        </div>
        {post.caption && (
          <p className="truncate text-xs opacity-80">{post.caption}</p>
        )}
        {post.scheduledAt && (
          <p className="text-[11px] opacity-60">
            {format(parseISO(post.scheduledAt), "h:mm a")}
          </p>
        )}
      </div>
    </div>
  );
}
