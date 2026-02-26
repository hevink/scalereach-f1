"use client";

import { format, parseISO } from "date-fns";
import { IconVideo } from "@tabler/icons-react";
import { useCalendarContext } from "./calendar-context";
import { getPostDate, PLATFORM_LABELS, POST_STATUS_STYLES } from "./helpers";
import {
  YouTubeIcon,
  TikTokIcon,
  InstagramIcon,
  TwitterIcon,
  LinkedInIcon,
  FacebookIcon,
} from "@/components/icons/platform-icons";
import type { ScheduledPost } from "@/lib/api/social";

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  instagram_reels: InstagramIcon,
  youtube: YouTubeIcon,
  youtube_shorts: YouTubeIcon,
  twitter: TwitterIcon,
  linkedin: LinkedInIcon,
  facebook: FacebookIcon,
};

interface PostBadgeProps {
  post: ScheduledPost;
  compact?: boolean;
}

export function PostBadge({ post, compact = false }: PostBadgeProps) {
  const { setSelectedDate, setView, openEditModal } = useCalendarContext();
  const styles = POST_STATUS_STYLES[post.status] ?? POST_STATUS_STYLES.pending;
  const postDate = getPostDate(post);
  const platformLabel = PLATFORM_LABELS[post.platform] ?? post.platform;
  const isEditable = post.status === "pending";
  const PlatformIcon = PLATFORM_ICONS[post.platform];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditable) {
      openEditModal(post);
    } else {
      setSelectedDate(postDate);
      setView("day");
    }
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
        {PlatformIcon ? (
          <PlatformIcon className="size-3 shrink-0" />
        ) : (
          <span className={`size-1.5 shrink-0 rounded-full ${styles.dot}`} />
        )}
        <span className="truncate">{post.clipTitle || platformLabel}</span>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick(e as unknown as React.MouseEvent)}
      className={`flex cursor-pointer select-none items-start gap-3 rounded-lg border p-3 text-sm ${styles.bg} ${styles.text} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
    >
      {/* Thumbnail */}
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted/40">
        {post.clipThumbnailUrl ? (
          <img
            src={post.clipThumbnailUrl}
            alt={post.clipTitle || ""}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <IconVideo size={18} className="opacity-30" />
          </div>
        )}
        {/* Platform icon badge on thumbnail */}
        {PlatformIcon && (
          <div className="absolute bottom-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-background shadow">
            <PlatformIcon className="size-2.5" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-xs font-semibold">
            {post.clipTitle || "Untitled clip"}
          </span>
          <span className="shrink-0 text-[10px] capitalize opacity-60">{post.status}</span>
        </div>
        <div className="flex items-center gap-1">
          {PlatformIcon && <PlatformIcon className="size-3 shrink-0 opacity-70" />}
          <span className="text-[11px] opacity-60">{platformLabel}</span>
        </div>
        {post.caption && (
          <p className="line-clamp-1 text-[11px] opacity-50">{post.caption}</p>
        )}
        {post.scheduledAt && (
          <p className="text-[11px] opacity-50">
            {format(parseISO(post.scheduledAt), "h:mm a")}
          </p>
        )}
        {isEditable && (
          <span className="text-[10px] opacity-40 hover:opacity-80">Edit →</span>
        )}
      </div>
    </div>
  );
}
