import { describe, expect, it } from "vitest";

import { composeDateTime, dateToYmd, parseDatePart, parseTimePart } from "./datetime";

describe("dateToYmd", () => {
  it("formats a local date as YYYY-MM-DD with zero-padding", () => {
    expect(dateToYmd(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(dateToYmd(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("parseDatePart", () => {
  it("parses the date portion of date and datetime values", () => {
    expect(dateToYmd(parseDatePart("2026-06-15")!)).toBe("2026-06-15");
    expect(dateToYmd(parseDatePart("2026-06-15T14:30")!)).toBe("2026-06-15");
  });

  it("returns undefined for empty or time-only values", () => {
    expect(parseDatePart(null)).toBeUndefined();
    expect(parseDatePart("")).toBeUndefined();
    expect(parseDatePart("14:30")).toBeUndefined();
  });
});

describe("parseTimePart", () => {
  it("extracts HH:MM from time-only and datetime values", () => {
    expect(parseTimePart("14:30")).toBe("14:30");
    expect(parseTimePart("2026-06-15T14:30")).toBe("14:30");
  });

  it("returns an empty string for date-only or empty values", () => {
    expect(parseTimePart("2026-06-15")).toBe("");
    expect(parseTimePart(null)).toBe("");
  });
});

describe("composeDateTime", () => {
  const date = new Date(2026, 5, 15);

  it("encodes per the property format", () => {
    expect(composeDateTime("date", date, "")).toBe("2026-06-15");
    expect(composeDateTime("time", undefined, "09:05")).toBe("09:05");
    expect(composeDateTime("datetime", date, "09:05")).toBe("2026-06-15T09:05");
  });

  it("defaults a datetime's time to midnight when only a date is picked", () => {
    expect(composeDateTime("datetime", date, "")).toBe("2026-06-15T00:00");
  });

  it("returns null when a required part is missing", () => {
    expect(composeDateTime("date", undefined, "")).toBeNull();
    expect(composeDateTime("time", undefined, "")).toBeNull();
    expect(composeDateTime("datetime", undefined, "09:05")).toBeNull();
  });
});
