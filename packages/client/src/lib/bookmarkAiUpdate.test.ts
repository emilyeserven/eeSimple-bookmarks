// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  aiFieldKeyForProperty,
  buildBookmarkAiUpdatePrompt,
  DEFAULT_BOOKMARK_AI_UPDATE_TEMPLATE,
  listAiUpdatableFields,
  parseBookmarkAiUpdateText,
  TAG_VOCAB_LIMIT,
} from "./bookmarkAiUpdate";
import { makeBookmark, makeCustomProperty } from "../test-utils/factories";

import type { BookmarkAiUpdatePromptArgs } from "./bookmarkAiUpdate";

function promptArgs(overrides: Partial<BookmarkAiUpdatePromptArgs> = {}): BookmarkAiUpdatePromptArgs {
  return {
    template: "",
    bookmark: makeBookmark(),
    checked: ["title"],
    properties: [],
    categoryName: "Dev",
    categoryNames: ["Dev", "Reading"],
    mediaTypeNames: ["Video", "Book"],
    tagNames: ["python", "testing"],
    ...overrides,
  };
}

describe("listAiUpdatableFields", () => {
  it("lists standard fields, relations, and in-scope enabled properties", () => {
    const inScope = makeCustomProperty({
      id: "p1",
      name: "Rating",
      type: "ratingScale",
      allCategories: true,
    });
    const outOfScope = makeCustomProperty({
      id: "p2",
      categoryIds: ["other-cat"],
      mediaTypeIds: ["mt-x"],
    });
    const fields = listAiUpdatableFields(makeBookmark({
      categoryId: "cat",
    }), [inScope, outOfScope]);
    const keys = fields.map(field => field.key);
    expect(keys).toContain("title");
    expect(keys).toContain("tags");
    expect(keys).toContain("prop:p1");
    expect(keys).not.toContain("prop:p2");
  });

  it("excludes image/file and disabled properties, and disables derived ones", () => {
    const image = makeCustomProperty({
      id: "img",
      type: "image",
      allCategories: true,
    });
    const disabled = makeCustomProperty({
      id: "off",
      enabled: false,
      allCategories: true,
    });
    const calculated = makeCustomProperty({
      id: "calc",
      type: "calculate",
      allCategories: true,
    });
    const driven = makeCustomProperty({
      id: "prog",
      type: "itemInItems",
      itemInItemsSourcePropertyId: "sections-prop",
      allCategories: true,
    });
    const fields = listAiUpdatableFields(makeBookmark(), [image, disabled, calculated, driven]);
    const byKey = new Map(fields.map(field => [field.key, field]));
    expect(byKey.has("prop:img")).toBe(false);
    expect(byKey.has("prop:off")).toBe(false);
    expect(byKey.get("prop:calc")?.disabledReason).toBe("calculated");
    expect(byKey.get("prop:prog")?.disabledReason).toBe("sectionsDriven");
  });

  it("includes a property in scope via the media type only", () => {
    const property = makeCustomProperty({
      id: "p1",
      mediaTypeIds: ["mt-1"],
      categoryIds: ["other-cat"],
    });
    const bookmark = makeBookmark({
      categoryId: "cat",
      mediaType: {
        id: "mt-1",
        name: "Video",
        slug: "video",
        icon: null,
        parentId: null,
        builtIn: false,
      },
    });
    // categoryIds: ["other-cat"] does not match "cat", but the media type does (union scoping).
    expect(listAiUpdatableFields(bookmark, [property]).map(field => field.key)).toContain("prop:p1");
  });
});

