// @vitest-environment node
import type { FillFilter, FillTarget, FillTransform } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import {
  coerceFillFilter,
  coerceFillTarget,
  coerceFillTransform,
  directFieldSupported,
} from "./extensionFillCoerce";

describe("directFieldSupported", () => {
  it("accepts a JSON field the association lists", () => {
    expect(directFieldSupported("website", "name")).toBe(true);
    expect(directFieldSupported("website", "description")).toBe(true);
    expect(directFieldSupported("category", "name")).toBe(true);
  });

  it("rejects a field the association does not list", () => {
    // category's fields are ["name", "description"] — socialLink is not one.
    expect(directFieldSupported("category", "socialLink")).toBe(false);
  });

  it("accepts image only when the association has an image endpoint", () => {
    expect(directFieldSupported("website", "image")).toBe(true); // website has image: true
    expect(directFieldSupported("category", "image")).toBe(false); // category has no image
  });
});

describe("coerceFillTarget", () => {
  it("field: preserves the field on a same-kind rebuild, defaults to title otherwise", () => {
    const prev: FillTarget = {
      kind: "field",
      field: "description",
    };
    expect(coerceFillTarget("field", prev)).toEqual({
      kind: "field",
      field: "description",
    });
    const other: FillTarget = {
      kind: "image",
      setMain: true,
    };
    expect(coerceFillTarget("field", other)).toEqual({
      kind: "field",
      field: "title",
    });
  });

  it("customProperty: preserves propertyId + discriminators same-kind, blank otherwise", () => {
    const prev: FillTarget = {
      kind: "customProperty",
      propertyId: "p1",
      subField: "current",
    };
    expect(coerceFillTarget("customProperty", prev)).toEqual({
      kind: "customProperty",
      propertyId: "p1",
      subField: "current",
    });
    const other: FillTarget = {
      kind: "field",
      field: "title",
    };
    expect(coerceFillTarget("customProperty", other)).toEqual({
      kind: "customProperty",
      propertyId: "",
    });
  });

  it("taxonomy: preserves the taxonomy same-kind, defaults to people otherwise", () => {
    const prev: FillTarget = {
      kind: "taxonomy",
      taxonomy: "groups",
    };
    expect(coerceFillTarget("taxonomy", prev)).toEqual({
      kind: "taxonomy",
      taxonomy: "groups",
    });
    const other: FillTarget = {
      kind: "field",
      field: "title",
    };
    expect(coerceFillTarget("taxonomy", other)).toEqual({
      kind: "taxonomy",
      taxonomy: "people",
    });
  });

  it("image: preserves setMain same-kind, defaults to true otherwise", () => {
    const prev: FillTarget = {
      kind: "image",
      setMain: false,
    };
    expect(coerceFillTarget("image", prev)).toEqual({
      kind: "image",
      setMain: false,
    });
    const other: FillTarget = {
      kind: "field",
      field: "title",
    };
    expect(coerceFillTarget("image", other)).toEqual({
      kind: "image",
      setMain: true,
    });
  });

  it("taxonomyEntity: preserves association/field/socialPlatform same-kind, defaults otherwise", () => {
    const prev: FillTarget = {
      kind: "taxonomyEntity",
      association: "people",
      field: "socialLink",
      socialPlatform: "instagram",
    };
    expect(coerceFillTarget("taxonomyEntity", prev)).toEqual(prev);
    const other: FillTarget = {
      kind: "field",
      field: "title",
    };
    expect(coerceFillTarget("taxonomyEntity", other)).toEqual({
      kind: "taxonomyEntity",
      association: "website",
      field: "name",
    });
  });

  it("taxonomyDirect: keeps the field only if the association still supports it", () => {
    // website supports socialLink → kept.
    const supported: FillTarget = {
      kind: "taxonomyDirect",
      association: "website",
      resolve: {
        mode: "url",
      },
      field: "socialLink",
    };
    expect(coerceFillTarget("taxonomyDirect", supported)).toMatchObject({
      association: "website",
      field: "socialLink",
    });
  });

  it("taxonomyDirect: resets an unsupported field to the association's first field", () => {
    // category does NOT support socialLink → falls back to its first field ("name").
    const unsupported: FillTarget = {
      kind: "taxonomyDirect",
      association: "category",
      resolve: {
        mode: "url",
      },
      field: "socialLink",
    };
    expect(coerceFillTarget("taxonomyDirect", unsupported)).toMatchObject({
      association: "category",
      field: "name",
    });
  });

  it("taxonomyDirect: starts on website/url when coming from a different kind", () => {
    const other: FillTarget = {
      kind: "field",
      field: "title",
    };
    expect(coerceFillTarget("taxonomyDirect", other)).toEqual({
      kind: "taxonomyDirect",
      association: "website",
      resolve: {
        mode: "url",
      },
      field: "name",
    });
  });

  it("sections: preserves remaining fields same-kind, blank otherwise", () => {
    const prev: FillTarget = {
      kind: "sections",
      propertyId: "sec1",
      entryType: "url",
    };
    expect(coerceFillTarget("sections", prev)).toEqual({
      kind: "sections",
      propertyId: "sec1",
      entryType: "url",
    });
    const other: FillTarget = {
      kind: "field",
      field: "title",
    };
    expect(coerceFillTarget("sections", other)).toEqual({
      kind: "sections",
      propertyId: "",
      entryType: "name",
    });
  });
});

