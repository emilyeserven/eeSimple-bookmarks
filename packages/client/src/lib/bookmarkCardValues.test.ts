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
): Map<string, ResolvedFieldPlacement> {
  return new Map([[key, {
    zone: corner ? `image-${corner}` as const : "card-labels",
    corner,
    scale: 1,
    mobileScale: null,
    hideLabel,
    hideIcon: false,
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
});