describe("buildBookmarkAiUpdatePrompt", () => {
  it("falls back to the default template when the stored template is blank", () => {
    expect(buildBookmarkAiUpdatePrompt(promptArgs({
      template: "  ",
    }))).toContain(DEFAULT_BOOKMARK_AI_UPDATE_TEMPLATE);
    expect(buildBookmarkAiUpdatePrompt(promptArgs({
      template: "My instructions.",
    }))).toContain("My instructions.");
  });

  it("includes the bookmark context and the strict-JSON output instruction", () => {
    const prompt = buildBookmarkAiUpdatePrompt(promptArgs({
      bookmark: makeBookmark({
        title: "Fluent Python",
        year: 2022,
      }),
    }));
    expect(prompt).toContain("- Title: Fluent Python");
    expect(prompt).toContain("- Year: 2022");
    expect(prompt).toContain("Respond with ONLY a JSON object — no prose and no code fences.");
  });

  it("emits a rule line per checked field only, and an example filtered to them", () => {
    const prompt = buildBookmarkAiUpdatePrompt(promptArgs({
      checked: ["title", "year"],
    }));
    expect(prompt).toContain("- \"title\":");
    expect(prompt).toContain("- \"year\":");
    expect(prompt).not.toContain("- \"description\":");
    expect(prompt).toContain("\"title\": \"Improved title\"");
    expect(prompt).not.toContain("\"tags\": [");
  });

  it("injects a checked property's description and AI instructions into its rule line", () => {
    const property = makeCustomProperty({
      id: "p1",
      slug: "difficulty",
      name: "Difficulty",
      type: "number",
      numberMin: 1,
      numberMax: 5,
      description: "How hard the material is.",
      aiInstructions: "Judge for a self-taught learner.",
    });
    const prompt = buildBookmarkAiUpdatePrompt(promptArgs({
      checked: [aiFieldKeyForProperty("p1")],
      properties: [property],
    }));
    expect(prompt).toContain("\"properties\".\"difficulty\"");
    expect(prompt).toContain("min 1, max 5");
    expect(prompt).toContain("Description: How hard the material is.");
    expect(prompt).toContain("Instructions: Judge for a self-taught learner.");
  });

  it("includes a checked property's current value in the context block", () => {
    const property = makeCustomProperty({
      id: "p1",
      slug: "pages",
      name: "Pages",
      type: "itemInItems",
    });
    const prompt = buildBookmarkAiUpdatePrompt(promptArgs({
      checked: [aiFieldKeyForProperty("p1")],
      properties: [property],
      bookmark: makeBookmark({
        progressValues: [{
          propertyId: "p1",
          current: 3,
          total: 12,
        }],
      }),
    }));
    expect(prompt).toContain("- Pages: 3 of 12");
  });

  it("embeds vocabulary only for checked relation fields, capping the tag list", () => {
    const manyTags = Array.from({
      length: TAG_VOCAB_LIMIT + 5,
    }, (_, i) => `tag-${i}`);
    const withTags = buildBookmarkAiUpdatePrompt(promptArgs({
      checked: ["tags"],
      tagNames: manyTags,
    }));
    expect(withTags).toContain("- Tags: tag-0,");
    expect(withTags).toContain("(list truncated)");
    expect(withTags).not.toContain(`tag-${TAG_VOCAB_LIMIT}`);
    const withoutRelations = buildBookmarkAiUpdatePrompt(promptArgs({
      checked: ["title"],
    }));
    expect(withoutRelations).not.toContain("Existing vocabulary:");
  });
});

