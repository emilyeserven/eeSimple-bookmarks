import type { WorkbenchMode } from "./types";
import type { EntityLayout } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { categoryWorkbench } from "./category";
import { newsletterWorkbench } from "./newsletter";
import { shape } from "./workbenchLayoutTestUtils";

/**
 * Byte-identical pilot check (#1161): the two field-registry pilots (Category, Newsletter) must resolve
 * their code default layout to the exact same tab / section / field-key order — in both view and edit —
 * as their pre-migration opaque panes. These assertions are the snapshot the migration must preserve;
 * the rollout sub-issues (#1164/#1165) reuse the same `shape` helper (`workbenchLayoutTestUtils.ts`).
 * Renderers are never invoked here, only the pure order/visibility helpers, so no React rendering happens.
 */

describe("category default layout", () => {
  it("renders the view tabs + field order byte-identically to the old panes", () => {
    expect(shape(categoryWorkbench, "view")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["details", "primaryLanguage", "names", "autofillSources"],
        }],
      },
      {
        key: "custom-properties",
        group: undefined,
        sections: [{
          key: "custom-properties",
          fields: ["customProperties"],
        }],
      },
      {
        key: "autofill",
        group: "Rules",
        sections: [{
          key: "autofill",
          fields: ["autofillRules"],
        }],
      },
      {
        key: "display-rules",
        group: "Rules",
        sections: [{
          key: "display-rules",
          fields: ["displayRules"],
        }],
      },
    ]);
  });

  it("renders the edit tabs + field order byte-identically (Display present, group carried)", () => {
    expect(shape(categoryWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["name", "icon", "description", "primaryLanguage", "names", "genreMoods"],
        }],
      },
      {
        key: "custom-properties",
        group: undefined,
        sections: [{
          key: "custom-properties",
          fields: ["customProperties"],
        }],
      },
      {
        key: "display",
        group: undefined,
        sections: [{
          key: "display",
          fields: ["display"],
        }],
      },
      {
        key: "autofill",
        group: "Rules",
        sections: [{
          key: "autofill",
          fields: ["autofillRules"],
        }],
      },
      {
        key: "display-rules",
        group: "Rules",
        sections: [{
          key: "display-rules",
          fields: ["displayRules"],
        }],
      },
    ]);
  });
});

describe("newsletter default layout", () => {
  it("renders the single view tab in field order (edit-only fields dropped)", () => {
    expect(shape(newsletterWorkbench, "view")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["description", "metadata", "sourceDefaults"],
        }],
      },
    ]);
  });

  it("renders the single edit tab in field order (view-only metadata dropped)", () => {
    expect(shape(newsletterWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["name", "description", "sourceDefaults", "tags", "genreMoods"],
        }],
      },
    ]);
  });
});

describe("stored layout rearrangement (end-to-end loop)", () => {
  // Move Category's `customProperties` field into a brand-new user-created tab. `resolveLayout` keeps it
  // there and appends every other (unplaced) field to its default home — proving a stored layout drives
  // the render in BOTH modes without the editor UI (that is #1160/#1162).
  const stored: EntityLayout = {
    tabs: [
      {
        key: "extras",
        label: "Extras",
        sections: [{
          key: "s",
          fields: ["customProperties"],
        }],
      },
    ],
  };

  function extrasFields(mode: WorkbenchMode): string[] | undefined {
    return shape(categoryWorkbench, mode, stored).find(tab => tab.key === "extras")?.sections[0]?.fields;
  }

  it("shows the moved field under the new tab in view mode", () => {
    expect(extrasFields("view")).toEqual(["customProperties"]);
  });

  it("shows the moved field under the new tab in edit mode", () => {
    expect(extrasFields("edit")).toEqual(["customProperties"]);
  });

  it("no longer shows the field under its original tab (custom-properties now empty → hidden)", () => {
    const keys = shape(categoryWorkbench, "edit", stored).map(tab => tab.key);
    expect(keys).toContain("extras");
    expect(keys).not.toContain("custom-properties");
  });
});
