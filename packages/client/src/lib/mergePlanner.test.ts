// @vitest-environment node
import { MERGE_SCALAR_FIELDS } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import {
  associationSummary,
  buildFieldChoices,
  differingUnits,
  MERGE_FIELD_UNITS,
  mergeFieldValue,
  unitDisplayValue,
} from "./mergePlanner";
import { makeBookmark } from "../test-utils/factories";

describe("MERGE_FIELD_UNITS", () => {
  it("covers every MERGE_SCALAR_FIELDS member exactly once", () => {
    const unitFields = MERGE_FIELD_UNITS.flatMap(unit => unit.fields);
    expect([...unitFields].sort()).toEqual([...MERGE_SCALAR_FIELDS].sort());
    expect(new Set(unitFields).size).toEqual(unitFields.length);
  });
});

describe("mergeFieldValue", () => {
  it("reads FK fields from the embedded relation and scalars directly", () => {
    const bookmark = makeBookmark({
      title: "Direct",
      website: {
        id: "w-1",
        domain: "example.com",
        siteName: "Example",
        slug: "example",
        imageUrl: null,
      },
    });
    expect(mergeFieldValue(bookmark, "title")).toEqual("Direct");
    expect(mergeFieldValue(bookmark, "websiteId")).toEqual("w-1");
    expect(mergeFieldValue(bookmark, "mediaTypeId")).toEqual(null);
  });
});

describe("differingUnits", () => {
  it("returns only units on which the members disagree, collapsing multi-field units", () => {
    const a = makeBookmark({
      id: "a",
      title: "Same",
      description: "One",
      kavitaSeriesId: 1,
      kavitaLibraryId: 1,
      kavitaSeriesName: "Series",
    });
    const b = makeBookmark({
      id: "b",
      title: "Same",
      description: "Two",
      kavitaSeriesId: 2,
      kavitaLibraryId: 1,
      kavitaSeriesName: "Series",
    });
    const keys = differingUnits([a, b]).map(unit => unit.key);
    expect(keys).toContain("description");
    expect(keys).toContain("kavita");
    expect(keys).not.toContain("title");
    expect(keys.filter(key => key === "kavita")).toHaveLength(1);
  });
});

describe("unitDisplayValue", () => {
  it("joins distinct non-empty field displays and resolves the category name", () => {
    const bookmark = makeBookmark({
      categoryId: "cat-1",
      kavitaSeriesId: 7,
      kavitaLibraryId: 7,
      kavitaSeriesName: "My Series",
    });
    const kavita = MERGE_FIELD_UNITS.find(unit => unit.key === "kavita")!;
    const category = MERGE_FIELD_UNITS.find(unit => unit.key === "categoryId")!;
    expect(unitDisplayValue(bookmark, kavita)).toEqual("7 · My Series");
    expect(unitDisplayValue(bookmark, category, () => "Dev")).toEqual("Dev");
    expect(unitDisplayValue(makeBookmark({
      kavitaSeriesId: null,
    }), kavita)).toEqual(null);
  });
});

describe("buildFieldChoices", () => {
  it("expands unit picks to their fields and omits survivor picks", () => {
    const kavita = MERGE_FIELD_UNITS.find(unit => unit.key === "kavita")!;
    const title = MERGE_FIELD_UNITS.find(unit => unit.key === "title")!;
    const choices = buildFieldChoices([kavita, title], {
      kavita: "loser-1",
      title: "survivor",
    }, "survivor");
    expect(choices).toEqual({
      kavitaSeriesId: "loser-1",
      kavitaLibraryId: "loser-1",
      kavitaSeriesName: "loser-1",
    });
  });

  it("defaults an unpicked unit to the survivor (no entry)", () => {
    const title = MERGE_FIELD_UNITS.find(unit => unit.key === "title")!;
    expect(buildFieldChoices([title], {}, "survivor")).toEqual({});
  });
});

describe("associationSummary", () => {
  it("counts unions across members and drops zero-count entries", () => {
    const a = makeBookmark({
      id: "a",
      tags: [
        {
          id: "t-1",
          name: "One",
          slug: "one",
          parentId: null,
          editableOnCard: false,
        },
        {
          id: "t-2",
          name: "Two",
          slug: "two",
          parentId: null,
          editableOnCard: false,
        },
      ],
    });
    const b = makeBookmark({
      id: "b",
      tags: [{
        id: "t-2",
        name: "Two",
        slug: "two",
        parentId: null,
        editableOnCard: false,
      }],
    });
    const summary = associationSummary([a, b]);
    expect(summary).toEqual([{
      label: "Tags",
      count: 2,
    }]);
  });

  it("ignores relationship edges that point at another group member", () => {
    const edge = {
      bookmark: {
        id: "b",
        url: null,
        title: "Member B",
      },
      relationshipTypeId: "type-1",
      relationshipTypeName: "Related",
      directional: false,
      role: "related" as const,
    };
    const outsideEdge = {
      ...edge,
      bookmark: {
        id: "outside",
        url: null,
        title: "Outside",
      },
    };
    const a = makeBookmark({
      id: "a",
      relationships: [edge, outsideEdge] as never,
    });
    const b = makeBookmark({
      id: "b",
    });
    const summary = associationSummary([a, b]);
    expect(summary).toEqual([{
      label: "Related bookmarks",
      count: 1,
    }]);
  });
});
