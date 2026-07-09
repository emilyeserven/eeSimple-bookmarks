// @vitest-environment node
import type { CardFieldZones } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import {
  cardDisplayConfigFromFieldZones,
  defaultCardZoneLayouts,
  emptyCardFieldZones,
  fieldZonesFromConfig,
} from "@eesimple/types";

const image = {
  imageMode: "natural",
  imageVisibility: "shown" as const,
  imageLayout: "above" as const,
  hideWebsiteForYouTube: false,
};

function sampleZones(): CardFieldZones {
  const zones = emptyCardFieldZones();
  zones["card-single-top"].push({
    key: "title",
  });
  zones["card-labels"].push({
    key: "category",
  }, {
    key: "tags",
  });
  zones["card-table"].push({
    key: "mediaType",
  });
  zones["image-top-left"].push({
    key: "website",
  });
  return zones;
}

describe("cardDisplayConfigFromFieldZones", () => {
  it("maps the four body zones to sections (in order) and lifts image zones into corners", () => {
    const config = cardDisplayConfigFromFieldZones(sampleZones(), defaultCardZoneLayouts(), image);
    expect(config.sections.map(s => s.key)).toEqual([
      "card-single-top",
      "card-labels",
      "card-table",
      "card-single-bottom",
    ]);
    expect(config.sections[0].form).toBe("stacked");
    expect(config.sections[1].form).toBe("inline");
    expect(config.sections[2].form).toBe("table");
    expect(config.sections[1].fields.map(f => f.key)).toEqual(["category", "tags"]);
    expect(config.imageCorners["top-left"].map(f => f.key)).toEqual(["website"]);
  });

  it("round-trips the field placements back through fieldZonesFromConfig", () => {
    const config = cardDisplayConfigFromFieldZones(sampleZones(), defaultCardZoneLayouts(), image);
    const zones = fieldZonesFromConfig(config);
    // Body fields land back in a body zone matching their section's form; corners round-trip exactly.
    expect(zones["card-single-top"].map(f => f.key)).toEqual(["title"]);
    expect(zones["card-labels"].map(f => f.key)).toEqual(["category", "tags"]);
    expect(zones["card-table"].map(f => f.key)).toEqual(["mediaType"]);
    expect(zones["image-top-left"].map(f => f.key)).toEqual(["website"]);
  });
});
