export type TCalendarView = "month" | "week" | "day";

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
