import assert from "node:assert/strict";
import { test } from "node:test";

import type { EntityLayout } from "./entityLayouts.js";

import { isValidEntityLayout, LAYOUTABLE_ENTITY_KINDS, resolveLayout } from "./entityLayouts.js";

/** A representative 2-tab, 2-section-per-tab default layout used across most test cases. */
function makeDefaultLayout(): EntityLayout {
  return {
    tabs: [
      {
        key: "general",
        label: "General",
        icon: "info",
        sections: [
          {
            key: "main",
            fields: ["name", "description"],
          },
          {
            key: "extra",
            title: "Extra",
            fields: ["icon"],
          },
        ],
      },
      {
        key: "related",
        label: "Related",
        sections: [
          {
            key: "related-main",
            fields: ["tags", "category"],
          },
        ],
      },
    ],
  };
}

/** All field keys present in {@link makeDefaultLayout}. */
function defaultKnownFieldKeys(): Set<string> {
  return new Set(["name", "description", "icon", "tags", "category"]);
}

function deepCloneLayout(layout: EntityLayout): EntityLayout {
  return structuredClone(layout);
}

// ---- Rule 1: stored null/empty resolves straight to defaultLayout -----------------------------

test("stored === null resolves to defaultLayout", () => {
  const defaultLayout = makeDefaultLayout();
  const result = resolveLayout(null, defaultLayout, defaultKnownFieldKeys());
  assert.deepEqual(result, defaultLayout);
});

test("stored === undefined resolves to defaultLayout", () => {
  const defaultLayout = makeDefaultLayout();
  const result = resolveLayout(undefined, defaultLayout, defaultKnownFieldKeys());
  assert.deepEqual(result, defaultLayout);
});

test("stored with zero tabs resolves to defaultLayout", () => {
  const defaultLayout = makeDefaultLayout();
  const result = resolveLayout({
    tabs: [],
  }, defaultLayout, defaultKnownFieldKeys());
  assert.deepEqual(result, defaultLayout);
});

// ---- Rule 2: unknown field keys dropped -------------------------------------------------------

test("a stored field key not in knownFieldKeys is dropped", () => {
  const defaultLayout = makeDefaultLayout();
  const stored: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [
          {
            key: "main",
            fields: ["name", "some-removed-field"],
          },
        ],
      },
    ],
  };
  const result = resolveLayout(stored, defaultLayout, defaultKnownFieldKeys());
  const mainSection = result.tabs.find(t => t.key === "general")!.sections.find(s => s.key === "main")!;
  assert.ok(!mainSection.fields.includes("some-removed-field"));
});

test("a known field key with no home in defaultLayout is kept wherever the user already placed it", () => {
  // Rule 2's only criterion for dropping is "not in knownFieldKeys" — a field that IS known but
  // happens to have no home in defaultLayout (e.g. registry/default drift) is not touched by
  // filtering, and rule 3 only ever appends fields that are missing, so it's never removed.
  const defaultLayout = makeDefaultLayout();
  const known = defaultKnownFieldKeys();
  known.add("orphan-field");
  const stored: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [
          {
            key: "main",
            fields: ["name", "orphan-field"],
          },
        ],
      },
    ],
  };
  const result = resolveLayout(stored, defaultLayout, known);
  const mainSection = result.tabs.find(t => t.key === "general")!.sections.find(s => s.key === "main")!;
  assert.ok(mainSection.fields.includes("orphan-field"));
});

// ---- Rule 3: known-but-unplaced fields appended to their default home --------------------------

test("a missing field is appended to its default section when that section still exists", () => {
  const defaultLayout = makeDefaultLayout();
  const stored: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [
          {
            key: "main",
            fields: ["name"],
          },
          {
            key: "extra",
            title: "Extra",
            fields: ["icon"],
          },
        ],
      },
      {
        key: "related",
        label: "Related",
        sections: [{
          key: "related-main",
          fields: ["tags", "category"],
        }],
      },
    ],
  };
  const result = resolveLayout(stored, defaultLayout, defaultKnownFieldKeys());
  const mainSection = result.tabs.find(t => t.key === "general")!.sections.find(s => s.key === "main")!;
  assert.deepEqual(mainSection.fields, ["name", "description"]);
});

