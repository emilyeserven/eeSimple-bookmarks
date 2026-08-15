// @vitest-environment node
import { describe, expect, it } from "vitest";

import { AI_SECTION_CONTEXT_ROW_LIMIT, buildSectionsContextValue } from "./aiSectionContext";

import type { BookmarkSectionsValue, SectionEntry } from "@eesimple/types";

function entry(overrides: Partial<SectionEntry> & { name: string }): SectionEntry {
  return {
    id: overrides.name,
    type: "page",
    startValue: "",
    ...overrides,
  };
}

function value(overrides: Partial<BookmarkSectionsValue>): BookmarkSectionsValue {
  return {
    propertyId: "p1",
    exhaustive: false,
    sections: [],
    ...overrides,
  };
}

describe("buildSectionsContextValue", () => {
  it("reports an absent or empty value as not set", () => {
    expect(buildSectionsContextValue(undefined)).toBe("(not set)");
    expect(buildSectionsContextValue(value({}))).toBe("(not set)");
  });

  it("renders every entry with its numbering and positional value", () => {
    const result = buildSectionsContextValue(value({
      sections: [
        entry({
          name: "Getting Started",
          startValue: "1",
          endValue: "20",
        }),
        entry({
          name: "Advanced",
          startValue: "21",
        }),
      ],
    }));
    expect(result).toBe([
      "2 sections",
      "  1. Getting Started — page 1–20",
      "  2. Advanced — page 21",
    ].join("\n"));
  });

  it("nests children under parent.child numbering and counts them as items", () => {
    const result = buildSectionsContextValue(value({
      sections: [entry({
        name: "Part One",
        children: [
          entry({
            name: "Intro",
            startValue: "1",
          }),
          entry({
            name: "Setup",
            startValue: "5",
          }),
        ],
      })],
    }));
    expect(result).toBe([
      "1 section, 2 sub-items",
      "  1. Part One",
      "    1.1. Intro — page 1",
      "    1.2. Setup — page 5",
    ].join("\n"));
  });

  it("flags completion per row and tallies it once any entry is done", () => {
    const result = buildSectionsContextValue(value({
      sections: [
        entry({
          name: "Read",
          completed: true,
        }),
        entry({
          name: "Unread",
        }),
      ],
    }));
    expect(result).toBe([
      "2 sections, 1 of 2 done",
      "  1. Read — done",
      "  2. Unread — not done",
    ].join("\n"));
  });

  it("omits the per-row completion flag when nothing is marked done", () => {
    const result = buildSectionsContextValue(value({
      sections: [entry({
        name: "Chapter",
      })],
    }));
    expect(result).toBe("1 section\n  1. Chapter");
  });

  it("renders a timestamp entry as a clock and a url entry as a link", () => {
    const result = buildSectionsContextValue(value({
      sections: [
        entry({
          name: "Chorus",
          type: "timestamp",
          startValue: "90",
          endValue: "150",
        }),
        entry({
          name: "Docs",
          type: "url",
          startValue: "https://example.com/docs",
        }),
      ],
    }));
    expect(result).toBe([
      "2 sections",
      "  1. Chorus — timestamp 1:30–2:30",
      "  2. Docs — link: https://example.com/docs",
    ].join("\n"));
  });

  it("notes the exhaustive flag, progress exclusion, favorites and resolvable tags", () => {
    const result = buildSectionsContextValue(value({
      exhaustive: true,
      sections: [entry({
        name: "Appendix",
        excludeFromProgress: true,
        isFavorite: true,
        tagIds: ["t1", "gone"],
      })],
    }), {
      tagNameById: new Map([["t1", "Reference"]]),
    });
    expect(result).toBe([
      "1 section (the list below is exhaustive)",
      "  1. Appendix — not counted in progress — favorite — tags: Reference",
    ].join("\n"));
  });

  it("omits tags when no tag map is supplied", () => {
    const result = buildSectionsContextValue(value({
      sections: [entry({
        name: "Chapter",
        tagIds: ["t1"],
      })],
    }));
    expect(result).toBe("1 section\n  1. Chapter");
  });

  it("truncates past the row limit and says how many were dropped", () => {
    const result = buildSectionsContextValue(value({
      sections: [
        entry({
          name: "One",
        }),
        entry({
          name: "Two",
        }),
        entry({
          name: "Three",
        }),
      ],
    }), {
      rowLimit: 2,
    });
    expect(result).toBe([
      "3 sections",
      "  1. One",
      "  2. Two",
      "  … 1 more entries omitted",
    ].join("\n"));
  });

  it("exposes a positive default row limit", () => {
    expect(AI_SECTION_CONTEXT_ROW_LIMIT).toBeGreaterThan(0);
  });
});
