import { parseYearMonth } from "./datetime";

/**
 * Locale-aware label for an Insights `"YYYY-MM"` month key — a short month name, with the year
 * appended on January so the 12-month chart's year rollover stays readable. Falls back to the raw
 * string for malformed input. Kept a plain-parameter pure function (not a hook) so it stays
 * node-env-testable, like `formatDateTimeValue`; components pass `useAppLocale()`.
 */
export function formatInsightsMonth(month: string, locale?: string): string {
  const date = parseYearMonth(month);
  if (!date) return month;
  const locales = locale ?? [];
  if (date.getMonth() === 0) {
    return date.toLocaleDateString(locales, {
      month: "short",
      year: "2-digit",
    });
  }
  return date.toLocaleDateString(locales, {
    month: "short",
  });
}
