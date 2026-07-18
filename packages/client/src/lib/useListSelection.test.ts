import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useListSelection } from "./useListSelection";

import { useUiStore } from "@/stores/uiStore";

afterEach(() => {
  useUiStore.setState({
    selection: {},
    selectionMode: {},
  });
});

describe("useListSelection", () => {
  it("toggles ids on and off", () => {
    const {
      result,
    } = renderHook(() => useListSelection("page", ["a", "b", "c"]));
    act(() => result.current.toggle("a"));
    expect(result.current.selectedIds).toEqual(["a"]);
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.count).toBe(1);
    act(() => result.current.toggle("a"));
    expect(result.current.selectedIds).toEqual([]);
  });

  it("selectAll selects every allId; allSelected reflects it; clear empties", () => {
    const {
      result,
    } = renderHook(() => useListSelection("page", ["a", "b"]));
    act(() => result.current.selectAll());
    expect(result.current.selectedIds).toEqual(["a", "b"]);
    expect(result.current.allSelected).toBe(true);
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
    expect(result.current.allSelected).toBe(false);
  });

  it("keeps selection independent per page key", () => {
    const a = renderHook(() => useListSelection("page-a", ["x"]));
    const b = renderHook(() => useListSelection("page-b", ["y"]));
    act(() => a.result.current.toggle("x"));
    expect(a.result.current.selectedIds).toEqual(["x"]);
    expect(b.result.current.selectedIds).toEqual([]);
  });

  it("selectRange adds the inclusive range between the anchor and the target, additively", () => {
    const {
      result,
    } = renderHook(() => useListSelection("page", ["a", "b", "c", "d", "e"]));
    // First plain toggle sets the anchor at "b".
    act(() => result.current.toggle("b"));
    // Shift-click "d" selects b..d without clearing the existing selection.
    act(() => result.current.selectRange("d"));
    expect(result.current.selectedIds).toEqual(["b", "c", "d"]);
  });

  it("selectRange works upward (target before anchor) and keeps the anchor for re-ranging", () => {
    const {
      result,
    } = renderHook(() => useListSelection("page", ["a", "b", "c", "d", "e"]));
    act(() => result.current.toggle("d"));
    act(() => result.current.selectRange("b"));
    expect(new Set(result.current.selectedIds)).toEqual(new Set(["b", "c", "d"]));
    // Re-range from the same anchor "d" to a nearer target shrinks the intent but stays additive.
    act(() => result.current.selectRange("e"));
    expect(new Set(result.current.selectedIds)).toEqual(new Set(["b", "c", "d", "e"]));
  });

  it("selectRange falls back to a toggle when there is no anchor yet", () => {
    const {
      result,
    } = renderHook(() => useListSelection("page", ["a", "b", "c"]));
    act(() => result.current.selectRange("b"));
    expect(result.current.selectedIds).toEqual(["b"]);
  });

  it("selectRange falls back to a toggle when the anchor scrolled out of the visible set", () => {
    const {
      result, rerender,
    } = renderHook(({
      ids,
    }) => useListSelection("page", ids), {
      initialProps: {
        ids: ["a", "b", "c"],
      },
    });
    act(() => result.current.toggle("a"));
    // "a" leaves the visible set (e.g. filtered away); a shift-click can't range from it.
    rerender({
      ids: ["b", "c", "d"],
    });
    act(() => result.current.selectRange("c"));
    expect(result.current.selectedIds).toEqual(["a", "c"]);
  });

  it("clear resets the anchor so the next selectRange toggles instead of ranging", () => {
    const {
      result,
    } = renderHook(() => useListSelection("page", ["a", "b", "c"]));
    act(() => result.current.toggle("a"));
    act(() => result.current.clear());
    act(() => result.current.selectRange("c"));
    expect(result.current.selectedIds).toEqual(["c"]);
  });

  it("turning selection mode off clears the page's selection", () => {
    const {
      result,
    } = renderHook(() => useListSelection("page", ["a"]));
    act(() => result.current.setMode(true));
    act(() => result.current.toggle("a"));
    expect(result.current.count).toBe(1);
    act(() => result.current.setMode(false));
    expect(result.current.mode).toBe(false);
    expect(result.current.count).toBe(0);
  });
});
