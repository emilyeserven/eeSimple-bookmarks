// @vitest-environment node
import { describe, expect, it } from "vitest";

import { formatInsightsMonth } from "./insightsFormat";

describe("formatInsightsMonth", () => {
  it("formats a month key as a short month name", () => {
    expect(formatInsightsMonth("2026-03", "en-US")).toBe("Mar");
  });

  it("appends the year on January to mark the rollover", () => {
    expect(formatInsightsMonth("2026-01", "en-US")).toBe(
      new Date(2026, 0, 1).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
    );
  });

  it("honors the passed locale", () => {
    // Assert against Intl's own output so the test doesn't hardcode localized text.
    expect(formatInsightsMonth("2026-03", "ja")).toBe(
      new Date(2026, 2, 1).toLocaleDateString("ja", {
        month: "short",
      }),
    );
  });

  it("falls back to the raw string for malformed input", () => {
    expect(formatInsightsMonth("not-a-month", "en-US")).toBe("not-a-month");
    expect(formatInsightsMonth("2026-3", "en-US")).toBe("2026-3");
  });
});
