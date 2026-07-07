// @vitest-environment node
import type { MapDebugInput } from "./locationMapDebug";
import type { LocationBoundary, LocationNode, PlaceTypeLevelGroup } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildLayersDebug, buildMapDebugInfo } from "./locationMapDebug";

function node(overrides: Partial<LocationNode> & Pick<LocationNode, "id">): LocationNode {
  return {
    name: overrides.id,
    slug: overrides.id,
    description: null,
    alternateNames: [],
    latitude: null,
    longitude: null,
    mapUrl: null,
    plusCode: null,
    placeType: null,
    countryCode: null,
    wikidataId: null,
    usesWikidataCoordinates: false,
    officialLink: null,
    wikipediaLinkEn: null,
    wikipediaLinkLocal: null,
    sortOrder: 0,
    parentId: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    labeledWebsites: [],
    children: [],
    ...overrides,
  };
}

const squareBoundary: LocationBoundary = {
  type: "Polygon",
  coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
};

function baseInput(tree: LocationNode[], overrides: Partial<MapDebugInput> = {}): MapDebugInput {
  return {
    tree,
    displayConfig: {},
    iconConfig: {},
    colorConfig: {},
    minAreaKm2: 0,
    pinScale: 1,
    hideAdminBorders: false,
    className: "h-96",
    seedView: null,
    ...overrides,
  };
}

describe("buildMapDebugInfo", () => {
  it("flags a node with neither a coordinate nor a boundary as no-geometry", () => {
    const debug = buildMapDebugInfo(baseInput([node({
      id: "ghost",
    })]));
    expect(debug.summary.totalNodes).toBe(1);
    expect(debug.summary.rendered).toBe(0);
    expect(debug.summary.omittedNoGeometry).toBe(1);
    expect(debug.nodes[0].rendered).toBe(false);
    expect(debug.nodes[0].hiddenReason).toBe("no-geometry");
  });

  it("renders a pin for a coordinate-only node and an area for a boundary node", () => {
    const debug = buildMapDebugInfo(baseInput([
      node({
        id: "pin",
        latitude: 10,
        longitude: 20,
        placeType: "city",
      }),
      node({
        id: "area",
        boundary: squareBoundary,
        placeType: "region",
      }),
    ]));
    expect(debug.summary.renderedPins).toBe(1);
    expect(debug.summary.renderedAreas).toBe(1);
    const pin = debug.nodes.find(n => n.id === "pin");
    expect(pin?.renderKind).toBe("pin");
    expect(pin?.hasCoordinates).toBe(true);
    const area = debug.nodes.find(n => n.id === "area");
    expect(area?.renderKind).toBe("area");
    expect(area?.boundaryType).toBe("Polygon");
    expect(area?.boundaryAreaKm2).toBeGreaterThan(0);
  });

  it("counts a node hidden by its level's display config as hidden-by-level", () => {
    const debug = buildMapDebugInfo(baseInput(
      [node({
        id: "hidden",
        latitude: 1,
        longitude: 2,
        placeType: "city",
      })],
      {
        displayConfig: {
          city: {
            visible: false,
            displayMode: "pin",
            sortOrder: 0,
          },
        },
      },
    ));
    expect(debug.summary.hiddenByLevel).toBe(1);
    expect(debug.nodes[0].rendered).toBe(false);
    expect(debug.nodes[0].hiddenReason).toBe("hidden-by-level");
  });

  it("marks a rendered node with no place type using the needs-attention color reason", () => {
    const debug = buildMapDebugInfo(baseInput([
      node({
        id: "unclassified",
        latitude: 1,
        longitude: 2,
        placeType: null,
      }),
    ]));
    expect(debug.summary.noPlaceType).toBe(1);
    expect(debug.nodes[0].colorReason).toBe("no-place-type");
  });

  it("flattens nested children and records their depth", () => {
    const debug = buildMapDebugInfo(baseInput([
      node({
        id: "parent",
        latitude: 1,
        longitude: 2,
        children: [node({
          id: "child",
          latitude: 3,
          longitude: 4,
        })],
      }),
    ]));
    expect(debug.summary.totalNodes).toBe(2);
    expect(debug.nodes.find(n => n.id === "parent")?.depth).toBe(0);
    expect(debug.nodes.find(n => n.id === "child")?.depth).toBe(1);
  });

  it("passes through props, settings, viewport, and the layers overlay snapshot", () => {
    const debug = buildMapDebugInfo(baseInput([node({
      id: "x",
    })], {
      minAreaKm2: 5,
      pinScale: 1.5,
      hideAdminBorders: true,
      seedView: {
        center: [12, 34],
        zoom: 7,
      },
      layers: {
        scopeKind: "main",
        levelMode: null,
        hideAdminBorders: true,
        filterIds: [],
        onlyDirectRelatives: null,
        groups: [{
          id: "g1",
          name: "Country",
          sortOrder: 0,
          displayMode: "area",
          color: "#123456",
          placeTypes: ["country"],
          visible: true,
          disabled: false,
          populated: true,
        }],
      },
    }));
    expect(debug.settings).toEqual({
      minAreaKm2: 5,
      pinScale: 1.5,
    });
    expect(debug.props.hideAdminBorders).toBe(true);
    expect(debug.viewport).toEqual({
      seededFromPreviousView: true,
      center: [12, 34],
      zoom: 7,
    });
    expect(debug.layers?.groups[0].color).toBe("#123456");
  });

  it("defaults the ancestry diagnostic to null when none is supplied", () => {
    const debug = buildMapDebugInfo(baseInput([node({
      id: "x",
    })]));
    expect(debug.ancestry).toBeNull();
  });

  it("passes the ancestry diagnostic through unchanged", () => {
    const debug = buildMapDebugInfo(baseInput([node({
      id: "leaf",
    })], {
      ancestry: {
        onlyDirectRelatives: false,
        treeLoaded: true,
        treeNodeCount: 12,
        nodeId: "leaf-id",
        nodeSlug: "leaf",
        parentId: null,
        foundInTree: true,
        ancestors: [],
      },
    }));
    expect(debug.ancestry).toEqual({
      onlyDirectRelatives: false,
      treeLoaded: true,
      treeNodeCount: 12,
      nodeId: "leaf-id",
      nodeSlug: "leaf",
      parentId: null,
      foundInTree: true,
      ancestors: [],
    });
  });
});

