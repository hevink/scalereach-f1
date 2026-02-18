"use client";

import { createContext, useContext, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TCalendarView } from "./types";
import type { ScheduledPost } from "@/lib/api/social";

interface ICalendarContext {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  view: TCalendarView;
  setView: Dispatch<SetStateAction<TCalendarView>>;
  posts: ScheduledPost[];
  // Create modal
  createModalDate: Date | null;
  openCreateModal: (date: Date) => void;
  closeCreateModal: () => void;
}

const CalendarContext = createContext({} as ICalendarContext);

export function CalendarProvider({
  children,
  posts,
}: {
  children: React.ReactNode;
  posts: ScheduledPost[];
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<TCalendarView>("month");
  const [createModalDate, setCreateModalDate] = useState<Date | null>(null);

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        view,
        setView,
        posts,
        createModalDate,
        openCreateModal: (date) => setCreateModalDate(date),
        closeCreateModal: () => setCreateModalDate(null),
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendarContext(): ICalendarContext {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendarContext must be used within CalendarProvider");
  return ctx;
}
