// @vitest-environment node
import type { ParseTemplate, SectionEntryType } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { parseWithTemplate, tokenizePattern } from "./sectionParseTemplate";

const OPTS = {
  allowedTypes: ["url", "page", "timestamp"] as SectionEntryType[],
  defaultType: "url" as SectionEntryType,
};

function template(overrides: Partial<ParseTemplate> = {}): ParseTemplate {
  return {
    id: "t1",
    name: "Test",
    description: null,
    delineator: " / ",
    pattern: "{{person}} - {{name}}",
    fallbackTag: "name",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const FUJILOVE = "Take Kayo - The Fujifilm X-Pro3 Was Never Meant for Everyone / "
  + "Rick Halpern - Light, Stone & Shadow: A Photographer's Field Guide to San Miguel de Allende / "
  + "Catherine Régnier - Winged Fairies / "
  + "Michael Govorko - An Ode to My Favourite Lens: The XF23MMF1.4 R / "
  + "From the Feed: FujiLove Community / "
  + "FujiLove Interview: Jess Ellis / "
  + "Dawn Eagleton - Exeter, UK: Photography Close to Home / "
  + "Rico Pfirstinger - Exposing Right: Part 30 / "
  + "Piet Van den Eynde - What's New in Adobe Camera RAW & Why It Matters for Lightroom / "
  + "Lee Varis - One Lens, Three Countries: How the XF18-135MMF3.5-5.6 Became the Perfect Time Machine / "
  + "Dylan Goldby - Is Your LCD Shaping Your Photographs?";

describe("tokenizePattern", () => {
  it("splits a pattern into tag and literal tokens in order", () => {
    expect(tokenizePattern("{{person}} - {{name}}")).toEqual([
      {
        kind: "tag",
        tag: "person",
      },
      {
        kind: "literal",
        text: " - ",
      },
      {
        kind: "tag",
        tag: "name",
      },
    ]);
  });

  it("tolerates whitespace inside the braces", () => {
    expect(tokenizePattern("{{ page }}: {{ name }}")).toEqual([
      {
        kind: "tag",
        tag: "page",
      },
      {
        kind: "literal",
        text: ": ",
      },
      {
        kind: "tag",
        tag: "name",
      },
    ]);
  });
});

describe("parseWithTemplate — the FujiLove example", () => {
  const result = parseWithTemplate(FUJILOVE, template(), OPTS);

  it("produces one section per delimited item", () => {
    expect(result.itemCount).toBe(11);
    expect(result.sections).toHaveLength(11);
  });

  it("strips the author prefix from the section name", () => {
    expect(result.sections[0].name).toBe("The Fujifilm X-Pro3 Was Never Meant for Everyone");
  });

  it("keeps the full title when it contains later separators", () => {
    expect(result.sections[1].name).toBe(
      "Light, Stone & Shadow: A Photographer's Field Guide to San Miguel de Allende",
    );
  });

  it("collects distinct authors as people", () => {
    expect(result.personNames).toContain("Take Kayo");
    expect(result.personNames).toContain("Rick Halpern");
    expect(result.personNames).toContain("Dylan Goldby");
  });

  it("falls back to the whole item for exceptions with no author", () => {
    expect(result.fallbackCount).toBe(2);
    const names = result.sections.map(s => s.name);
    expect(names).toContain("From the Feed: FujiLove Community");
    expect(names).toContain("FujiLove Interview: Jess Ellis");
    expect(result.personNames).not.toContain("From the Feed: FujiLove Community");
    expect(result.personNames).not.toContain("FujiLove Interview");
  });

  it("uses the property default type for section rows", () => {
    expect(result.sections.every(s => s.type === "url")).toBe(true);
  });
});

describe("parseWithTemplate — positional tags", () => {
  it("maps {{page}} to startValue with a page type", () => {
    const result = parseWithTemplate(
      "Intro - 1 / Chapter One - 12",
      template({
        pattern: "{{name}} - {{page}}",
      }),
      OPTS,
    );
    expect(result.sections).toEqual([
      expect.objectContaining({
        name: "Intro",
        type: "page",
        startValue: "1",
      }),
      expect.objectContaining({
        name: "Chapter One",
        type: "page",
        startValue: "12",
      }),
    ]);
    expect(result.personNames).toEqual([]);
  });

  it("maps {{timestamp}} to startValue with a timestamp type", () => {
    const result = parseWithTemplate(
      "Opening @ 0:00 / Verse @ 0:45",
      template({
        delineator: " / ",
        pattern: "{{name}} @ {{timestamp}}",
      }),
      OPTS,
    );
    expect(result.sections[0]).toEqual(
      expect.objectContaining({
        name: "Opening",
        type: "timestamp",
        startValue: "0:00",
      }),
    );
  });

  it("falls back to defaultType when the positional tag isn't allowed", () => {
    const result = parseWithTemplate(
      "Intro - 1",
      template({
        pattern: "{{name}} - {{page}}",
      }),
      {
        allowedTypes: ["url"],
        defaultType: "url",
      },
    );
    expect(result.sections[0].type).toBe("url");
  });
});

describe("parseWithTemplate — edge cases", () => {
  it("dedupes repeated author names case-insensitively", () => {
    const result = parseWithTemplate(
      "Jane Doe - A / jane doe - B",
      template(),
      OPTS,
    );
    expect(result.personNames).toEqual(["Jane Doe"]);
  });

  it("routes the whole item to a person fallbackTag when chosen", () => {
    const result = parseWithTemplate(
      "Standalone Author",
      template({
        fallbackTag: "person",
      }),
      OPTS,
    );
    expect(result.fallbackCount).toBe(1);
    expect(result.personNames).toEqual(["Standalone Author"]);
    expect(result.sections).toHaveLength(0);
  });

  it("splits on newlines when the delineator is empty", () => {
    const result = parseWithTemplate(
      "A - One\nB - Two",
      template({
        delineator: "",
      }),
      OPTS,
    );
    expect(result.sections.map(s => s.name)).toEqual(["One", "Two"]);
    expect(result.personNames).toEqual(["A", "B"]);
  });
});
