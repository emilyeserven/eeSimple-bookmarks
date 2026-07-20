// @vitest-environment node
import { describe, expect, it } from "vitest";

import { aiFieldKeyForProperty } from "./bookmarkAiUpdate";
import {
  buildAiUpdateApplyPlan,
  buildAiUpdateReview,
  wireAiSections,
} from "./bookmarkAiUpdateReview";
import { makeBookmark, makeCustomProperty } from "../test-utils/factories";

import type { AiUpdateProposal } from "./bookmarkAiUpdate";
import type { AiUpdateReviewContext } from "./bookmarkAiUpdateReview";
import type { Bookmark, CustomProperty } from "@eesimple/types";

function makeCtx(bookmark: Bookmark, overrides: Partial<AiUpdateReviewContext> = {}): AiUpdateReviewContext {
  return {
    bookmark,
    tags: [{
      id: "t1",
      name: "python",
    }],
    categories: [{
      id: "cat",
      name: "Dev",
    }, {
      id: "cat-2",
      name: "Reading",
    }],
    mediaTypes: [{
      id: "mt-1",
      name: "Book",
      slug: "book",
      parentId: null,
    }],
    people: [{
      id: "pe1",
      name: "Jane Doe",
    }],
    groups: [],
    languages: [{
      id: "lang-en",
      name: "English",
      isoCode: "en",
    }, {
      id: "lang-ja",
      name: "Japanese",
      isoCode: "ja",
    }],
    ...overrides,
  };
}

function reviewOne(
  proposal: AiUpdateProposal,
  ctx: AiUpdateReviewContext,
  properties: CustomProperty[] = [],
) {
  return buildAiUpdateReview([proposal], properties, ctx);
}

const seq = () => {
  let n = 0;
  return () => `id-${++n}`;
};

describe("buildAiUpdateReview", () => {
  it("marks a scalar changed vs same by comparing values", () => {
    const ctx = makeCtx(makeBookmark({
      title: "Old",
    }));
    const changed = reviewOne({
      fieldKey: "title",
      ok: true,
      value: {
        kind: "text",
        text: "New",
      },
    }, ctx);
    expect(changed[0]).toMatchObject({
      status: "changed",
      current: "Old",
      proposed: "New",
    });
    const same = reviewOne({
      fieldKey: "title",
      ok: true,
      value: {
        kind: "text",
        text: "Old",
      },
    }, ctx);
    expect(same[0].status).toBe("same");
    expect(same[0].apply).toBeUndefined();
  });

  it("surfaces a rejected proposal as an invalid row with its reason", () => {
    const rows = reviewOne({
      fieldKey: "year",
      ok: false,
      reason: "Not a whole number",
    }, makeCtx(makeBookmark()));
    expect(rows[0]).toMatchObject({
      status: "invalid",
      invalidReason: "Not a whole number",
    });
  });

  it("matches taxonomy names case-insensitively and flags unmatched ones as creations", () => {
    const ctx = makeCtx(makeBookmark({
      tags: [{
        id: "t1",
        name: "python",
        slug: "python",
        parentId: null,
        editableOnCard: false,
      }],
    }));
    const rows = reviewOne({
      fieldKey: "tags",
      ok: true,
      value: {
        kind: "nameList",
        names: ["PYTHON", "brand new"],
      },
    }, ctx);
    // Already on the bookmark → same; unknown everywhere → changed + will-be-created.
    expect(rows[0]).toMatchObject({
      status: "same",
    });
    expect(rows[1]).toMatchObject({
      status: "changed",
      creates: "tag",
      proposed: "brand new",
    });
  });

  it("resolves an existing-but-unassigned tag to an add without a creation", () => {
    const rows = reviewOne({
      fieldKey: "tags",
      ok: true,
      value: {
        kind: "nameList",
        names: ["Python"],
      },
    }, makeCtx(makeBookmark()));
    expect(rows[0].status).toBe("changed");
    expect(rows[0].creates).toBeUndefined();
    expect(rows[0].apply).toMatchObject({
      kind: "addRelation",
      existingId: "t1",
    });
  });

  it("treats a category name matching the current category as same", () => {
    const ctx = makeCtx(makeBookmark({
      categoryId: "cat",
    }));
    expect(reviewOne({
      fieldKey: "category",
      ok: true,
      value: {
        kind: "name",
        name: "dev",
      },
    }, ctx)[0].status).toBe("same");
    const switched = reviewOne({
      fieldKey: "category",
      ok: true,
      value: {
        kind: "name",
        name: "Reading",
      },
    }, ctx)[0];
    expect(switched).toMatchObject({
      status: "changed",
      apply: {
        kind: "singleRelation",
        existingId: "cat-2",
      },
    });
  });

  it("resolves name-entry languages by name or ISO code and rejects unknown languages", () => {
    const ctx = makeCtx(makeBookmark({
      names: [{
        id: "n1",
        language: {
          id: "lang-en",
          name: "English",
          slug: "english",
          isoCode: "en",
        },
        value: "Old",
        isPrimary: true,
        sortOrder: 0,
      }],
    }));
    const rows = reviewOne({
      fieldKey: "names",
      ok: true,
      value: {
        kind: "names",
        entries: [{
          language: "ja",
          value: "新しい",
        }, {
          language: "Klingon",
          value: "x",
        }],
      },
    }, ctx);
    expect(rows[0]).toMatchObject({
      status: "changed",
      key: "names:lang-ja",
    });
    expect(rows[1]).toMatchObject({
      status: "invalid",
      invalidReason: "Unknown language",
    });
  });
});