test("a missing field's section is recreated (appended to its default tab) when the user deleted it", () => {
  const defaultLayout = makeDefaultLayout();
  const stored: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [
          // "extra" section (which owns "icon") was deleted.
          {
            key: "main",
            fields: ["name", "description"],
          },
        ],
      },
      {
        key: "related",
        label: "Related",
        sections: [{
          key: "related-main",
          fields: ["tags", "category"],
        }],
      },
    ],
  };
  const result = resolveLayout(stored, defaultLayout, defaultKnownFieldKeys());
  const generalTab = result.tabs.find(t => t.key === "general")!;
  assert.equal(generalTab.sections.length, 2);
  const recreated = generalTab.sections.at(-1)!;
  assert.equal(recreated.key, "extra");
  assert.equal(recreated.title, "Extra");
  assert.deepEqual(recreated.fields, ["icon"]);
});

test("a missing field's tab is recreated (appended to tabs) when the user deleted the whole tab", () => {
  const defaultLayout = makeDefaultLayout();
  const stored: EntityLayout = {
    tabs: [
      // "related" tab (which owns "tags"/"category") was deleted entirely.
      {
        key: "general",
        label: "General",
        sections: [
          {
            key: "main",
            fields: ["name", "description"],
          },
          {
            key: "extra",
            title: "Extra",
            fields: ["icon"],
          },
        ],
      },
    ],
  };
  const result = resolveLayout(stored, defaultLayout, defaultKnownFieldKeys());
  assert.equal(result.tabs.length, 2);
  const recreatedTab = result.tabs.at(-1)!;
  assert.equal(recreatedTab.key, "related");
  assert.equal(recreatedTab.label, "Related");
  assert.equal(recreatedTab.sections.length, 1);
  assert.equal(recreatedTab.sections[0].key, "related-main");
  assert.deepEqual(recreatedTab.sections[0].fields, ["tags", "category"]);
});

test("multiple missing fields land in one recreated section, in defaultLayout's field order", () => {
  const defaultLayout: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [{
          key: "main",
          fields: ["a", "b", "c"],
        }],
      },
    ],
  };
  const stored: EntityLayout = {
    tabs: [{
      key: "general",
      label: "General",
      sections: [],
    }],
  };
  const result = resolveLayout(stored, defaultLayout, new Set(["a", "b", "c"]));
  const section = result.tabs[0].sections.find(s => s.key === "main")!;
  assert.deepEqual(section.fields, ["a", "b", "c"]);
});

test("multiple missing fields recreate two different deleted tabs, in a stable order", () => {
  const defaultLayout: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [{
          key: "main",
          fields: ["a"],
        }],
      },
      {
        key: "second",
        label: "Second",
        sections: [{
          key: "second-main",
          fields: ["b"],
        }],
      },
      {
        key: "third",
        label: "Third",
        sections: [{
          key: "third-main",
          fields: ["c"],
        }],
      },
    ],
  };
  const known = new Set(["a", "b", "c"]);
  // "general" survives (so this doesn't trip the rule-1 empty-stored short-circuit); "second" and
  // "third" were both deleted by the user.
  const stored: EntityLayout = {
    tabs: [{
      key: "general",
      label: "General",
      sections: [{
        key: "main",
        fields: ["a"],
      }],
    }],
  };

  const first = resolveLayout(stored, defaultLayout, known);
  const second = resolveLayout(deepCloneLayout(stored), defaultLayout, known);
  assert.equal(first.tabs.length, 3);
  assert.deepEqual(first.tabs.map(t => t.key), ["general", "second", "third"]);
  assert.deepEqual(first.tabs.map(t => t.key), second.tabs.map(t => t.key));
});

