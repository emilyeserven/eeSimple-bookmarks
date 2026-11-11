// @vitest-environment node
import type {
  Bookmark,
  CustomProperty,
  ExtensionFillContext,
  FillTarget,
  WebsiteExtensionFillRule,
} from "@eesimple/types";
import type { FillRunResult } from "../../lib/fill/fillEngine";
import type { ApplyState, BookmarkPatch } from "./rowTypes";

import { describe, expect, it } from "vitest";

import { buildRow } from "./buildRow";

/** Only the fields the row builders read; the rest of `Bookmark` is irrelevant here. */
function bookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: "b1",
    title: "Old title",
    description: null,
    isbn: null,
    year: 2020,
    images: [],
    people: [],
    groups: [],
    locations: [],
    tags: [],
    numberValues: [],
    booleanValues: [],
    textValues: [],
    dateTimeValues: [],
    progressValues: [],
    choicesValues: [],
    sectionsValues: [],
    ...overrides,
  } as Bookmark;
}

function rule(target: FillTarget): WebsiteExtensionFillRule {
  return {
    id: "r1",
    label: "Rule",
    target,
    extract: {
      selector: "h1",
    },
  };
}

function result(values: string[]): FillRunResult {
  return {
    ruleId: "r1",
    values,
  };
}

function ctx(b: Bookmark, extra: Partial<ExtensionFillContext> = {}): ExtensionFillContext {
  return {
    mode: "bookmark",
    bookmark: b,
    ...extra,
  };
}

function emptyState(): ApplyState {
  return {
    tax: {},
    taxHydrated: {},
    values: {},
    entityPatches: {},
    languageWrites: [],
    created: [],
    failed: [],
  };
}

async function applyRow(row: ReturnType<typeof buildRow>): Promise<{ patch: BookmarkPatch;
  state: ApplyState; }> {
  const patch: BookmarkPatch = {};
  const state = emptyState();
  await row.apply(patch, state);
  return {
    patch,
    state,
  };
}

describe("buildRow — bookmark fields", () => {
  it("diffs a title and writes it into the patch", async () => {
    const row = buildRow(rule({
      kind: "field",
      field: "title",
    }), result(["New title"]), ctx(bookmark()));
    expect(row).toMatchObject({
      currentText: "Old title",
      extractedText: "New title",
      changed: true,
      disabledReason: null,
    });
    expect((await applyRow(row)).patch).toEqual({
      title: "New title",
    });
  });

  it("coerces year to a number and reports an unchanged value as 'no change'", () => {
    const row = buildRow(rule({
      kind: "field",
      field: "year",
    }), result(["2020"]), ctx(bookmark()));
    expect(row.changed).toBe(false);
    expect(row.disabledReason).toBe("no change");
  });

  it("is 'not found' when nothing was extracted", () => {
    const row = buildRow(rule({
      kind: "field",
      field: "isbn",
    }), result([]), ctx(bookmark()));
    expect(row.disabledReason).toBe("not found");
  });
});

describe("buildRow — custom properties", () => {
  const rating = {
    id: "p-rating",
    name: "Level",
    type: "ratingScale",
    ratingAllowRange: true,
    ratingLabels: {
      1: "Beginner",
      2: "Intermediate",
    },
  } as unknown as CustomProperty;

  it("detect-range sets From/To from the present levels and keeps sibling values", async () => {
    const b = bookmark({
      numberValues: [{
        propertyId: "other",
        value: 7,
      }],
    });
    const row = buildRow(rule({
      kind: "customProperty",
      propertyId: "p-rating",
      ratingBound: "range",
    }), result(["2", "1"]), ctx(b, {
      properties: [rating],
    }));
    expect(row.extractedText).toBe("Beginner → Intermediate");
    const {
      state,
    } = await applyRow(row);
    expect([...state.values.numberValues?.values() ?? []]).toEqual([
      {
        propertyId: "other",
        value: 7,
      },
      {
        propertyId: "p-rating",
        value: 1,
        valueEnd: 2,
      },
    ]);
  });

  it("renders an unknown property as unsupported", () => {
    const row = buildRow(rule({
      kind: "customProperty",
      propertyId: "missing",
    }), result(["1"]), ctx(bookmark()));
    expect(row.disabledReason).toBe("unsupported");
  });
});

describe("buildRow — taxonomy", () => {
  it("is 'no change' when every extracted name is already linked (case-insensitive)", () => {
    const b = bookmark({
      tags: [{
        id: "t1",
        name: "React",
      }] as Bookmark["tags"],
    });
    const row = buildRow(rule({
      kind: "taxonomy",
      taxonomy: "tags",
    }), result(["react"]), ctx(b));
    expect(row.disabledReason).toBe("no change");
  });

  it("flags names with no existing option as new", () => {
    const row = buildRow(rule({
      kind: "taxonomy",
      taxonomy: "people",
    }), result(["Ada Lovelace", "Grace Hopper"]), ctx(bookmark(), {
      taxonomies: {
        people: [{
          id: "p1",
          name: "Ada Lovelace",
        }],
      },
    }));
    expect(row.extractedNames).toEqual(["Ada Lovelace", "Grace Hopper"]);
    expect(row.newNames).toEqual(["Grace Hopper"]);
  });
});

describe("buildRow — taxonomy mode and unknown targets", () => {
  it("disables bookmark targets when there is no bookmark", () => {
    const row = buildRow(rule({
      kind: "field",
      field: "title",
    }), result(["X"]), {
      mode: "taxonomy",
    });
    expect(row.disabledReason).toBe("unsupported");
  });

  it("renders a target kind from a newer server as unsupported instead of throwing", () => {
    const row = buildRow(rule({
      kind: "somethingNew",
    } as unknown as FillTarget), result(["X"]), ctx(bookmark()));
    expect(row.disabledReason).toBe("unsupported");
  });
});

describe("buildRow — taxonomyEntity", () => {
  it("auto-targets a single linked term and upserts its social link", async () => {
    const row = buildRow(rule({
      kind: "taxonomyEntity",
      association: "groups",
      field: "socialLink",
      socialPlatform: "x",
    } as FillTarget), result(["https://x.com/oreilly"]), ctx(bookmark(), {
      associatedTerms: {
        groups: [{
          id: "g1",
          name: "O'Reilly",
          socialLinks: [{
            platform: "youtube",
            url: "https://youtube.com/@oreilly",
          }] as never,
        }],
      },
    }));
    expect(row.changed).toBe(true);
    const {
      state,
    } = await applyRow(row);
    expect(state.entityPatches["groups:g1"]).toMatchObject({
      path: "/api/groups",
      id: "g1",
      patch: {
        socialLinks: [
          {
            platform: "youtube",
            url: "https://youtube.com/@oreilly",
          },
          {
            platform: "x",
            url: "https://x.com/oreilly",
          },
        ],
      },
    });
  });

  it("explains a missing linked term", () => {
    const row = buildRow(rule({
      kind: "taxonomyEntity",
      association: "website",
      field: "description",
    }), result(["About"]), ctx(bookmark()));
    expect(row.disabledReason).toBe("no linked website");
  });
});
