"use client";

import * as React from "react";
import { useImperativeHandle, useRef } from "react";
import { format } from "date-fns";
import { IconCalendar, IconClock } from "@tabler/icons-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
      <Input
        ref={ref}
        type="tel"
        inputMode="decimal"
        value={calculated}
        onChange={(e) => e.preventDefault()}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-12 text-center font-mono text-sm tabular-nums caret-transparent focus:bg-accent focus:text-accent-foreground [&::-webkit-inner-spin-button]:appearance-none",
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

    return (
      <div className="flex items-center justify-center gap-1">
        <label htmlFor="tp-hour" className="cursor-pointer">
          <IconClock className="size-4 text-muted-foreground" />
        </label>
        <TimePickerInput
          id="tp-hour"
          picker="hours"
          date={date}
          ref={hourRef}
          onDateChange={onChange}
          onRightFocus={() => minuteRef.current?.focus()}
        />
        {(granularity === "minute" || granularity === "second") && (
          <>
            <span className="text-muted-foreground font-medium">:</span>
            <TimePickerInput
              picker="minutes"
              date={date}
              ref={minuteRef}
              onDateChange={onChange}
              onLeftFocus={() => hourRef.current?.focus()}
              onRightFocus={() => secondRef.current?.focus()}
            />
          </>
        )}
        {granularity === "second" && (
          <>
            <span className="text-muted-foreground font-medium">:</span>
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

    React.useEffect(() => {
      if (value) setMonth(value);
    }, [value]);

    const fmt = displayFormat ?? (granularity === "day" ? "PPP" : granularity === "hour" ? "PPP HH:00" : granularity === "second" ? "PPP HH:mm:ss" : "PPP HH:mm");

    const handleDaySelect = (day: Date | undefined) => {
      if (!day) return;
      const d = new Date(day);
      d.setHours(month.getHours(), month.getMinutes(), month.getSeconds());
      onChange?.(d);
      setMonth(d);
      if (granularity === "day") setOpen(false);
    };

    const handleMonthChange = (newMonth: Date) => {
      const d = new Date(newMonth);
      d.setHours(month.getHours(), month.getMinutes(), month.getSeconds());
      setMonth(d);
    };

    const handleTimeChange = (d: Date | undefined) => {
      if (!d) return;
      onChange?.(d);
      setMonth(d);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            "flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <IconCalendar className="size-4 shrink-0" />
          {value ? format(value, fmt) : <span>{placeholder}</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            month={month}
            onSelect={handleDaySelect}
            onMonthChange={handleMonthChange}
            captionLayout="dropdown"
            disabled={disablePast ? (d) => d < new Date(new Date().setHours(0, 0, 0, 0)) : undefined}
          />
          {granularity !== "day" && (
            <div className="border-t p-3">
              <TimePicker date={month} onChange={handleTimeChange} granularity={granularity} />
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
}
