// @vitest-environment node
import { describe, expect, it } from "vitest";

import { effectiveCascadeIds, pruneCascadeIds, toggleCascadeId } from "./conditionCascade";

describe("effectiveCascadeIds", () => {
  it("returns the stored set verbatim when present", () => {
    expect(effectiveCascadeIds(["a", "b"], ["a"], true)).toEqual(["a"]);
    expect(effectiveCascadeIds(["a", "b"], [], false)).toEqual([]);
  });

  it("legacy (undefined): tags/locations fall back to cascade-all, media/genre to exact", () => {
    expect(effectiveCascadeIds(["a", "b"], undefined, true)).toEqual(["a", "b"]);
    expect(effectiveCascadeIds(["a", "b"], undefined, false)).toEqual([]);
  });
});

describe("toggleCascadeId", () => {
  it("adds an id not currently cascading", () => {
    expect(toggleCascadeId(["a", "b"], [], "a", false)).toEqual(["a"]);
  });

  it("removes an id currently cascading", () => {
    expect(toggleCascadeId(["a", "b"], ["a", "b"], "a", false)).toEqual(["b"]);
  });

  it("materializes from the legacy cascade-all default on first toggle (tags)", () => {
    // undefined + legacyCascade → effective is all selected; toggling one off leaves the rest.
    expect(toggleCascadeId(["a", "b"], undefined, "a", true).sort()).toEqual(["b"]);
  });
});

describe("pruneCascadeIds", () => {
  it("keeps a legacy (undefined) set undefined so selection changes don't flip semantics", () => {
    expect(pruneCascadeIds(undefined, ["a"])).toBeUndefined();
  });

  it("drops cascade ids that are no longer selected", () => {
    expect(pruneCascadeIds(["a", "b"], ["a"])).toEqual(["a"]);
    expect(pruneCascadeIds(["a"], [])).toEqual([]);
  });
});
