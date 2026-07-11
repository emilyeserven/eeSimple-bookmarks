// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import { useBasketStore } from "./basketStore";

afterEach(() => {
  useBasketStore.getState().clear();
});

describe("basketStore.add", () => {
  it("adds an id and is a no-op when already present", () => {
    useBasketStore.getState().add("a");
    useBasketStore.getState().add("a");
    expect(useBasketStore.getState().bookmarkIds).toEqual(["a"]);
  });

  it("preserves insertion order", () => {
    useBasketStore.getState().add("a");
    useBasketStore.getState().add("b");
    useBasketStore.getState().add("c");
    expect(useBasketStore.getState().bookmarkIds).toEqual(["a", "b", "c"]);
  });
});

describe("basketStore.addMany", () => {
  it("appends only the not-yet-present ids, deduped", () => {
    useBasketStore.getState().add("a");
    useBasketStore.getState().addMany(["a", "b", "b", "c"]);
    expect(useBasketStore.getState().bookmarkIds).toEqual(["a", "b", "c"]);
  });
});

describe("basketStore.remove", () => {
  it("removes the given id and leaves the rest", () => {
    useBasketStore.getState().addMany(["a", "b", "c"]);
    useBasketStore.getState().remove("b");
    expect(useBasketStore.getState().bookmarkIds).toEqual(["a", "c"]);
  });
});

describe("basketStore.toggle", () => {
  it("adds when absent and removes when present", () => {
    useBasketStore.getState().toggle("a");
    expect(useBasketStore.getState().bookmarkIds).toEqual(["a"]);
    useBasketStore.getState().toggle("a");
    expect(useBasketStore.getState().bookmarkIds).toEqual([]);
  });
});

describe("basketStore.clear", () => {
  it("empties the basket", () => {
    useBasketStore.getState().addMany(["a", "b"]);
    useBasketStore.getState().clear();
    expect(useBasketStore.getState().bookmarkIds).toEqual([]);
  });
});
