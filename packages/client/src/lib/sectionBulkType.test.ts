// @vitest-environment node
import type { SectionEntry } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { applyBulkSectionType } from "./sectionBulkType";

function entry(over: Partial<SectionEntry> = {}): SectionEntry {
  return {
    id: over.id ?? "e1",
    name: over.name ?? "Chapter",
    type: over.type ?? "page",
    startValue: over.startValue ?? "10",
    endValue: over.endValue,
    url: over.url,
    children: over.children,
    completed: over.completed,
  };
}

const tiered: SectionEntry[] = [
  entry({
    id: "p1",
    type: "page",
    startValue: "1",
    children: [
      entry({
        id: "c1",
        type: "page",
        startValue: "2",
      }),
      entry({
        id: "c2",
        type: "page",
        startValue: "3",
      }),
    ],
  }),
  entry({
    id: "p2",
    type: "page",
    startValue: "4",
  }),
];

describe("applyBulkSectionType", () => {
  it("scope 'all' retypes both tier-1 entries and children", () => {
    const out = applyBulkSectionType(tiered, "all", "url");
    expect(out[0].type).toBe("url");
    expect(out[0].children?.map(c => c.type)).toEqual(["url", "url"]);
    expect(out[1].type).toBe("url");
  });

  it("scope 'sections' retypes only tier-1 entries, leaving children untouched", () => {
    const out = applyBulkSectionType(tiered, "sections", "timestamp");
    expect(out[0].type).toBe("timestamp");
    expect(out[0].children?.map(c => c.type)).toEqual(["page", "page"]);
    expect(out[1].type).toBe("timestamp");
  });

  it("scope 'subsections' retypes only children, leaving tier-1 entries untouched", () => {
    const out = applyBulkSectionType(tiered, "subsections", "timestamp");
    expect(out[0].type).toBe("page");
    expect(out[0].children?.map(c => c.type)).toEqual(["timestamp", "timestamp"]);
    expect(out[1].type).toBe("page");
  });

  it("clears startValue and drops endValue when retyping to 'name'", () => {
    const withEnd = [
      entry({
        id: "p1",
        type: "page",
        startValue: "1",
        endValue: "9",
        children: [
          entry({
            id: "c1",
            type: "page",
            startValue: "2",
            endValue: "5",
          }),
        ],
      }),
    ];
    const out = applyBulkSectionType(withEnd, "all", "name");
    expect(out[0].type).toBe("name");
    expect(out[0].startValue).toBe("");
    expect(out[0]).not.toHaveProperty("endValue");
    expect(out[0].children?.[0].startValue).toBe("");
    expect(out[0].children?.[0]).not.toHaveProperty("endValue");
  });

  it("preserves unrelated fields (name, completed, url) and does not mutate the input", () => {
    const src = [
      entry({
        id: "p1",
        name: "Intro",
        type: "page",
        startValue: "1",
        completed: true,
        url: "https://example.com",
      }),
    ];
    const out = applyBulkSectionType(src, "sections", "url");
    expect(out[0].name).toBe("Intro");
    expect(out[0].completed).toBe(true);
    expect(out[0].url).toBe("https://example.com");
    expect(src[0].type).toBe("page"); // input untouched
  });
});
