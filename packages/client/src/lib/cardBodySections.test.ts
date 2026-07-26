// @vitest-environment node
import type { ResolvedFieldPlacement } from "./bookmarkCardValues";
import type { CardDisplaySection, CardZoneLayout } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { bodySectionsFromConfig, bodySectionsFromZones } from "./cardBodySections";

const flex: CardZoneLayout = {
  mode: "flex",
};

function placement(zone: ResolvedFieldPlacement["zone"], corner: ResolvedFieldPlacement["corner"] = null): ResolvedFieldPlacement {
  // Only `zone` and `corner` are read by bodySectionsFromZones; the rest are irrelevant here.
  return {
    zone,
    corner,
  } as ResolvedFieldPlacement;
}

describe("bodySectionsFromConfig", () => {
  it("maps each section to its render shape and pins only the last section", () => {
    const sections: CardDisplaySection[] = [
      {
        key: "top",
        form: "stacked",
        layout: flex,
        fields: [{
          key: "title",
        }, {
          key: "url",
        }],
      },
      {
        key: "meta",
        form: "inline",
        layout: flex,
        fields: [{
          key: "category",
        }],
      },
    ];
    const result = bodySectionsFromConfig(sections);
    expect(result).toEqual([
      {
        key: "top",
        form: "single",
        layout: flex,
        fieldKeys: ["title", "url"],
        pinBottom: false,
      },
      {
        key: "meta",
        form: "label",
        layout: flex,
        fieldKeys: ["category"],
        pinBottom: true,
      },
    ]);
  });

  it("converts the table form to the table field form", () => {
    const sections: CardDisplaySection[] = [
      {
        key: "t",
        form: "table",
        layout: flex,
        fields: [{
          key: "rating",
        }],
      },
    ];
    expect(bodySectionsFromConfig(sections)[0]?.form).toBe("table");
  });

  it("returns an empty array for no sections", () => {
    expect(bodySectionsFromConfig([])).toEqual([]);
  });
});

describe("bodySectionsFromZones", () => {
  it("always emits the four body zones in fixed order and pins card-single-bottom", () => {
    const result = bodySectionsFromZones(new Map(), undefined);
    expect(result.map(s => s.key)).toEqual([
      "card-single-top",
      "card-labels",
      "card-table",
      "card-single-bottom",
    ]);
    expect(result.find(s => s.key === "card-single-bottom")?.pinBottom).toBe(true);
    expect(result.find(s => s.key === "card-single-top")?.pinBottom).toBe(false);
  });

  it("groups body keys under their zone, preserving insertion order", () => {
    const placements = new Map<string, ResolvedFieldPlacement>([
      ["title", placement("card-single-top")],
      ["url", placement("card-single-top")],
      ["rating", placement("card-table")],
    ]);
    const result = bodySectionsFromZones(placements, undefined);
    expect(result.find(s => s.key === "card-single-top")?.fieldKeys).toEqual(["title", "url"]);
    expect(result.find(s => s.key === "card-table")?.fieldKeys).toEqual(["rating"]);
    expect(result.find(s => s.key === "card-labels")?.fieldKeys).toEqual([]);
  });

  it("excludes image-corner placements from the body sections", () => {
    const placements = new Map<string, ResolvedFieldPlacement>([
      ["badge", placement("card-single-top", "top-left")],
      ["title", placement("card-single-top")],
    ]);
    const result = bodySectionsFromZones(placements, undefined);
    expect(result.find(s => s.key === "card-single-top")?.fieldKeys).toEqual(["title"]);
  });
});
