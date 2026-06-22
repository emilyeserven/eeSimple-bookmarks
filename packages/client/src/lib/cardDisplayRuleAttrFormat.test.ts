import type { RuleAttrInspection } from "./cardDisplayRules";
import type { CardFieldZones, CardZoneLayouts } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { emptyCardFieldZones } from "@eesimple/types";

import { formatRuleAttrValue } from "./cardDisplayRuleAttrFormat";

const labels = {
  aspectLabel: new Map([["16:9", "16 : 9"]]),
  fieldLabel: new Map([
    ["title", "Title"],
    ["prop-1", "Rating"],
  ]),
};

/** Build a minimal inspected attr; only `key`/`value` matter for formatting. */
function attr(key: RuleAttrInspection["key"], value: RuleAttrInspection["value"]): RuleAttrInspection {
  return {
    key,
    value,
    label: key,
    status: "applied",
    overriddenBy: null,
  };
}

describe("formatRuleAttrValue", () => {
  it("maps image visibility enums to their labels, falling back to the raw value", () => {
    expect(formatRuleAttrValue(attr("imageVisibility", "shown"), labels)).toBe("Show");
    expect(formatRuleAttrValue(attr("imageVisibility", "image-only"), labels)).toBe("Only");
    expect(formatRuleAttrValue(attr("imageVisibility", "weird"), labels)).toBe("weird");
  });

  it("maps image layout enums to their labels", () => {
    expect(formatRuleAttrValue(attr("imageLayout", "above"), labels)).toBe("Above");
    expect(formatRuleAttrValue(attr("imageLayout", "side"), labels)).toBe("Side");
  });

  it("resolves the aspect label via the provided map", () => {
    expect(formatRuleAttrValue(attr("imageMode", "16:9"), labels)).toBe("16 : 9");
    expect(formatRuleAttrValue(attr("imageMode", "natural"), labels)).toBe("natural");
  });

  it("renders hideWebsiteForYouTube as On/Off", () => {
    expect(formatRuleAttrValue(attr("hideWebsiteForYouTube", true), labels)).toBe("On");
    expect(formatRuleAttrValue(attr("hideWebsiteForYouTube", false), labels)).toBe("Off");
  });

  it("summarizes fieldZones into card + corner groups with field labels", () => {
    const zones: CardFieldZones = emptyCardFieldZones();
    zones["card-labels"].push({
      key: "title",
    });
    zones["card-table"].push({
      key: "prop-1",
    });
    zones["image-top-left"].push({
      key: "title",
    });

    expect(formatRuleAttrValue(attr("fieldZones", zones), labels)).toBe(
      "Card: Title, Rating; Corners: Title",
    );
  });

  it("falls back to the raw key for an unlabeled field", () => {
    const zones: CardFieldZones = emptyCardFieldZones();
    zones["card-labels"].push({
      key: "unknown-prop",
    });
    expect(formatRuleAttrValue(attr("fieldZones", zones), labels)).toBe("Card: unknown-prop");
  });

  it("reports 'All fields hidden' when fieldZones place nothing", () => {
    expect(formatRuleAttrValue(attr("fieldZones", emptyCardFieldZones()), labels)).toBe(
      "All fields hidden",
    );
  });

  it("summarizes cardZoneLayouts by zone label and mode", () => {
    const layouts: CardZoneLayouts = {
      "card-single-top": {
        mode: "flex",
      },
      "card-labels": {
        mode: "grid",
      },
      "card-table": {
        mode: "flex",
      },
      "card-single-bottom": {
        mode: "grid",
      },
    };
    expect(formatRuleAttrValue(attr("cardZoneLayouts", layouts), labels)).toBe(
      "Top: flex, Labels: grid, Table: flex, Bottom: grid",
    );
  });
});
