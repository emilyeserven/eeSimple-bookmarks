import type { EntityWorkbench, WorkbenchMode } from "./types";
import type { EntityLayout } from "@eesimple/types";

import { resolveLayout } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { autofillWorkbench } from "./autofill";
import { cardDisplayRuleWorkbench } from "./cardDisplayRule";
import { importRuleWorkbench } from "./importRule";
import { locationWorkbench } from "./location";
import { mediaTypeWorkbench } from "./mediaType";
import { propertyWorkbench } from "./property";
import { savedFilterWorkbench } from "./savedFilter";
import { tagWorkbench } from "./tag";
import { websiteWorkbench } from "./website";
import { youtubeChannelWorkbench } from "./youtubeChannel";

import { deriveWorkbenchTabs, knownFieldKeys, visibleSectionsForTab } from "@/lib/workbenchLayout";

/**
 * Byte-identical batch-2 check (#1165), mirroring `pilotLayouts.test.tsx`'s #1161 harness: each
 * migrated entity's code default layout must resolve to the exact same tab / section / field-key
 * order — in both view and edit — as its pre-migration opaque panes (the "one field per tab" recipe
 * these descriptors use). Renderers are never invoked here, only the pure order/visibility helpers,
 * so no React rendering happens.
 */

interface TabShape {
  key: string;
  group?: string;
  sections: { key: string;
    fields: string[]; }[];
}

