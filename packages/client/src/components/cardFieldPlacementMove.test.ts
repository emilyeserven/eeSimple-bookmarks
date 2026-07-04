// @vitest-environment node
import type { CardFieldPlacement } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { carryOverPlacement } from "./cardFieldPlacementMove";

describe("carryOverPlacement", () => {
  it("returns a bare placement when there is no previous placement", () => {
    expect(carryOverPlacement("tags", undefined, false)).toEqual({
      key: "tags",
    });
  });

  it("carries the boolean per-field knobs across a body-zone move but omits image scale", () => {
    const existing: CardFieldPlacement = {
      key: "done",
      scale: 2,
      mobileScale: 1,
      hideLabel: true,
      showIfFalse: true,
      showValueBeforeLabel: true,
    };
    const result = carryOverPlacement("done", existing, false);
    expect(result).toEqual({
      key: "done",
      hideLabel: true,
      showIfFalse: true,
      showValueBeforeLabel: true,
    });
    // A body zone must not carry the image-overlay scale.
    expect(result).not.toHaveProperty("scale");
    expect(result).not.toHaveProperty("mobileScale");
  });

  it("carries the image scale (including undefined) into an image zone", () => {
    const result = carryOverPlacement("image", {
      key: "image",
      scale: 3,
    }, true);
    expect(result.scale).toBe(3);
    expect("mobileScale" in result).toBe(true);
    expect(result.mobileScale).toBeUndefined();
  });

  it("preserves an explicit showLabelColon=false but not the default true", () => {
    expect(carryOverPlacement("x", {
      key: "x",
      showLabelColon: false,
    }, false).showLabelColon).toBe(false);
    expect(carryOverPlacement("x", {
      key: "x",
      showLabelColon: true,
    }, false)).not.toHaveProperty("showLabelColon");
  });
});
