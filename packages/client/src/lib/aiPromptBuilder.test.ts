// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildAiPromptBuilderPrompt, DEFAULT_AI_PROMPT_BUILDER_TEMPLATE, listAiContextFields } from "./aiPromptBuilder";
import { aiFieldKeyForProperty } from "./bookmarkAiUpdate";
import { makeBookmark, makeCustomProperty } from "../test-utils/factories";

import type { AiPromptBuilderArgs } from "./aiPromptBuilder";

function args(overrides: Partial<AiPromptBuilderArgs> = {}): AiPromptBuilderArgs {
  return {
    template: "",
    question: "Which of these should I read first?",
    bookmarks: [
      makeBookmark({
        id: "b1",
        title: "First",
        categoryId: "cat-1",
        year: 2001,
      }),
      makeBookmark({
        id: "b2",
        title: "Second",
        url: "https://two.example",
      }),
    ],
    contextFields: [],
    properties: [],
    categories: [{
      id: "cat-1",
      name: "Dev",
    }],
    ...overrides,
  };
}

describe("buildAiPromptBuilderPrompt", () => {
  it("falls back to the built-in template when none is stored", () => {
    expect(buildAiPromptBuilderPrompt(args())).toContain(DEFAULT_AI_PROMPT_BUILDER_TEMPLATE);
  });

  it("uses a stored template verbatim instead of the default", () => {
    const prompt = buildAiPromptBuilderPrompt(args({
      template: "  Act as my librarian.  ",
    }));
    expect(prompt.startsWith("Act as my librarian.")).toBe(true);
    expect(prompt).not.toContain(DEFAULT_AI_PROMPT_BUILDER_TEMPLATE);
  });

  it("includes the question and one bracketed block per bookmark, in order", () => {
    const prompt = buildAiPromptBuilderPrompt(args());
    expect(prompt).toContain("Question:\nWhich of these should I read first?");
    expect(prompt).toContain("[b1] First");
    expect(prompt.indexOf("[b2] Second")).toBeGreaterThan(prompt.indexOf("[b1] First"));
  });

  it("always closes with the answer instruction", () => {
    expect(buildAiPromptBuilderPrompt(args())).toContain("Answer the question using only the bookmarks listed above.");
  });

  it("omits the question section when the question is blank", () => {
    const prompt = buildAiPromptBuilderPrompt(args({
      question: "   ",
    }));
    expect(prompt).not.toContain("Question:");
    expect(prompt).toContain("[b1] First");
  });

  it("omits the bookmarks section when nothing is targeted", () => {
    const prompt = buildAiPromptBuilderPrompt(args({
      bookmarks: [],
    }));
    expect(prompt).not.toContain("Bookmarks:");
    expect(prompt).toContain("Question:");
  });

  it("emits URL always but optional standard fields only when selected as context", () => {
    const withoutFields = buildAiPromptBuilderPrompt(args());
    expect(withoutFields).toContain("- URL: https://example.com");
    expect(withoutFields).not.toContain("- Year: 2001");
    expect(withoutFields).not.toContain("- Category: Dev");

    const withFields = buildAiPromptBuilderPrompt(args({
      contextFields: ["year", "category"],
    }));
    expect(withFields).toContain("- Year: 2001");
    expect(withFields).toContain("- Category: Dev");
  });

  it("includes a selected custom property's current value per bookmark", () => {
    const property = makeCustomProperty({
      id: "p1",
      slug: "rating",
      name: "Rating",
      type: "number",
    });
    const prompt = buildAiPromptBuilderPrompt(args({
      contextFields: [aiFieldKeyForProperty("p1")],
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
  });

  it("spells out a selected sections property entry by entry, naming its tags", () => {
    const property = makeCustomProperty({
      id: "p1",
      slug: "sections",
      name: "Sections",
      type: "sections",
      sectionsTiered: true,
    });
    const prompt = buildAiPromptBuilderPrompt(args({
      contextFields: [aiFieldKeyForProperty("p1")],
      properties: [property],
      tags: [{
        id: "t1",
        name: "Reference",
      }],
      bookmarks: [makeBookmark({
        id: "b1",
        title: "First",
        sectionsValues: [{
          propertyId: "p1",
          exhaustive: false,
          sections: [{
            id: "s1",
            name: "Part One",
            type: "page",
            startValue: "1",
            endValue: "40",
            completed: true,
            tagIds: ["t1"],
            children: [{
              id: "s1a",
              name: "Intro",
              type: "page",
              startValue: "1",
            }],
          }],
        }],
      })],
    }));
    // The tally counts LEAVES (the shared `countSectionLeaves` rule), so the parent's own tick does
    // not count — its unfinished child is the only leaf.
    expect(prompt).toContain("- Sections: 1 section, 1 sub-item, 0 of 1 done");
    expect(prompt).toContain("  1. Part One — page 1–40 — done — tags: Reference");
    expect(prompt).toContain("    1.1. Intro — page 1 — not done");
  });

  it("never asks for JSON — nothing is parsed back", () => {
    const prompt = buildAiPromptBuilderPrompt(args({
      contextFields: ["tags", "category"],
    }));
    expect(prompt).not.toContain("JSON");
    expect(prompt).not.toContain("code fences");
  });
});

describe("listAiContextFields", () => {
  it("drops the always-included title and description fields", () => {
    const keys = listAiContextFields([]).map(field => field.key);
    expect(keys).not.toContain("title");
    expect(keys).not.toContain("description");
    expect(keys).toContain("year");
    expect(keys).toContain("tags");
  });

  it("keeps a derived property selectable — it is readable context, just not writable", () => {
    const calculated = makeCustomProperty({
      id: "p1",
      slug: "computed",
      name: "Computed",
      type: "calculate",
    });
    const [field] = listAiContextFields([calculated]).filter(entry => entry.key === "prop:p1");
    expect(field).toBeDefined();
    expect(field.disabledReason).toBeUndefined();
  });
});
