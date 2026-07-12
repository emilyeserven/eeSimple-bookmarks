// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildAutotagPrompt, describeAutotagResult, normalizeAutotagItems, parseAutotagText } from "./aiAutotag";

describe("buildAutotagPrompt", () => {
  const items = [
    {
      id: "id-1",
      url: "https://example.com",
      title: "A page",
    },
    {
      id: "id-2",
      url: null,
      title: "No URL",
    },
  ];

  it("includes each bookmark id in brackets and the JSON output instruction", () => {
    const prompt = buildAutotagPrompt("Tag these.", items, null);
    expect(prompt).toContain("- [id-1] A page: https://example.com");
    expect(prompt).toContain("- [id-2] No URL");
    expect(prompt).toContain("Respond with ONLY a JSON array");
    expect(prompt).toContain("\"tags\": [\"tag1\", \"tag2\"]");
    expect(prompt).toContain("Tag these.");
  });

  it("lists existing tags only when provided and non-empty", () => {
    expect(buildAutotagPrompt("", items, ["React", "Design"])).toContain(
      "Existing tags — reuse these where relevant instead of inventing new ones:\nReact, Design",
    );
    expect(buildAutotagPrompt("", items, [])).not.toContain("Existing tags");
    expect(buildAutotagPrompt("", items, null)).not.toContain("Existing tags");
  });

  it("notes an empty batch", () => {
    expect(buildAutotagPrompt("", [], null)).toContain("No untagged bookmarks found");
  });
});

describe("normalizeAutotagItems", () => {
  it("accepts a bare array of { id, tags }", () => {
    expect(normalizeAutotagItems([{
      id: "a",
      tags: ["x"],
    }])).toEqual([{
      id: "a",
      tags: ["x"],
    }]);
  });

  it("unwraps a { items: [] } envelope", () => {
    expect(normalizeAutotagItems({
      items: [{
        id: "a",
        tags: ["x"],
      }],
    })).toEqual([{
      id: "a",
      tags: ["x"],
    }]);
  });

  it("treats a missing tags field as an empty list and drops non-string tags", () => {
    expect(normalizeAutotagItems([
      {
        id: "a",
      },
      {
        id: "b",
        tags: ["x", 3, "y"],
      },
    ])).toEqual([
      {
        id: "a",
        tags: [],
      },
      {
        id: "b",
        tags: ["x", "y"],
      },
    ]);
  });

  it("returns null for a non-array / malformed shape", () => {
    expect(normalizeAutotagItems({
      nope: true,
    })).toBeNull();
    expect(normalizeAutotagItems([{
      tags: ["x"],
    }])).toBeNull();
    expect(normalizeAutotagItems("not json object")).toBeNull();
  });
});

describe("parseAutotagText", () => {
  it("classifies empty, unparseable, wrong-shape, and ok inputs", () => {
    expect(parseAutotagText("   ")).toEqual({
      kind: "empty",
    });
    expect(parseAutotagText("{not json")).toEqual({
      kind: "error",
    });
    expect(parseAutotagText("{\"nope\":true}")).toEqual({
      kind: "invalid",
    });
    expect(parseAutotagText("[{\"id\":\"a\",\"tags\":[\"x\"]}]")).toEqual({
      kind: "ok",
      items: [{
        id: "a",
        tags: ["x"],
      }],
    });
  });
});

describe("describeAutotagResult", () => {
  it("summarizes counts, pluralizing and noting created tags / not-found ids", () => {
    expect(describeAutotagResult({
      updated: 1,
      tagsCreated: 0,
      notFound: [],
    })).toBe("Tagged 1 bookmark");
    expect(describeAutotagResult({
      updated: 2,
      tagsCreated: 3,
      notFound: ["x"],
    })).toBe(
      "Tagged 2 bookmarks, created 3 tags, 1 id not found",
    );
  });
});
