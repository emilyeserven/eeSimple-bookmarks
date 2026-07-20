// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  AI_BULK_EDIT_SOFT_WARNING_THRESHOLD,
  buildAiBulkEditPrompt,
  dedupeBulkCreations,
  describeAiBulkEditResult,
  EMPTY_AI_BULK_EDIT_SELECTION,
  parseAiBulkEditText,
  prefixReviewRows,
  resolveBulkTargets,
} from "./aiBulkEdit";
import { aiFieldKeyForProperty, listAiBulkUpdatableFields } from "./bookmarkAiUpdate";
import { makeBookmark, makeCustomProperty } from "../test-utils/factories";

import type { AiBulkEditPromptArgs, AiBulkEditSelection } from "./aiBulkEdit";
import type { AiUpdateReviewRow } from "./bookmarkAiUpdateReview";

function selection(overrides: Partial<AiBulkEditSelection>): AiBulkEditSelection {
  return {
    ...EMPTY_AI_BULK_EDIT_SELECTION,
    ...overrides,
  };
}

const bmTag = (id: string, name: string) => ({
  id,
  name,
  slug: name,
  parentId: null,
  editableOnCard: false,
});

describe("resolveBulkTargets", () => {
  const bookmarks = [
    makeBookmark({
      id: "b1",
      categoryId: "cat-1",
    }),
    makeBookmark({
      id: "b2",
      categoryId: "cat-2",
      tags: [bmTag("t-child", "child")],
    }),
    makeBookmark({
      id: "b3",
      categoryId: "cat-2",
      website: {
        id: "w1",
        domain: "example.com",
        siteName: "Example",
        slug: "example",
      },
    }),
  ];

  it("matches nothing for an empty selection", () => {
    expect(resolveBulkTargets(bookmarks, EMPTY_AI_BULK_EDIT_SELECTION)).toEqual([]);
  });

  it("unions individual picks with group matches, deduped in stable order", () => {
    const targets = resolveBulkTargets(bookmarks, selection({
      bookmarkIds: ["b3"],
      categoryIds: ["cat-1"],
    }));
    expect(targets.map(bookmark => bookmark.id)).toEqual(["b1", "b3"]);
  });

  it("does not double-count a bookmark matching several groups", () => {
    const targets = resolveBulkTargets(bookmarks, selection({
      bookmarkIds: ["b3"],
      categoryIds: ["cat-2"],
      websiteIds: ["w1"],
    }));
    expect(targets.map(bookmark => bookmark.id)).toEqual(["b2", "b3"]);
  });

  it("expands a selected tag to its subtree when the tree is provided", () => {
    const tagTree = [{
      id: "t-parent",
      children: [{
        id: "t-child",
        children: [],
      }],
    }];
    expect(resolveBulkTargets(bookmarks, selection({
      tagIds: ["t-parent"],
    }), {
      tagTree,
    }).map(bookmark => bookmark.id)).toEqual(["b2"]);
    // Without the tree, only exact-id matches apply.
    expect(resolveBulkTargets(bookmarks, selection({
      tagIds: ["t-parent"],
    }))).toEqual([]);
  });
});

