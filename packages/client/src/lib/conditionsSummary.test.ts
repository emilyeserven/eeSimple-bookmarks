import type { ConditionTree } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { summarizeConditions } from "./conditionsSummary";

function group(children: ConditionTree["children"], combinator: "and" | "or" = "and"): ConditionTree {
  return {
    type: "group",
    combinator,
    children,
  };
}

describe("summarizeConditions", () => {
  it("returns 'no conditions' for an empty group", () => {
    expect(summarizeConditions(group([]))).toBe("no conditions");
  });

  it("summarizes a URL match with the operator verb and pattern", () => {
    expect(
      summarizeConditions(
        group([{
          type: "match",
          field: "url",
          operator: "contains",
          pattern: "example.com",
        }]),
      ),
    ).toBe("URL contains “example.com”");
  });

  it("summarizes a title starts_with match", () => {
    expect(
      summarizeConditions(
        group([{
          type: "match",
          field: "title",
          operator: "starts_with",
          pattern: "How to",
        }]),
      ),
    ).toBe("title starts with “How to”");
  });

  it("renders a domain match without the field prefix", () => {
    expect(
      summarizeConditions(
        group([{
          type: "match",
          field: "url",
          operator: "domain",
          pattern: "youtube.com",
        }]),
      ),
    ).toBe("domain is “youtube.com”");
  });

  it("joins children with 'and' / 'or' per combinator", () => {
    const children: ConditionTree["children"] = [
      {
        type: "category",
        categoryIds: ["a", "b"],
      },
      {
        type: "tag",
        tagIds: ["t1"],
      },
    ];
    expect(summarizeConditions(group(children, "and"))).toBe(
      "category is one of (2) and tagged with (1)",
    );
    expect(summarizeConditions(group(children, "or"))).toBe(
      "category is one of (2) or tagged with (1)",
    );
  });

  it("uses singular phrasing for single-id website/channel/media-type/relationship leaves", () => {
    expect(summarizeConditions(group([{
      type: "website",
      domains: ["x.com"],
    }]))).toBe(
      "website is “x.com”",
    );
    expect(summarizeConditions(group([{
      type: "youtube-channel",
      channelIds: ["c"],
    }]))).toBe(
      "YouTube channel is (1)",
    );
    expect(summarizeConditions(group([{
      type: "media-type",
      mediaTypeIds: ["m"],
    }]))).toBe(
      "media type is (1)",
    );
    expect(
      summarizeConditions(group([{
        type: "relationship-type",
        relationshipTypeIds: ["r"],
      }])),
    ).toBe("has a relationship of type (1)");
  });

  it("uses plural phrasing for multi-id leaves", () => {
    expect(summarizeConditions(group([{
      type: "website",
      domains: ["x.com", "y.com"],
    }]))).toBe(
      "website is one of (2)",
    );
    expect(
      summarizeConditions(group([{
        type: "media-type",
        mediaTypeIds: ["m1", "m2"],
      }])),
    ).toBe("media type is one of (2)");
  });

  it("summarizes a property leaf by its value kind", () => {
    expect(
      summarizeConditions(
        group([{
          type: "property",
          propertyId: "p",
          predicate: {
            valueKind: "number",
            predicate: {
              kind: "presence",
              mode: "has",
            },
          },
        }]),
      ),
    ).toBe("number property condition");
  });
});
