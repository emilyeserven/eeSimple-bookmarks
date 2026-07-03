// @vitest-environment node
import type { LanguageUsageAssociation, LanguageUsageLevel } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { groupLanguageUsages } from "./languageUsageGrouping";

const level = (id: string, name: string, slug: string, kind: LanguageUsageLevel["kind"] = "availability"): LanguageUsageLevel => ({
  id,
  name,
  slug,
  kind,
  builtIn: true,
  sortOrder: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  usageCount: 0,
});

const assoc = (
  langId: string,
  langName: string,
  langSlug: string,
  lvlId: string,
  lvlName: string,
  lvlSlug: string,
  count: number,
): LanguageUsageAssociation => ({
  language: {
    id: langId,
    name: langName,
    slug: langSlug,
  },
  level: {
    id: lvlId,
    name: lvlName,
    slug: lvlSlug,
    kind: "availability",
  },
  count,
});

const associations: LanguageUsageAssociation[] = [
  assoc("ja", "Japanese", "japanese", "sub", "Subtitles", "subtitles", 3),
  assoc("en", "English", "english", "sub", "Subtitles", "subtitles", 5),
  assoc("en", "English", "english", "dub", "Dub", "dub", 2),
];

describe("groupLanguageUsages", () => {
  it("groups by level, summing counts and nesting languages", () => {
    const groups = groupLanguageUsages(associations, "level");
    const sub = groups.find(g => g.id === "sub");
    expect(sub?.count).toBe(8); // 3 + 5
    expect(sub?.children.map(c => c.name)).toEqual(["English", "Japanese"]); // sorted by name
    // Each leaf carries the (language, level) slug pair for the link.
    const english = sub?.children.find(c => c.id === "en");
    expect(english).toMatchObject({
      languageSlug: "english",
      levelSlug: "subtitles",
      count: 5,
    });
  });

  it("groups by language, nesting the levels used", () => {
    const groups = groupLanguageUsages(associations, "language");
    const english = groups.find(g => g.id === "en");
    expect(english?.count).toBe(7); // Subtitles 5 + Dub 2
    expect(english?.children.map(c => c.name)).toEqual(["Dub", "Subtitles"]);
    const dubLeaf = english?.children.find(c => c.id === "dub");
    expect(dubLeaf).toMatchObject({
      languageSlug: "english",
      levelSlug: "dub",
    });
  });

  it("includes zero-association levels as empty groups only when grouping by level", () => {
    const levels = [level("sub", "Subtitles", "subtitles"), level("exp", "Explanations", "explanations")];
    const byLevel = groupLanguageUsages([associations[0]], "level", levels);
    const explanations = byLevel.find(g => g.id === "exp");
    expect(explanations).toMatchObject({
      count: 0,
      children: [],
    });

    // Grouping by language never invents empty language groups.
    const byLanguage = groupLanguageUsages([associations[0]], "language", levels);
    expect(byLanguage).toHaveLength(1);
    expect(byLanguage[0].id).toBe("ja");
  });

  it("sorts groups by name", () => {
    const groups = groupLanguageUsages(associations, "level");
    expect(groups.map(g => g.name)).toEqual(["Dub", "Subtitles"]);
  });
});
