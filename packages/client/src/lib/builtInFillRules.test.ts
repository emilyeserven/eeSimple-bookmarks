// @vitest-environment node
import type { Website } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildBuiltInFillRules } from "./builtInFillRules";

/** Minimal website with the fields the built-in rules reflect. */
function site(overrides: Partial<Pick<Website, "category" | "tagIds" | "mediaTypeId" | "scanUrlForIsbn">> = {}) {
  return {
    category: null,
    tagIds: [],
    mediaTypeId: null,
    scanUrlForIsbn: false,
    ...overrides,
  } as Pick<Website, "category" | "tagIds" | "mediaTypeId" | "scanUrlForIsbn">;
}

const ctx = {
  tagNameById: (id: string) => ({
    "tag-1": "React",
    "tag-2": "TypeScript",
  } as Record<string, string>)[id],
  mediaTypeNameById: (id: string) => ({
    "mt-book": "Book",
  } as Record<string, string>)[id],
};

function ruleById(website: Parameters<typeof buildBuiltInFillRules>[0], id: string) {
  return buildBuiltInFillRules(website, ctx).find(rule => rule.id === id);
}

describe("buildBuiltInFillRules", () => {
  it("always includes the global scan and oEmbed rules with providers", () => {
    const rules = buildBuiltInFillRules(site(), ctx);
    const ids = rules.map(rule => rule.id);
    for (const id of ["scan-title", "scan-description", "scan-image", "scan-favicon", "scan-people", "scan-language"]) {
      expect(ids).toContain(id);
    }
    const oembed = rules.find(rule => rule.id === "oembed");
    expect(oembed?.scope).toBe("global");
    expect(oembed?.providers?.length ?? 0).toBeGreaterThan(0);
    // Global scan rules carry no per-site state.
    expect(ruleById(site(), "scan-title")?.state).toBeUndefined();
  });

  it("reflects the ISBN scan gate on vs off", () => {
    expect(ruleById(site({
      scanUrlForIsbn: true,
    }), "isbn")?.state).toEqual({
      kind: "on",
    });
    expect(ruleById(site({
      scanUrlForIsbn: false,
    }), "isbn")?.state).toEqual({
      kind: "off",
    });
  });

  it("resolves a configured default category / media type to its name, else unset", () => {
    const configured = site({
      category: {
        id: "cat-1",
        name: "Development",
        slug: "development",
        icon: null,
      },
      mediaTypeId: "mt-book",
    });
    expect(ruleById(configured, "default-category")?.state).toEqual({
      kind: "value",
      detail: "Development",
    });
    expect(ruleById(configured, "default-media-type")?.state).toEqual({
      kind: "value",
      detail: "Book",
    });
    expect(ruleById(site(), "default-category")?.state).toEqual({
      kind: "unset",
    });
    expect(ruleById(site(), "default-media-type")?.state).toEqual({
      kind: "unset",
    });
  });

  it("joins resolved default-tag names and drops ids that no longer resolve", () => {
    expect(ruleById(site({
      tagIds: ["tag-1", "tag-2"],
    }), "default-tags")?.state).toEqual({
      kind: "value",
      detail: "React, TypeScript",
    });
    // An id with no matching name resolves to unset rather than a blank value.
    expect(ruleById(site({
      tagIds: ["tag-missing"],
    }), "default-tags")?.state).toEqual({
      kind: "unset",
    });
  });
});
