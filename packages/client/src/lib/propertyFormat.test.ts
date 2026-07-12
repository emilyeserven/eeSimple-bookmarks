// @vitest-environment node
import type { BookmarkProgressValue, BookmarkSectionsValue, SectionEntry } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { makeCustomProperty } from "../test-utils/factories";
import {
  composeProgressText,
  DATE_TIME_FORMAT_LABELS,
  formatProgressValue,
  formatRatingCaption,
  formatSectionEntry,
  formatSectionsValue,
  NUMBER_FORMAT_LABELS,
  ratingLevelValues,
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

describe("formatRatingCaption", () => {
  const rating = (overrides = {}) => makeCustomProperty({
    type: "ratingScale",
    ratingMax: 5,
    ...overrides,
  });

  it("returns null when there are no labels and no range", () => {
    expect(formatRatingCaption(rating(), 3, null)).toBeNull();
  });

  it("returns the single label for a labelled single value", () => {
    const property = rating({
      ratingLabels: {
        3: "Intermediate",
      },
    });
    expect(formatRatingCaption(property, 3, null)).toBe("Intermediate");
    // An unlabelled level with labels present still returns null (nothing to add beside the stars).
    expect(formatRatingCaption(property, 2, null)).toBeNull();
  });

  it("returns 'from → to' using labels for a range, falling back to the number", () => {
    const property = rating({
      ratingAllowRange: true,
      ratingLabels: {
        1: "Beginner",
        3: "Advanced",
      },
    });
    expect(formatRatingCaption(property, 1, 3)).toBe("Beginner → Advanced");
    // With no labels the range still renders as numbers.
    expect(formatRatingCaption(rating({
      ratingAllowRange: true,
    }), 2, 4)).toBe("2 → 4");
  });
});

describe("ratingLevelValues", () => {
  it("lists 1..max by default and includes 0 when zero is allowed", () => {
    expect(ratingLevelValues(makeCustomProperty({
      type: "ratingScale",
      ratingMax: 3,
    }))).toEqual([1, 2, 3]);
    expect(ratingLevelValues(makeCustomProperty({
      type: "ratingScale",
      ratingMax: 5,
      ratingAllowZero: true,
    }))).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("steps by half when half ratings are allowed", () => {
    expect(ratingLevelValues(makeCustomProperty({
      type: "ratingScale",
      ratingMax: 3,
      ratingAllowHalf: true,
    }))).toEqual([1, 1.5, 2, 2.5, 3]);
  });
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

  it("applies a per-media-type override for the bookmark's media type, inheriting unset segments", () => {
    const property = makeCustomProperty({
      itemInItemsAfterText: " pages",
      itemInItemsMediaTypeTexts: {
        "mt-course": {
          afterText: " modules",
        },
      },
    });
    expect(formatProgressValue(progress(24, 230), property, "mt-course")).toBe("24 of 230 modules");
    // Another media type (or none) falls back to the base texts.
    expect(formatProgressValue(progress(3, 10), property, "mt-book")).toBe("3 of 10 pages");
    expect(formatProgressValue(progress(3, 10), property)).toBe("3 of 10 pages");
  });

  it("applies a per-bookmark textOverride over the media-type override and base, per field", () => {
    const property = makeCustomProperty({
      itemInItemsAfterText: " pages",
      itemInItemsMediaTypeTexts: {
        "mt-course": {
          afterText: " modules",
        },
      },
    });
    const value: BookmarkProgressValue = {
      propertyId: "p1",
      current: 5,
      total: 20,
      textOverride: {
        beforeText: "chapter ",
        afterText: " chapters",
      },
    };
    // before + after come from the bookmark override; between inherits the base " of ".
    expect(formatProgressValue(value, property, "mt-course")).toBe("chapter 5 of 20 chapters");
  });

  it("an absent textOverride leaves the media-type/base output unchanged", () => {
    const property = makeCustomProperty({
      itemInItemsAfterText: " pages",
    });
    expect(formatProgressValue(progress(3, 10), property)).toBe("3 of 10 pages");
  });

  it("auto-spaces non-empty labels that were typed without spaces (default on)", () => {
    const property = makeCustomProperty({
      itemInItemsBeforeText: "page",
      itemInItemsBetweenText: "of",
      itemInItemsAfterText: "pages",
    });
    // No autoSpace field on the value → default on: spaces are added around each non-empty label.
    expect(formatProgressValue(progress(5, 200), property)).toBe("page 5 of 200 pages");
  });

  it("leaves the raw concat when autoSpace is false (tight formatting)", () => {
    const property = makeCustomProperty({
      itemInItemsBetweenText: "/",
    });
    const value: BookmarkProgressValue = {
      propertyId: "p1",
      current: 5,
      total: 200,
      autoSpace: false,
    };
    expect(formatProgressValue(value, property)).toBe("5/200");
    // …and with auto-space on (default), the same "/" gets spaced.
    expect(formatProgressValue(progress(5, 200), property)).toBe("5 / 200");
  });
});

describe("composeProgressText", () => {
  const property = makeCustomProperty({
    itemInItemsBeforeText: "chapter ",
    itemInItemsAfterText: " pages",
  });

  it("shows both the numbers and the unit words by default", () => {
    expect(composeProgressText(progress(3, 10), property)).toBe("chapter 3 of 10 pages");
  });

  it("shows only the 'X of Y' numbers when the unit is hidden", () => {
    expect(composeProgressText(progress(3, 10), property, null, {
      showUnit: false,
    })).toBe("3 of 10");
  });

  it("shows only the trimmed unit words when the numbers are hidden", () => {
    expect(composeProgressText(progress(3, 10), property, null, {
      showCount: false,
    })).toBe("chapter pages");
  });

  it("returns an empty string when both parts are hidden", () => {
    expect(composeProgressText(progress(3, 10), property, null, {
      showCount: false,
      showUnit: false,
    })).toBe("");
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
