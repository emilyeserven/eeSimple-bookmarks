import type { ResolvedFieldPlacement } from "./bookmarkCardValues";
import type { Bookmark, CardImageCorner } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildBookmarkValueItems } from "./bookmarkCardValues";
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
