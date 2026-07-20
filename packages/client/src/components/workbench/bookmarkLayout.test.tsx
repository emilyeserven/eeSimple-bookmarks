import type { EntityWorkbench, WorkbenchMode, WorkbenchField } from "./types";
import type { EntityLayout, Bookmark } from "@eesimple/types";

import { resolveLayout } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { bookmarkWorkbench } from "./bookmark";

import { augmentDefaultLayout, deriveWorkbenchTabs, knownFieldKeys, visibleSectionsForTab } from "@/lib/workbenchLayout";

/**
 * The #1163 bookmark analogue of `pilotLayouts.test.tsx`: the `"bookmark"` field registry must resolve
 * its code default layout to a stable tab / section / field-key order in both view and edit. Byte-
 * identical is waived for bookmarks (design §7-A: one unified layout can't match the two asymmetric
 * pre-migration surfaces), so this snapshots the chosen canonical order and the parity-by-construction
 * split — view-only fields (relatedBookmarks/bookmarkGraph/hierarchy/mediaSource/locationsMap/metadata/
 * debug) drop in edit and the edit-only `relatedEdit` drops in view, so Graph/Metadata/Debug are
 * view-only tabs. Renderers are never invoked, only the pure order/visibility helpers.
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
          fields: ["url", "secondaryUrl", "description", "category", "mediaType", "tags", "locationsBox", "channel", "people", "groups", "genreMoods", "kavitaLink", "plexLink", "favoriteSections"],
        }],
      },
      // The `properties` tab has no static VIEW field (its only static field, `youtubeMetadata`, is
      // edit-only; each custom property is a dynamic view+edit field merged in at runtime — see the
      // "dynamic custom-property fields" describe below), so it is hidden in the static-registry view.
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
          // Only `imagePicker` has a view renderer; the other three image fields are edit-only.
          fields: ["imagePicker"],
        }],
      },
      {
        key: "video",
        group: undefined,
        sections: [{
          key: "video",
          // `reelCapture` is edit-only, so only the player shows in view.
          fields: ["reelPlayer"],
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
        key: "graph",
        group: undefined,
        sections: [{
          key: "graph",
          fields: ["bookmarkGraph"],
        }],
      },
      {
        key: "metadata",
        group: undefined,
        sections: [{
          key: "metadata",
          fields: ["priority", "createdAt"],
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
        sections: [
          {
            key: "general",
            fields: ["name", "primaryLanguage", "names", "url", "secondaryUrl", "description", "category", "mediaType", "tags", "locationsBox", "channel", "people", "groups", "genreMoods"],
          },
          {
            key: "advanced",
            fields: ["tagBlacklist", "locationBlacklist"],
          },
        ],
      },
      {
        key: "properties",
        group: undefined,
        sections: [{
          key: "properties",
          // The static YouTube-metadata field (edit-only); dynamic custom-property fields append here.
          fields: ["youtubeMetadata"],
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
          fields: ["imagePicker", "imageActions", "imageDisplay", "screenshot"],
        }],
      },
      {
        key: "video",
        group: undefined,
        sections: [{
          key: "video",
          fields: ["reelCapture", "reelPlayer"],
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
      {
        // The AI field-update tab is edit-only (its one field has no view renderer), so it appears
        // here and is absent from the view snapshot above.
        key: "ai",
        group: undefined,
        sections: [{
          key: "ai",
          fields: ["aiUpdate"],
        }],
      },
    ]);
  });
});

describe("bookmark stored layout rearrangement (end-to-end loop)", () => {
  // Move the `imagePicker` field into a brand-new user-created tab; `resolveLayout` keeps it there and
  // appends every other unplaced field to its default home — proving a stored layout drives the render
  // in BOTH modes for bookmarks too (the hand-PUT loop the editor UI automates).
  const stored: EntityLayout = {
    tabs: [
      {
        key: "media",
        label: "Media",
        sections: [{
          key: "s",
          fields: ["imagePicker"],
        }],
      },
    ],
  };

  it("shows the moved field under the new tab in both modes", () => {
    const viewMedia = shape(bookmarkWorkbench, "view", stored).find(tab => tab.key === "media");
    const editMedia = shape(bookmarkWorkbench, "edit", stored).find(tab => tab.key === "media");
    expect(viewMedia?.sections[0]?.fields).toEqual(["imagePicker"]);
    expect(editMedia?.sections[0]?.fields).toEqual(["imagePicker"]);
  });

  it("no longer shows the original image tab in view (its only view field moved away)", () => {
    // In view the image tab's other fields (imageActions/imageDisplay/screenshot) are edit-only, so
    // with `imagePicker` moved out the image tab has no view-visible field and is hidden.
    const keys = shape(bookmarkWorkbench, "view", stored).map(tab => tab.key);
    expect(keys).toContain("media");
    expect(keys).not.toContain("image");
  });
});

describe("bookmark dynamic custom-property fields", () => {
  // Simulate the runtime merge `useLayoutDrivenWorkbench` performs: two enabled custom properties
  // become view+edit fields keyed by id, appended to the Properties tab's home section.
  const noop = () => null;
  const propField = (key: string, label: string): WorkbenchField<Bookmark> => ({
    key,
    label,
    view: noop,
    edit: noop,
  });
  const baseDefault = bookmarkWorkbench.defaultLayout ?? {
    tabs: [],
  };
  const defaultLayout = augmentDefaultLayout(
    baseDefault,
    ["prop-a", "prop-b"],
    {
      tabKey: "properties",
      sectionKey: "properties",
    },
  );
  const merged = {
    ...bookmarkWorkbench,
    fields: {
      ...bookmarkWorkbench.fields,
      "prop-a": propField("prop-a", "Rating"),
      "prop-b": propField("prop-b", "Notes"),
    },
    defaultLayout,
  };

  it("places each property field in the Properties tab, in both modes", () => {
    const viewProps = shape(merged, "view").find(tab => tab.key === "properties");
    // youtubeMetadata is edit-only → dropped in view, leaving the two dynamic property fields.
    expect(viewProps?.sections[0]?.fields).toEqual(["prop-a", "prop-b"]);

    const editProps = shape(merged, "edit").find(tab => tab.key === "properties");
    expect(editProps?.sections[0]?.fields).toEqual(["youtubeMetadata", "prop-a", "prop-b"]);
  });

  it("keeps a stored placement of a property field in a different tab", () => {
    const stored = {
      tabs: [
        {
          key: "general",
          label: "General",
          sections: [{
            key: "general",
            fields: ["url", "prop-a"],
          }],
        },
      ],
    };
    const editGeneral = shape(merged, "edit", stored).find(tab => tab.key === "general");
    expect(editGeneral?.sections[0]?.fields).toContain("prop-a");
    // prop-b, unplaced, falls back to its Properties home.
    const editProps = shape(merged, "edit", stored).find(tab => tab.key === "properties");
    expect(editProps?.sections.some(section => section.fields.includes("prop-b"))).toBe(true);
  });
});
