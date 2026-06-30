import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useExpandedSet } from "./useExpandedSet";

describe("useExpandedSet", () => {
  it("seeds from initialIds and toggles a single id on/off", () => {
    const {
      result,
    } = renderHook(() => useExpandedSet(["a"]));
    expect([...result.current.expanded]).toEqual(["a"]);
    act(() => result.current.onToggle("b"));
    expect(result.current.expanded.has("b")).toBe(true);
    act(() => result.current.onToggle("a"));
    expect(result.current.expanded.has("a")).toBe(false);
  });

  it("expandAll replaces the set, collapsing anything not in the list", () => {
    const {
      result,
    } = renderHook(() => useExpandedSet(["a", "b"]));
    act(() => result.current.expandAll(["c", "d"]));
    expect([...result.current.expanded].sort()).toEqual(["c", "d"]);
  });

  it("expandMany unions ids in without collapsing other open branches", () => {
    const {
      result,
    } = renderHook(() => useExpandedSet(["a"]));
    act(() => result.current.expandMany(["b", "c"]));
    expect([...result.current.expanded].sort()).toEqual(["a", "b", "c"]);
    // Re-applying overlapping ids is idempotent.
    act(() => result.current.expandMany(["a", "b"]));
    expect([...result.current.expanded].sort()).toEqual(["a", "b", "c"]);
  });

  it("collapseAll empties the set", () => {
    const {
      result,
    } = renderHook(() => useExpandedSet(["a", "b"]));
    act(() => result.current.collapseAll());
    expect(result.current.expanded.size).toBe(0);
  });
});
