import { describe, expect, it } from "vitest";

import { makeBookmark, makeCustomProperty } from "../test-utils/factories";
import { buildBookmarkPropertyRows, hasAnyPropertyRow } from "./bookmarkPropertyRows";

describe("buildBookmarkPropertyRows", () => {
  it("splits numberValues into number rows and ratingScale rows", () => {
    const properties = [
      makeCustomProperty({
        id: "n",
        type: "number",
        name: "Pages",
      }),
      makeCustomProperty({
        id: "r",
        type: "ratingScale",
        name: "Stars",
        ratingMax: 3,
      }),
    ];
    const bookmark = makeBookmark({
      numberValues: [
        {
          propertyId: "n",
          value: 12,
        },
        {
          propertyId: "r",
          value: 4,
        },
      ],
    });
    const rows = buildBookmarkPropertyRows(bookmark, properties, undefined);
    expect(rows.numberRows.map(r => r.id)).toEqual(["n"]);
    expect(rows.ratingRows.map(r => r.id)).toEqual(["r"]);
    expect(rows.ratingRows[0].max).toBe(3);
  });

  it("flags calculated number properties", () => {
    const properties = [makeCustomProperty({
      id: "c",
      type: "calculate",
      name: "Total",
    })];
    const bookmark = makeBookmark({
      numberValues: [{
        propertyId: "c",
        value: 5,
      }],
    });
    expect(buildBookmarkPropertyRows(bookmark, properties, undefined).numberRows[0].isCalculated).toBe(true);
  });

  it("skips values whose property is unknown", () => {
    const bookmark = makeBookmark({
      numberValues: [{
        propertyId: "ghost",
        value: 1,
      }],
    });
    expect(buildBookmarkPropertyRows(bookmark, [], undefined).numberRows).toEqual([]);
  });

  it("drops false booleans unless showIfFalse resolves true (default zones absent → false)", () => {
    const properties = [makeCustomProperty({
      id: "b",
      type: "boolean",
      name: "Read",
    })];
    const bookmark = makeBookmark({
      booleanValues: [{
        propertyId: "b",
        value: false,
      }],
    });
    expect(buildBookmarkPropertyRows(bookmark, properties, undefined).booleanRows).toEqual([]);
  });

  it("keeps true booleans", () => {
    const properties = [makeCustomProperty({
      id: "b",
      type: "boolean",
      name: "Read",
    })];
    const bookmark = makeBookmark({
      booleanValues: [{
        propertyId: "b",
        value: true,
      }],
    });
    const rows = buildBookmarkPropertyRows(bookmark, properties, undefined);
    expect(rows.booleanRows.map(r => r.id)).toEqual(["b"]);
    expect(rows.booleanRows[0].rawValue).toBe(true);
  });

  it("only includes file rows whose property opted into showInDetails", () => {
    const properties = [
      makeCustomProperty({
        id: "shown",
        type: "image",
        name: "Cover",
        showInDetails: true,
      }),
      makeCustomProperty({
        id: "hidden",
        type: "file",
        name: "Doc",
        showInDetails: false,
      }),
    ];
    const file = (propertyId: string, url: string, originalFilename: string) => ({
      propertyId,
      url,
      originalFilename,
      contentType: "application/octet-stream",
      byteSize: 1,
      width: null,
      height: null,
    });
    const bookmark = makeBookmark({
      fileValues: [file("shown", "/a.png", "a.png"), file("hidden", "/b.pdf", "b.pdf")],
    });
    const rows = buildBookmarkPropertyRows(bookmark, properties, undefined);
    expect(rows.fileRows.map(r => r.id)).toEqual(["shown"]);
    expect(rows.fileRows[0].isImage).toBe(true);
  });

  it("hasAnyPropertyRow reflects whether any row kind is present", () => {
    expect(hasAnyPropertyRow(buildBookmarkPropertyRows(makeBookmark(), [], undefined))).toBe(false);
    const properties = [makeCustomProperty({
      id: "d",
      type: "datetime",
      name: "Due",
    })];
    const bookmark = makeBookmark({
      dateTimeValues: [{
        propertyId: "d",
        value: "2026-06-01",
      }],
    });
    expect(hasAnyPropertyRow(buildBookmarkPropertyRows(bookmark, properties, undefined))).toBe(true);
  });
});
