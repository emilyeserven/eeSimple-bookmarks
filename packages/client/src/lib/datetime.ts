import type { DateTimeFormat } from "@eesimple/types";

/** Pad a number to two digits. */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format a local `Date` as the canonical `"YYYY-MM-DD"` date string. */
export function dateToYmd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse the date portion of a canonical value (`"YYYY-MM-DD"` / `"YYYY-MM-DDTHH:MM"`) into a local `Date`, or `undefined`. */
export function parseDatePart(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Parse a bare month-only value (`"YYYY-MM"`, no day) into a local `Date` at the 1st, or `undefined`. */
export function parseYearMonth(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Extract the `"HH:MM"` time portion of a canonical value (time-only or datetime), or `""` when absent. */
export function parseTimePart(value: string | null | undefined): string {
  if (!value) return "";
  const time = value.includes("T") ? value.slice(value.indexOf("T") + 1) : value;
  return /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : "";
}

/** Compose the canonical stored string for the given `format` from a date and/or time part. */
export function composeDateTime(
  format: DateTimeFormat,
  datePart: Date | undefined,
  timePart: string,
): string | null {
  if (format === "time") return timePart || null;
  if (!datePart) return null;
  const ymd = dateToYmd(datePart);
  if (format === "date") return ymd;
  return `${ymd}T${timePart || "00:00"}`;
}

/**
 * Format a canonical date/time value for display, honoring the property's `format`. Falls back to
 * the raw string when it can't be parsed.
 *
 * `locale` is an optional BCP-47 tag (e.g. the active interface locale from `useAppLocale`) threaded
 * into the `Intl`-backed `toLocale*` calls; omit it to keep the runtime-default behavior. Kept a
 * plain parameter (not a hook) so this stays a pure, node-env-testable function — components pass
 * `useAppLocale()`.
 */
export function formatDateTimeValue(
  value: string,
  format: DateTimeFormat | null,
  locale?: string,
): string {
  // `Intl` accepts an empty array as "use the runtime default locale"; keep that when unspecified.
  const locales = locale ?? [];
  if (format === "time") {
    const time = parseTimePart(value);
    if (!time) return value;
    const [h, m] = time.split(":");
    const date = new Date();
    date.setHours(Number(h), Number(m), 0, 0);
    return date.toLocaleTimeString(locales, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  // Month-only value (from the "allow YYYY-MM" option): show month + year, e.g. "June 2026".
  const yearMonth = parseYearMonth(value);
  if (yearMonth) {
    return yearMonth.toLocaleDateString(locales, {
      year: "numeric",
      month: "long",
    });
  }
  const date = parseDatePart(value);
  if (!date) return value;
  if (format === "datetime") {
    const time = parseTimePart(value);
    if (time) {
      const [h, m] = time.split(":");
      date.setHours(Number(h), Number(m), 0, 0);
    }
    return date.toLocaleString(locales, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
  return date.toLocaleDateString(locales, {
    dateStyle: "medium",
  });
}
