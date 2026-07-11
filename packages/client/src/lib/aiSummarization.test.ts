// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildGeneratedPrompt, describeApplyResult, normalizeApplyItems } from "./aiSummarization";

describe("buildGeneratedPrompt", () => {
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
    const prompt = buildGeneratedPrompt("Summarize.", items, false);
    expect(prompt).toContain("- [id-1] A page: https://example.com");
    expect(prompt).toContain("- [id-2] No URL");
    expect(prompt).toContain("Respond with ONLY a JSON array");
    expect(prompt).toContain("Summarize.");
    expect(prompt).not.toContain("\"tags\"");
  });

  it("adds the tags field to the format when suggestTags is on", () => {
    const prompt = buildGeneratedPrompt("", items, true);
    expect(prompt).toContain("\"tags\": [\"tag1\", \"tag2\"]");
    expect(prompt).toContain("suggest a few short, relevant topic tags");
  });

  it("notes an empty queue", () => {
    expect(buildGeneratedPrompt("", [], false)).toContain("No bookmarks currently in the AI Summary Queue");
  });
});

describe("normalizeApplyItems", () => {
  it("accepts a bare array of { id, summary }", () => {
    expect(normalizeApplyItems([{
      id: "a",
      summary: "s",
    }])).toEqual([{
      id: "a",
      summary: "s",
    }]);
  });

  it("unwraps a { items: [] } envelope", () => {
    expect(normalizeApplyItems({
      items: [{
        id: "a",
        summary: "s",
      }],
    })).toEqual([{
      id: "a",
      summary: "s",
    }]);
  });

  it("keeps string tags and drops non-string entries", () => {
    expect(normalizeApplyItems([{
      id: "a",
      summary: "s",
      tags: ["x", 3, "y"],
    }])).toEqual([
      {
        id: "a",
        summary: "s",
        tags: ["x", "y"],
      },
    ]);
  });

  it("returns null for a non-array / malformed shape", () => {
    expect(normalizeApplyItems({
      nope: true,
    })).toBeNull();
    expect(normalizeApplyItems([{
      id: "a",
    }])).toBeNull();
    expect(normalizeApplyItems([{
      summary: "s",
    }])).toBeNull();
    expect(normalizeApplyItems("not json object")).toBeNull();
  });
});

describe("describeApplyResult", () => {
  it("summarizes counts, pluralizing and noting created tags / not-found ids", () => {
    expect(describeApplyResult({
      updated: 1,
      tagsCreated: 0,
      notFound: [],
    })).toBe("Updated 1 bookmark");
    expect(describeApplyResult({
      updated: 2,
      tagsCreated: 3,
      notFound: ["x"],
    })).toBe(
      "Updated 2 bookmarks, created 3 tags, 1 id not found",
    );
  });
});
