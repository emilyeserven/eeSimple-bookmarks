// @vitest-environment node
import type { WebsiteExtensionFillRule } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import {
  coerceFillFilter,
  coerceFillTarget,
  coerceFillTransform,
  moveItem,
  newFillRuleDraft,
  normalizeExtensionFillRules,
} from "./extensionFillForm";

/** Wrap a target + extract in a minimal rule for round-trip assertions. */
function rule(overrides: Partial<WebsiteExtensionFillRule>): WebsiteExtensionFillRule {
  return {
    id: "r1",
    label: "Label",
    target: {
      kind: "field",
      field: "title",
    },
    extract: {
      selector: ".x",
    },
    ...overrides,
  };
}

describe("newFillRuleDraft", () => {
  it("builds a blank rule with a stable id and a field target", () => {
    const draft = newFillRuleDraft();
    expect(draft.id).toBeTruthy();
    expect(draft.target).toEqual({
      kind: "field",
      field: "title",
    });
    expect(draft.extract).toEqual({
      selector: "",
    });
  });
});

describe("coerceFillTarget", () => {
  it("preserves a same-kind value and resets on kind change", () => {
    const cp = coerceFillTarget("customProperty", {
      kind: "customProperty",
      propertyId: "p1",
    });
    expect(cp).toEqual({
      kind: "customProperty",
      propertyId: "p1",
    });
    // Switching away then the picker starts blank.
    expect(coerceFillTarget("taxonomy", cp)).toEqual({
      kind: "taxonomy",
      taxonomy: "people",
    });
  });
});

describe("coerceFillFilter", () => {
  it("keeps the text match across the text variants and drops it for closest/nth", () => {
    const self = {
      kind: "selfText" as const,
      match: {
        mode: "equals" as const,
        value: "Pages",
      },
    };
    expect(coerceFillFilter("siblingText", self)).toEqual({
      kind: "siblingText",
      match: {
        mode: "equals",
        value: "Pages",
      },
    });
    expect(coerceFillFilter("closest", self)).toEqual({
      kind: "closest",
      selector: "",
    });
    expect(coerceFillFilter("nth", self)).toEqual({
      kind: "nth",
      index: 0,
    });
  });
});

describe("coerceFillTransform", () => {
  it("carries the pattern between regex and replace", () => {
    const regex = {
      kind: "regex" as const,
      pattern: "(\\d+)",
    };
    expect(coerceFillTransform("replace", regex)).toEqual({
      kind: "replace",
      pattern: "(\\d+)",
      replacement: "",
    });
    expect(coerceFillTransform("number", regex)).toEqual({
      kind: "number",
    });
  });
});

describe("moveItem", () => {
  it("moves an item and is a no-op when out of range", () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
    expect(moveItem([1, 2, 3], 2, 3)).toEqual([1, 2, 3]);
  });
});

