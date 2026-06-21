import type { ConditionNode, ConditionTree } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { conditionsBreakdown, conditionsSummaryLabel, summarizeConditions } from "./summarizeConditions";

/** Build a condition tree from a list of children so each test only states what matters. */
function tree(children: ConditionNode[], combinator: "and" | "or" = "and"): ConditionTree {
  return {
    type: "group",
    combinator,
    children,
  };
}

describe("summarizeConditions", () => {
  it("returns all-zero counts for an empty tree", () => {
    const summary = summarizeConditions(tree([]));
    expect(summary).toEqual({
      total: 0,
      match: 0,
      categories: 0,
      websites: 0,
      tags: 0,
      channels: 0,
      mediaTypes: 0,
      relationshipTypes: 0,
      properties: 0,
      combinator: "and",
    });
  });

  it("counts each match leaf as one and carries the combinator", () => {
    const summary = summarizeConditions(tree([
      {
        type: "match",
        field: "title",
        operator: "contains",
        pattern: "a",
      },
      {
        type: "match",
        field: "url",
        operator: "contains",
        pattern: "b",
      },
    ], "or"));
    expect(summary.match).toBe(2);
    expect(summary.total).toBe(2);
    expect(summary.combinator).toBe("or");
  });

  it("sums the ids inside a single multi-value leaf rather than counting the leaf once", () => {
    const summary = summarizeConditions(tree([
      {
        type: "category",
        categoryIds: ["c1", "c2", "c3"],
      },
      {
        type: "website",
        domains: ["a.com", "b.com"],
      },
      {
        type: "tag",
        tagIds: ["t1", "t2"],
      },
      {
        type: "youtube-channel",
        channelIds: ["ch1"],
      },
      {
        type: "media-type",
        mediaTypeIds: ["m1", "m2", "m3", "m4"],
      },
      {
        type: "relationship-type",
        relationshipTypeIds: ["r1", "r2"],
      },
    ]));
    expect(summary.categories).toBe(3);
    expect(summary.websites).toBe(2);
    expect(summary.tags).toBe(2);
    expect(summary.channels).toBe(1);
    expect(summary.mediaTypes).toBe(4);
    expect(summary.relationshipTypes).toBe(2);
    // total counts direct children, not the ids within them.
    expect(summary.total).toBe(6);
  });

  it("counts each property leaf as one regardless of its predicate", () => {
    const summary = summarizeConditions(tree([
      {
        type: "property",
        propertyId: "p1",
        predicate: {
          valueKind: "file",
          predicate: {
            kind: "presence",
            mode: "has",
          },
        },
      },
      {
        type: "property",
        propertyId: "p2",
        predicate: {
          valueKind: "file",
          predicate: {
            kind: "presence",
            mode: "missing",
          },
        },
      },
    ]));
    expect(summary.properties).toBe(2);
  });

  it("does not recurse into nested groups (only direct leaves count)", () => {
    const summary = summarizeConditions(tree([
      {
        type: "category",
        categoryIds: ["c1"],
      },
      tree([{
        type: "tag",
        tagIds: ["t1", "t2"],
      }]),
    ]));
    expect(summary.categories).toBe(1);
    // the nested group itself is a direct child but matches none of the leaf branches.
    expect(summary.tags).toBe(0);
    expect(summary.total).toBe(2);
  });
});

describe("conditionsSummaryLabel", () => {
  it("reports the empty case", () => {
    expect(conditionsSummaryLabel(tree([]))).toBe("No filter conditions — shows nothing");
  });

  it("uses the singular form for exactly one condition", () => {
    expect(conditionsSummaryLabel(tree([{
      type: "category",
      categoryIds: ["c1"],
    }]))).toBe(
      "1 filter condition (AND)",
    );
  });

  it("pluralizes and upcases the combinator for multiple conditions", () => {
    expect(conditionsSummaryLabel(tree([
      {
        type: "category",
        categoryIds: ["c1"],
      },
      {
        type: "tag",
        tagIds: ["t1"],
      },
    ], "or"))).toBe("2 filter conditions (OR)");
  });
});

describe("conditionsBreakdown", () => {
  it("omits zero-count types", () => {
    expect(conditionsBreakdown(tree([{
      type: "category",
      categoryIds: ["c1", "c2"],
    }]))).toEqual([
      "2 categories",
    ]);
  });

  it("uses singular wording for single-item types", () => {
    expect(conditionsBreakdown(tree([
      {
        type: "match",
        field: "title",
        operator: "contains",
        pattern: "x",
      },
      {
        type: "category",
        categoryIds: ["c1"],
      },
      {
        type: "website",
        domains: ["a.com"],
      },
      {
        type: "tag",
        tagIds: ["t1"],
      },
      {
        type: "youtube-channel",
        channelIds: ["ch1"],
      },
      {
        type: "media-type",
        mediaTypeIds: ["m1"],
      },
      {
        type: "relationship-type",
        relationshipTypeIds: ["r1"],
      },
      {
        type: "property",
        propertyId: "p1",
        predicate: {
          valueKind: "file",
          predicate: {
            kind: "presence",
            mode: "has",
          },
        },
      },
    ]))).toEqual([
      "1 title match",
      "1 category",
      "1 website",
      "1 tag",
      "1 YouTube channel",
      "1 media type",
      "1 relationship type",
      "1 custom property",
    ]);
  });

  it("uses plural wording for multi-item types", () => {
    expect(conditionsBreakdown(tree([
      {
        type: "match",
        field: "title",
        operator: "contains",
        pattern: "x",
      },
      {
        type: "match",
        field: "url",
        operator: "contains",
        pattern: "y",
      },
      {
        type: "category",
        categoryIds: ["c1", "c2"],
      },
      {
        type: "property",
        propertyId: "p1",
        predicate: {
          valueKind: "file",
          predicate: {
            kind: "presence",
            mode: "has",
          },
        },
      },
      {
        type: "property",
        propertyId: "p2",
        predicate: {
          valueKind: "file",
          predicate: {
            kind: "presence",
            mode: "has",
          },
        },
      },
    ]))).toEqual([
      "2 title matches",
      "2 categories",
      "2 custom properties",
    ]);
  });

  it("returns an empty list for an empty tree", () => {
    expect(conditionsBreakdown(tree([]))).toEqual([]);
  });
});
