import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  isSameDay,
  isSameMonth,
  isSameWeek,
} from "date-fns";

import type { ICalendarCell, TCalendarView } from "./types";
import type { ScheduledPost } from "@/lib/api/social";

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  const totalDays = firstDay + daysInMonth;

  const prevCells: ICalendarCell[] = Array.from({ length: firstDay }, (_, i) => ({
    day: daysInPrevMonth - firstDay + i + 1,
    currentMonth: false,
    date: new Date(year, month - 1, daysInPrevMonth - firstDay + i + 1),
  }));

  const currentCells: ICalendarCell[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    currentMonth: true,
    date: new Date(year, month, i + 1),
  }));

  const nextCount = (7 - (totalDays % 7)) % 7;
  const nextCells: ICalendarCell[] = Array.from({ length: nextCount }, (_, i) => ({
    day: i + 1,
    currentMonth: false,
    date: new Date(year, month + 1, i + 1),
  }));

  return [...prevCells, ...currentCells, ...nextCells];
}

export function navigateDate(date: Date, view: TCalendarView, direction: "previous" | "next"): Date {
  const ops = {
    month: direction === "next" ? addMonths : subMonths,
    week: direction === "next" ? addWeeks : subWeeks,
    day: direction === "next" ? addDays : subDays,
  };
  return ops[view](date, 1);
}

export function rangeText(view: TCalendarView, date: Date): string {
  const fmt = "MMM d, yyyy";
  if (view === "day") return format(date, fmt);
  if (view === "week") {
    return `${format(startOfWeek(date), fmt)} – ${format(endOfWeek(date), fmt)}`;
  }
  return `${format(startOfMonth(date), fmt)} – ${format(endOfMonth(date), fmt)}`;
}

export function getPostsForDate(posts: ScheduledPost[], date: Date): ScheduledPost[] {
  return posts.filter((p) => {
    const d = p.scheduledAt ? parseISO(p.scheduledAt) : parseISO(p.createdAt);
    return isSameDay(d, date);
  });
}

export function getPostsForView(
  posts: ScheduledPost[],
  date: Date,
  view: TCalendarView
): ScheduledPost[] {
  return posts.filter((p) => {
    const d = p.scheduledAt ? parseISO(p.scheduledAt) : parseISO(p.createdAt);
    if (view === "month") return isSameMonth(d, date);
    if (view === "week") return isSameWeek(d, date);
    return isSameDay(d, date);
  });
}

export function getPostDate(post: ScheduledPost): Date {
  return post.scheduledAt ? parseISO(post.scheduledAt) : parseISO(post.createdAt);
}

export const POST_STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending:   { bg: "bg-yellow-500/15",  text: "text-yellow-600 dark:text-yellow-400",  dot: "bg-yellow-500" },
  posting:   { bg: "bg-blue-500/15",    text: "text-blue-600 dark:text-blue-400",      dot: "bg-blue-500" },
  posted:    { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  failed:    { bg: "bg-red-500/15",     text: "text-red-600 dark:text-red-400",         dot: "bg-red-500" },
  cancelled: { bg: "bg-zinc-500/15",    text: "text-zinc-500 dark:text-zinc-400",       dot: "bg-zinc-400" },
};

export const PLATFORM_LABELS: Record<string, string> = {
  tiktok:    "TikTok",
  instagram: "Instagram",
  youtube:   "YouTube",
  twitter:   "Twitter / X",
};

export const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