describe("normalizeExtensionFillRules", () => {
  it("drops a rule with a blank selector", () => {
    expect(normalizeExtensionFillRules([rule({
      extract: {
        selector: "   ",
      },
    })])).toEqual([]);
  });

  it("drops a customProperty target with no propertyId", () => {
    expect(normalizeExtensionFillRules([rule({
      target: {
        kind: "customProperty",
        propertyId: "",
      },
    })])).toEqual([]);
  });

  it("keeps a customProperty target once a property is selected", () => {
    const [out] = normalizeExtensionFillRules([rule({
      target: {
        kind: "customProperty",
        propertyId: "22222222-2222-2222-2222-222222222222",
      },
    })]);
    expect(out.target).toEqual({
      kind: "customProperty",
      propertyId: "22222222-2222-2222-2222-222222222222",
    });
  });

  it("strips a blank pathSuffix and trims a set one", () => {
    const [blank] = normalizeExtensionFillRules([rule({
      pathSuffix: "   ",
    })]);
    expect(blank).not.toHaveProperty("pathSuffix");
    const [set] = normalizeExtensionFillRules([rule({
      pathSuffix: "  /book  ",
    })]);
    expect(set.pathSuffix).toBe("/book");
  });

  it("drops a closest filter with a blank selector but keeps nth/text filters", () => {
    const [out] = normalizeExtensionFillRules([rule({
      extract: {
        selector: ".x",
        filters: [
          {
            kind: "closest",
            selector: "   ",
          },
          {
            kind: "nth",
            index: 0,
          },
          {
            kind: "selfText",
            match: {
              mode: "equals",
              value: "Pages",
            },
          },
        ],
      },
    })]);
    expect(out.extract.filters).toEqual([
      {
        kind: "nth",
        index: 0,
      },
      {
        kind: "selfText",
        match: {
          mode: "equals",
          value: "Pages",
        },
      },
    ]);
  });

  it("drops regex/replace transforms with a blank pattern, keeping number/trim", () => {
    const [out] = normalizeExtensionFillRules([rule({
      extract: {
        selector: ".x",
        transform: [
          {
            kind: "regex",
            pattern: "",
          },
          {
            kind: "number",
          },
          {
            kind: "trim",
          },
        ],
      },
    })]);
    expect(out.extract.transform).toEqual([
      {
        kind: "number",
      },
      {
        kind: "trim",
      },
    ]);
  });

  it("keeps an attr read but omits a text read (the default)", () => {
    const [attr] = normalizeExtensionFillRules([rule({
      extract: {
        selector: ".x",
        read: {
          kind: "attr",
          name: "data-value",
        },
      },
    })]);
    expect(attr.extract.read).toEqual({
      kind: "attr",
      name: "data-value",
    });
    const [text] = normalizeExtensionFillRules([rule({
      extract: {
        selector: ".x",
        read: {
          kind: "text",
        },
      },
    })]);
    expect(text.extract).not.toHaveProperty("read");
  });

  it("keeps split only for taxonomy targets", () => {
    const [taxonomy] = normalizeExtensionFillRules([rule({
      target: {
        kind: "taxonomy",
        taxonomy: "people",
      },
      extract: {
        selector: ".x",
        split: ", ",
      },
    })]);
    expect(taxonomy.extract.split).toBe(", ");
    const [field] = normalizeExtensionFillRules([rule({
      extract: {
        selector: ".x",
        split: ", ",
      },
    })]);
    expect(field.extract).not.toHaveProperty("split");
  });

  it("round-trips the PRINT LENGTH worked example from #1239 to a clean payload", () => {
    const printLength: WebsiteExtensionFillRule = {
      id: "print-length",
      label: "Pages",
      target: {
        kind: "customProperty",
        propertyId: "22222222-2222-2222-2222-222222222222",
      },
      extract: {
        selector: "._statBlockTitle_1ckth_86 > *",
        filters: [
          {
            kind: "siblingText",
            match: {
              mode: "contains",
              value: "PRINT LENGTH:",
            },
          },
        ],
        transform: [
          {
            kind: "number",
          },
        ],
      },
    };
    expect(normalizeExtensionFillRules([printLength])).toEqual([printLength]);
  });

  it("keeps every filter and transform variant in a maximal rule", () => {
    const maximal: WebsiteExtensionFillRule = {
      id: "maximal",
      label: "Everything",
      pathSuffix: "/book",
      target: {
        kind: "customProperty",
        propertyId: "22222222-2222-2222-2222-222222222222",
      },
      extract: {
        selector: ".x > *",
        filters: [
          {
            kind: "selfText",
            match: {
              mode: "equals",
              value: "A",
            },
          },
          {
            kind: "siblingText",
            match: {
              mode: "contains",
              value: "B",
              caseSensitive: true,
            },
          },
          {
            kind: "ancestorText",
            match: {
              mode: "regex",
              value: "^C$",
            },
            maxDepth: 3,
          },
          {
            kind: "closest",
            selector: ".stat-block",
          },
          {
            kind: "nth",
            index: 1,
          },
        ],
        read: {
          kind: "attr",
          name: "data-value",
        },
        transform: [
          {
            kind: "regex",
            pattern: "(\\d+)",
            flags: "i",
            group: 1,
          },
          {
            kind: "number",
          },
          {
            kind: "replace",
            pattern: ",",
            flags: "g",
            replacement: "",
          },
          {
            kind: "trim",
          },
        ],
      },
    };
    expect(normalizeExtensionFillRules([maximal])).toEqual([maximal]);
  });
});
