// @vitest-environment node
import type { EntityListingConfig } from "../entities/types";

import { describe, expect, it } from "vitest";

import { partitionListingSections } from "./listingSections";

interface Item {
  id: string;
  count: number;
}

const item = (id: string, count: number): Item => ({
  id,
  count,
});

type Sections = EntityListingConfig<Item>["sections"];

const usedUnused: Sections = [
  {
    key: "in-use",
    match: i => i.count > 0,
  },
  {
    key: "unused",
    title: "Unused",
    match: i => i.count === 0,
  },
];

describe("partitionListingSections", () => {
  it("returns one untitled group holding all items when no sections are given", () => {
    const items = [item("a", 1), item("b", 0)];
    const groups = partitionListingSections(items, undefined);
    expect(groups).toEqual([{
      key: "__all__",
      items,
    }]);
  });

  it("assigns each item to the first matching section and preserves order", () => {
    const items = [item("a", 2), item("b", 0), item("c", 5), item("d", 0)];
    const groups = partitionListingSections(items, usedUnused);
    expect(groups.map(g => g.key)).toEqual(["in-use", "unused"]);
    expect(groups[0].items.map(i => i.id)).toEqual(["a", "c"]);
    expect(groups[1].items.map(i => i.id)).toEqual(["b", "d"]);
    expect(groups[0].title).toBeUndefined();
    expect(groups[1].title).toBe("Unused");
  });

  it("drops empty groups so their heading never renders", () => {
    const groups = partitionListingSections([item("a", 3), item("b", 1)], usedUnused);
    expect(groups.map(g => g.key)).toEqual(["in-use"]);
  });

  it("drops items that match no section", () => {
    const sections: Sections = [{
      key: "positive",
      match: i => i.count > 0,
    }];
    const groups = partitionListingSections([item("a", 1), item("b", 0)], sections);
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map(i => i.id)).toEqual(["a"]);
  });
});