describe("coerceFillFilter", () => {
  it("carries the text match across text-variant kinds", () => {
    const prev: FillFilter = {
      kind: "selfText",
      match: {
        mode: "equals",
        value: "hi",
      },
    };
    expect(coerceFillFilter("siblingText", prev)).toEqual({
      kind: "siblingText",
      match: {
        mode: "equals",
        value: "hi",
      },
    });
    expect(coerceFillFilter("ancestorText", prev)).toEqual({
      kind: "ancestorText",
      match: {
        mode: "equals",
        value: "hi",
      },
    });
    expect(coerceFillFilter("exclude", prev)).toEqual({
      kind: "exclude",
      match: {
        mode: "equals",
        value: "hi",
      },
    });
  });

  it("supplies a fresh text match when the previous filter carried none", () => {
    const prev: FillFilter = {
      kind: "nth",
      index: 2,
    };
    expect(coerceFillFilter("selfText", prev)).toEqual({
      kind: "selfText",
      match: {
        mode: "contains",
        value: "",
      },
    });
  });

  it("closest: preserves the selector same-kind, blank otherwise", () => {
    const prev: FillFilter = {
      kind: "closest",
      selector: ".card",
    };
    expect(coerceFillFilter("closest", prev)).toEqual({
      kind: "closest",
      selector: ".card",
    });
    const other: FillFilter = {
      kind: "nth",
      index: 0,
    };
    expect(coerceFillFilter("closest", other)).toEqual({
      kind: "closest",
      selector: "",
    });
  });

  it("nth: preserves the index same-kind, defaults to 0 otherwise", () => {
    const prev: FillFilter = {
      kind: "nth",
      index: 5,
    };
    expect(coerceFillFilter("nth", prev)).toEqual({
      kind: "nth",
      index: 5,
    });
    const other: FillFilter = {
      kind: "closest",
      selector: ".x",
    };
    expect(coerceFillFilter("nth", other)).toEqual({
      kind: "nth",
      index: 0,
    });
  });

  it("excludeSelector: reuses a selector from excludeSelector or closest", () => {
    const fromExclude: FillFilter = {
      kind: "excludeSelector",
      selector: ".ad",
    };
    expect(coerceFillFilter("excludeSelector", fromExclude)).toEqual({
      kind: "excludeSelector",
      selector: ".ad",
    });
    const fromClosest: FillFilter = {
      kind: "closest",
      selector: ".wrap",
    };
    expect(coerceFillFilter("excludeSelector", fromClosest)).toEqual({
      kind: "excludeSelector",
      selector: ".wrap",
    });
    const other: FillFilter = {
      kind: "nth",
      index: 0,
    };
    expect(coerceFillFilter("excludeSelector", other)).toEqual({
      kind: "excludeSelector",
      selector: "",
    });
  });
});

describe("coerceFillTransform", () => {
  it("preserves the pattern across regex/replace", () => {
    const prev: FillTransform = {
      kind: "regex",
      pattern: "\\d+",
    };
    expect(coerceFillTransform("replace", prev)).toEqual({
      kind: "replace",
      pattern: "\\d+",
      replacement: "",
    });
    const prevReplace: FillTransform = {
      kind: "replace",
      pattern: "a",
      replacement: "b",
    };
    expect(coerceFillTransform("regex", prevReplace)).toEqual({
      kind: "regex",
      pattern: "a",
    });
  });

  it("starts a regex/replace pattern blank when coming from a non-pattern kind", () => {
    const prev: FillTransform = {
      kind: "trim",
    };
    expect(coerceFillTransform("regex", prev)).toEqual({
      kind: "regex",
      pattern: "",
    });
  });

  it("rebuilds the parameterless kinds as a bare discriminant", () => {
    const prev: FillTransform = {
      kind: "regex",
      pattern: "x",
    };
    for (const kind of [
      "number",
      "duration",
      "date",
      "trim",
      "capitalizeFirst",
      "affix",
      "absoluteUrl",
      "youtubeThumbnail",
    ] as const) {
      expect(coerceFillTransform(kind, prev)).toEqual({
        kind,
      });
    }
  });
});
