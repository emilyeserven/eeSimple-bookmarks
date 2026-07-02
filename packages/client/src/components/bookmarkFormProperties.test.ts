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

  it("restricts to a property group when groupId is given (null = ungrouped)", () => {
    const list = [
      prop({
        id: "g1",
        slug: "g1",
        showInForm: true,
        propertyGroupId: "g1",
      }),
      prop({
        id: "ungrouped",
        slug: "ungrouped",
        showInForm: true,
        propertyGroupId: null,
      }),
    ];
    expect(selectVisibleFormProperties(list, {
      ...base,
      groupId: "g1",
    }).map(p => p.id))
      .toEqual(["g1"]);
    expect(selectVisibleFormProperties(list, {
      ...base,
      groupId: null,
    }).map(p => p.id))
      .toEqual(["ungrouped"]);
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
});
