// @vitest-environment node
import type { TreeComboboxOption } from "./TreeMultiCombobox";

import { describe, expect, it } from "vitest";

import { ancestorIdsForSelected } from "./treeExpansion";

/** Places > { Japan > Kyushu > Fukuoka, Korea > Busan }. */
const tree: TreeComboboxOption[] = [
  {
    value: "places",
    label: "Places",
    children: [
      {
        value: "japan",
        label: "Japan",
        children: [
          {
            value: "kyushu",
            label: "Kyushu",
            children: [{
              value: "fukuoka",
              label: "Fukuoka",
            }],
          },
        ],
      },
      {
        value: "korea",
        label: "Korea",
        children: [{
          value: "busan",
          label: "Busan",
        }],
      },
    ],
  },
];

describe("ancestorIdsForSelected", () => {
  it("expands every branch that contains a selected item, not just the first", () => {
    const ancestors = ancestorIdsForSelected(tree, new Set(["fukuoka", "busan"]));
    // Both the Japan→Kyushu chain and the Korea chain must be present.
    expect([...ancestors].sort()).toEqual(["japan", "korea", "kyushu", "places"]);
  });

  it("returns no ancestors when nothing is selected", () => {
    expect(ancestorIdsForSelected(tree, new Set()).size).toBe(0);
  });

  it("includes only the ancestors of the selected item", () => {
    expect([...ancestorIdsForSelected(tree, new Set(["busan"]))].sort()).toEqual([
      "korea",
      "places",
    ]);
  });
});
