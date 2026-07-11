// @vitest-environment node
import type { BookmarkProgressValue, BookmarkSectionsValue, SectionEntry } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { makeCustomProperty } from "../test-utils/factories";
import {
  DATE_TIME_FORMAT_LABELS,
  formatProgressValue,
  formatSectionEntry,
  formatSectionsValue,
  NUMBER_FORMAT_LABELS,
  sectionEntryLink,
  sectionEntryPositional,
  TYPE_LABELS,
} from "./propertyFormat";

const progress = (current: number, total: number): BookmarkProgressValue => ({
  propertyId: "p1",
  current,
  total,
});

const entry = (overrides: Partial<SectionEntry> = {}): SectionEntry => ({
  id: "s1",
  name: "Chapter 1",
  type: "page",
  startValue: "1",
  ...overrides,
});

describe("formatProgressValue", () => {
  it("uses the default ' of ' separator when no segments are configured", () => {
    const property = makeCustomProperty();
    expect(formatProgressValue(progress(3, 10), property)).toBe("3 of 10");
  });

  it("applies configured before/between/after text segments", () => {
    const property = makeCustomProperty({
      itemInItemsBeforeText: "Page ",
      itemInItemsBetweenText: " / ",
      itemInItemsAfterText: " read",
    });
    expect(formatProgressValue(progress(42, 300), property)).toBe("Page 42 / 300 read");
  });

  it("treats an empty-string between segment as configured, not as the default", () => {
    const property = makeCustomProperty({
      itemInItemsBetweenText: "",
    });
    expect(formatProgressValue(progress(1, 2), property)).toBe("12");
  });
});

describe("formatSectionEntry", () => {
  it("renders a range with the type label when an end value is present", () => {
    expect(formatSectionEntry(entry({
      startValue: "1",
      endValue: "10",
    }))).toBe(
      "Chapter 1: 1–10 (Page)",
    );
  });

  it("renders only the start value when there is no end value", () => {
    expect(formatSectionEntry(entry({
      type: "timestamp",
      startValue: "0:00",
      endValue: undefined,
    }))).toBe(
      "Chapter 1: 0:00 (Timestamp)",
    );
  });
});

describe("formatSectionsValue", () => {
  const sectionsValue = (count: number, exhaustive: boolean): BookmarkSectionsValue => ({
    propertyId: "p1",
    exhaustive,
    sections: Array.from({
      length: count,
    }, (_, i) => entry({
      id: `s${i}`,
    })),
  });

  it("singularizes a single section", () => {
    expect(formatSectionsValue(sectionsValue(1, false))).toBe("1 section");
  });

  it("pluralizes multiple sections", () => {
    expect(formatSectionsValue(sectionsValue(3, false))).toBe("3 sections");
  });

  it("appends an exhaustive marker when the value is exhaustive", () => {
    expect(formatSectionsValue(sectionsValue(3, true))).toBe("3 sections (exhaustive)");
  });

  it("handles an empty sections array", () => {
    expect(formatSectionsValue(sectionsValue(0, false))).toBe("0 sections");
  });
});

describe("sectionEntryLink", () => {
  it("prefers the explicit url field over everything else", () => {
    expect(sectionEntryLink(entry({
      type: "timestamp",
      startValue: "0:00",
      url: "https://example.com/watch",
    }))).toBe("https://example.com/watch");
  });

  it("falls back to a legacy url-type entry's startValue", () => {
    expect(sectionEntryLink(entry({
      type: "url",
      startValue: "https://legacy.example/page",
    }))).toBe("https://legacy.example/page");
  });

  it("returns undefined when there is no link (non-url type, no url field)", () => {
    expect(sectionEntryLink(entry({
      type: "page",
      startValue: "12",
    }))).toBeUndefined();
  });

  it("treats a blank url as no link", () => {
    expect(sectionEntryLink(entry({
      type: "page",
      url: "   ",
    }))).toBeUndefined();
  });
});

describe("sectionEntryPositional", () => {
  it("suppresses the positional value for a url-type entry (the url is shown as a link)", () => {
    expect(sectionEntryPositional(entry({
      type: "url",
      startValue: "https://example.com",
    }))).toBe("");
  });

  it("renders a page range", () => {
    expect(sectionEntryPositional(entry({
      type: "page",
      startValue: "1",
      endValue: "10",
    }))).toBe("1–10");
  });

  it("renders a timestamp clock", () => {
    expect(sectionEntryPositional(entry({
      type: "timestamp",
      startValue: "90",
    }))).toBe("1:30");
  });
});

describe("label records", () => {
  it("labels every custom-property type", () => {
    expect(TYPE_LABELS.itemInItems).toBe("Item in Items");
    expect(TYPE_LABELS.ratingScale).toBe("Rating Scale");
    expect(Object.values(TYPE_LABELS).every(label => label.length > 0)).toBe(true);
  });

  it("labels every number and date-time format", () => {
    expect(NUMBER_FORMAT_LABELS.duration).toBe("Duration");
    expect(DATE_TIME_FORMAT_LABELS.datetime).toBe("Date & time");
  });
});
