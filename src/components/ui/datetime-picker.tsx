"use client";

import * as React from "react";
import { useImperativeHandle, useRef } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { IconCalendar, IconClock, IconChevronLeft, IconChevronRight, IconCheck } from "@tabler/icons-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

type TimePickerType = "hours" | "minutes" | "seconds";

function getValidNumber(value: string, { max, min = 0, loop = false }: { max: number; min?: number; loop?: boolean }) {
  let n = parseInt(value, 10);
  if (!Number.isNaN(n)) {
    if (!loop) { if (n > max) n = max; if (n < min) n = min; }
    else { if (n > max) n = min; if (n < min) n = max; }
    return n.toString().padStart(2, "0");
  }
  return "00";
}

function getValidHour(v: string) { return /^(0[0-9]|1[0-9]|2[0-3])$/.test(v) ? v : getValidNumber(v, { max: 23 }); }
function getValidMinSec(v: string) { return /^[0-5][0-9]$/.test(v) ? v : getValidNumber(v, { max: 59 }); }

function getArrow(value: string, step: number, type: TimePickerType) {
  const cfg = type === "hours" ? { min: 0, max: 23 } : { min: 0, max: 59 };
  return getValidNumber(String(parseInt(value, 10) + step), { ...cfg, loop: true });
}

function getDateByType(date: Date | null | undefined, type: TimePickerType) {
  if (!date) return "00";
  if (type === "hours") return getValidHour(String(date.getHours()));
  if (type === "minutes") return getValidMinSec(String(date.getMinutes()));
  return getValidMinSec(String(date.getSeconds()));
}

function setDateByType(date: Date, value: string, type: TimePickerType) {
  const d = new Date(date);
  if (type === "hours") d.setHours(parseInt(getValidHour(value), 10));
  else if (type === "minutes") d.setMinutes(parseInt(getValidMinSec(value), 10));
  else d.setSeconds(parseInt(getValidMinSec(value), 10));
  return d;
}

function formatRelativeDate(date: Date): string {
  if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
  if (isTomorrow(date)) return `Tomorrow at ${format(date, "h:mm a")}`;
  return format(date, "MMM d 'at' h:mm a");
}

// ─── TimePickerInput ─────────────────────────────────────────────────────────

interface TimePickerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: TimePickerType;
  date?: Date | null;
  onDateChange?: (date: Date | undefined) => void;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
}

const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  ({ picker, date, onDateChange, onRightFocus, onLeftFocus, className, ...props }, ref) => {
    const [flag, setFlag] = React.useState(false);

    React.useEffect(() => {
      if (flag) {
        const t = setTimeout(() => setFlag(false), 2000);
        return () => clearTimeout(t);
      }
    }, [flag]);

    const calculated = React.useMemo(() => getDateByType(date, picker), [date, picker]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab") return;
      e.preventDefault();
      if (e.key === "ArrowRight") { onRightFocus?.(); return; }
      if (e.key === "ArrowLeft") { onLeftFocus?.(); return; }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        const step = e.key === "ArrowUp" ? 1 : -1;
        const newVal = getArrow(calculated, step, picker);
        if (flag) setFlag(false);
        onDateChange?.(setDateByType(date ? new Date(date) : new Date(), newVal, picker));
        return;
      }
      if (e.key >= "0" && e.key <= "9") {
        const newVal = !flag ? `0${e.key}` : calculated.slice(1) + e.key;
        if (flag) onRightFocus?.();
        setFlag((p) => !p);
        onDateChange?.(setDateByType(date ? new Date(date) : new Date(), newVal, picker));
      }
    };

    return (
      <input
        ref={ref}
        type="tel"
        inputMode="decimal"
        value={calculated}
        onChange={(e) => e.preventDefault()}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-10 rounded-md bg-muted/60 py-1.5 text-center font-mono text-sm tabular-nums caret-transparent outline-none transition-colors focus:bg-primary focus:text-primary-foreground hover:bg-muted",
          className
        )}
        {...props}
      />
    );
  }
);
TimePickerInput.displayName = "TimePickerInput";

// ─── TimePicker ───────────────────────────────────────────────────────────────

interface TimePickerProps {
  date?: Date | null;
  onChange?: (date: Date | undefined) => void;
  granularity?: "hour" | "minute" | "second";
}

