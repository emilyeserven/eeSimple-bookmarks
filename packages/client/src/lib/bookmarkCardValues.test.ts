// @vitest-environment node
import type { ResolvedFieldPlacement } from "./bookmarkCardValues";
import type { Bookmark, CardImageCorner } from "@eesimple/types";

import { emptyCardFieldZones } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_BOOLEAN_DISPLAY,
  buildBookmarkValueItems,
  defaultBodyZone,
  hiddenFieldKeysFromZones,
  resolveBooleanDisplay,
  resolveFieldPlacements,
} from "./bookmarkCardValues";
import { STANDARD_CARD_FIELDS } from "./bookmarkCardFieldDefs";
import { makeBookmark, makeCustomProperty as property } from "../test-utils/factories";

/** Build a single-key placement map for the test property. */
function placementMap(
  key: string,
  corner: CardImageCorner | null,
  hideLabel: boolean,
  extra: Partial<ResolvedFieldPlacement> = {},
): Map<string, ResolvedFieldPlacement> {
  return new Map([[key, {
    zone: corner ? `image-${corner}` as const : "card-labels",
    corner,
    scale: 1,
    mobileScale: null,
    hideLabel,
    hideIcon: false,
    showIfFalse: false,
    clickableInView: false,
    clickableInOverlay: false,
    showLabelColon: true,
    showValueBeforeLabel: false,
    clickableTags: false,
    showTagHierarchyOnHover: false,
    showMediaTypeHierarchyOnHover: false,
    showLocationHierarchyOnHover: false,
    showGenreMoodHierarchyOnHover: false,
    maxTerms: null,
    collapseToCount: false,
    showProgressCount: true,
    showProgressUnit: true,
    ...extra,
  }]]);
}

function bookmarkWithNumber(propertyId: string, value: number): Bookmark {
  return makeBookmark({
    numberValues: [{
      propertyId,
      value,
    }],
  });
}

describe("buildBookmarkValueItems corner hide-label", () => {
  it("includes the property name when the label is not hidden", () => {
    const prop = property({
      name: "Rating",
    });
    const [item] = buildBookmarkValueItems(
      bookmarkWithNumber(prop.id, 7),
      [prop],
      placementMap(prop.id, "top-left", false),
    );
    expect(item.kind).toBe("badge");
    if (item.kind === "badge") expect(item.label).toBe("Rating: 7");
  });

  it("drops the property name when hide-label is set on a corner placement", () => {
    const prop = property({});
    const [item] = buildBookmarkValueItems(
      bookmarkWithNumber(prop.id, 7),
      [prop],
      placementMap(prop.id, "top-left", true),
    );
    expect(item.kind).toBe("badge");
    if (item.kind === "badge") expect(item.label).toBe("7");
  });

  it("omits a property absent from the placement map (hidden)", () => {
    const prop = property({});
    const items = buildBookmarkValueItems(
      bookmarkWithNumber(prop.id, 7),
      [prop],
      new Map(),
    );
    expect(items).toHaveLength(0);
  });

  it("skips a property with showInListings off", () => {
    const prop = property({
      showInListings: false,
    });
    const items = buildBookmarkValueItems(
      bookmarkWithNumber(prop.id, 7),
      [prop],
      placementMap(prop.id, null, false),
    );
    expect(items).toHaveLength(0);
  });
});

