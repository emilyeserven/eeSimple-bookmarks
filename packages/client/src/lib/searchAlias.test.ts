// @vitest-environment node
import type { EntityName } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildSearchAlias } from "./searchAlias";

function name(value: string): EntityName {
  return {
    value,
  } as EntityName;
}

describe("buildSearchAlias", () => {
  it("returns undefined for null or undefined input", () => {
    expect(buildSearchAlias(null)).toBeUndefined();
    expect(buildSearchAlias(undefined)).toBeUndefined();
  });

  it("returns undefined for an empty array", () => {
    expect(buildSearchAlias([])).toBeUndefined();
  });

  it("filters out blank/whitespace-only values", () => {
    expect(buildSearchAlias([name("Evangelion"), name("   "), name("")])).toBe("Evangelion");
  });

  it("dedupes duplicate values, preserving first-occurrence order", () => {
    expect(buildSearchAlias([
      name("Evangelion"),
      name("エヴァンゲリオン"),
      name("Evangelion"),
    ])).toBe("Evangelion エヴァンゲリオン");
  });

  it("trims values before joining", () => {
    expect(buildSearchAlias([name("  Evangelion  "), name(" エヴァンゲリオン ")]))
      .toBe("Evangelion エヴァンゲリオン");
  });

  it("returns undefined when every value is blank", () => {
    expect(buildSearchAlias([name(""), name("   ")])).toBeUndefined();
  });
});
