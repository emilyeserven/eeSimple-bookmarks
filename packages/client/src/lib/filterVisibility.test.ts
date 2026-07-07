// @vitest-environment node
import type { TagNode } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { computeFacetData, computeFilterVisibility } from "./filterVisibility";
import { makeCategory, makeCustomProperty, makeTag } from "../test-utils/factories";

const tagNode: TagNode = {
  ...makeTag(),
  children: [],
};

describe("computeFacetData", () => {
  it("reports presence per facet from the raw inputs", () => {
    const data = computeFacetData({
      tree: [tagNode],
      properties: [makeCustomProperty({
        type: "sections",
        enabled: true,
      })],
      categories: [makeCategory()],
    });
    expect(data.tags).toBe(true);
    expect(data.categories).toBe(true);
    expect(data.sections).toBe(true);
    // Facets with no data (undefined or empty) are absent.
    expect(data["media-types"]).toBe(false);
    expect(data.websites).toBe(false);
  });

  it("reports the Genres & Moods facet from its input list", () => {
    const empty = computeFacetData({
      tree: [],
      properties: [],
    });
    expect(empty["genre-moods"]).toBe(false);
    const withData = computeFacetData({
      tree: [],
      properties: [],
      genreMoods: [{
        id: "gm-1",
        name: "Sci-Fi",
        slug: "sci-fi",
        description: null,
        parentId: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      }],
    });
    expect(withData["genre-moods"]).toBe(true);
  });

  it("ignores disabled properties for the sections facet", () => {
    const data = computeFacetData({
      tree: [],
      properties: [makeCustomProperty({
        type: "sections",
        enabled: false,
      })],
    });
    expect(data.sections).toBe(false);
  });
});

describe("computeFilterVisibility", () => {
  it("shows facets with data when nothing is on-demand", () => {
    const result = computeFilterVisibility(
      {
        tree: [tagNode],
        properties: [],
        categories: [makeCategory()],
      },
      {},
      [],
      new Set(),
    );
    expect(result.hasFilters).toBe(true);
    expect(result.facetVisible.tags).toBe(true);
    expect(result.facetVisible.categories).toBe(true);
    // No data → not visible even though not on-demand.
    expect(result.facetVisible.websites).toBe(false);
    expect(result.addableFilters).toEqual([]);
  });

  it("hides an on-demand facet and offers it in the Add-filter menu", () => {
    const result = computeFilterVisibility(
      {
        tree: [tagNode],
        properties: [],
      },
      {},
      ["tags"],
      new Set(),
    );
    expect(result.facetVisible.tags).toBe(false);
    expect(result.addableFilters).toEqual([{
      key: "tags",
      label: "Tags",
    }]);
  });

  it("reveals an on-demand facet once added this session", () => {
    const result = computeFilterVisibility(
      {
        tree: [tagNode],
        properties: [],
      },
      {},
      ["tags"],
      new Set(["tags"]),
    );
    expect(result.facetVisible.tags).toBe(true);
    expect(result.addableFilters).toEqual([]);
  });

  it("always shows an on-demand facet with an active selection (deep links never disappear)", () => {
    const result = computeFilterVisibility(
      {
        tree: [tagNode],
        properties: [],
      },
      {
        tags: ["tag"],
      },
      ["tags"],
      new Set(),
    );
    expect(result.facetVisible.tags).toBe(true);
    expect(result.addableFilters).toEqual([]);
  });

  it("filters properties to enabled + revealed and offers hidden on-demand ones", () => {
    const shown = makeCustomProperty({
      id: "p1",
      name: "Rating",
      enabled: true,
    });
    const onDemandProp = makeCustomProperty({
      id: "p2",
      name: "Pages",
      enabled: true,
    });
    const disabled = makeCustomProperty({
      id: "p3",
      enabled: false,
    });
    const result = computeFilterVisibility(
      {
        tree: [],
        properties: [shown, onDemandProp, disabled],
      },
      {},
      ["p2"],
      new Set(),
    );
    expect(result.visibleProperties.map(p => p.id)).toEqual(["p1"]);
    expect(result.addableFilters).toEqual([{
      key: "p2",
      label: "Pages",
    }]);
    // Enabled properties count toward hasFilters even when hidden.
    expect(result.hasFilters).toBe(true);
  });

  it("reports no filters when there is no data at all", () => {
    const result = computeFilterVisibility(
      {
        tree: [],
        properties: [],
      },
      {},
      [],
      new Set(),
    );
    expect(result.hasFilters).toBe(false);
    expect(result.addableFilters).toEqual([]);
  });
});