describe("buildLayersDebug", () => {
  const group: PlaceTypeLevelGroup = {
    id: "city",
    name: "City",
    placeTypes: ["city", "town"],
    displayMode: "pin",
    visible: true,
    sortOrder: 1,
    color: "#2563eb",
  };

  it("resolves each group's visible/disabled/populated state from the id sets", () => {
    const layers = buildLayersDebug({
      scopeKind: "location",
      levelMode: "current",
      hideAdminBorders: false,
      filterIds: ["a"],
      onlyDirectRelatives: true,
      groups: [group],
      visibleIds: new Set(["city"]),
      disabledIds: new Set(),
      populatedIds: new Set(["city"]),
    });
    expect(layers.groups[0]).toMatchObject({
      id: "city",
      color: "#2563eb",
      visible: true,
      disabled: false,
      populated: true,
    });
    expect(layers.filterIds).toEqual(["a"]);
    expect(layers.onlyDirectRelatives).toBe(true);
  });

  it("normalizes an absent group color to null", () => {
    const layers = buildLayersDebug({
      scopeKind: "main",
      levelMode: null,
      hideAdminBorders: true,
      filterIds: [],
      onlyDirectRelatives: null,
      groups: [{
        ...group,
        color: undefined,
      }],
      visibleIds: new Set(),
      disabledIds: new Set(["city"]),
      populatedIds: new Set(),
    });
    expect(layers.groups[0].color).toBeNull();
    expect(layers.groups[0].disabled).toBe(true);
  });
});
