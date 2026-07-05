// @vitest-environment node
import { describe, expect, it } from "vitest";

import { makeLanguageUsage } from "../../test-utils/factories";

import { draftsFromUsages, entriesFromDrafts } from "./draftLanguageUsage";

describe("draftLanguageUsage", () => {
  it("hydrates a translation source into a draft, or empty when absent", () => {
    const drafts = draftsFromUsages([
      makeLanguageUsage({
        translationSource: {
          id: "src-1",
          name: "Fan-translated",
          slug: "fan-translated",
        },
      }),
      makeLanguageUsage({
        id: "usage-2",
        translationSource: null,
      }),
    ]);
    expect(drafts[0].translationSourceId).toBe("src-1");
    expect(drafts[1].translationSourceId).toBe("");
  });

  it("shapes a selected translation source into the PUT entry", () => {
    const [entry] = entriesFromDrafts([
      {
        languageId: "lang-1",
        usageLevelId: "level-1",
        translationSourceId: "src-1",
        note: "  hi  ",
      },
    ]);
    expect(entry).toEqual({
      languageId: "lang-1",
      usageLevelId: "level-1",
      translationSourceId: "src-1",
      note: "hi",
    });
  });

  it("sends null when no translation source is chosen", () => {
    const [entry] = entriesFromDrafts([
      {
        languageId: "lang-1",
        usageLevelId: "level-1",
        translationSourceId: "",
        note: "",
      },
    ]);
    expect(entry.translationSourceId).toBeNull();
    expect(entry.note).toBeNull();
  });

  it("drops incomplete rows (missing language or level)", () => {
    const entries = entriesFromDrafts([
      {
        languageId: "",
        usageLevelId: "level-1",
        translationSourceId: "src-1",
        note: "",
      },
      {
        languageId: "lang-1",
        usageLevelId: "",
        translationSourceId: "src-1",
        note: "",
      },
    ]);
    expect(entries).toHaveLength(0);
  });

  it("round-trips a hydrated usage back to an equivalent entry", () => {
    const usage = makeLanguageUsage({
      translationSource: {
        id: "src-1",
        name: "Professionally translated",
        slug: "professionally-translated",
      },
      note: "official",
    });
    const [entry] = entriesFromDrafts(draftsFromUsages([usage]));
    expect(entry).toEqual({
      languageId: usage.language.id,
      usageLevelId: usage.level.id,
      translationSourceId: "src-1",
      note: "official",
    });
  });
});
