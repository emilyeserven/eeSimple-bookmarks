// @vitest-environment node
import type { AutofillRule, ConditionNode, ConditionTree } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import {
  ruleSetsMediaType,
  ruleSetsProperty,
  ruleSetsTag,
  ruleTargetsWebsite,
  ruleTargetsYoutubeChannel,
} from "./autofillRulesFilter";

function makeRule(overrides: Partial<AutofillRule> = {}): AutofillRule {
  return {
    id: "rule-1",
    name: "Rule",
    slug: "rule",
    description: null,
    conditions: {
      type: "group",
      combinator: "and",
      children: [],
    },
    setCategoryId: null,
    setMediaTypeId: null,
    tagIds: [],
    locationIds: [],
    numberValues: [],
    booleanValues: [],
    dateTimeValues: [],
    sortOrder: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

function tree(...children: ConditionNode[]): ConditionTree {
  return {
    type: "group",
    combinator: "and",
    children,
  };
}

describe("ruleSetsProperty", () => {
  it("matches a property set via any value-kind array", () => {
    expect(ruleSetsProperty(makeRule({
      numberValues: [{
        propertyId: "p1",
        value: 3,
      }],
    }), "p1")).toBe(true);
    expect(ruleSetsProperty(makeRule({
      booleanValues: [{
        propertyId: "p2",
        value: true,
      }],
    }), "p2")).toBe(true);
    expect(ruleSetsProperty(makeRule({
      dateTimeValues: [{
        propertyId: "p3",
        value: "2026-01-01",
      }],
    }), "p3")).toBe(true);
  });

  it("returns false when no array references the property", () => {
    expect(ruleSetsProperty(makeRule({
      numberValues: [{
        propertyId: "other",
        value: 1,
      }],
    }), "p1")).toBe(false);
    expect(ruleSetsProperty(makeRule(), "p1")).toBe(false);
  });
});

describe("ruleSetsTag", () => {
  it("is true only when tagIds includes the tag", () => {
    expect(ruleSetsTag(makeRule({
      tagIds: ["t1", "t2"],
    }), "t2")).toBe(true);
    expect(ruleSetsTag(makeRule({
      tagIds: ["t1"],
    }), "t2")).toBe(false);
  });
});

describe("ruleSetsMediaType", () => {
  it("compares against setMediaTypeId", () => {
    expect(ruleSetsMediaType(makeRule({
      setMediaTypeId: "m1",
    }), "m1")).toBe(true);
    expect(ruleSetsMediaType(makeRule({
      setMediaTypeId: "m1",
    }), "m2")).toBe(false);
    expect(ruleSetsMediaType(makeRule(), "m1")).toBe(false);
  });
});

describe("ruleTargetsWebsite", () => {
  it("matches a normalized domain anywhere in a nested tree", () => {
    const rule = makeRule({
      conditions: tree({
        type: "group",
        combinator: "or",
        children: [{
          type: "website",
          domains: ["www.Example.com"],
        }],
      }),
    });
    expect(ruleTargetsWebsite(rule, "example.com")).toBe(true);
    expect(ruleTargetsWebsite(rule, "other.com")).toBe(false);
  });

  it("returns false when there is no website condition", () => {
    expect(ruleTargetsWebsite(makeRule(), "example.com")).toBe(false);
  });
});

describe("ruleTargetsYoutubeChannel", () => {
  it("matches a channel id nested in a group", () => {
    const rule = makeRule({
      conditions: tree({
        type: "group",
        combinator: "or",
        children: [{
          type: "youtube-channel",
          channelIds: ["c1", "c2"],
        }],
      }),
    });
    expect(ruleTargetsYoutubeChannel(rule, "c2")).toBe(true);
    expect(ruleTargetsYoutubeChannel(rule, "c3")).toBe(false);
  });

  it("returns false when there is no youtube-channel condition", () => {
    expect(ruleTargetsYoutubeChannel(makeRule(), "c1")).toBe(false);
  });
});