// ---- Rule 4: empty sections are kept, not pruned ------------------------------------------------

test("an empty section in stored is kept in the resolved output, not pruned", () => {
  const defaultLayout = makeDefaultLayout();
  const stored: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [
          {
            key: "main",
            fields: ["name", "description", "icon"],
          },
          {
            key: "now-empty",
            title: "Now Empty",
            fields: ["some-removed-field"],
          },
        ],
      },
      {
        key: "related",
        label: "Related",
        sections: [{
          key: "related-main",
          fields: ["tags", "category"],
        }],
      },
    ],
  };
  const result = resolveLayout(stored, defaultLayout, defaultKnownFieldKeys());
  const generalTab = result.tabs.find(t => t.key === "general")!;
  const emptySection = generalTab.sections.find(s => s.key === "now-empty");
  assert.ok(emptySection, "empty section should still be present");
  assert.deepEqual(emptySection!.fields, []);
});

// ---- Rule 6: at least one tab always resolves ---------------------------------------------------

test("a fully degenerate defaultLayout with zero tabs still returns a value (falls back to defaultLayout)", () => {
  const defaultLayout: EntityLayout = {
    tabs: [],
  };
  const result = resolveLayout({
    tabs: [],
  }, defaultLayout, new Set());
  assert.deepEqual(result, defaultLayout);
});

test("knownFieldKeys sharing no members with defaultLayout still resolves (falls back when stored empties out)", () => {
  const defaultLayout = makeDefaultLayout();
  const stored: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [{
          key: "main",
          fields: ["name"],
        }],
      },
    ],
  };
  // knownFieldKeys shares nothing with what's stored, so "name" is dropped as unknown, and none of
  // defaultLayout's fields are "known" either, so nothing gets appended — the tab/section survive
  // (empty), never falling below one tab.
  const result = resolveLayout(stored, defaultLayout, new Set(["totally-unrelated"]));
  assert.ok(result.tabs.length >= 1);
});

// ---- Idempotence ---------------------------------------------------------------------------------

test("resolveLayout is idempotent from a plain missing-field scenario", () => {
  const defaultLayout = makeDefaultLayout();
  const stored: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [{
          key: "main",
          fields: ["name"],
        }],
      },
    ],
  };
  const known = defaultKnownFieldKeys();
  const firstPass = resolveLayout(stored, defaultLayout, known);
  const secondPass = resolveLayout(deepCloneLayout(firstPass), defaultLayout, known);
  assert.deepEqual(secondPass, firstPass);
});

test("resolveLayout is idempotent from the recreated-tab scenario", () => {
  const defaultLayout = makeDefaultLayout();
  const stored: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [
          {
            key: "main",
            fields: ["name", "description"],
          },
          {
            key: "extra",
            title: "Extra",
            fields: ["icon"],
          },
        ],
      },
    ],
  };
  const known = defaultKnownFieldKeys();
  const firstPass = resolveLayout(stored, defaultLayout, known);
  const secondPass = resolveLayout(deepCloneLayout(firstPass), defaultLayout, known);
  assert.deepEqual(secondPass, firstPass);
});

// ---- section columns (#1220) -----------------------------------------------------------------------

test("a section's columns count is preserved through reconciliation", () => {
  const defaultLayout = makeDefaultLayout();
  const stored: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [
          {
            key: "main",
            columns: 2,
            fields: ["name", "description"],
          },
        ],
      },
    ],
  };
  const result = resolveLayout(stored, defaultLayout, defaultKnownFieldKeys());
  const main = result.tabs.find(t => t.key === "general")!.sections.find(s => s.key === "main")!;
  assert.equal(main.columns, 2);
});

