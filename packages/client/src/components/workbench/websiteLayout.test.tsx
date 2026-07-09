import type { EntityWorkbench, WorkbenchMode } from "./types";
import type { EntityLayout } from "@eesimple/types";

import { resolveLayout } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { websiteWorkbench } from "./website";

import { deriveWorkbenchTabs, knownFieldKeys, visibleSectionsForTab } from "@/lib/workbenchLayout";

/**
 * The #1188 website analogue of `bookmarkLayout.test.tsx`: the website General composite is now split
 * into granular fields, so this snapshots the full tab → section → field-key order the `"website"`
 * registry + default layout resolve to in both modes, and the parity-by-construction split — the
 * view-only `metadata`/`sourceDefaults` fields drop in edit, and the edit-only
 * `name`/`defaultCategory`/`defaultMediaType`/`defaultTags`/`labeledWebsites`/`redirectFailure`/`scanIsbn`/`genreMoods`
 * fields drop in view; the `hierarchy` tab stays view-only. Renderers are never invoked, only the pure
 * order/visibility helpers. (`batch2Layouts.test.tsx` still covers the unchanged tab-key order.)
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
  if (!defaultLayout || !fields) throw new Error("website workbench must be layout-driven");
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

describe("website default layout", () => {
  it("renders the view tabs + granular General field order (edit-only fields dropped, Hierarchy present)", () => {
    expect(shape(websiteWorkbench, "view")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: [
            "favicon",
            "domain",
            "metadata",
            "description",
            "alternateNames",
            "sourceDefaults",
            "youtubeChannels",
            "socialLinks",
          ],
        }],
      },
      {
        key: "people",
        group: undefined,
        sections: [{
          key: "people",
          fields: ["people"],
        }],
      },
      {
        key: "shortened-links",
        group: undefined,
        sections: [{
          key: "shortened-links",
          fields: ["shortenedLinks"],
        }],
      },
      {
        key: "param-rules",
        group: undefined,
        sections: [{
          key: "param-rules",
          fields: ["paramRules"],
        }],
      },
      {
        key: "hierarchy",
        group: undefined,
        sections: [{
          key: "hierarchy",
          fields: ["hierarchy"],
        }],
      },
      {
        key: "autofill",
        group: undefined,
        sections: [{
          key: "autofill",
          fields: ["autofillRules"],
        }],
      },
      {
        key: "languages",
        group: undefined,
        sections: [{
          key: "languages",
          fields: ["languages"],
        }],
      },
    ]);
  });

  it("renders the edit tabs + granular General field order (view-only fields + Hierarchy dropped)", () => {
    expect(shape(websiteWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: [
            "name",
            "favicon",
            "domain",
            "description",
            "alternateNames",
            "defaultCategory",
            "defaultMediaType",
            "defaultTags",
            "youtubeChannels",
            "socialLinks",
            "labeledWebsites",
            "redirectFailure",
            "scanIsbn",
            "genreMoods",
          ],
        }],
      },
      {
        key: "people",
        group: undefined,
        sections: [{
          key: "people",
          fields: ["people"],
        }],
      },
      {
        key: "shortened-links",
        group: undefined,
        sections: [{
          key: "shortened-links",
          fields: ["shortenedLinks"],
        }],
      },
      {
        key: "param-rules",
        group: undefined,
        sections: [{
          key: "param-rules",
          fields: ["paramRules"],
        }],
      },
      {
        key: "extension-fill",
        group: undefined,
        sections: [{
          key: "extension-fill",
          fields: ["extensionFillRules"],
        }],
      },
      {
        key: "autofill",
        group: undefined,
        sections: [{
          key: "autofill",
          fields: ["autofillRules"],
        }],
      },
      {
        key: "languages",
        group: undefined,
        sections: [{
          key: "languages",
          fields: ["languages"],
        }],
      },
    ]);
  });
});

describe("website stored layout rearrangement (end-to-end loop)", () => {
  // Pull the favicon field into a brand-new user-created tab; `resolveLayout` keeps it there and
  // appends every other unplaced field to its default home — proving a stored layout drives the render
  // in BOTH modes (the hand-PUT loop the Page Layouts editor automates).
  const stored: EntityLayout = {
    tabs: [
      {
        key: "branding",
        label: "Branding",
        sections: [{
          key: "s",
          fields: ["favicon"],
        }],
      },
    ],
  };

  it("shows the moved field under the new tab in both modes", () => {
    const viewBranding = shape(websiteWorkbench, "view", stored).find(tab => tab.key === "branding");
    const editBranding = shape(websiteWorkbench, "edit", stored).find(tab => tab.key === "branding");
    expect(viewBranding?.sections[0]?.fields).toEqual(["favicon"]);
    expect(editBranding?.sections[0]?.fields).toEqual(["favicon"]);
  });

  it("still resolves the General tab (favicon removed, other fields appended)", () => {
    const keys = shape(websiteWorkbench, "view", stored).map(tab => tab.key);
    expect(keys).toContain("branding");
    expect(keys).toContain("general");
  });
});