describe("buildAiUpdateApplyPlan", () => {
  it("unions kept relation ids over the bookmark's existing ones (additive-only)", () => {
    const bookmark = makeBookmark({
      tags: [{
        id: "t-old",
        name: "existing",
        slug: "existing",
        parentId: null,
        editableOnCard: false,
      }],
    });
    const ctx = makeCtx(bookmark);
    const rows = buildAiUpdateReview([{
      fieldKey: "tags",
      ok: true,
      value: {
        kind: "nameList",
        names: ["Python", "brand new"],
      },
    }], [], ctx);
    const plan = buildAiUpdateApplyPlan(rows, new Set(), ctx, seq());
    expect(plan.creations).toEqual([{
      kind: "tag",
      name: "brand new",
      rowKey: "tags:brand new",
    }]);
    const input = plan.buildBookmarkInput(new Map([["tags:brand new", "t-created"]]));
    expect(input?.tagIds?.sort()).toEqual(["t-created", "t-old", "t1"]);
  });

  it("drops an excluded row from the plan", () => {
    const ctx = makeCtx(makeBookmark());
    const rows = buildAiUpdateReview([{
      fieldKey: "tags",
      ok: true,
      value: {
        kind: "nameList",
        names: ["brand new"],
      },
    }], [], ctx);
    const plan = buildAiUpdateApplyPlan(rows, new Set(["tags:brand new"]), ctx, seq());
    expect(plan.hasChanges).toBe(false);
    expect(plan.creations).toEqual([]);
    expect(plan.buildBookmarkInput(new Map())).toBeNull();
  });

  it("seeds a sent value array with the bookmark's existing entries of that type", () => {
    const property = makeCustomProperty({
      id: "p1",
      slug: "difficulty",
      type: "number",
    });
    const bookmark = makeBookmark({
      numberValues: [{
        propertyId: "other",
        value: 7,
        valueEnd: null,
      }, {
        propertyId: "p1",
        value: 2,
        valueEnd: null,
      }],
    });
    const ctx = makeCtx(bookmark);
    const rows = buildAiUpdateReview([{
      fieldKey: aiFieldKeyForProperty("p1"),
      ok: true,
      value: {
        kind: "propNumber",
        value: 4,
      },
    }], [property], ctx);
    const input = buildAiUpdateApplyPlan(rows, new Set(), ctx, seq()).buildBookmarkInput(new Map());
    // The untouched "other" entry must ride along — the PATCH replaces the whole array.
    expect(input?.numberValues).toContainEqual({
      propertyId: "other",
      value: 7,
      valueEnd: null,
    });
    expect(input?.numberValues).toContainEqual({
      propertyId: "p1",
      value: 4,
      valueEnd: null,
    });
    expect(input?.booleanValues).toBeUndefined();
  });

  it("preserves a progress value's display overrides", () => {
    const property = makeCustomProperty({
      id: "p1",
      type: "itemInItems",
    });
    const bookmark = makeBookmark({
      progressValues: [{
        propertyId: "p1",
        current: 1,
        total: 10,
        textOverride: {
          beforeText: "page ",
          betweenText: " of ",
          afterText: "",
        },
        autoSpace: false,
      }],
    });
    const ctx = makeCtx(bookmark);
    const rows = buildAiUpdateReview([{
      fieldKey: aiFieldKeyForProperty("p1"),
      ok: true,
      value: {
        kind: "propProgress",
        current: 3,
        total: 12,
      },
    }], [property], ctx);
    const input = buildAiUpdateApplyPlan(rows, new Set(), ctx, seq()).buildBookmarkInput(new Map());
    expect(input?.progressValues?.[0]).toMatchObject({
      current: 3,
      total: 12,
      textOverride: {
        beforeText: "page ",
      },
      autoSpace: false,
    });
  });

  it("builds the replace-all names set, mirroring a kept title change into the primary row", () => {
    const bookmark = makeBookmark({
      title: "Old",
      names: [{
        id: "n1",
        language: {
          id: "lang-en",
          name: "English",
          slug: "english",
          isoCode: "en",
        },
        value: "Old",
        isPrimary: true,
        sortOrder: 0,
      }],
    });
    const ctx = makeCtx(bookmark);
    const rows = buildAiUpdateReview([{
      fieldKey: "title",
      ok: true,
      value: {
        kind: "text",
        text: "New Title",
      },
    }, {
      fieldKey: "names",
      ok: true,
      value: {
        kind: "names",
        entries: [{
          language: "Japanese",
          value: "新しい",
        }],
      },
    }], [], ctx);
    const plan = buildAiUpdateApplyPlan(rows, new Set(), ctx, seq());
    expect(plan.namesEntries).toEqual([{
      languageId: "lang-en",
      value: "New Title",
      isPrimary: true,
    }, {
      languageId: "lang-ja",
      value: "新しい",
    }]);
    expect(plan.buildBookmarkInput(new Map())?.title).toBe("New Title");
  });

  it("leaves namesEntries null when only the title changes and there is no primary name row", () => {
    const ctx = makeCtx(makeBookmark({
      title: "Old",
    }));
    const rows = buildAiUpdateReview([{
      fieldKey: "title",
      ok: true,
      value: {
        kind: "text",
        text: "New",
      },
    }], [], ctx);
    const plan = buildAiUpdateApplyPlan(rows, new Set(), ctx, seq());
    expect(plan.namesEntries).toBeNull();
    expect(plan.buildBookmarkInput(new Map())?.title).toBe("New");
  });

  it("replaces a sections value wholesale, preserving its exhaustive flag", () => {
    const property = makeCustomProperty({
      id: "p1",
      type: "sections",
      sectionsTiered: true,
    });
    const bookmark = makeBookmark({
      sectionsValues: [{
        propertyId: "p1",
        exhaustive: false,
        sections: [{
          id: "s-old",
          name: "Old",
          type: "name",
          startValue: "",
        }],
      }],
    });
    const ctx = makeCtx(bookmark);
    const rows = buildAiUpdateReview([{
      fieldKey: aiFieldKeyForProperty("p1"),
      ok: true,
      value: {
        kind: "propSections",
        sections: [{
          name: "Ch 1",
          startValue: "1",
          children: [{
            name: "1.1",
          }],
        }],
      },
    }], [property], ctx);
    const input = buildAiUpdateApplyPlan(rows, new Set(), ctx, seq()).buildBookmarkInput(new Map());
    expect(input?.sectionsValues?.[0]).toMatchObject({
      propertyId: "p1",
      exhaustive: false,
      sections: [{
        id: "id-1",
        name: "Ch 1",
        children: [{
          id: "id-2",
          name: "1.1",
        }],
      }],
    });
  });

  it("counts distinct applied fields for the toast summary", () => {
    const ctx = makeCtx(makeBookmark({
      title: "Old",
    }));
    const rows = buildAiUpdateReview([{
      fieldKey: "title",
      ok: true,
      value: {
        kind: "text",
        text: "New",
      },
    }, {
      fieldKey: "tags",
      ok: true,
      value: {
        kind: "nameList",
        names: ["a", "b"],
      },
    }], [], ctx);
    const plan = buildAiUpdateApplyPlan(rows, new Set(), ctx, seq());
    // Two tag rows collapse into one field.
    expect(plan.fieldCount).toBe(2);
  });
});

