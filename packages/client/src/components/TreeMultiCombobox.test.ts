// @vitest-environment node
import type { TreeComboboxOption } from "./TreeMultiCombobox";

import { describe, expect, it } from "vitest";

import { ancestorIdsForSelected, filterTreeByTerm } from "./treeExpansion";

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

describe("filterTreeByTerm", () => {
  it("keeps a matching leaf's full ancestor chain, pruning unrelated branches", () => {
    const filtered = filterTreeByTerm(tree, "fukuoka");
    expect(filtered).toEqual([
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
        ],
      },
    ]);
  });

  it("keeps a matching parent without pulling in its non-matching descendants", () => {
    const filtered = filterTreeByTerm(tree, "japan");
    expect(filtered).toEqual([
      {
        value: "places",
        label: "Places",
        children: [{
          value: "japan",
          label: "Japan",
        }],
      },
    ]);
  });

  it("keeps every branch with a match, not just the first", () => {
    const filtered = filterTreeByTerm(tree, "busan");
    expect(filtered).toEqual([
      {
        value: "places",
        label: "Places",
        children: [
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
    ]);
  });

  it("matches against searchAlias as well as label", () => {
    const withAlias: TreeComboboxOption[] = [
      {
        value: "seoul",
        label: "Seoul",
        searchAlias: "서울",
      },
      {
        value: "busan",
        label: "Busan",
        searchAlias: "부산",
      },
    ];
    expect(filterTreeByTerm(withAlias, "서울")).toEqual([
      {
        value: "seoul",
        label: "Seoul",
        searchAlias: "서울",
      },
    ]);
  });

  it("returns no nodes when nothing matches", () => {
    expect(filterTreeByTerm(tree, "nonexistent")).toEqual([]);
  });

  it("returns the tree unchanged for a blank term", () => {
    expect(filterTreeByTerm(tree, "  ")).toBe(tree);
  });
});