/** The resolved (default) layout's visible tab → section → field-key shape for a given mode. */
function shape<E extends { id: string }>(
  workbench: EntityWorkbench<E>,
  mode: WorkbenchMode,
  stored: EntityLayout | null = null,
): TabShape[] {
  const {
    defaultLayout, fields,
  } = workbench;
  if (!defaultLayout || !fields) throw new Error("batch-2 workbench must be layout-driven");
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

describe("tag default layout", () => {
  it("renders the view tabs in order (Hierarchy present)", () => {
    expect(shape(tagWorkbench, "view").map(tab => tab.key)).toEqual([
      "general", "hierarchy", "autofill", "display-rules",
    ]);
  });

  it("renders the edit tabs in order (Hierarchy dropped, view-only)", () => {
    expect(shape(tagWorkbench, "edit").map(tab => tab.key)).toEqual([
      "general", "autofill", "display-rules",
    ]);
  });

  it("renders the General tab's view fields in the old TagGeneralView order (#1193)", () => {
    const general = shape(tagWorkbench, "view").find(tab => tab.key === "general");
    expect(general?.sections).toEqual([{
      key: "general",
      fields: ["stats", "primaryLanguage", "names", "autofillSources"],
    }]);
  });

  it("renders the General tab's edit fields in the old TagGeneralForm order (#1193)", () => {
    const general = shape(tagWorkbench, "edit").find(tab => tab.key === "general");
    expect(general?.sections).toEqual([{
      key: "general",
      fields: ["name", "primaryLanguage", "description", "names", "parent", "options", "genreMoods"],
    }]);
  });
});

describe("media type default layout", () => {
  /** The General tab's flattened section field-key order for a mode. */
  const generalFields = (mode: WorkbenchMode) =>
    shape(mediaTypeWorkbench, mode).find(tab => tab.key === "general")?.sections.flatMap(section => section.fields);

  it("renders the view tabs in order (Hierarchy present)", () => {
    expect(shape(mediaTypeWorkbench, "view").map(tab => tab.key)).toEqual([
      "general", "hierarchy", "autofill", "display-rules",
    ]);
  });

  it("renders the edit tabs in order (Hierarchy dropped, view-only)", () => {
    expect(shape(mediaTypeWorkbench, "edit").map(tab => tab.key)).toEqual([
      "general", "autofill", "display-rules",
    ]);
  });

  it("atomizes the General composite into granular view fields (#1189)", () => {
    // Edit-only `name`/`genreMoods` drop in view.
    expect(generalFields("view")).toEqual([
      "added", "slug", "hidden", "sortOrder", "description",
      "primaryLanguage", "names", "parent", "icon", "autofillSources", "bookmarks",
    ]);
  });

  it("atomizes the General composite into granular edit fields (#1189)", () => {
    // View-only `added`/`slug`/`autofillSources`/`bookmarks` drop in edit; the rest reproduce the
    // pre-#1189 edit order exactly.
    expect(generalFields("edit")).toEqual([
      "hidden", "name", "sortOrder", "description",
      "primaryLanguage", "names", "parent", "icon", "genreMoods",
    ]);
  });
});

describe("location default layout", () => {
  it("renders the view tabs in order (Hierarchy present)", () => {
    expect(shape(locationWorkbench, "view").map(tab => tab.key)).toEqual([
      "general", "hierarchy", "autofill", "display-rules",
    ]);
  });

  it("renders the edit tabs in order (Hierarchy dropped, view-only)", () => {
    expect(shape(locationWorkbench, "edit").map(tab => tab.key)).toEqual([
      "general", "autofill", "display-rules",
    ]);
  });
});

describe("custom property default layout", () => {
  const expectedTabs = [
    "general", "options", "categories", "media-types", "display", "autofill", "display-rules",
  ];

  it("renders the view tabs in order", () => {
    expect(shape(propertyWorkbench, "view").map(tab => tab.key)).toEqual(expectedTabs);
  });

  it("renders the edit tabs in order", () => {
    expect(shape(propertyWorkbench, "edit").map(tab => tab.key)).toEqual(expectedTabs);
  });

  // The atomized General composite (#1196): one section, five fields ordered so each mode drops the
  // fields it lacks a renderer for — edit keeps name/type/status/description; view keeps
  // status/description/created (name/type are edit-only, created is view-only).
  it("splits the General tab into granular view fields", () => {
    const general = shape(propertyWorkbench, "view").find(tab => tab.key === "general");
    expect(general?.sections).toEqual([{
      key: "general",
      fields: ["status", "description", "created"],
    }]);
  });

  it("splits the General tab into granular edit fields", () => {
    const general = shape(propertyWorkbench, "edit").find(tab => tab.key === "general");
    expect(general?.sections).toEqual([{
      key: "general",
      fields: ["name", "type", "status", "description"],
    }]);
  });
});

describe("website default layout", () => {
  it("renders the view tabs in order (Hierarchy present)", () => {
    expect(shape(websiteWorkbench, "view").map(tab => tab.key)).toEqual([
      "general", "people", "shortened-links", "param-rules", "hierarchy", "autofill", "display-rules", "languages",
    ]);
  });

  it("renders the edit tabs in order (Hierarchy dropped, view-only)", () => {
    expect(shape(websiteWorkbench, "edit").map(tab => tab.key)).toEqual([
      "general", "people", "shortened-links", "param-rules", "autofill", "display-rules", "languages",
    ]);
  });
});

describe("YouTube channel default layout", () => {
  const expectedTabs = ["general", "autofill", "display-rules", "languages"];

  it("renders the view tabs in order", () => {
    expect(shape(youtubeChannelWorkbench, "view").map(tab => tab.key)).toEqual(expectedTabs);
  });

  it("renders the edit tabs in order", () => {
    expect(shape(youtubeChannelWorkbench, "edit").map(tab => tab.key)).toEqual(expectedTabs);
  });

  it("atomizes the general composite into granular view-visible fields (#1192)", () => {
    const general = shape(youtubeChannelWorkbench, "view").find(tab => tab.key === "general");
    expect(general?.sections[0].fields).toEqual([
      "description", "avatar", "metadata", "sourceDefaults", "selfIds", "channelGroups",
    ]);
  });

  it("atomizes the general composite into granular edit-visible fields (#1192)", () => {
    const general = shape(youtubeChannelWorkbench, "edit").find(tab => tab.key === "general");
    expect(general?.sections[0].fields).toEqual([
      "name", "description", "avatar", "category", "selfIds", "tags",
      "channelWebsites", "channelGroups", "labeledWebsites", "genreMoods",
    ]);
  });
});

describe("autofill rule default layout", () => {
  it("renders the view tabs in order (Debug + Backfill present)", () => {
    expect(shape(autofillWorkbench, "view").map(tab => tab.key)).toEqual([
      "general", "conditions", "prefill", "debug", "backfill",
    ]);
  });

  it("renders the edit tabs in order (Debug + Backfill dropped, view-only)", () => {
    expect(shape(autofillWorkbench, "edit").map(tab => tab.key)).toEqual([
      "general", "conditions", "prefill",
    ]);
  });
});

describe("import rule default layout", () => {
  const expectedTabs = ["general", "conditions"];

  it("renders the view tabs in order", () => {
    expect(shape(importRuleWorkbench, "view").map(tab => tab.key)).toEqual(expectedTabs);
  });

  it("renders the edit tabs in order", () => {
    expect(shape(importRuleWorkbench, "edit").map(tab => tab.key)).toEqual(expectedTabs);
  });
});

describe("card display rule default layout", () => {
  const expectedTabs = ["general", "conditions", "display"];

  it("renders the view tabs in order", () => {
    expect(shape(cardDisplayRuleWorkbench, "view").map(tab => tab.key)).toEqual(expectedTabs);
  });

  it("renders the edit tabs in order", () => {
    expect(shape(cardDisplayRuleWorkbench, "edit").map(tab => tab.key)).toEqual(expectedTabs);
  });
});

describe("saved filter default layout", () => {
  it("renders the single tab in both modes", () => {
    expect(shape(savedFilterWorkbench, "view").map(tab => tab.key)).toEqual(["general"]);
    expect(shape(savedFilterWorkbench, "edit").map(tab => tab.key)).toEqual(["general"]);
  });
});

describe("stored layout rearrangement (end-to-end loop, one tree entity + one config entity)", () => {
  it("moves a tag field into a brand-new user-created tab in both modes", () => {
    const stored: EntityLayout = {
      tabs: [
        {
          key: "extras",
          label: "Extras",
          sections: [{
            key: "s",
            fields: ["autofillRules"],
          }],
        },
      ],
    };
    const viewKeys = shape(tagWorkbench, "view", stored).map(tab => tab.key);
    const editKeys = shape(tagWorkbench, "edit", stored).map(tab => tab.key);
    expect(viewKeys).toContain("extras");
    expect(editKeys).toContain("extras");
    expect(viewKeys).not.toContain("autofill");
    expect(editKeys).not.toContain("autofill");
  });

  it("moves a card display rule field into a brand-new user-created tab in both modes", () => {
    const stored: EntityLayout = {
      tabs: [
        {
          key: "extras",
          label: "Extras",
          sections: [{
            key: "s",
            fields: ["display"],
          }],
        },
      ],
    };
    const viewKeys = shape(cardDisplayRuleWorkbench, "view", stored).map(tab => tab.key);
    const editKeys = shape(cardDisplayRuleWorkbench, "edit", stored).map(tab => tab.key);
    expect(viewKeys).toContain("extras");
    expect(editKeys).toContain("extras");
    expect(viewKeys).not.toContain("display");
    expect(editKeys).not.toContain("display");
  });
});
