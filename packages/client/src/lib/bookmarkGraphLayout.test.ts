// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  clampZoom,
  IDENTITY_TRANSFORM,
  MAX_ZOOM,
  MIN_ZOOM,
  panBy,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  zoomAtPoint,
} from "./bookmarkGraphLayout";

describe("clampZoom", () => {
  it("passes values inside the range through", () => {
    expect(clampZoom(1)).toBe(1);
    expect(clampZoom(2.5)).toBe(2.5);
  });

  it("clamps to the min and max bounds", () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM);
    expect(clampZoom(100)).toBe(MAX_ZOOM);
  });
});

describe("zoomAtPoint", () => {
  const center = {
    x: VIEW_WIDTH / 2,
    y: VIEW_HEIGHT / 2,
  };

  it("scales the transform by the factor", () => {
    const next = zoomAtPoint(IDENTITY_TRANSFORM, 2, center);
    expect(next.k).toBe(2);
  });

  it("keeps the focus point fixed in viewBox space", () => {
    const focus = {
      x: 300,
      y: 200,
    };
    // screen position of a viewBox point = t + k * point? No — focus is already in viewBox space,
    // so the invariant is that the focus maps to itself: applying the transform to the content
    // point currently under `focus` yields `focus` again both before and after the zoom.
    const before = IDENTITY_TRANSFORM;
    const contentUnderFocus = {
      x: (focus.x - before.tx) / before.k,
      y: (focus.y - before.ty) / before.k,
    };
    const after = zoomAtPoint(before, 1.7, focus);
    const screenAfter = {
      x: after.tx + after.k * contentUnderFocus.x,
      y: after.ty + after.k * contentUnderFocus.y,
    };
    expect(screenAfter.x).toBeCloseTo(focus.x, 6);
    expect(screenAfter.y).toBeCloseTo(focus.y, 6);
  });

  it("keeps the focus fixed even from a non-identity starting transform", () => {
    const start = {
      k: 1.5,
      tx: 40,
      ty: -30,
    };
    const focus = {
      x: 500,
      y: 100,
    };
    const contentUnderFocus = {
      x: (focus.x - start.tx) / start.k,
      y: (focus.y - start.ty) / start.k,
    };
    const after = zoomAtPoint(start, 0.5, focus);
    expect(after.tx + after.k * contentUnderFocus.x).toBeCloseTo(focus.x, 6);
    expect(after.ty + after.k * contentUnderFocus.y).toBeCloseTo(focus.y, 6);
  });

  it("respects the zoom bounds", () => {
    const zoomedOut = zoomAtPoint(IDENTITY_TRANSFORM, 0.001, center);
    expect(zoomedOut.k).toBe(MIN_ZOOM);
    const zoomedIn = zoomAtPoint(IDENTITY_TRANSFORM, 1000, center);
    expect(zoomedIn.k).toBe(MAX_ZOOM);
  });
});

describe("panBy", () => {
  it("adds the delta to the translation and leaves the scale untouched", () => {
    const start = {
      k: 1.5,
      tx: 10,
      ty: 20,
    };
    expect(panBy(start, 5, -8)).toEqual({
      k: 1.5,
      tx: 15,
      ty: 12,
    });
  });
});
