// @vitest-environment node
import type { ConditionTree } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { autofillConditionsValidator } from "./conditionsSchema";

/** Collect the issue messages from a failed parse (empty array on success). */
function messages(tree: unknown): string[] {
  const result = autofillConditionsValidator.safeParse(tree);
  return result.success ? [] : result.error.issues.map(issue => issue.message);
}

const group = (children: ConditionTree["children"]): ConditionTree => ({
  type: "group",
  combinator: "and",
  children,
});

describe("autofillConditionsValidator", () => {
  it("requires at least one condition", () => {
    expect(messages(group([]))).toEqual(["Add at least one condition."]);
    expect(messages(null)).toEqual(["Add at least one condition."]);
    expect(messages({
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "x",
    })).toEqual(["Add at least one condition."]);
  });

  it("accepts a non-empty match condition", () => {
    expect(messages(group([{
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "react",
    }]))).toEqual([]);
  });

  it("flags an empty match pattern", () => {
    expect(messages(group([{
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "   ",
    }]))).toEqual(["Every title condition needs a pattern."]);
  });

  it("flags an invalid regex pattern but accepts a valid one", () => {
    expect(messages(group([{
      type: "match",
      field: "title",
      operator: "regex",
      pattern: "[unclosed",
    }]))).toEqual(["Enter a valid regular expression."]);
    expect(messages(group([{
      type: "match",
      field: "title",
      operator: "regex",
      pattern: "^foo.*bar$",
    }]))).toEqual([]);
  });

  it("flags empty website / media-type / relationship-type selections", () => {
    expect(messages(group([{
      type: "website",
      domains: [],
    }]))).toEqual(["Pick at least one website."]);
    expect(messages(group([{
      type: "media-type",
      mediaTypeIds: [],
    }]))).toEqual(["Pick at least one media type."]);
    expect(messages(group([{
      type: "relationship-type",
      relationshipTypeIds: [],
    }]))).toEqual(["Pick at least one relationship type."]);
  });

  it("accepts populated website/media-type/relationship-type leaves", () => {
    expect(messages(group([
      {
        type: "website",
        domains: ["github.com"],
      },
      {
        type: "media-type",
        mediaTypeIds: ["mt-1"],
      },
      {
        type: "relationship-type",
        relationshipTypeIds: ["rt-1"],
      },
    ]))).toEqual([]);
  });

  it("walks nested groups and reports each distinct problem once", () => {
    const result = messages(group([
      group([{
        type: "match",
        field: "title",
        operator: "contains",
        pattern: "",
      }]),
      {
        type: "website",
        domains: [],
      },
    ]));
    expect(result).toContain("Every title condition needs a pattern.");
    expect(result).toContain("Pick at least one website.");
  });
});
