// @vitest-environment node
import { describe, expect, it } from "vitest";

import { makeCustomProperty } from "@/test-utils/factories";

import { selectVisibleFormProperties } from "./bookmarkFormProperties";

/** A property scoped to every category by default so scoping never hides it unintentionally. */
function prop(overrides: Parameters<typeof makeCustomProperty>[0] = {}) {
  return makeCustomProperty({
    allCategories: true,
    ...overrides,
  });
}

const base = {
  categoryId: "cat",
  mediaTypeId: null,
  placement: "default" as const,
};

describe("selectVisibleFormProperties", () => {
  it("drops disabled, hiddenFromForm, and hidden-slug properties", () => {
    const list = [
      prop({
        id: "ok",
        slug: "ok",
        showInForm: true,
      }),
      prop({
        id: "disabled",
        slug: "disabled",
        showInForm: true,
        enabled: false,
      }),
      prop({
        id: "hidden",
        slug: "hidden",
        showInForm: true,
        hiddenFromForm: true,
      }),
      prop({
        id: "runtime",
        slug: "runtime",
        showInForm: true,
      }),
    ];
    const result = selectVisibleFormProperties(list, {
      ...base,
      hiddenSlugs: ["runtime"],
    });
    expect(result.map(p => p.id)).toEqual(["ok"]);
  });

  it("default placement keeps showInForm properties; advanced keeps the rest", () => {
    const list = [
      prop({
        id: "form",
        slug: "form",
        showInForm: true,
      }),
      prop({
        id: "adv",
        slug: "adv",
        showInForm: false,
      }),
    ];
    expect(selectVisibleFormProperties(list, {
      ...base,
      placement: "default",
    }).map(p => p.id))
      .toEqual(["form"]);
    expect(selectVisibleFormProperties(list, {
      ...base,
      placement: "advanced",
    }).map(p => p.id))
      .toEqual(["adv"]);
  });

  it("details placement keeps only showInDetails properties", () => {
    const list = [
      prop({
        id: "shown",
        slug: "shown",
        showInDetails: true,
      }),
      prop({
        id: "hidden",
        slug: "hidden",
        showInDetails: false,
      }),
    ];
    expect(selectVisibleFormProperties(list, {
      ...base,
      placement: "details",
    }).map(p => p.id))
      .toEqual(["shown"]);
  });

  it("all placement keeps every non-hidden property regardless of showInForm", () => {
    const list = [
      prop({
        id: "a",
        slug: "a",
        showInForm: true,
      }),
      prop({
        id: "b",
        slug: "b",
        showInForm: false,
      }),
    ];
    expect(selectVisibleFormProperties(list, {
      ...base,
      placement: "all",
    }).map(p => p.id))
      .toEqual(["a", "b"]);
  });

  it("hides a property that applies to neither the category nor the media type", () => {
    const list = [
      prop({
        id: "scoped",
        slug: "scoped",
        showInForm: true,
        allCategories: false,
        categoryIds: ["other"],
      }),
    ];
    expect(selectVisibleFormProperties(list, base)).toEqual([]);
  });

  describe("placementOverrides", () => {
    it("drops a property whose override is \"hidden\", regardless of showInForm", () => {
      const list = [
        prop({
          id: "a",
          slug: "a",
          showInForm: true,
        }),
        prop({
          id: "b",
          slug: "b",
          showInForm: false,
        }),
      ];
      const overrides = {
        a: "hidden" as const,
        b: "hidden" as const,
      };
      expect(selectVisibleFormProperties(list, {
        ...base,
        placement: "default",
        placementOverrides: overrides,
      })).toEqual([]);
      expect(selectVisibleFormProperties(list, {
        ...base,
        placement: "advanced",
        placementOverrides: overrides,
      })).toEqual([]);
    });

    it("moves a property between default/advanced placements, overriding showInForm", () => {
      const list = [
        // Normally shows in "default" (showInForm: true) but overridden to "advanced".
        prop({
          id: "movedToAdvanced",
          slug: "movedToAdvanced",
          showInForm: true,
        }),
        // Normally shows in "advanced" (showInForm: false) but overridden to "default".
        prop({
          id: "movedToDefault",
          slug: "movedToDefault",
          showInForm: false,
        }),
      ];
      const overrides = {
        movedToAdvanced: "advanced" as const,
        movedToDefault: "default" as const,
      };
      expect(selectVisibleFormProperties(list, {
        ...base,
        placement: "default",
        placementOverrides: overrides,
      }).map(p => p.id)).toEqual(["movedToDefault"]);
      expect(selectVisibleFormProperties(list, {
        ...base,
        placement: "advanced",
        placementOverrides: overrides,
      }).map(p => p.id)).toEqual(["movedToAdvanced"]);
    });

    it("falls through to showInForm when a slug has no override entry", () => {
      const list = [
        prop({
          id: "noOverride",
          slug: "noOverride",
          showInForm: true,
        }),
      ];
      expect(selectVisibleFormProperties(list, {
        ...base,
        placement: "default",
        placementOverrides: {
          otherSlug: "hidden",
        },
      }).map(p => p.id)).toEqual(["noOverride"]);
    });

    it("hiddenFromForm still wins over an override that would otherwise show the property", () => {
      const list = [
        prop({
          id: "forcedHidden",
          slug: "forcedHidden",
          showInForm: true,
          hiddenFromForm: true,
        }),
      ];
      expect(selectVisibleFormProperties(list, {
        ...base,
        placement: "default",
        placementOverrides: {
          forcedHidden: "default",
        },
      })).toEqual([]);
    });
  });

  describe("revealAutofilledInMain", () => {
    it("lifts an auto-filled property into the default zone and out of advanced, bypassing its placement", () => {
      const list = [
        // Configured to Advanced (showInForm: false) — but auto-filled, so it belongs in main.
        prop({
          id: "autofilled",
          slug: "autofilled",
          showInForm: false,
        }),
      ];
      expect(selectVisibleFormProperties(list, {
        ...base,
        placement: "default",
        autofilledPropertyIds: new Set(["autofilled"]),
        revealAutofilledInMain: true,
      }).map(p => p.id)).toEqual(["autofilled"]);
      expect(selectVisibleFormProperties(list, {
        ...base,
        placement: "advanced",
        autofilledPropertyIds: new Set(["autofilled"]),
        revealAutofilledInMain: true,
      })).toEqual([]);
    });

    it("lifts an auto-filled property whose override is \"hidden\" into the default zone", () => {
      const list = [
        prop({
          id: "autofilled",
          slug: "autofilled",
          showInForm: false,
        }),
      ];
      expect(selectVisibleFormProperties(list, {
        ...base,
        placement: "default",
        placementOverrides: {
          autofilled: "hidden",
        },
        autofilledPropertyIds: new Set(["autofilled"]),
        revealAutofilledInMain: true,
      }).map(p => p.id)).toEqual(["autofilled"]);
    });

    it("does nothing when the setting is off", () => {
      const list = [
        prop({
          id: "autofilled",
          slug: "autofilled",
          showInForm: false,
        }),
      ];
      expect(selectVisibleFormProperties(list, {
        ...base,
        placement: "default",
        autofilledPropertyIds: new Set(["autofilled"]),
        revealAutofilledInMain: false,
      })).toEqual([]);
      expect(selectVisibleFormProperties(list, {
        ...base,
        placement: "advanced",
        autofilledPropertyIds: new Set(["autofilled"]),
        revealAutofilledInMain: false,
      }).map(p => p.id)).toEqual(["autofilled"]);
    });

    it("keeps the scope lock and hiddenFromForm as the ultimate gates", () => {
      const scoped = prop({
        id: "scoped",
        slug: "scoped",
        showInForm: false,
        allCategories: false,
        categoryIds: ["other"],
      });
      const forcedHidden = prop({
        id: "forcedHidden",
        slug: "forcedHidden",
        showInForm: false,
        hiddenFromForm: true,
      });
      expect(selectVisibleFormProperties([scoped, forcedHidden], {
        ...base,
        placement: "default",
        autofilledPropertyIds: new Set(["scoped", "forcedHidden"]),
        revealAutofilledInMain: true,
      })).toEqual([]);
    });
  });
});
