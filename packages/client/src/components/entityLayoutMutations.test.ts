// @vitest-environment node
import type { EntityLayout } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import {
  addSection,
  addTab,
  deleteSection,
  deleteTab,
  makeContainerKey,
  moveField,
  moveSection,
  moveTab,
  renameSection,
  renameTab,
  setTabIcon,
} from "./entityLayoutMutations";

/** A two-tab layout: general(main[a,b] / meta[c]) + advanced(danger[d]). */
function sampleLayout(): EntityLayout {
  return {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [
          {
            key: "main",
            title: "Main",
            fields: ["a", "b"],
          },
          {
            key: "meta",
            fields: ["c"],
          },
        ],
      },
      {
        key: "advanced",
        label: "Advanced",
        sections: [{
          key: "danger",
          fields: ["d"],
        }],
      },
    ],
  };
}

/** The field keys held by section `sectionKey` of tab `tabKey`. */
function fieldsIn(layout: EntityLayout, tabKey: string, sectionKey: string): string[] | undefined {
  return layout.tabs
    .find(tab => tab.key === tabKey)?.sections
    .find(section => section.key === sectionKey)?.fields;
}

/** Every field key placed anywhere in the layout. */
function allPlaced(layout: EntityLayout): string[] {
  return layout.tabs.flatMap(tab => tab.sections.flatMap(section => section.fields));
}

describe("makeContainerKey", () => {
  it("slugifies the base when it is free", () => {
    expect(makeContainerKey("My Tab", new Set())).toBe("my-tab");
  });

  it("suffixes -2, -3… past collisions", () => {
    expect(makeContainerKey("Main", new Set(["main"]))).toBe("main-2");
    expect(makeContainerKey("Main", new Set(["main", "main-2"]))).toBe("main-3");
  });

  it("falls back when the slug is empty", () => {
    expect(makeContainerKey("   ", new Set(), "tab")).toBe("tab");
    expect(makeContainerKey("!!!", new Set(["item"]))).toBe("item-2");
  });
});

describe("moveField", () => {
  it("relocates a field into another section, appending by default", () => {
    const next = moveField(sampleLayout(), "a", {
      tabKey: "general",
      sectionKey: "meta",
    });
    expect(fieldsIn(next, "general", "main")).toEqual(["b"]);
    expect(fieldsIn(next, "general", "meta")).toEqual(["c", "a"]);
  });

  it("inserts at a clamped index", () => {
    const next = moveField(sampleLayout(), "c", {
      tabKey: "general",
      sectionKey: "main",
    }, 1);
    expect(fieldsIn(next, "general", "main")).toEqual(["a", "c", "b"]);
    const clamped = moveField(sampleLayout(), "c", {
      tabKey: "general",
      sectionKey: "main",
    }, 99);
    expect(fieldsIn(clamped, "general", "main")).toEqual(["a", "b", "c"]);
  });

  it("moves a field across tabs", () => {
    const next = moveField(sampleLayout(), "a", {
      tabKey: "advanced",
      sectionKey: "danger",
    });
    expect(fieldsIn(next, "general", "main")).toEqual(["b"]);
    expect(fieldsIn(next, "advanced", "danger")).toEqual(["d", "a"]);
  });

  it("removes a field from the layout when the target is null (→ tray)", () => {
    const next = moveField(sampleLayout(), "a", null);
    expect(allPlaced(next)).toEqual(["b", "c", "d"]);
  });

  it("does not mutate the input layout", () => {
    const layout = sampleLayout();
    moveField(layout, "a", null);
    expect(fieldsIn(layout, "general", "main")).toEqual(["a", "b"]);
  });
});

