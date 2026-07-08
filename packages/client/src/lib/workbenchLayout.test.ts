// @vitest-environment node
import type { EntityWorkbench, WorkbenchField } from "../components/workbench/types";
import type { EntityLayout } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import {
  deriveWorkbenchTabs,
  fieldRendersInMode,
  modeVisibleTabs,
  visibleFieldKeys,
  visibleSectionsForTab,
} from "./workbenchLayout";

interface Fake {
  id: string;
  hasOptions?: boolean;
}

const noop = () => null;

// A fake registry exercising every mode-visibility case: a both-mode field, an edit-only field, a
// view-only field, and a `showIf`-gated both-mode field.
const fields = {
  name: {
    key: "name",
    label: "Name",
    view: noop,
    edit: noop,
  },
  display: {
    key: "display",
    label: "Display",
    edit: noop,
  }, // edit-only (no view)
  hierarchy: {
    key: "hierarchy",
    label: "Hierarchy",
    view: noop,
  }, // view-only (no edit)
  options: {
    key: "options",
    label: "Options",
    view: noop,
    edit: noop,
    showIf: (e: Fake) => e.hasOptions === true,
  },
} satisfies Record<string, WorkbenchField<Fake>>;

// One tab per field so tab-level empty-in-mode hiding is directly observable.
const layout: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: "General",
      sections: [{
        key: "main",
        fields: ["name"],
      }],
    },
    {
      key: "display",
      label: "Display",
      sections: [{
        key: "s",
        fields: ["display"],
      }],
    },
    {
      key: "hierarchy",
      label: "Hierarchy",
      sections: [{
        key: "s",
        fields: ["hierarchy"],
      }],
    },
    {
      key: "opts",
      label: "Options",
      sections: [{
        key: "s",
        fields: ["options"],
      }],
    },
  ],
};

const withOptions: Fake = {
  id: "1",
  hasOptions: true,
};
const withoutOptions: Fake = {
  id: "1",
  hasOptions: false,
};

describe("fieldRendersInMode", () => {
  it("shows a both-mode field in either mode", () => {
    expect(fieldRendersInMode(fields.name, "view", withOptions)).toBe(true);
    expect(fieldRendersInMode(fields.name, "edit", withOptions)).toBe(true);
  });

  it("hides an edit-only field in view and shows it in edit", () => {
    expect(fieldRendersInMode(fields.display, "view", withOptions)).toBe(false);
    expect(fieldRendersInMode(fields.display, "edit", withOptions)).toBe(true);
  });

  it("hides a view-only field in edit and shows it in view", () => {
    expect(fieldRendersInMode(fields.hierarchy, "edit", withOptions)).toBe(false);
    expect(fieldRendersInMode(fields.hierarchy, "view", withOptions)).toBe(true);
  });

  it("respects showIf once the entity is loaded", () => {
    expect(fieldRendersInMode(fields.options, "view", withOptions)).toBe(true);
    expect(fieldRendersInMode(fields.options, "view", withoutOptions)).toBe(false);
  });

  it("optimistically includes a showIf field while the entity is undefined", () => {
    expect(fieldRendersInMode(fields.options, "view", undefined)).toBe(true);
  });
});

describe("visibleFieldKeys", () => {
  it("keeps only mode-visible, registry-known keys in layout order", () => {
    const section = {
      key: "s",
      fields: ["name", "display", "missing"],
    };
    expect(visibleFieldKeys(section, fields, "view", withOptions)).toEqual(["name"]);
    expect(visibleFieldKeys(section, fields, "edit", withOptions)).toEqual(["name", "display"]);
  });
});

describe("visibleSectionsForTab", () => {
  it("drops a section whose every field is absent in the active mode", () => {
    const tab = {
      key: "t",
      label: "T",
      sections: [
        {
          key: "a",
          fields: ["name"],
        },
        {
          key: "b",
          fields: ["hierarchy"],
        }, // view-only field → empty in edit
      ],
    };
    const editVisible = visibleSectionsForTab(tab, fields, "edit", withOptions);
    expect(editVisible.map(v => v.section.key)).toEqual(["a"]);
    const viewVisible = visibleSectionsForTab(tab, fields, "view", withOptions);
    expect(viewVisible.map(v => v.section.key)).toEqual(["a", "b"]);
  });
});

describe("modeVisibleTabs", () => {
  it("hides edit-only tabs in view mode", () => {
    const keys = modeVisibleTabs(layout, fields, "view", withOptions).map(t => t.key);
    expect(keys).toEqual(["general", "hierarchy", "opts"]); // 'display' (edit-only) dropped
  });

  it("hides view-only tabs in edit mode", () => {
    const keys = modeVisibleTabs(layout, fields, "edit", withOptions).map(t => t.key);
    expect(keys).toEqual(["general", "display", "opts"]); // 'hierarchy' (view-only) dropped
  });

  it("hides a showIf tab whose only field is gated off", () => {
    const keys = modeVisibleTabs(layout, fields, "view", withoutOptions).map(t => t.key);
    expect(keys).toEqual(["general", "hierarchy"]); // 'opts' gone, 'display' still edit-only
  });

  it("optimistically includes a showIf tab while the entity is undefined", () => {
    const keys = modeVisibleTabs(layout, fields, "view", undefined).map(t => t.key);
    expect(keys).toContain("opts");
  });

  it("carries the layout tab label", () => {
    const tabs = modeVisibleTabs(layout, fields, "view", withOptions);
    expect(tabs.find(t => t.key === "general")?.label).toBe("General");
  });
});

describe("deriveWorkbenchTabs (legacy fallback)", () => {
  it("returns the mode-filtered legacy tabs (carrying group) when the workbench has no registry", () => {
    const legacy = {
      fields: undefined,
      tabs: [
        {
          key: "general",
          label: "General",
          view: {
            render: noop,
          },
          edit: {
            render: noop,
          },
        },
        {
          key: "display",
          label: "Display",
          edit: {
            render: noop,
          },
        }, // edit-only
        {
          key: "autofill",
          label: "Autofill",
          group: "Rules",
          view: {
            render: noop,
          },
          edit: {
            render: noop,
          },
        },
      ],
    } as unknown as EntityWorkbench<Fake>;

    const viewTabs = deriveWorkbenchTabs(legacy, null, "view", withOptions);
    expect(viewTabs.map(t => t.key)).toEqual(["general", "autofill"]); // display is edit-only
    expect(viewTabs.find(t => t.key === "autofill")?.group).toBe("Rules");

    const editTabs = deriveWorkbenchTabs(legacy, null, "edit", withOptions);
    expect(editTabs.map(t => t.key)).toEqual(["general", "display", "autofill"]);
  });

  it("honors tab-level showIf in the legacy path", () => {
    const legacy = {
      fields: undefined,
      tabs: [
        {
          key: "general",
          label: "General",
          view: {
            render: noop,
          },
        },
        {
          key: "opts",
          label: "Options",
          view: {
            render: noop,
          },
          showIf: (e: Fake) => e.hasOptions === true,
        },
      ],
    } as unknown as EntityWorkbench<Fake>;

    expect(deriveWorkbenchTabs(legacy, null, "view", withoutOptions).map(t => t.key)).toEqual(["general"]);
    expect(deriveWorkbenchTabs(legacy, null, "view", withOptions).map(t => t.key)).toEqual(["general", "opts"]);
  });
});
