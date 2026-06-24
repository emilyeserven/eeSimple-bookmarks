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
