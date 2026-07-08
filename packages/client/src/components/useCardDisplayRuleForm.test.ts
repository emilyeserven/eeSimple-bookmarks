// @vitest-environment node
import type { CardDisplayRule, ConditionTree } from "@eesimple/types";

import { defaultCardZoneLayouts, emptyConditionTree } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { initialFromRule } from "./useCardDisplayRuleForm";

function makeRule(overrides: Partial<CardDisplayRule> = {}): CardDisplayRule {
  return {
    id: "rule-1",
    name: "Rule",
    slug: "rule",
    description: null,
    conditions: emptyConditionTree(),
    sortOrder: 0,
    isDefault: false,
    fieldZones: null,
    cardZoneLayouts: null,
    imageMode: null,
    imageVisibility: null,
    imageLayout: null,
    hideWebsiteForYouTube: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("initialFromRule", () => {
  it("returns empty defaults with no rule and no seed", () => {
    const values = initialFromRule();
    expect(values.name).toBe("");
    expect(values.description).toBe("");
    expect(values.conditions).toEqual(emptyConditionTree());
    // Non-default (absent rule) => every display column inherits (null).
    expect(values.display).toEqual({
      fieldZones: null,
      cardZoneLayouts: null,
      imageMode: null,
      imageVisibility: null,
      imageLayout: null,
      hideWebsiteForYouTube: null,
    });
  });

  it("uses the provided seed conditions when creating a fresh rule", () => {
    const seed: ConditionTree = {
      type: "group",
      combinator: "or",
      children: [],
    };
    expect(initialFromRule(undefined, seed).conditions).toBe(seed);
  });

  it("keeps a non-default rule's display columns null (inherit) when unset", () => {
    const values = initialFromRule(makeRule({
      isDefault: false,
    }));
    expect(values.display).toEqual({
      fieldZones: null,
      cardZoneLayouts: null,
      imageMode: null,
      imageVisibility: null,
      imageLayout: null,
      hideWebsiteForYouTube: null,
    });
  });

  it("seeds concrete baseline display columns for the Default rule when unset", () => {
    const values = initialFromRule(makeRule({
      id: "default",
      name: "Default",
      isDefault: true,
    }));
    expect(values.display.cardZoneLayouts).toEqual(defaultCardZoneLayouts());
    expect(values.display.imageMode).toBe("natural");
    expect(values.display.imageVisibility).toBe("shown");
    expect(values.display.imageLayout).toBe("above");
    expect(values.display.hideWebsiteForYouTube).toBe(false);
    // fieldZones has no Default fallback in the seeder — stays null here.
    expect(values.display.fieldZones).toBeNull();
  });

  it("prefers the rule's own stored display values over both defaults", () => {
    const zones = defaultCardZoneLayouts();
    const values = initialFromRule(makeRule({
      isDefault: true,
      name: "Custom",
      description: "  spaced  ",
      imageMode: "cropped",
      imageVisibility: "off",
      imageLayout: "side",
      hideWebsiteForYouTube: true,
      cardZoneLayouts: zones,
    }));
    expect(values.name).toBe("Custom");
    // description is passed through verbatim (trim happens on submit, not seed).
    expect(values.description).toBe("  spaced  ");
    expect(values.display.imageMode).toBe("cropped");
    expect(values.display.imageVisibility).toBe("off");
    expect(values.display.imageLayout).toBe("side");
    expect(values.display.hideWebsiteForYouTube).toBe(true);
    expect(values.display.cardZoneLayouts).toBe(zones);
  });
});