describe("buildAiBulkEditPrompt", () => {
  function promptArgs(overrides: Partial<AiBulkEditPromptArgs> = {}): AiBulkEditPromptArgs {
    return {
      template: "",
      bookmarks: [
        makeBookmark({
          id: "b1",
          title: "First",
          categoryId: "cat-1",
        }),
        makeBookmark({
          id: "b2",
          title: "Second",
          url: "https://two.example",
        }),
      ],
      checked: ["title", "year"],
      properties: [],
      categories: [{
        id: "cat-1",
        name: "Dev",
      }],
      categoryNames: ["Dev"],
      mediaTypeNames: [],
      tagNames: [],
      ...overrides,
    };
  }

  it("emits the rules block once and one bracketed block per bookmark", () => {
    const prompt = buildAiBulkEditPrompt(promptArgs());
    expect(prompt).toContain("updating MULTIPLE bookmarks");
    expect(prompt.match(/Fields to update — include ONLY these keys/g)).toHaveLength(1);
    expect(prompt.indexOf("[b1] First")).toBeGreaterThan(-1);
    expect(prompt.indexOf("[b2] Second")).toBeGreaterThan(prompt.indexOf("[b1] First"));
  });

  it("wraps the example in a bookmarks array carrying the first target's id", () => {
    const prompt = buildAiBulkEditPrompt(promptArgs());
    expect(prompt).toContain("\"bookmarks\": [");
    expect(prompt).toContain("\"id\": \"b1\"");
    expect(prompt).toContain("\"title\": \"Improved title\"");
  });

  it("shows checked-only standard context per bookmark, with URL always present", () => {
    const prompt = buildAiBulkEditPrompt(promptArgs({
      checked: ["title"],
      bookmarks: [makeBookmark({
        id: "b1",
        title: "First",
        year: 2001,
        categoryId: "cat-1",
      })],
    }));
    expect(prompt).toContain("- URL: https://example.com");
    // year/category are unchecked → their context lines are omitted from the block.
    expect(prompt).not.toContain("- Year: 2001");
    expect(prompt).not.toContain("- Category: Dev");
  });

  it("includes a checked property's current value per bookmark and its rule once", () => {
    const property = makeCustomProperty({
      id: "p1",
      slug: "rating",
      name: "Rating",
      type: "number",
    });
    const prompt = buildAiBulkEditPrompt(promptArgs({
      checked: [aiFieldKeyForProperty("p1")],
      properties: [property],
      bookmarks: [
        makeBookmark({
          id: "b1",
          title: "First",
          numberValues: [{
            propertyId: "p1",
            value: 4,
            valueEnd: null,
          }],
        }),
        makeBookmark({
          id: "b2",
          title: "Second",
        }),
      ],
    }));
    expect(prompt).toContain("- Rating: 4");
    expect(prompt).toContain("- Rating: (not set)");
    expect(prompt.match(/"properties"\."rating"/g)).toHaveLength(1);
  });

  it("keeps the soft-warning threshold out of the prompt", () => {
    expect(buildAiBulkEditPrompt(promptArgs())).not.toContain(String(AI_BULK_EDIT_SOFT_WARNING_THRESHOLD));
  });
});

