import type { BookmarkSearch } from "./bookmarkSearch";
import type { CustomProperty, DateTimeFormat } from "@eesimple/types";

import {
  withBooleanFilter,
  withDateTimeFilter,
  withNumberFilter,
  withPresenceFilter,
} from "./bookmarkSearch";
import { composeDateTime, dateToYmd, parseDatePart, parseTimePart } from "./datetime";

/** Clamp a minute-of-day count into `[0, 1439]` so a shifted time stays within a single day. */
function clampMinuteOfDay(minutes: number): number {
  return Math.min(1439, Math.max(0, minutes));
}

/** Pad to two digits. */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Shift a canonical date/time `value` by `deltaSeconds` (positive or negative), preserving its
 * `format`'s encoding. `time` values are clamped within the day; `date`/`datetime` roll naturally.
 * Returns the input unchanged when it can't be parsed.
 */
export function shiftDateTime(
  value: string,
  format: DateTimeFormat,
  deltaSeconds: number,
): string {
  if (format === "time") {
    const time = parseTimePart(value);
    if (!time) return value;
    const [h, m] = time.split(":").map(Number);
    const shifted = clampMinuteOfDay(h * 60 + m + Math.round(deltaSeconds / 60));
    return `${pad2(Math.floor(shifted / 60))}:${pad2(shifted % 60)}`;
  }

  const datePart = parseDatePart(value);
  if (!datePart) return value;
  const base = new Date(datePart);
  if (format === "datetime") {
    const time = parseTimePart(value);
    if (time) {
      const [h, m] = time.split(":").map(Number);
      base.setHours(h, m, 0, 0);
    }
  }
  base.setSeconds(base.getSeconds() + Math.round(deltaSeconds));
  const ymd = dateToYmd(base);
  if (format === "date") return ymd;
  return composeDateTime("datetime", base, `${pad2(base.getHours())}:${pad2(base.getMinutes())}`) ?? ymd;
}

/**
 * Build a fresh {@link BookmarkSearch} that filters the Bookmarks page to bookmarks sharing a
 * property's value, used by the per-row "quick filter" button on the bookmark detail page.
 *
 * - `number`/`calculate`/`ratingScale` → a numeric range. Exact (`[v, v]`) unless the property is a
 *   `number` with a configured `quickFilterRange`, which widens it to `[v − d, v + d]`.
 * - `datetime` → a date/time range. Exact unless `quickFilterRange` is set, which shifts the bounds
 *   by ±`quickFilterRange` seconds.
 * - `boolean` → the exact boolean value.
 * - `image`/`file` → presence-only ("has a value").
 */
export function buildPropertyQuickSearch(
  property: CustomProperty,
  value: number | boolean | string,
): BookmarkSearch {
  const id = property.id;
  switch (property.type) {
    case "number":
    case "calculate":
    case "ratingScale": {
      const v = Number(value);
      const delta = property.type === "number" ? property.quickFilterRange : null;
      const range: [number, number] = delta != null ? [v - delta, v + delta] : [v, v];
      return withNumberFilter({}, id, range);
    }
    case "boolean":
      return withBooleanFilter({}, id, Boolean(value));
    case "datetime": {
      const raw = String(value);
      const format = property.dateTimeFormat ?? "date";
      const delta = property.quickFilterRange;
      const range: [string, string] = delta != null
        ? [shiftDateTime(raw, format, -delta), shiftDateTime(raw, format, delta)]
        : [raw, raw];
      return withDateTimeFilter({}, id, range);
    }
    case "image":
    case "file":
    default:
      return withPresenceFilter({}, id, "has");
  }
}