test("a recreated section inherits its columns count from the default home", () => {
  const defaultLayout: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [
          {
            key: "main",
            fields: ["name"],
          },
          {
            key: "grid",
            title: "Grid",
            columns: 3,
            fields: ["icon"],
          },
        ],
      },
    ],
  };
  const stored: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        // "grid" section (columns=3) was deleted, so "icon" is missing and gets recreated.
        sections: [{
          key: "main",
          fields: ["name"],
        }],
      },
    ],
  };
  const result = resolveLayout(stored, defaultLayout, new Set(["name", "icon"]));
  const recreated = result.tabs[0].sections.at(-1)!;
  assert.equal(recreated.key, "grid");
  assert.equal(recreated.columns, 3);
  assert.deepEqual(recreated.fields, ["icon"]);
});

// ---- tab & section descriptions (#1220 follow-up) --------------------------------------------------

test("a tab and section description are preserved through reconciliation", () => {
  const defaultLayout = makeDefaultLayout();
  const stored: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        description: "About this entity",
        sections: [
          {
            key: "main",
            description: "The core fields",
            fields: ["name", "description"],
          },
        ],
      },
    ],
  };
  const result = resolveLayout(stored, defaultLayout, defaultKnownFieldKeys());
  const tab = result.tabs.find(t => t.key === "general")!;
  assert.equal(tab.description, "About this entity");
  assert.equal(tab.sections.find(s => s.key === "main")!.description, "The core fields");
});

test("a recreated tab and section inherit their description from the default home", () => {
  const defaultLayout: EntityLayout = {
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
        key: "related",
        label: "Related",
        description: "Linked records",
        sections: [{
          key: "links",
          title: "Links",
          description: "Everything connected",
          fields: ["tags"],
        }],
      },
    ],
  };
  const stored: EntityLayout = {
    tabs: [{
      key: "general",
      label: "General",
      // "related" tab (with its description) was deleted, so "tags" is missing and recreated.
      sections: [{
        key: "main",
        fields: ["name"],
      }],
    }],
  };
  const result = resolveLayout(stored, defaultLayout, new Set(["name", "tags"]));
  const recreatedTab = result.tabs.at(-1)!;
  assert.equal(recreatedTab.key, "related");
  assert.equal(recreatedTab.description, "Linked records");
  assert.equal(recreatedTab.sections[0].description, "Everything connected");
});

// ---- section visibleIf condition gate --------------------------------------------------------------

const sampleVisibleIf = {
  type: "group",
  combinator: "and",
  children: [{
    type: "media-type",
    mediaTypeIds: ["mt-video"],
  }],
} as const;

test("a section's visibleIf condition is preserved through reconciliation", () => {
  const defaultLayout = makeDefaultLayout();
  const stored: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [
          {
            key: "main",
            visibleIf: sampleVisibleIf,
            fields: ["name", "description"],
          },
        ],
      },
    ],
  };
  const result = resolveLayout(stored, defaultLayout, defaultKnownFieldKeys());
  const main = result.tabs.find(t => t.key === "general")!.sections.find(s => s.key === "main")!;
  assert.deepEqual(main.visibleIf, sampleVisibleIf);
});

test("a recreated section inherits its visibleIf from the default home", () => {
  const defaultLayout: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [
          {
            key: "main",
            fields: ["name"],
          },
          {
            key: "video",
            title: "Video",
            visibleIf: sampleVisibleIf,
            fields: ["icon"],
          },
        ],
      },
    ],
  };
  const stored: EntityLayout = {
    tabs: [
      {
        key: "general",
        label: "General",
        // "video" section (with its visibleIf) was deleted, so "icon" is missing and recreated.
        sections: [{
          key: "main",
          fields: ["name"],
        }],
      },
    ],
  };
  const result = resolveLayout(stored, defaultLayout, new Set(["name", "icon"]));
  const recreated = result.tabs[0].sections.at(-1)!;
  assert.equal(recreated.key, "video");
  assert.deepEqual(recreated.visibleIf, sampleVisibleIf);
  assert.deepEqual(recreated.fields, ["icon"]);
});

// ---- isValidEntityLayout ---------------------------------------------------------------------------