describe("buildBookmarkValueItems by value kind", () => {
  it("emits a rating item for a ratingScale number value", () => {
    const prop = property({
      type: "ratingScale",
      ratingMax: 5,
    });
    const [item] = buildBookmarkValueItems(
      bookmarkWithNumber(prop.id, 4),
      [prop],
      placementMap(prop.id, null, false),
    );
    expect(item.kind).toBe("rating");
    if (item.kind === "rating") expect(item.value).toBe(4);
  });

  it("emits a boolean badge and respects showIfFalse", () => {
    const prop = property({
      type: "boolean",
      name: "Read",
    });
    const shown = buildBookmarkValueItems(
      makeBookmark({
        booleanValues: [{
          propertyId: prop.id,
          value: true,
        }],
      }),
      [prop],
      placementMap(prop.id, null, false),
    );
    expect(shown).toHaveLength(1);
    expect(shown[0].kind).toBe("badge");
    if (shown[0].kind === "badge") expect(shown[0].booleanValue).toBe(true);

    const hidden = buildBookmarkValueItems(
      makeBookmark({
        booleanValues: [{
          propertyId: prop.id,
          value: false,
        }],
      }),
      [prop],
      placementMap(prop.id, null, false),
    );
    expect(hidden).toHaveLength(0);
  });

  it("keeps a false boolean when showIfFalse is set", () => {
    const prop = property({
      type: "boolean",
    });
    const items = buildBookmarkValueItems(
      makeBookmark({
        booleanValues: [{
          propertyId: prop.id,
          value: false,
        }],
      }),
      [prop],
      placementMap(prop.id, null, false, {
        showIfFalse: true,
      }),
    );
    expect(items).toHaveLength(1);
  });

  it("emits a datetime badge with the property name", () => {
    const prop = property({
      type: "datetime",
      dateTimeFormat: "date",
      name: "Due",
    });
    const [item] = buildBookmarkValueItems(
      makeBookmark({
        dateTimeValues: [{
          propertyId: prop.id,
          value: "2024-03-04",
        }],
      }),
      [prop],
      placementMap(prop.id, null, false),
    );
    expect(item.kind).toBe("badge");
    if (item.kind === "badge") expect(item.label.startsWith("Due: ")).toBe(true);
  });

  it("emits an image item carrying the serving url and only the property name", () => {
    const prop = property({
      type: "image",
      name: "Cover",
    });
    const [item] = buildBookmarkValueItems(
      makeBookmark({
        fileValues: [{
          propertyId: prop.id,
          url: "https://cdn/x.webp",
          contentType: "image/webp",
          byteSize: 10,
          originalFilename: null,
          width: 100,
          height: 100,
        }],
      }),
      [prop],
      placementMap(prop.id, null, false),
    );
    expect(item.kind).toBe("badge");
    if (item.kind === "badge") {
      expect(item.imageUrl).toBe("https://cdn/x.webp");
      expect(item.label).toBe("Cover");
    }
  });

  it("emits a file item appending the original filename", () => {
    const prop = property({
      type: "file",
      name: "Doc",
    });
    const [item] = buildBookmarkValueItems(
      makeBookmark({
        fileValues: [{
          propertyId: prop.id,
          url: "https://cdn/report.pdf",
          contentType: "application/pdf",
          byteSize: 10,
          originalFilename: "report.pdf",
          width: null,
          height: null,
        }],
      }),
      [prop],
      placementMap(prop.id, null, false),
    );
    expect(item.kind).toBe("badge");
    if (item.kind === "badge") {
      expect(item.label).toBe("Doc: report.pdf");
      expect(item.imageUrl).toBeUndefined();
    }
  });
});

describe("buildBookmarkValueItems progress items", () => {
  it("emits a progress item for a manual progress value (ring-eligible)", () => {
    const prop = property({
      type: "itemInItems",
      name: "Progress",
    });
    const [item] = buildBookmarkValueItems(
      makeBookmark({
        progressValues: [{
          propertyId: prop.id,
          current: 3,
          total: 10,
        }],
      }),
      [prop],
      placementMap(prop.id, "top-left", true),
    );
    expect(item.kind).toBe("progress");
    if (item.kind === "progress") {
      expect(item.current).toBe(3);
      expect(item.total).toBe(10);
      expect(item.fraction).toBeCloseTo(0.3);
      expect(item.ringEligible).toBe(true);
      expect(item.text).toBe("3 of 10");
    }
  });

  it("is ring-eligible for a 0-of-N exhaustive derived value (all unchecked)", () => {
    const sections = property({
      type: "sections",
      name: "Sections",
    });
    const prog = property({
      type: "itemInItems",
      name: "Progress",
      itemInItemsSourcePropertyId: sections.id,
    });
    const [item] = buildBookmarkValueItems(
      makeBookmark({
        progressValues: [{
          propertyId: prog.id,
          current: 0,
          total: 5,
        }],
        sectionsValues: [{
          propertyId: sections.id,
          exhaustive: true,
          sections: [],
        }],
      }),
      [prog],
      placementMap(prog.id, "top-left", true),
    );
    expect(item.kind).toBe("progress");
    if (item.kind === "progress") {
      expect(item.fraction).toBe(0);
      expect(item.ringEligible).toBe(true);
    }
  });

  it("is not ring-eligible when the derived source sections are not exhaustive", () => {
    const sections = property({
      type: "sections",
      name: "Sections",
    });
    const prog = property({
      type: "itemInItems",
      name: "Progress",
      itemInItemsSourcePropertyId: sections.id,
    });
    const [item] = buildBookmarkValueItems(
      makeBookmark({
        progressValues: [{
          propertyId: prog.id,
          current: 2,
          total: 5,
        }],
        sectionsValues: [{
          propertyId: sections.id,
          exhaustive: false,
          sections: [],
        }],
      }),
      [prog],
      placementMap(prog.id, "top-left", true),
    );
    expect(item.kind).toBe("progress");
    if (item.kind === "progress") expect(item.ringEligible).toBe(false);
  });

  it("honors the showProgressCount/showProgressUnit knobs", () => {
    const prop = property({
      type: "itemInItems",
      name: "Progress",
      itemInItemsAfterText: " pages",
    });
    const [item] = buildBookmarkValueItems(
      makeBookmark({
        progressValues: [{
          propertyId: prop.id,
          current: 3,
          total: 10,
        }],
      }),
      [prop],
      placementMap(prop.id, "top-left", true, {
        showProgressCount: false,
      }),
    );
    expect(item.kind).toBe("progress");
    if (item.kind === "progress") expect(item.text).toBe("pages");
  });

  it("skips a 0-of-0 progress value", () => {
    const prop = property({
      type: "itemInItems",
    });
    const items = buildBookmarkValueItems(
      makeBookmark({
        progressValues: [{
          propertyId: prop.id,
          current: 0,
          total: 0,
        }],
      }),
      [prop],
      placementMap(prop.id, null, false),
    );
    expect(items).toHaveLength(0);
  });
});