describe("addTab / addSection", () => {
  it("appends a tab with one empty section and a unique key", () => {
    const next = addTab(sampleLayout(), "General");
    expect(next.tabs).toHaveLength(3);
    const added = next.tabs[2];
    expect(added.key).toBe("general-2");
    expect(added.label).toBe("General");
    expect(added.sections).toEqual([{
      key: "section",
      fields: [],
    }]);
  });

  it("appends a section with a unique key, titled when given", () => {
    const next = addSection(sampleLayout(), "general", "Main");
    const sections = next.tabs[0].sections;
    expect(sections).toHaveLength(3);
    expect(sections[2]).toEqual({
      key: "main-2",
      title: "Main",
      fields: [],
    });
  });

  it("adds an untitled section for an empty title", () => {
    const next = addSection(sampleLayout(), "advanced");
    expect(next.tabs[1].sections[1]).toEqual({
      key: "section",
      fields: [],
    });
  });
});

describe("renameTab / renameSection / setTabIcon", () => {
  it("renames a tab label without touching its key", () => {
    const next = renameTab(sampleLayout(), "general", "Overview");
    expect(next.tabs[0].key).toBe("general");
    expect(next.tabs[0].label).toBe("Overview");
  });

  it("renames a section title and drops it when cleared", () => {
    const titled = renameSection(sampleLayout(), "general", "meta", "Metadata");
    expect(fieldsIn(titled, "general", "meta")).toEqual(["c"]);
    expect(titled.tabs[0].sections[1].title).toBe("Metadata");
    const cleared = renameSection(titled, "general", "meta", "");
    expect(cleared.tabs[0].sections[1]).not.toHaveProperty("title");
  });

  it("sets and clears a tab icon", () => {
    const set = setTabIcon(sampleLayout(), "general", "Star");
    expect(set.tabs[0].icon).toBe("Star");
    const cleared = setTabIcon(set, "general", undefined);
    expect(cleared.tabs[0]).not.toHaveProperty("icon");
  });
});

describe("deleteTab", () => {
  it("removes a tab and drops its fields to the tray", () => {
    const next = deleteTab(sampleLayout(), "advanced");
    expect(next.tabs).toHaveLength(1);
    expect(allPlaced(next)).toEqual(["a", "b", "c"]);
  });

  it("is a no-op when only one tab remains", () => {
    const single: EntityLayout = {
      tabs: [{
        key: "general",
        label: "General",
        sections: [{
          key: "main",
          fields: ["a"],
        }],
      }],
    };
    expect(deleteTab(single, "general")).toBe(single);
  });
});

describe("deleteSection", () => {
  it("removes a non-last section and drops its fields to the tray", () => {
    const next = deleteSection(sampleLayout(), "general", "meta");
    expect(next.tabs[0].sections).toHaveLength(1);
    expect(allPlaced(next)).toEqual(["a", "b", "d"]);
  });

  it("is a no-op on the tab's last section while it holds fields", () => {
    const layout = sampleLayout();
    expect(deleteSection(layout, "advanced", "danger")).toBe(layout);
  });

  it("deletes an empty last section, leaving a section-less tab", () => {
    const layout: EntityLayout = {
      tabs: [{
        key: "advanced",
        label: "Advanced",
        sections: [{
          key: "danger",
          fields: [],
        }],
      }],
    };
    const next = deleteSection(layout, "advanced", "danger");
    expect(next.tabs[0].sections).toEqual([]);
  });
});

describe("moveTab / moveSection", () => {
  it("reorders a tab and no-ops at the boundary", () => {
    const moved = moveTab(sampleLayout(), "advanced", -1);
    expect(moved.tabs.map(tab => tab.key)).toEqual(["advanced", "general"]);
    const layout = sampleLayout();
    expect(moveTab(layout, "general", -1)).toBe(layout);
    expect(moveTab(layout, "advanced", 1)).toBe(layout);
  });

  it("reorders a section within its tab and no-ops at the boundary", () => {
    const moved = moveSection(sampleLayout(), "general", "meta", -1);
    expect(moved.tabs[0].sections.map(section => section.key)).toEqual(["meta", "main"]);
    const layout = sampleLayout();
    expect(moveSection(layout, "general", "main", -1)).toBe(layout);
    expect(moveSection(layout, "general", "meta", 1)).toBe(layout);
  });
});
