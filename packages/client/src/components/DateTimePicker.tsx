import type { DateTimeFormat } from "@eesimple/types";

import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  composeDateTime,
  formatDateTimeValue,
  parseDatePart,
  parseTimePart,
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
}

/**
 * Entry control for a `datetime` custom-property value. Renders a calendar popover for `date`, a
 * time input for `time`, and both for `datetime`. Always emits the canonical string encoding.
 * Shared by the bookmark form, the card inline editor, and condition range bounds.
 */
export function DateTimePicker({
  format, value, onChange, id, placeholder, className,
}: DateTimePickerProps) {
  const datePart = parseDatePart(value);
  const timePart = parseTimePart(value);

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

  const label = value ? formatDateTimeValue(value, format) : (placeholder ?? "Pick a date");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal",
              value ? "" : "text-muted-foreground",
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
    </div>
  );
}
