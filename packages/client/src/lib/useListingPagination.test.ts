import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useListingPagination } from "./useListingPagination";

const items = Array.from({
  length: 55,
}, (_, i) => i);

describe("useListingPagination", () => {
  it("slices the first page and reports the range", () => {
    const {
      result,
    } = renderHook(() => useListingPagination(items, 25, "key"));
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.pageItems).toEqual(items.slice(0, 25));
    expect(result.current.total).toBe(55);
    expect(result.current.rangeStart).toBe(1);
    expect(result.current.rangeEnd).toBe(25);
  });

  it("slices later pages, including a partial final page", () => {
    const {
      result,
    } = renderHook(() => useListingPagination(items, 25, "key"));
    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);
    expect(result.current.pageItems).toEqual(items.slice(50, 55));
    expect(result.current.rangeStart).toBe(51);
    expect(result.current.rangeEnd).toBe(55);
  });

  it("clamps a page beyond the range to the last page", () => {
    const {
      result,
    } = renderHook(() => useListingPagination(items, 25, "key"));
    act(() => result.current.setPage(99));
    expect(result.current.page).toBe(3);
    expect(result.current.pageItems).toEqual(items.slice(50, 55));
  });

  it("resets to page 1 when the reset key changes", () => {
    const {
      result,
      rerender,
    } = renderHook(
      ({
        key,
      }: { key: string }) => useListingPagination(items, 25, key),
      {
        initialProps: {
          key: "a",
        },
      },
    );
    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);
    rerender({
      key: "b",
    });
    expect(result.current.page).toBe(1);
  });

  it("reports one page and a zeroed range when empty", () => {
    const {
      result,
    } = renderHook(() => useListingPagination([] as number[], 25, "key"));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.pageItems).toEqual([]);
    expect(result.current.rangeStart).toBe(0);
    expect(result.current.rangeEnd).toBe(0);
  });
});
