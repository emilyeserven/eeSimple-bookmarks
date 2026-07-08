import type { EntityWorkbench, WorkbenchMode } from "./types";
import type { EntityLayout } from "@eesimple/types";

import { resolveLayout } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { bookmarkWorkbench } from "./bookmark";

import { deriveWorkbenchTabs, knownFieldKeys, visibleSectionsForTab } from "@/lib/workbenchLayout";

/**
 * The #1163 bookmark analogue of `pilotLayouts.test.tsx`: the `"bookmark"` field registry must resolve
 * its code default layout to a stable tab / section / field-key order in both view and edit. Byte-
 * identical is waived for bookmarks (design §7-A: one unified layout can't match the two asymmetric
 * pre-migration surfaces), so this snapshots the chosen canonical order and the parity-by-construction
 * split — view-only fields (relatedBookmarks/hierarchy/mediaSource/locationsMap/metadata/debug) drop in
 * edit and the edit-only `relatedEdit` drops in view, so Metadata/Debug are view-only tabs. Renderers
 * are never invoked, only the pure order/visibility helpers.
 */

interface TabShape {
  key: string;
  group?: string;
  sections: { key: string;
    fields: string[]; }[];
}

function shape<E extends { id: string }>(
  workbench: EntityWorkbench<E>,
  mode: WorkbenchMode,
  stored: EntityLayout | null = null,
): TabShape[] {
  const {
    defaultLayout, fields,
  } = workbench;
  if (!defaultLayout || !fields) throw new Error("bookmark workbench must be layout-driven");
  const layout = resolveLayout(stored, defaultLayout, knownFieldKeys(workbench));
  return deriveWorkbenchTabs(workbench, layout, mode, undefined).flatMap((tab) => {
    const layoutTab = layout.tabs.find(candidate => candidate.key === tab.key);
    if (!layoutTab) return [];
    return [{
      key: tab.key,
      group: tab.group,
      sections: visibleSectionsForTab(layoutTab, fields, mode, undefined).map(section => ({
        key: section.section.key,
        fields: section.fieldKeys,
      })),
    }];
  });
}

describe("bookmark default layout", () => {
  it("renders the view tabs + field order (edit-only relatedEdit dropped)", () => {
    expect(shape(bookmarkWorkbench, "view")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
      {
        key: "properties",
        group: undefined,
        sections: [{
          key: "properties",
          fields: ["customProperties"],
        }],
      },
      {
        key: "languages",
        group: undefined,
        sections: [{
          key: "languages",
          fields: ["languageUsages"],
        }],
      },
      {
        key: "image",
        group: undefined,
        sections: [{
          key: "image",
          fields: ["gallery"],
        }],
      },
      {
        key: "video",
        group: undefined,
        sections: [{
          key: "video",
          fields: ["reel"],
        }],
      },
      {
        key: "related",
        group: undefined,
        sections: [{
          key: "related",
          fields: ["relatedBookmarks", "hierarchy", "mediaSource", "locationsMap"],
        }],
      },
      {
        key: "metadata",
        group: undefined,
        sections: [{
          key: "metadata",
          fields: ["metadata"],
        }],
      },
      {
        key: "debug",
        group: undefined,
        sections: [{
          key: "debug",
          fields: ["debugInfo"],
        }],
      },
    ]);
  });

  it("renders the edit tabs + field order (view-only Metadata/Debug tabs dropped)", () => {
    expect(shape(bookmarkWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
      {
        key: "properties",
        group: undefined,
        sections: [{
          key: "properties",
          fields: ["customProperties"],
        }],
      },
      {
        key: "languages",
        group: undefined,
        sections: [{
          key: "languages",
          fields: ["languageUsages"],
        }],
      },
      {
        key: "image",
        group: undefined,
        sections: [{
          key: "image",
          fields: ["gallery"],
        }],
      },
      {
        key: "video",
        group: undefined,
        sections: [{
          key: "video",
          fields: ["reel"],
        }],
      },
      {
        key: "related",
        group: undefined,
        sections: [{
          key: "related",
          fields: ["relatedEdit"],
        }],
      },
    ]);
  });
});

describe("bookmark stored layout rearrangement (end-to-end loop)", () => {
  // Move the `gallery` field into a brand-new user-created tab; `resolveLayout` keeps it there and
  // appends every other unplaced field to its default home — proving a stored layout drives the render
  // in BOTH modes for bookmarks too (the hand-PUT loop the editor UI automates).
  const stored: EntityLayout = {
    tabs: [
      {
        key: "media",
        label: "Media",
        sections: [{
          key: "s",
          fields: ["gallery"],
        }],
      },
    ],
  };

  it("shows the moved field under the new tab in both modes", () => {
    const viewMedia = shape(bookmarkWorkbench, "view", stored).find(tab => tab.key === "media");
    const editMedia = shape(bookmarkWorkbench, "edit", stored).find(tab => tab.key === "media");
    expect(viewMedia?.sections[0]?.fields).toEqual(["gallery"]);
    expect(editMedia?.sections[0]?.fields).toEqual(["gallery"]);
  });

  it("no longer shows the original image tab (now empty → hidden)", () => {
    const keys = shape(bookmarkWorkbench, "view", stored).map(tab => tab.key);
    expect(keys).toContain("media");
    expect(keys).not.toContain("image");
  });
});