describe("wireAiSections", () => {
  it("types entries from the media-type hint when the property allows it", () => {
    const property = makeCustomProperty({
      id: "p1",
      type: "sections",
      sectionsAllowedTypes: null,
    });
    const bookmark = makeBookmark({
      mediaType: {
        id: "mt-1",
        name: "Book",
        slug: "book",
        icon: null,
        parentId: null,
        builtIn: false,
      },
    });
    const entries = wireAiSections([{
      name: "Ch 1",
      startValue: "5",
    }, {
      name: "Untitled",
    }], property, {
      bookmark,
      mediaTypes: [{
        id: "mt-1",
        name: "Book",
        slug: "book",
        parentId: null,
      }],
    }, seq());
    // A valued entry takes the hinted type ("page" for books); a valueless one stays name-only.
    expect(entries[0]).toMatchObject({
      type: "page",
      startValue: "5",
    });
    expect(entries[1]).toMatchObject({
      type: "name",
      startValue: "",
    });
  });

  it("falls back to the property's allowed types when the hint is not allowed", () => {
    const property = makeCustomProperty({
      id: "p1",
      type: "sections",
      sectionsAllowedTypes: ["timestamp"],
    });
    const entries = wireAiSections([{
      name: "Intro",
      startValue: "0:00",
    }], property, {
      bookmark: makeBookmark(),
      mediaTypes: [],
    }, seq());
    expect(entries[0].type).toBe("timestamp");
  });
});
