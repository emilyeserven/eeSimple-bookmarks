import type { ResolvedFieldPlacement } from "../lib/bookmarkCardValues";
import type { CardImageCorner } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildCardOverlayItems } from "./bookmarkCardOverlays";
import { buildBookmarkValueItems } from "../lib/bookmarkCardValues";
import { makeBookmark, makeCustomProperty } from "../test-utils/factories";

/** A corner placement with overridable overlay flags. */
function cornerPlacement(
  corner: CardImageCorner | null,
  overrides: Partial<ResolvedFieldPlacement> = {},
): ResolvedFieldPlacement {
  return {
    zone: corner ? `image-${corner}` as const : "card-labels",
    corner,
    scale: 1,
    mobileScale: null,
    hideLabel: false,
    hideIcon: false,
    ...overrides,
  };
}

describe("buildCardOverlayItems", () => {
  it("overlays a custom-property value placed in a corner, carrying its scale", () => {
    const prop = makeCustomProperty({
      name: "Pages",
    });
    const bookmark = makeBookmark({
      numberValues: [{
        propertyId: prop.id,
        value: 42,
      }],
    });
    const placements = new Map([[prop.id, cornerPlacement("top-left", {
      scale: 2,
      mobileScale: 1.5,
    })]]);
    const valueItems = buildBookmarkValueItems(bookmark, [prop], placements);

    const overlays = buildCardOverlayItems(bookmark, valueItems, placements, undefined);

    expect(overlays).toHaveLength(1);
    expect(overlays[0]).toMatchObject({
      key: prop.id,
      corner: "top-left",
      scale: 2,
      mobileScale: 1.5,
    });
    expect(overlays[0].node).toBeTruthy();
  });

  it("skips a custom-property value placed in the card body (corner null)", () => {
    const prop = makeCustomProperty({
      name: "Pages",
    });
    const bookmark = makeBookmark({
      numberValues: [{
        propertyId: prop.id,
        value: 42,
      }],
    });
    const placements = new Map([[prop.id, cornerPlacement(null)]]);
    const valueItems = buildBookmarkValueItems(bookmark, [prop], placements);

    expect(buildCardOverlayItems(bookmark, valueItems, placements, undefined)).toHaveLength(0);
  });

  it("overlays a standard field placed in a corner under the field's key", () => {
    const bookmark = makeBookmark({
      mediaType: {
        id: "mt",
        name: "Article",
        slug: "article",
        icon: null,
        parentId: null,
      },
    });
    const placements = new Map([["mediaType", cornerPlacement("bottom-right")]]);

    const overlays = buildCardOverlayItems(bookmark, [], placements, undefined);

    expect(overlays).toHaveLength(1);
    expect(overlays[0]).toMatchObject({
      key: "mediaType",
      corner: "bottom-right",
    });
  });

  it("drops a standard-field overlay that resolves to neither icon nor text", () => {
    // `tags` has no overlay icon; with the label hidden there is nothing left to render.
    const bookmark = makeBookmark({
      tags: [{
        id: "t1",
        name: "react",
        slug: "react",
        parentId: null,
      }],
    });
    const placements = new Map([["tags", cornerPlacement("top-right", {
      hideLabel: true,
    })]]);

    expect(buildCardOverlayItems(bookmark, [], placements, undefined)).toHaveLength(0);
  });

  it("ignores standard fields that are not placed in a corner", () => {
    const bookmark = makeBookmark({
      description: "a description",
    });
    const placements = new Map([["description", cornerPlacement(null)]]);

    expect(buildCardOverlayItems(bookmark, [], placements, undefined)).toHaveLength(0);
  });
});
