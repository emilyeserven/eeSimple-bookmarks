// @vitest-environment node
import type { CardFieldZones } from "@eesimple/types";

import { emptyCardFieldZones } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { hasBookmarkPropertyRows } from "./bookmarkProperties";
import { makeBookmark, makeCustomProperty } from "../test-utils/factories";

/** A zones map placing one boolean property in the body with `showIfFalse` set. */
function zonesShowingFalse(propertyId: string): CardFieldZones {
  const zones = emptyCardFieldZones();
  zones["card-labels"].push({
    key: propertyId,
    showIfFalse: true,
  });
  return zones;
}

describe("hasBookmarkPropertyRows", () => {
  it("is false when the bookmark has no values at all", () => {
    expect(hasBookmarkPropertyRows(makeBookmark(), [])).toBe(false);
  });

  it("is true when a known number value would render", () => {
    const prop = makeCustomProperty({
      id: "p1",
      type: "number",
    });
    const bookmark = makeBookmark({
      numberValues: [{
        propertyId: "p1",
        value: 3,
      }],
    });
    expect(hasBookmarkPropertyRows(bookmark, [prop])).toBe(true);
  });

  it("ignores values whose property is not in the list", () => {
    const bookmark = makeBookmark({
      numberValues: [{
        propertyId: "unknown",
        value: 3,
      }],
    });
    expect(hasBookmarkPropertyRows(bookmark, [])).toBe(false);
  });

  it("is true for a datetime value", () => {
    const prop = makeCustomProperty({
      id: "d1",
      type: "datetime",
    });
    const bookmark = makeBookmark({
      dateTimeValues: [{
        propertyId: "d1",
        value: "2026-06-01",
      }],
    });
    expect(hasBookmarkPropertyRows(bookmark, [prop])).toBe(true);
  });

  it("counts a file value only when the property is shown in details", () => {
    const shown = makeCustomProperty({
      id: "f1",
      type: "file",
      showInDetails: true,
    });
    const hidden = makeCustomProperty({
      id: "f1",
      type: "file",
      showInDetails: false,
    });
    const bookmark = makeBookmark({
      fileValues: [{
        propertyId: "f1",
        url: "https://example.com/x",
        contentType: "application/pdf",
        byteSize: 100,
        originalFilename: "x.pdf",
        width: null,
        height: null,
      }],
    });
    expect(hasBookmarkPropertyRows(bookmark, [shown])).toBe(true);
    expect(hasBookmarkPropertyRows(bookmark, [hidden])).toBe(false);
  });

  it("hides a false boolean by default but shows it when the Default rule sets showIfFalse", () => {
    const prop = makeCustomProperty({
      id: "b1",
      type: "boolean",
    });
    const bookmark = makeBookmark({
      booleanValues: [{
        propertyId: "b1",
        value: false,
      }],
    });
    // No zones → showIfFalse defaults off → a false value produces no row.
    expect(hasBookmarkPropertyRows(bookmark, [prop])).toBe(false);
    // With showIfFalse in the Default zones → the false value produces a row.
    expect(hasBookmarkPropertyRows(bookmark, [prop], zonesShowingFalse("b1"))).toBe(true);
  });

  it("always counts a true boolean", () => {
    const prop = makeCustomProperty({
      id: "b2",
      type: "boolean",
    });
    const bookmark = makeBookmark({
      booleanValues: [{
        propertyId: "b2",
        value: true,
      }],
    });
    expect(hasBookmarkPropertyRows(bookmark, [prop])).toBe(true);
  });
});