describe("defaultBodyZone", () => {
  it("places 'description' in card-single-top", () => {
    expect(defaultBodyZone("description")).toBe("card-single-top");
  });

  it("places header fields (title, externalLink, more) in card-single-top", () => {
    expect(defaultBodyZone("title")).toBe("card-single-top");
    expect(defaultBodyZone("externalLink")).toBe("card-single-top");
    expect(defaultBodyZone("more")).toBe("card-single-top");
  });

  it("places other standard fields in card-labels", () => {
    expect(defaultBodyZone("category")).toBe("card-labels");
    expect(defaultBodyZone("tags")).toBe("card-labels");
  });

  it("places arbitrary custom property IDs in card-labels", () => {
    expect(defaultBodyZone("prop-abc123")).toBe("card-labels");
  });
});

describe("resolveFieldPlacements", () => {
  it("returns an empty map for zones with no placements", () => {
    const zones = emptyCardFieldZones();
    const map = resolveFieldPlacements(zones);
    expect(map.size).toBe(0);
  });

  it("maps a card-labels placement to the correct resolved entry", () => {
    const zones = emptyCardFieldZones();
    zones["card-labels"].push({
      key: "category",
    });
    const map = resolveFieldPlacements(zones);
    const placement = map.get("category");
    expect(placement).toBeDefined();
    expect(placement?.zone).toBe("card-labels");
    expect(placement?.corner).toBeNull();
    expect(placement?.hideLabel).toBe(false);
    expect(placement?.scale).toBe(1);
  });

  it("maps an image-top-left placement with a corner", () => {
    const zones = emptyCardFieldZones();
    zones["image-top-left"].push({
      key: "category",
      scale: 2,
      hideLabel: true,
    });
    const map = resolveFieldPlacements(zones);
    const placement = map.get("category");
    expect(placement?.zone).toBe("image-top-left");
    expect(placement?.corner).toBe("top-left");
    expect(placement?.scale).toBe(2);
    expect(placement?.hideLabel).toBe(true);
  });

  it("hides a field absent from all zones", () => {
    const zones = emptyCardFieldZones();
    zones["card-labels"].push({
      key: "tags",
    });
    const map = resolveFieldPlacements(zones);
    expect(map.has("category")).toBe(false);
  });
});

describe("resolveBooleanDisplay", () => {
  it("returns DEFAULT_BOOLEAN_DISPLAY when zones is undefined", () => {
    expect(resolveBooleanDisplay(undefined, "prop-1")).toEqual(DEFAULT_BOOLEAN_DISPLAY);
  });

  it("returns DEFAULT_BOOLEAN_DISPLAY when the property is not in any zone", () => {
    const zones = emptyCardFieldZones();
    expect(resolveBooleanDisplay(zones, "prop-1")).toEqual(DEFAULT_BOOLEAN_DISPLAY);
  });

  it("returns the placement's boolean knobs when found", () => {
    const zones = emptyCardFieldZones();
    zones["card-labels"].push({
      key: "prop-1",
      showIfFalse: true,
      clickableInView: true,
    });
    const display = resolveBooleanDisplay(zones, "prop-1");
    expect(display.showIfFalse).toBe(true);
    expect(display.clickableInView).toBe(true);
    expect(display.hideLabel).toBe(false);
  });
});

describe("hiddenFieldKeysFromZones", () => {
  it("returns all standard fields as hidden when zones are empty", () => {
    const zones = emptyCardFieldZones();
    const hidden = hiddenFieldKeysFromZones(zones, []);
    const standardKeys = new Set(STANDARD_CARD_FIELDS.map(f => f.key));
    for (const key of standardKeys) {
      expect(hidden.has(key)).toBe(true);
    }
  });

  it("excludes a field placed in a zone from the hidden set", () => {
    const zones = emptyCardFieldZones();
    zones["card-labels"].push({
      key: "category",
    });
    const hidden = hiddenFieldKeysFromZones(zones, []);
    expect(hidden.has("category")).toBe(false);
  });

  it("includes custom property keys not in any zone", () => {
    const zones = emptyCardFieldZones();
    const prop = property({
      id: "prop-1",
      type: "boolean",
      allCategories: true,
    });
    const hidden = hiddenFieldKeysFromZones(zones, [prop]);
    expect(hidden.has("prop-1")).toBe(true);
  });

  it("excludes a custom property placed in a zone", () => {
    const zones = emptyCardFieldZones();
    const prop = property({
      id: "prop-2",
      type: "boolean",
      allCategories: true,
    });
    zones["card-labels"].push({
      key: "prop-2",
    });
    const hidden = hiddenFieldKeysFromZones(zones, [prop]);
    expect(hidden.has("prop-2")).toBe(false);
  });
});