describe("parseBookmarkAiUpdateText", () => {
  const checked = ["title", "year", "tags"] as const;

  it("returns empty / error / invalid for blank, non-JSON, and non-object input", () => {
    expect(parseBookmarkAiUpdateText("", [...checked], []).kind).toBe("empty");
    expect(parseBookmarkAiUpdateText("not json", [...checked], []).kind).toBe("error");
    expect(parseBookmarkAiUpdateText("[1, 2]", [...checked], []).kind).toBe("invalid");
  });

  it("parses checked fields, stripping a wrapping code fence", () => {
    const state = parseBookmarkAiUpdateText(
      "```json\n{ \"title\": \"Better\", \"year\": 2021 }\n```",
      [...checked],
      [],
    );
    expect(state.kind).toBe("ok");
    if (state.kind !== "ok") return;
    expect(state.proposals).toContainEqual({
      fieldKey: "title",
      ok: true,
      value: {
        kind: "text",
        text: "Better",
      },
    });
    expect(state.proposals).toContainEqual({
      fieldKey: "year",
      ok: true,
      value: {
        kind: "number",
        value: 2021,
      },
    });
  });

  it("collects unchecked and unknown keys as ignored instead of failing", () => {
    const state = parseBookmarkAiUpdateText(
      "{ \"title\": \"Better\", \"description\": \"x\", \"bogus\": 1 }",
      ["title"],
      [],
    );
    expect(state.kind).toBe("ok");
    if (state.kind !== "ok") return;
    expect(state.proposals).toHaveLength(1);
    expect(state.ignoredKeys.sort()).toEqual(["bogus", "description"]);
  });

  it("rejects an individually malformed value with a reason instead of failing the parse", () => {
    const state = parseBookmarkAiUpdateText("{ \"year\": \"soonish\" }", ["year"], []);
    expect(state.kind).toBe("ok");
    if (state.kind !== "ok") return;
    expect(state.proposals).toEqual([{
      fieldKey: "year",
      ok: false,
      reason: "Not a whole number",
    }]);
  });

  it("parses tag name lists, trimming and deduping case-insensitively", () => {
    const state = parseBookmarkAiUpdateText(
      "{ \"tags\": [\" Python \", \"python\", \"\", \"testing\"] }",
      ["tags"],
      [],
    );
    expect(state.kind).toBe("ok");
    if (state.kind !== "ok") return;
    expect(state.proposals).toEqual([{
      fieldKey: "tags",
      ok: true,
      value: {
        kind: "nameList",
        names: ["Python", "testing"],
      },
    }]);
  });

  it("parses names entries and rejects malformed ones", () => {
    const ok = parseBookmarkAiUpdateText(
      "{ \"names\": [{ \"language\": \"ja\", \"value\": \"タイトル\" }] }",
      ["names"],
      [],
    );
    expect(ok.kind).toBe("ok");
    if (ok.kind !== "ok") return;
    expect(ok.proposals[0]).toEqual({
      fieldKey: "names",
      ok: true,
      value: {
        kind: "names",
        entries: [{
          language: "ja",
          value: "タイトル",
        }],
      },
    });
    const bad = parseBookmarkAiUpdateText("{ \"names\": [{ \"language\": \"ja\" }] }", ["names"], []);
    if (bad.kind !== "ok") throw new Error("expected ok");
    expect(bad.proposals[0].ok).toBe(false);
  });

  describe("property values", () => {
    function parseProp(property: Parameters<typeof makeCustomProperty>[0], rawJson: string) {
      const prop = makeCustomProperty({
        id: "p1",
        slug: "prop",
        ...property,
      });
      const state = parseBookmarkAiUpdateText(
        `{ "properties": { "prop": ${rawJson} } }`,
        [aiFieldKeyForProperty("p1")],
        [prop],
      );
      if (state.kind !== "ok") throw new Error(`expected ok, got ${state.kind}`);
      return state.proposals[0];
    }

    it("validates number bounds", () => {
      expect(parseProp({
        type: "number",
        numberMin: 1,
        numberMax: 5,
      }, "3")).toMatchObject({
        ok: true,
        value: {
          kind: "propNumber",
          value: 3,
        },
      });
      expect(parseProp({
        type: "number",
        numberMin: 1,
        numberMax: 5,
      }, "9")).toMatchObject({
        ok: false,
        reason: "Out of range",
      });
    });

    it("validates rating steps, zero, and ranges", () => {
      expect(parseProp({
        type: "ratingScale",
        ratingMax: 5,
      }, "3.5")).toMatchObject({
        ok: false,
      });
      expect(parseProp({
        type: "ratingScale",
        ratingMax: 5,
        ratingAllowHalf: true,
      }, "3.5")).toMatchObject({
        ok: true,
        value: {
          value: 3.5,
        },
      });
      expect(parseProp({
        type: "ratingScale",
      }, "0")).toMatchObject({
        ok: false,
      });
      expect(parseProp({
        type: "ratingScale",
        ratingAllowZero: true,
      }, "0")).toMatchObject({
        ok: true,
      });
      expect(parseProp({
        type: "ratingScale",
        ratingAllowRange: true,
      }, "{ \"value\": 2, \"valueEnd\": 4 }")).toMatchObject({
        ok: true,
        value: {
          value: 2,
          valueEnd: 4,
        },
      });
      expect(parseProp({
        type: "ratingScale",
      }, "{ \"value\": 2, \"valueEnd\": 4 }")).toMatchObject({
        ok: false,
      });
    });

    it("validates datetime encodings per format", () => {
      expect(parseProp({
        type: "datetime",
        dateTimeFormat: "date",
      }, "\"2024-05-01\"")).toMatchObject({
        ok: true,
      });
      expect(parseProp({
        type: "datetime",
        dateTimeFormat: "date",
      }, "\"2024-05\"")).toMatchObject({
        ok: false,
        reason: "Unrecognized date format",
      });
      expect(parseProp({
        type: "datetime",
        dateTimeFormat: "date",
        dateTimeAllowYearMonth: true,
      }, "\"2024-05\"")).toMatchObject({
        ok: true,
      });
      expect(parseProp({
        type: "datetime",
        dateTimeFormat: "time",
      }, "\"20:30\"")).toMatchObject({
        ok: true,
      });
      expect(parseProp({
        type: "datetime",
        dateTimeFormat: "datetime",
      }, "\"2024-05-01T20:30\"")).toMatchObject({
        ok: true,
      });
    });

    it("resolves choices by value then label, dropping unmatched entries", () => {
      const choices = {
        type: "choices" as const,
        choicesMultiple: true,
        choicesItems: [{
          label: "Reading",
          value: "reading",
        }, {
          label: "Done",
          value: "done",
        }],
      };
      expect(parseProp(choices, "[\"READING\", \"Done\", \"nope\"]")).toMatchObject({
        ok: true,
        value: {
          values: ["reading", "done"],
          dropped: ["nope"],
        },
      });
      expect(parseProp({
        ...choices,
        choicesMultiple: false,
      }, "[\"Reading\", \"Done\"]")).toMatchObject({
        ok: true,
        value: {
          values: ["reading"],
        },
      });
      expect(parseProp(choices, "[\"nope\"]")).toMatchObject({
        ok: false,
        reason: "No matching choice options",
      });
    });

    it("validates progress objects", () => {
      expect(parseProp({
        type: "itemInItems",
      }, "{ \"current\": 3, \"total\": 12 }")).toMatchObject({
        ok: true,
        value: {
          current: 3,
          total: 12,
        },
      });
      expect(parseProp({
        type: "itemInItems",
      }, "{ \"current\": -1, \"total\": 12 }")).toMatchObject({
        ok: false,
      });
    });

    it("parses sections, allowing children only for tiered properties", () => {
      const nested = "[{ \"name\": \"Ch 1\", \"startValue\": 1, \"children\": [{ \"name\": \"1.1\" }] }]";
      expect(parseProp({
        type: "sections",
        sectionsTiered: true,
      }, nested)).toMatchObject({
        ok: true,
        value: {
          sections: [{
            name: "Ch 1",
            startValue: "1",
            children: [{
              name: "1.1",
            }],
          }],
        },
      });
      const flat = parseProp({
        type: "sections",
      }, nested);
      expect(flat).toMatchObject({
        ok: true,
      });
      if (flat.ok && flat.value.kind === "propSections") {
        expect(flat.value.sections[0].children).toBeUndefined();
      }
    });

    it("ignores a property key that isn't checked", () => {
      const prop = makeCustomProperty({
        id: "p1",
        slug: "prop",
      });
      const state = parseBookmarkAiUpdateText("{ \"properties\": { \"prop\": 1 } }", ["title"], [prop]);
      if (state.kind !== "ok") throw new Error("expected ok");
      expect(state.proposals).toHaveLength(0);
      expect(state.ignoredKeys).toEqual(["properties.prop"]);
    });
  });
});