describe("parseAiBulkEditText", () => {
  const known = new Set(["b1", "b2"]);

  it("returns empty / error / invalid for blank, non-JSON, and shapeless input", () => {
    expect(parseAiBulkEditText("", ["title"], [], known).kind).toBe("empty");
    expect(parseAiBulkEditText("nope", ["title"], [], known).kind).toBe("error");
    expect(parseAiBulkEditText("{ \"foo\": 1 }", ["title"], [], known).kind).toBe("invalid");
  });

  it("parses the bookmarks wrapper, a bare array, and a single entry object", () => {
    const wrapper = parseAiBulkEditText(
      "{ \"bookmarks\": [{ \"id\": \"b1\", \"title\": \"New\" }] }",
      ["title"],
      [],
      known,
    );
    const bare = parseAiBulkEditText("[{ \"id\": \"b1\", \"title\": \"New\" }]", ["title"], [], known);
    const single = parseAiBulkEditText("{ \"id\": \"b1\", \"title\": \"New\" }", ["title"], [], known);
    for (const state of [wrapper, bare, single]) {
      expect(state.kind).toBe("ok");
      if (state.kind !== "ok") continue;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].bookmarkId).toBe("b1");
      expect(state.items[0].proposals).toEqual([{
        fieldKey: "title",
        ok: true,
        value: {
          kind: "text",
          text: "New",
        },
      }]);
    }
  });

  it("collects unknown, missing, and duplicate ids without failing", () => {
    const state = parseAiBulkEditText(
      "{ \"bookmarks\": [{ \"id\": \"b1\", \"title\": \"A\" }, { \"id\": \"b1\", \"title\": \"B\" }, { \"id\": \"nope\", \"title\": \"C\" }, { \"title\": \"D\" }] }",
      ["title"],
      [],
      known,
    );
    expect(state.kind).toBe("ok");
    if (state.kind !== "ok") return;
    expect(state.items).toHaveLength(1);
    expect(state.unknownIds).toEqual(["b1", "nope", "(missing id)"]);
  });

  it("keeps per-bookmark ignored keys and rejected proposals separate", () => {
    const state = parseAiBulkEditText(
      "{ \"bookmarks\": [{ \"id\": \"b1\", \"title\": \"A\", \"bogus\": 1 }, { \"id\": \"b2\", \"year\": \"soon\" }] }",
      ["title", "year"],
      [],
      known,
    );
    expect(state.kind).toBe("ok");
    if (state.kind !== "ok") return;
    expect(state.items[0].ignoredKeys).toEqual(["bogus"]);
    expect(state.items[1].proposals).toEqual([{
      fieldKey: "year",
      ok: false,
      reason: "Not a whole number",
    }]);
  });

  it("strips a wrapping code fence", () => {
    const state = parseAiBulkEditText(
      "```json\n{ \"bookmarks\": [{ \"id\": \"b1\", \"title\": \"New\" }] }\n```",
      ["title"],
      [],
      known,
    );
    expect(state.kind).toBe("ok");
  });
});

describe("review/apply glue", () => {
  it("prefixes review-row keys with the bookmark id", () => {
    const rows = [{
      key: "title",
      fieldKey: "title",
      label: "Title",
      current: "a",
      proposed: "b",
      status: "changed",
    }] as AiUpdateReviewRow[];
    expect(prefixReviewRows("b1", rows)[0].key).toBe("b1:title");
    // The input rows are not mutated.
    expect(rows[0].key).toBe("title");
  });

  it("groups creations by kind and case-insensitive name, fanning out row keys", () => {
    const groups = dedupeBulkCreations([
      {
        kind: "tag",
        name: "Python",
        rowKey: "b1:tags:python",
      },
      {
        kind: "tag",
        name: "python",
        rowKey: "b2:tags:python",
      },
      {
        kind: "person",
        name: "Python",
        rowKey: "b1:people:python",
      },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({
      kind: "tag",
      name: "Python",
      rowKeys: ["b1:tags:python", "b2:tags:python"],
    });
    expect(groups[1].kind).toBe("person");
  });

  it("describes the aggregate result", () => {
    expect(describeAiBulkEditResult(4, 2, 0)).toBe("Updated 4 fields across 2 bookmarks");
    expect(describeAiBulkEditResult(1, 1, 2)).toBe("Updated 1 field across 1 bookmark, created 2 new entries");
  });
});

describe("listAiBulkUpdatableFields", () => {
  it("lists every enabled JSON-typed property regardless of category/media-type scope", () => {
    const scoped = makeCustomProperty({
      id: "p1",
      categoryIds: ["some-other-cat"],
      mediaTypeIds: ["some-mt"],
    });
    const image = makeCustomProperty({
      id: "img",
      type: "image",
    });
    const disabled = makeCustomProperty({
      id: "off",
      enabled: false,
    });
    const calculated = makeCustomProperty({
      id: "calc",
      type: "calculate",
    });
    const fields = listAiBulkUpdatableFields([scoped, image, disabled, calculated]);
    const keys = fields.map(field => field.key);
    expect(keys).toContain("prop:p1");
    expect(keys).not.toContain("prop:img");
    expect(keys).not.toContain("prop:off");
    expect(fields.find(field => field.key === "prop:calc")?.disabledReason).toBe("calculated");
    expect(keys).toContain("title");
    expect(keys).toContain("tags");
  });
});
