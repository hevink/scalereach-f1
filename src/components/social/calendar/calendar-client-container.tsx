"use client";

import { useCalendarContext } from "./calendar-context";
import { CalendarHeader } from "./calendar-header";
import { CalendarMonthView } from "./calendar-month-view";
import { CalendarWeekView } from "./calendar-week-view";
import { CalendarDayView } from "./calendar-day-view";
import { CreatePostFromCalendarModal } from "./create-post-modal";
import { EditPostModal } from "./edit-post-modal";

interface Props {
  workspaceId: string;
}

export function CalendarClientContainer({ workspaceId }: Props) {
  const { view } = useCalendarContext();

  return (
    <div className="overflow-hidden rounded-xl border">
      <CalendarHeader />
      {view === "month" && <CalendarMonthView />}
      {view === "week" && <CalendarWeekView />}
      {view === "day" && <CalendarDayView />}
      <CreatePostFromCalendarModal workspaceId={workspaceId} />
      <EditPostModal workspaceId={workspaceId} />
    </div>
  );
}
