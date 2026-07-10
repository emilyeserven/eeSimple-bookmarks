// @vitest-environment node
import type { WebsiteExtensionFillRule } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import {
  coerceFillFilter,
  coerceFillTarget,
  coerceFillTransform,
  describeFillFilter,
  describeFillRead,
  describeFillTarget,
  describeFillTransform,
  describePathMatch,
  duplicateFillRule,
  moveItem,
  newFillRuleDraft,
  newPathMatch,
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

describe("newPathMatch", () => {
  it("defaults to a blank prefix match", () => {
    expect(newPathMatch()).toEqual({
      mode: "prefix",
      value: "",
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

  it("defaults an image target to setMain and preserves it across a same-kind rebuild", () => {
    // Switching to image from another kind defaults setMain on.
    expect(coerceFillTarget("image", {
      kind: "field",
      field: "title",
    })).toEqual({
      kind: "image",
      setMain: true,
    });
    // A same-kind rebuild keeps the user's choice.
    expect(coerceFillTarget("image", {
      kind: "image",
      setMain: false,
    })).toEqual({
      kind: "image",
      setMain: false,
    });
  });

  it("carries the sub-value discriminators across a same-kind rebuild", () => {
    expect(coerceFillTarget("customProperty", {
      kind: "customProperty",
      propertyId: "p1",
      subField: "total",
    })).toEqual({
      kind: "customProperty",
      propertyId: "p1",
      subField: "total",
    });
    expect(coerceFillTarget("customProperty", {
      kind: "customProperty",
      propertyId: "p1",
      choiceValue: "read",
    })).toEqual({
      kind: "customProperty",
      propertyId: "p1",
      choiceValue: "read",
    });
  });
});

describe("describeFillTarget", () => {
  it("summarizes an image target, flagging the main-image variant", () => {
    expect(describeFillTarget({
      kind: "image",
      setMain: true,
    })).toBe("Image · Main");
    expect(describeFillTarget({
      kind: "image",
      setMain: false,
    })).toBe("Image");
    expect(describeFillTarget({
      kind: "image",
    })).toBe("Image");
  });
});

describe("describePathMatch", () => {
  it("labels the mode and quotes the value", () => {
    expect(describePathMatch({
      mode: "prefix",
      value: "/course/",
    })).toBe("Starts with \"/course/\"");
    expect(describePathMatch({
      mode: "regex",
      value: "^/x",
    })).toBe("Matches regex \"^/x\"");
  });
});

describe("describeFillRead", () => {
  it("names an attribute read and falls back to text otherwise", () => {
    expect(describeFillRead({
      kind: "attr",
      name: "src",
    })).toBe("Attribute: src");
    expect(describeFillRead({
      kind: "text",
    })).toBe("Text content");
    expect(describeFillRead(undefined)).toBe("Text content");
    // An attr read with no name is incomplete → treated as the default text read.
    expect(describeFillRead({
      kind: "attr",
      name: "",
    })).toBe("Text content");
  });
});

describe("describeFillFilter", () => {
  it("summarizes each filter variant, noting case-sensitivity and depth", () => {
    expect(describeFillFilter({
      kind: "selfText",
      match: {
        mode: "contains",
        value: "PRINT LENGTH:",
      },
    })).toBe("Self text contains \"PRINT LENGTH:\"");
    expect(describeFillFilter({
      kind: "siblingText",
      match: {
        mode: "equals",
        value: "B",
        caseSensitive: true,
      },
    })).toBe("Sibling text equals \"B\" (case-sensitive)");
    expect(describeFillFilter({
      kind: "ancestorText",
      match: {
        mode: "regex",
        value: "^C$",
      },
      maxDepth: 3,
    })).toBe("Ancestor text matches \"^C$\" (max depth 3)");
    expect(describeFillFilter({
      kind: "closest",
      selector: ".stat-block",
    })).toBe("Closest ancestor \".stat-block\"");
    expect(describeFillFilter({
      kind: "nth",
      index: 1,
    })).toBe("Nth match #1");
  });
});

describe("describeFillTransform", () => {
  it("summarizes each transform variant", () => {
    expect(describeFillTransform({
      kind: "regex",
      pattern: "(\\d+)",
      flags: "i",
      group: 1,
    })).toBe("Regex /(\\d+)/i group 1");
    expect(describeFillTransform({
      kind: "number",
    })).toBe("First number");
    expect(describeFillTransform({
      kind: "duration",
    })).toBe("Duration → seconds");
    expect(describeFillTransform({
      kind: "date",
    })).toBe("Date → YYYY-MM-DD");
    expect(describeFillTransform({
      kind: "replace",
      pattern: ",",
      flags: "g",
      replacement: "",
    })).toBe("Replace /,/g → \"\"");
    expect(describeFillTransform({
      kind: "trim",
    })).toBe("Trim");
  });
});

describe("duplicateFillRule", () => {
  it("clones a rule with a fresh id and deep-copied nested arrays", () => {
    const original = rule({
      id: "orig",
      extract: {
        selector: ".x",
        filters: [
          {
            kind: "selfText",
            match: {
              mode: "equals",
              value: "Pages",
            },
          },
        ],
      },
    });
    const copy = duplicateFillRule(original);
    expect(copy.id).not.toBe(original.id);
    expect(copy.id).toBeTruthy();
    expect(copy.label).toBe(original.label);
    expect(copy.extract).toEqual(original.extract);
    // Deep clone: mutating the copy's nested array must not touch the original.
    expect(copy.extract.filters).not.toBe(original.extract.filters);
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

  it("coerces to the parameter-less duration variant", () => {
    expect(coerceFillTransform("duration", {
      kind: "regex" as const,
      pattern: "(\\d+)",
    })).toEqual({
      kind: "duration",
    });
  });

  it("coerces to the parameter-less date variant", () => {
    expect(coerceFillTransform("date", {
      kind: "regex" as const,
      pattern: "(\\d+)",
    })).toEqual({
      kind: "date",
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

  it("passes through a customProperty subField / choiceValue sub-value", () => {
    const [progress] = normalizeExtensionFillRules([rule({
      target: {
        kind: "customProperty",
        propertyId: "22222222-2222-2222-2222-222222222222",
        subField: "total",
      },
    })]);
    expect(progress.target).toEqual({
      kind: "customProperty",
      propertyId: "22222222-2222-2222-2222-222222222222",
      subField: "total",
    });
    const [choice] = normalizeExtensionFillRules([rule({
      target: {
        kind: "customProperty",
        propertyId: "22222222-2222-2222-2222-222222222222",
        choiceValue: "read",
      },
    })]);
    expect(choice.target).toEqual({
      kind: "customProperty",
      propertyId: "22222222-2222-2222-2222-222222222222",
      choiceValue: "read",
    });
  });

  it("drops a blank pathMatch and trims a set one", () => {
    const [blank] = normalizeExtensionFillRules([rule({
      pathMatch: {
        mode: "prefix",
        value: "   ",
      },
    })]);
    expect(blank).not.toHaveProperty("pathMatch");
    const [set] = normalizeExtensionFillRules([rule({
      pathMatch: {
        mode: "prefix",
        value: "  /course/  ",
      },
    })]);
    expect(set.pathMatch).toEqual({
      mode: "prefix",
      value: "/course/",
    });
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

  it("keeps an image target, emitting setMain only when true", () => {
    const [main] = normalizeExtensionFillRules([rule({
      target: {
        kind: "image",
        setMain: true,
      },
      extract: {
        selector: "img.cover",
        read: {
          kind: "attr",
          name: "src",
        },
      },
    })]);
    expect(main.target).toEqual({
      kind: "image",
      setMain: true,
    });
    // setMain false is the default and is omitted from the schema-clean payload.
    const [noMain] = normalizeExtensionFillRules([rule({
      target: {
        kind: "image",
        setMain: false,
      },
      extract: {
        selector: "img.cover",
      },
    })]);
    expect(noMain.target).toEqual({
      kind: "image",
    });
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
      pathMatch: {
        mode: "prefix",
        value: "/course/",
      },
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

describe("normalizeExtensionFillRules — meta source", () => {
  it("keeps a meta rule with a metaKey and drops the unused selector", () => {
    const [out] = normalizeExtensionFillRules([rule({
      extract: {
        source: "meta",
        metaKey: "og:book:author",
      },
    })]);
    expect(out.extract).toEqual({
      source: "meta",
      metaKey: "og:book:author",
    });
  });

  it("drops a meta rule with a blank metaKey", () => {
    expect(normalizeExtensionFillRules([rule({
      extract: {
        source: "meta",
        metaKey: "   ",
      },
    })])).toEqual([]);
  });

  it("keeps transforms/filters/split on a meta rule but omits a text read", () => {
    const [out] = normalizeExtensionFillRules([rule({
      target: {
        kind: "taxonomy",
        taxonomy: "people",
      },
      extract: {
        source: "meta",
        metaKey: "og:book:author",
        split: ", ",
        transform: [{
          kind: "trim",
        }],
        read: {
          kind: "text",
        },
      },
    })]);
    expect(out.extract).toEqual({
      source: "meta",
      metaKey: "og:book:author",
      transform: [{
        kind: "trim",
      }],
      split: ", ",
    });
  });
});

describe("taxonomyEntity target", () => {
  it("coerces to a website/name default and preserves a same-kind value", () => {
    expect(coerceFillTarget("taxonomyEntity", {
      kind: "field",
      field: "title",
    })).toEqual({
      kind: "taxonomyEntity",
      association: "website",
      field: "name",
    });
    expect(coerceFillTarget("taxonomyEntity", {
      kind: "taxonomyEntity",
      association: "group",
      field: "socialLink",
      socialPlatform: "x",
    })).toEqual({
      kind: "taxonomyEntity",
      association: "group",
      field: "socialLink",
      socialPlatform: "x",
    });
  });

  it("normalizes a social-link target, requiring a platform", () => {
    const [out] = normalizeExtensionFillRules([rule({
      target: {
        kind: "taxonomyEntity",
        association: "group",
        field: "socialLink",
        socialPlatform: "x",
      },
      extract: {
        source: "meta",
        metaKey: "twitter:creator",
      },
    })]);
    expect(out.target).toEqual({
      kind: "taxonomyEntity",
      association: "group",
      field: "socialLink",
      socialPlatform: "x",
    });
    // A social-link target with no platform is incomplete → the whole rule is dropped.
    expect(normalizeExtensionFillRules([rule({
      target: {
        kind: "taxonomyEntity",
        association: "group",
        field: "socialLink",
      },
      extract: {
        selector: ".x",
      },
    })])).toEqual([]);
  });

  it("normalizes a non-social taxonomyEntity target and strips a stray platform", () => {
    const [out] = normalizeExtensionFillRules([rule({
      target: {
        kind: "taxonomyEntity",
        association: "people",
        field: "description",
        socialPlatform: "x",
      },
      extract: {
        selector: ".bio",
      },
    })]);
    expect(out.target).toEqual({
      kind: "taxonomyEntity",
      association: "people",
      field: "description",
    });
  });

  it("summarizes a taxonomyEntity target with the field or social platform", () => {
    expect(describeFillTarget({
      kind: "taxonomyEntity",
      association: "group",
      field: "socialLink",
      socialPlatform: "x",
    })).toBe("Publisher (Group) · X");
    expect(describeFillTarget({
      kind: "taxonomyEntity",
      association: "people",
      field: "description",
    })).toBe("People · Description");
  });
});