export const TimePicker = React.forwardRef<{ hourRef: HTMLInputElement | null }, TimePickerProps>(
  ({ date, onChange, granularity = "minute" }, ref) => {
    const hourRef = useRef<HTMLInputElement>(null);
    const minuteRef = useRef<HTMLInputElement>(null);
    const secondRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({ hourRef: hourRef.current }), []);

    // Quick time presets
    const presets = [
      { label: "Morning", hour: 9, minute: 0 },
      { label: "Noon", hour: 12, minute: 0 },
      { label: "Evening", hour: 18, minute: 0 },
      { label: "Night", hour: 21, minute: 0 },
    ];

    const applyPreset = (hour: number, minute: number) => {
      const d = date ? new Date(date) : new Date();
      d.setHours(hour, minute, 0, 0);
      onChange?.(d);
    };

    return (
      <div className="flex flex-col gap-3">
        {/* Time inputs */}
        <div className="flex items-center justify-center gap-1.5">
          <IconClock className="size-4 text-muted-foreground" />
          <div className="flex items-center gap-1">
            <TimePickerInput
              id="tp-hour"
              picker="hours"
              date={date}
              ref={hourRef}
              onDateChange={onChange}
              onRightFocus={() => minuteRef.current?.focus()}
            />
            <span className="text-muted-foreground font-bold text-base">:</span>
            {(granularity === "minute" || granularity === "second") && (
              <TimePickerInput
                picker="minutes"
                date={date}
                ref={minuteRef}
                onDateChange={onChange}
                onLeftFocus={() => hourRef.current?.focus()}
                onRightFocus={() => secondRef.current?.focus()}
              />
            )}
            {granularity === "second" && (
              <>
                <span className="text-muted-foreground font-bold text-base">:</span>
                <TimePickerInput
                  picker="seconds"
                  date={date}
                  ref={secondRef}
                  onDateChange={onChange}
                  onLeftFocus={() => minuteRef.current?.focus()}
                />
              </>
            )}
          </div>
          <span className="text-xs text-muted-foreground ml-1">
            {date ? format(date, "a") : "AM"}
          </span>
        </div>

        {/* Quick presets */}
        <div className="grid grid-cols-4 gap-1.5">
          {presets.map((p) => {
            const isActive = date?.getHours() === p.hour && date?.getMinutes() === p.minute;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p.hour, p.minute)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
TimePicker.displayName = "TimePicker";

// ─── DateTimePicker ───────────────────────────────────────────────────────────

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  granularity?: "day" | "hour" | "minute" | "second";
  displayFormat?: string;
  className?: string;
  disablePast?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Pick date & time",
  granularity = "minute",
  displayFormat,
  className,
  disablePast = false,
}: DateTimePickerProps) {
  const [month, setMonth] = React.useState<Date>(value ?? new Date());
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Date | undefined>(value);

  // Sync draft when value changes externally
  React.useEffect(() => {
    setDraft(value);
    if (value) setMonth(value);
  }, [value]);

  const fmt = displayFormat ?? (granularity === "day" ? "PPP" : "PPP HH:mm");

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const d = new Date(day);
    d.setHours(draft?.getHours() ?? 12, draft?.getMinutes() ?? 0, 0, 0);
    setDraft(d);
    setMonth(d);
    if (granularity === "day") {
      onChange?.(d);
      setOpen(false);
    }
  };

  const handleTimeChange = (d: Date | undefined) => {
    if (!d) return;
    setDraft(d);
    setMonth(d);
  };

  const handleConfirm = () => {
    onChange?.(draft);
    setOpen(false);
  };

  const handleClear = () => {
    setDraft(undefined);
    onChange?.(undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(o) => {
      setOpen(o);
      // Reset draft to current value when closing without confirming
      if (!o) setDraft(value);
    }}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-normal transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          value ? "text-foreground" : "text-muted-foreground",
          className
        )}
      >
        <IconCalendar className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left">
          {value ? formatRelativeDate(value) : placeholder}
        </span>
        {value && (
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            {format(value, "MMM d")}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 shadow-xl" align="start" sideOffset={6}>
        <div className="flex flex-col">
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={draft}
            month={month}
            onSelect={handleDaySelect}
            onMonthChange={(m) => {
              const d = new Date(m);
              d.setHours(draft?.getHours() ?? 12, draft?.getMinutes() ?? 0, 0, 0);
              setMonth(d);
            }}
            captionLayout="dropdown"
            disabled={disablePast ? (d) => d < new Date(new Date().setHours(0, 0, 0, 0)) : undefined}
            className="rounded-t-lg"
          />

          {/* Time picker */}
          {granularity !== "day" && (
            <div className="border-t px-4 py-3">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Time
              </p>
              <TimePicker date={draft ?? month} onChange={handleTimeChange} granularity={granularity} />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2.5">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
            <div className="flex items-center gap-2">
              {draft && (
                <span className="text-xs text-muted-foreground">
                  {format(draft, "MMM d, h:mm a")}
                </span>
              )}
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={!draft}
                className="h-7 gap-1.5 px-3 text-xs"
              >
                <IconCheck size={12} strokeWidth={3} />
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
