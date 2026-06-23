import type { CustomAspectRatio } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildAspectOptions } from "./aspectOptions";

describe("buildAspectOptions", () => {
  it("returns the four built-ins with the cropped ratio in its label", () => {
    const options = buildAspectOptions(16, 9, []);
    expect(options).toEqual([
      {
        value: "natural",
        label: "Natural",
      },
      {
        value: "square",
        label: "Square (1:1)",
      },
      {
        value: "opengraph",
        label: "OpenGraph (1.91:1)",
      },
      {
        value: "cropped",
        label: "Cropped (16:9)",
      },
    ]);
  });

  it("appends one option per saved custom ratio, keyed by id", () => {
    const custom: CustomAspectRatio[] = [
      {
        id: "ratio-1",
        name: "Banner",
        width: 3,
        height: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const options = buildAspectOptions(4, 3, custom);
    expect(options).toHaveLength(5);
    expect(options[4]).toEqual({
      value: "ratio-1",
      label: "Banner (3:1)",
    });
  });
});
