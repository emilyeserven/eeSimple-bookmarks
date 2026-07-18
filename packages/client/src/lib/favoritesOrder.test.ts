// @vitest-environment node
import { describe, expect, it } from "vitest";

import { sortFavoritesFirst } from "./favoritesOrder";

describe("sortFavoritesFirst", () => {
  it("moves favorites to the front, preserving relative order within each partition", () => {
    const items = [
      {
        id: "1",
      },
      {
        id: "2",
        isFavorite: true,
      },
      {
        id: "3",
      },
      {
        id: "4",
        isFavorite: true,
      },
    ];
    expect(sortFavoritesFirst(items).map(item => item.id)).toEqual(["2", "4", "1", "3"]);
  });

  it("treats an unset isFavorite flag as non-favorite", () => {
    const items = [
      {
        id: "1",
        isFavorite: false,
      },
      {
        id: "2",
      },
      {
        id: "3",
        isFavorite: true,
      },
    ];
    expect(sortFavoritesFirst(items).map(item => item.id)).toEqual(["3", "1", "2"]);
  });

  it("does not mutate the input array", () => {
    const items = [
      {
        id: "1",
      },
      {
        id: "2",
        isFavorite: true,
      },
    ];
    const original = [...items];
    sortFavoritesFirst(items);
    expect(items).toEqual(original);
  });
});
