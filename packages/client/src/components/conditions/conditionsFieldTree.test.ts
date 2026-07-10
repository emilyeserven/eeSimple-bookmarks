// @vitest-environment node
import type { ConditionTree } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildRootChildren, splitRootConditions } from "./conditionsFieldTree";

const tree: ConditionTree = {
  type: "group",
  combinator: "and",
  children: [
    {
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "react",
    },
    {
      type: "category",
      categoryIds: ["c1", "c2"],
    },
    {
      type: "tag",
      tagIds: ["t1"],
    },
    {
      type: "property",
      propertyId: "p1",
      predicate: {
        valueKind: "boolean",
        predicate: {
          kind: "value",
          value: true,
        },
      },
    },
    {
      type: "group",
      combinator: "or",
      children: [],
    },
  ],
};

describe("splitRootConditions", () => {
  it("splits the root children into per-section leaves with counts", () => {
    const leaves = splitRootConditions(tree);
    expect(leaves.matches).toHaveLength(1);
    expect(leaves.urlMatches).toHaveLength(0);
    expect(leaves.otherMatches).toHaveLength(0);
    expect(leaves.categoryLeaf?.categoryIds).toEqual(["c1", "c2"]);
    expect(leaves.tagLeaf?.tagIds).toEqual(["t1"]);
    expect(leaves.propertyLeaves).toHaveLength(1);
    expect(leaves.nestedGroups).toHaveLength(1);
    expect(leaves.websiteLeaf).toBeUndefined();
    expect(leaves.counts).toEqual({
      category: 2,
      website: 0,
      tag: 1,
      location: 0,
      youtubeChannel: 0,
      mediaType: 0,
      genreMood: 0,
      relationshipType: 0,
      languageUsage: 0,
    });
  });

  it("partitions match leaves into title, url, and legacy passthrough buckets", () => {
    const withUrl: ConditionTree = {
      type: "group",
      combinator: "and",
      children: [
        {
          type: "match",
          field: "title",
          operator: "contains",
          pattern: "react",
        },
        {
          type: "match",
          field: "url",
          operator: "contains",
          pattern: "/course/",
        },
        // Legacy domain-operator leaf (superseded by the Website condition) passes through untouched.
        {
          type: "match",
          field: "url",
          operator: "domain",
          pattern: "example.com",
        },
      ],
    };
    const leaves = splitRootConditions(withUrl);
    expect(leaves.matches).toHaveLength(1);
    expect(leaves.matches[0]?.field).toBe("title");
    expect(leaves.urlMatches).toHaveLength(1);
    expect(leaves.urlMatches[0]?.pattern).toBe("/course/");
    expect(leaves.otherMatches).toHaveLength(1);
    expect(leaves.otherMatches[0]?.operator).toBe("domain");
    // All three round-trip when nothing is patched.
    expect(buildRootChildren(leaves, {})).toEqual(withUrl.children);
  });

  it("replaces only the url matches when patched, preserving title + legacy matches", () => {
    const withUrl: ConditionTree = {
      type: "group",
      combinator: "and",
      children: [
        {
          type: "match",
          field: "title",
          operator: "contains",
          pattern: "react",
        },
        {
          type: "match",
          field: "url",
          operator: "domain",
          pattern: "example.com",
        },
      ],
    };
    const leaves = splitRootConditions(withUrl);
    const children = buildRootChildren(leaves, {
      urlMatches: [{
        type: "match",
        field: "url",
        operator: "starts_with",
        pattern: "https://x/",
      }],
    });
    const matchLeaves = children.filter(child => child.type === "match");
    expect(matchLeaves).toHaveLength(3);
    expect(matchLeaves.some(m => m.field === "title" && m.pattern === "react")).toBe(true);
    expect(matchLeaves.some(m => m.operator === "domain")).toBe(true);
    expect(matchLeaves.some(m => m.operator === "starts_with" && m.pattern === "https://x/")).toBe(true);
  });

  it("splits a language-usage leaf and counts its languages + levels", () => {
    const withLangUsage: ConditionTree = {
      type: "group",
      combinator: "and",
      children: [
        {
          type: "language-usage",
          languageIds: ["en", "ja"],
          usageLevelIds: ["dub"],
        },
      ],
    };
    const leaves = splitRootConditions(withLangUsage);
    expect(leaves.languageUsageLeaf?.languageIds).toEqual(["en", "ja"]);
    expect(leaves.counts.languageUsage).toBe(3);
  });
});

describe("buildRootChildren", () => {
  it("round-trips unchanged when the patch is empty", () => {
    const leaves = splitRootConditions(tree);
    expect(buildRootChildren(leaves, {})).toEqual(tree.children);
  });

  it("replaces a leaf and drops empty selections", () => {
    const leaves = splitRootConditions(tree);
    const children = buildRootChildren(leaves, {
      category: {
        type: "category",
        categoryIds: ["c3"],
      },
      // Explicit null clears the leaf.
      tag: null,
    });
    expect(children).toContainEqual({
      type: "category",
      categoryIds: ["c3"],
    });
    expect(children.some(child => child.type === "tag")).toBe(false);
    // Untouched leaves and nested groups round-trip.
    expect(children.some(child => child.type === "property")).toBe(true);
    expect(children.some(child => child.type === "group")).toBe(true);
  });

  it("drops a replacement leaf whose selection is empty", () => {
    const leaves = splitRootConditions(tree);
    const children = buildRootChildren(leaves, {
      category: {
        type: "category",
        categoryIds: [],
      },
    });
    expect(children.some(child => child.type === "category")).toBe(false);
  });

  it("replaces the whole match/property lists when patched", () => {
    const leaves = splitRootConditions(tree);
    const children = buildRootChildren(leaves, {
      matches: [],
      properties: [],
    });
    expect(children.some(child => child.type === "match")).toBe(false);
    expect(children.some(child => child.type === "property")).toBe(false);
  });
});
