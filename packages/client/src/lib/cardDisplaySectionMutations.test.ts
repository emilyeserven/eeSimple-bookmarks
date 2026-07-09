// @vitest-environment node
import type { CardDisplayFields } from "./cardDisplaySectionMutations";
import type { CardDisplaySection, ConditionTree } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { emptyCardImageCorners } from "@eesimple/types";

import {
  addCardSection,
  moveCardField,
  moveCardSection,
  patchFieldPlacement,
  placedFieldKeys,
  removeSection,
  renameCardSection,
  setSectionForm,
  setSectionLayout,
  setCardSectionVisibility,
} from "./cardDisplaySectionMutations";

function section(key: string, fieldKeys: string[]): CardDisplaySection {
  return {
    key,
    title: key,
    form: "inline",
    layout: {
      mode: "flex",
    },
    fields: fieldKeys.map(k => ({
      key: k,
    })),
  };
}

function fields(sections: CardDisplaySection[]): CardDisplayFields {
  return {
    sections,
    imageCorners: emptyCardImageCorners(),
  };
}

const tree: ConditionTree = {
  type: "group",
  combinator: "and",
  children: [{
    type: "media-type",
    mediaTypeIds: ["mt-1"],
  }],
};

describe("card display section mutations", () => {
  it("addCardSection appends a stacked/flex section with a stable unique key", () => {
    const next = addCardSection([section("a", [])]);
    expect(next).toHaveLength(2);
    expect(next[1].form).toBe("stacked");
    expect(next[1].layout.mode).toBe("flex");
    expect(next[1].key).not.toBe("a");
  });

  it("renameCardSection changes only the title", () => {
    expect(renameCardSection([section("a", ["title"])], "a", "Header")[0].title).toBe("Header");
  });

  it("setSectionForm / setSectionLayout update the render form + layout", () => {
    const s = setSectionForm([section("a", [])], "a", "table");
    expect(s[0].form).toBe("table");
    const s2 = setSectionLayout(s, "a", {
      mode: "grid",
      gap: "lg",
    });
    expect(s2[0].layout).toEqual({
      mode: "grid",
      gap: "lg",
    });
  });

  it("setCardSectionVisibility sets a non-empty tree and clears an empty one", () => {
    const withTree = setCardSectionVisibility([section("a", [])], "a", tree);
    expect(withTree[0].visibleIf).toEqual(tree);
    const cleared = setCardSectionVisibility(withTree, "a", {
      type: "group",
      combinator: "and",
      children: [],
    });
    expect(cleared[0].visibleIf).toBeUndefined();
  });

  it("moveCardSection swaps order and no-ops at the boundary", () => {
    const list = [section("a", []), section("b", [])];
    expect(moveCardSection(list, "a", 1).map(s => s.key)).toEqual(["b", "a"]);
    expect(moveCardSection(list, "a", -1).map(s => s.key)).toEqual(["a", "b"]);
  });

  it("moveCardField relocates a field between sections and preserves its knobs", () => {
    const value = fields([
      {
        ...section("a", []),
        fields: [{
          key: "title",
          hideLabel: true,
        }],
      },
      section("b", []),
    ]);
    const next = moveCardField(value, "title", {
      type: "section",
      key: "b",
    });
    expect(next.sections[0].fields).toHaveLength(0);
    expect(next.sections[1].fields).toEqual([{
      key: "title",
      hideLabel: true,
    }]);
  });

  it("moveCardField to a corner and to the tray", () => {
    const value = fields([section("a", ["title"])]);
    const toCorner = moveCardField(value, "title", {
      type: "corner",
      corner: "top-left",
    });
    expect(toCorner.imageCorners["top-left"].map(f => f.key)).toEqual(["title"]);
    expect(toCorner.sections[0].fields).toHaveLength(0);
    const toTray = moveCardField(value, "title", {
      type: "tray",
    });
    expect(placedFieldKeys(toTray).has("title")).toBe(false);
  });

  it("patchFieldPlacement updates a field's knobs in place", () => {
    const value = fields([section("a", ["title"])]);
    const next = patchFieldPlacement(value, "title", {
      hideLabel: true,
    });
    expect(next.sections[0].fields[0]).toEqual({
      key: "title",
      hideLabel: true,
    });
  });

  it("removeSection drops the section (its fields return to the tray)", () => {
    const value = fields([section("a", ["title"]), section("b", ["tags"])]);
    const next = {
      ...value,
      sections: removeSection(value.sections, "a"),
    };
    expect(next.sections.map(s => s.key)).toEqual(["b"]);
    expect(placedFieldKeys(next).has("title")).toBe(false);
  });
});
