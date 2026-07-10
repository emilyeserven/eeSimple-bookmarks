import type { DateTimeFormat } from "@eesimple/types";

import { useState } from "react";

import { CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppLocale } from "@/hooks/useAppLocale";
import {
  composeDateTime,
  formatDateTimeValue,
  parseDatePart,
  parseTimePart,
  parseYearMonth,
} from "@/lib/datetime";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  /** What the property captures, deciding which controls are shown. */
  format: DateTimeFormat;
  /** Canonical stored value (`"YYYY-MM-DD"` / `"HH:MM"` / `"YYYY-MM-DDTHH:MM"`), or `null`. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Id applied to the primary control, for label association. */
  id?: string;
  placeholder?: string;
  className?: string;
  /**
   * When true (only meaningful for `format === "date"`), offer a Full date / Month toggle so the
   * user can enter a month-only `"YYYY-MM"` value via a native month input.
   */
  allowYearMonth?: boolean;
}

/**
 * Entry control for a `datetime` custom-property value. Renders a calendar popover for `date`, a
 * time input for `time`, and both for `datetime`. Always emits the canonical string encoding.
 * Shared by the bookmark form, the card inline editor, and condition range bounds.
 */
export function DateTimePicker({
  format, value, onChange, id, placeholder, className, allowYearMonth = false,
}: DateTimePickerProps) {
  const {
    t,
  } = useTranslation();
  const locale = useAppLocale();
  const datePart = parseDatePart(value);
  const timePart = parseTimePart(value);
  // Month-precision entry is a `date`-only affordance; seed it from a stored month-only value.
  const monthEntry = allowYearMonth && format === "date";
  const [monthMode, setMonthMode] = useState(() => monthEntry && parseYearMonth(value) !== undefined);

  // Time-only: a bare native time input is the whole control.
  if (format === "time") {
    return (
      <Input
        id={id}
        type="time"
        className={className}
        value={timePart}
        onChange={event => onChange(event.target.value ? event.target.value : null)}
      />
    );
  }

  const label = value ? formatDateTimeValue(value, format, locale) : (placeholder ?? t("Pick a date"));

  if (monthEntry) {
    return (
      <div className={cn("space-y-2", className)}>
        <ToggleGroup
          type="single"
          size="sm"
          value={monthMode ? "month" : "date"}
          onValueChange={(next) => {
            if (next) setMonthMode(next === "month");
          }}
        >
          <ToggleGroupItem value="date">{t("Full date")}</ToggleGroupItem>
          <ToggleGroupItem value="month">{t("Month")}</ToggleGroupItem>
        </ToggleGroup>
        {monthMode
          ? (
            <Input
              id={id}
              type="month"
              value={value ? value.slice(0, 7) : ""}
              onChange={event => onChange(event.target.value ? event.target.value : null)}
            />
          )
          : (
            <DateCalendarControl
              id={id}
              format={format}
              label={label}
              hasValue={value != null}
              datePart={datePart}
              timePart={timePart}
              onChange={onChange}
            />
          )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DateCalendarControl
        id={id}
        format={format}
        label={label}
        hasValue={value != null}
        datePart={datePart}
        timePart={timePart}
        onChange={onChange}
      />
    </div>
  );
}

/** The calendar-popover trigger + body shared by the default `date`/`datetime` control and month mode. */
function DateCalendarControl({
  id, format, label, hasValue, datePart, timePart, onChange,
}: {
  id?: string;
  format: DateTimeFormat;
  label: string;
  hasValue: boolean;
  datePart: Date | undefined;
  timePart: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "flex-1 justify-start text-left font-normal",
            hasValue ? "" : "text-muted-foreground",
          )}
        >
          <CalendarIcon className="size-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
      >
        <Calendar
          mode="single"
          autoFocus
          selected={datePart}
          onSelect={date => onChange(composeDateTime(format, date, timePart))}
        />
        {format === "datetime"
          ? (
            <div className="border-t p-3">
              <Input
                type="time"
                value={timePart}
                onChange={event =>
                  onChange(composeDateTime(format, datePart, event.target.value))}
              />
            </div>
          )
          : null}
      </PopoverContent>
    </Popover>
  );
}

interface DateTimeRangeFieldsProps {
  format: DateTimeFormat;
  /** Lower bound of the range (canonical string), or `null` for open-ended. */
  from: string | null;
  /** Upper bound of the range (canonical string), or `null` for open-ended. */
  to: string | null;
  onChange: (range: { from: string | null;
    to: string | null; }) => void;
  /** `stack` lays the two pickers vertically (default); `grid` puts them side by side. */
  layout?: "stack" | "grid";
}

/**
 * A labelled From/To pair of {@link DateTimePicker}s for a date/time range, shared by the homepage
 * filter sidebar and the condition editor so both render identical controls.
 */
export function DateTimeRangeFields({
  format, from, to, onChange, layout = "stack",
}: DateTimeRangeFieldsProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div
      className={cn(
        layout === "grid"
          ? `
            grid gap-2
            sm:grid-cols-2
          `
          : "space-y-2",
      )}
    >
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{t("From")}</Label>
        <DateTimePicker
          format={format}
          value={from}
          placeholder={t("Any")}
          onChange={next => onChange({
            from: next,
            to,
          })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{t("To")}</Label>
        <DateTimePicker
          format={format}
          value={to}
          placeholder={t("Any")}
          onChange={next => onChange({
            from,
            to: next,
          })}
        />
      </div>
    </div>
  );
}
