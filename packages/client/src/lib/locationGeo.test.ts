import type { LocationBoundary } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { boundaryCentroid, boundaryContainsPoint } from "./locationGeo";

/** A 0..10 square (lng/lat) with a 4..6 square hole punched out of the middle. */
const SQUARE_WITH_HOLE: LocationBoundary = {
  type: "Polygon",
  coordinates: [
    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
    [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
  ],
};

/** Two disjoint 1x1 squares: one near the origin, one far away. */
const MULTI: LocationBoundary = {
  type: "MultiPolygon",
  coordinates: [
    [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
    [[[20, 20], [21, 20], [21, 21], [20, 21], [20, 20]]],
  ],
};

describe("boundaryContainsPoint", () => {
  it("returns true for a point inside a simple polygon", () => {
    expect(boundaryContainsPoint(2, 2, SQUARE_WITH_HOLE)).toBe(true);
  });

  it("returns false for a point outside the polygon", () => {
    expect(boundaryContainsPoint(15, 15, SQUARE_WITH_HOLE)).toBe(false);
  });

  it("returns false for a point inside a hole ring", () => {
    expect(boundaryContainsPoint(5, 5, SQUARE_WITH_HOLE)).toBe(false);
  });

  it("matches a point inside the second polygon of a MultiPolygon", () => {
    expect(boundaryContainsPoint(20.5, 20.5, MULTI)).toBe(true);
    expect(boundaryContainsPoint(0.5, 0.5, MULTI)).toBe(true);
    expect(boundaryContainsPoint(10, 10, MULTI)).toBe(false);
  });
});

describe("boundaryCentroid", () => {
  it("returns the center of a simple square as [lat, lng]", () => {
    const square: LocationBoundary = {
      type: "Polygon",
      coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
    };
    const centroid = boundaryCentroid(square);
    expect(centroid).not.toBeNull();
    expect(centroid?.[0]).toBeCloseTo(5);
    expect(centroid?.[1]).toBeCloseTo(5);
  });

  it("area-weights the centroid across a MultiPolygon's parts", () => {
    // A large square near the origin and a tiny square far away — the centroid should sit much
    // closer to the large part than a naive unweighted average of the two centers would.
    const multi: LocationBoundary = {
      type: "MultiPolygon",
      coordinates: [
        [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        [[[100, 100], [101, 100], [101, 101], [100, 101], [100, 100]]],
      ],
    };
    const centroid = boundaryCentroid(multi);
    expect(centroid).not.toBeNull();
    expect(centroid?.[0]).toBeLessThan(10);
    expect(centroid?.[1]).toBeLessThan(10);
  });

  it("returns null for a degenerate (zero-area) boundary", () => {
    const degenerate: LocationBoundary = {
      type: "Polygon",
      coordinates: [[[0, 0], [0, 0], [0, 0]]],
    };
    expect(boundaryCentroid(degenerate)).toBeNull();
  });
});