test("isValidEntityLayout accepts a well-formed layout", () => {
  assert.equal(isValidEntityLayout(makeDefaultLayout()), true);
});

test("isValidEntityLayout accepts string tab/section descriptions and rejects non-string ones", () => {
  const withDescriptions = {
    tabs: [{
      key: "general",
      label: "General",
      description: "Tab blurb",
      sections: [{
        key: "main",
        description: "Section blurb",
        fields: ["name"],
      }],
    }],
  };
  assert.equal(isValidEntityLayout(withDescriptions), true);
  const badTab = {
    tabs: [{
      key: "general",
      label: "General",
      description: 42,
      sections: [],
    }],
  };
  assert.equal(isValidEntityLayout(badTab), false);
  const badSection = {
    tabs: [{
      key: "general",
      label: "General",
      sections: [{
        key: "main",
        description: 7,
        fields: ["name"],
      }],
    }],
  };
  assert.equal(isValidEntityLayout(badSection), false);
});

test("isValidEntityLayout accepts a section with a numeric columns count", () => {
  const value = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [{
          key: "main",
          columns: 2,
          fields: ["name"],
        }],
      },
    ],
  };
  assert.equal(isValidEntityLayout(value), true);
});

test("isValidEntityLayout rejects a section with a non-numeric columns value", () => {
  const value = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [{
          key: "main",
          columns: "two",
          fields: ["name"],
        }],
      },
    ],
  };
  assert.equal(isValidEntityLayout(value), false);
});

test("isValidEntityLayout accepts a section with a group-shaped visibleIf", () => {
  const value = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [{
          key: "main",
          visibleIf: sampleVisibleIf,
          fields: ["name"],
        }],
      },
    ],
  };
  assert.equal(isValidEntityLayout(value), true);
});

test("isValidEntityLayout rejects a section whose visibleIf is not a condition group", () => {
  const value = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [{
          key: "main",
          visibleIf: {
            type: "media-type",
            mediaTypeIds: [],
          },
          fields: ["name"],
        }],
      },
    ],
  };
  assert.equal(isValidEntityLayout(value), false);
});

test("isValidEntityLayout rejects non-object values", () => {
  assert.equal(isValidEntityLayout(null), false);
  assert.equal(isValidEntityLayout("not a layout"), false);
  assert.equal(isValidEntityLayout(42), false);
});

test("isValidEntityLayout rejects an object with no tabs array", () => {
  assert.equal(isValidEntityLayout({}), false);
  assert.equal(isValidEntityLayout({
    tabs: "not-an-array",
  }), false);
});

test("isValidEntityLayout rejects a tab missing a key", () => {
  const value = {
    tabs: [{
      label: "General",
      sections: [],
    }],
  };
  assert.equal(isValidEntityLayout(value), false);
});

test("isValidEntityLayout rejects a section with non-string fields", () => {
  const value = {
    tabs: [
      {
        key: "general",
        label: "General",
        sections: [{
          key: "main",
          fields: [1, 2],
        }],
      },
    ],
  };
  assert.equal(isValidEntityLayout(value), false);
});

// ---- LAYOUTABLE_ENTITY_KINDS -----------------------------------------------------------------------

test("LAYOUTABLE_ENTITY_KINDS has exactly 20 unique entries", () => {
  assert.equal(LAYOUTABLE_ENTITY_KINDS.length, 20);
  assert.deepEqual([...new Set(LAYOUTABLE_ENTITY_KINDS)], [...LAYOUTABLE_ENTITY_KINDS]);
});

test("LAYOUTABLE_ENTITY_KINDS includes bookmark alongside the 19 workbench entity kinds", () => {
  assert.ok(LAYOUTABLE_ENTITY_KINDS.includes("bookmark"));
  assert.ok(LAYOUTABLE_ENTITY_KINDS.includes("category"));
  // card-display-rule was removed when Card Display Rules collapsed to a single config.
  assert.ok(!LAYOUTABLE_ENTITY_KINDS.includes("card-display-rule"));
});
