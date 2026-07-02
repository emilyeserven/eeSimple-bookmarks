// @vitest-environment node
import type { KavitaTocResult } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { kavitaSeriesUrl, kavitaTocToSections } from "./kavita";

describe("kavitaSeriesUrl", () => {
  it("builds the web-UI series deep link from the library and series ids", () => {
    expect(kavitaSeriesUrl("http://localhost:5000", 3, 12)).toBe(
      "http://localhost:5000/library/3/series/12",
    );
  });

  it("trims a single trailing slash on the base URL before appending", () => {
    expect(kavitaSeriesUrl("https://kavita.example.com/", 1, 44)).toBe(
      "https://kavita.example.com/library/1/series/44",
    );
  });
});

function toc(entries: { title: string;
  page: number; }[], pages: number | null): KavitaTocResult {
  return {
    entries,
    pages,
  };
}

describe("kavitaTocToSections", () => {
  it("maps entries to page sections, ending each at the next entry's start minus one", () => {
    const sections = kavitaTocToSections(toc([
      {
        title: "Chapter 1",
        page: 1,
      },
      {
        title: "Chapter 2",
        page: 15,
      },
      {
        title: "Chapter 3",
        page: 40,
      },
    ], 100));
    expect(sections.map(s => ({
      name: s.name,
      type: s.type,
      startValue: s.startValue,
      endValue: s.endValue,
    }))).toEqual([
      {
        name: "Chapter 1",
        type: "page",
        startValue: "1",
        endValue: "14",
      },
      {
        name: "Chapter 2",
        type: "page",
        startValue: "15",
        endValue: "39",
      },
      {
        name: "Chapter 3",
        type: "page",
        startValue: "40",
        endValue: "100",
      },
    ]);
  });

  it("clamps the end page when consecutive entries start on the same page", () => {
    const sections = kavitaTocToSections(toc([
      {
        title: "A",
        page: 7,
      },
      {
        title: "B",
        page: 7,
      },
    ], null));
    expect(sections[0].startValue).toBe("7");
    expect(sections[0].endValue).toBe("7");
  });

  it("omits the last entry's end page when the total is unknown or inconsistent", () => {
    expect(kavitaTocToSections(toc([
      {
        title: "Only",
        page: 5,
      },
    ], null))[0].endValue).toBeUndefined();
    expect(kavitaTocToSections(toc([
      {
        title: "Only",
        page: 5,
      },
    ], 3))[0].endValue).toBeUndefined();
  });

  it("returns [] for an empty ToC and assigns unique ids", () => {
    expect(kavitaTocToSections(toc([], 10))).toEqual([]);
    const sections = kavitaTocToSections(toc([
      {
        title: "A",
        page: 1,
      },
      {
        title: "B",
        page: 2,
      },
    ], null));
    expect(new Set(sections.map(s => s.id)).size).toBe(2);
  });
});
