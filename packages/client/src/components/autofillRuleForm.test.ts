import type { AutofillRule } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildAutofillRuleDefaultValues, NO_MEDIA_TYPE } from "./autofillRuleForm";
import { NO_CATEGORY } from "../lib/autofillScope";

describe("buildAutofillRuleDefaultValues", () => {
  it("uses sentinels/empties for a new rule with no scope defaults", () => {
    expect(buildAutofillRuleDefaultValues(undefined, {})).toEqual({
      name: "",
      description: "",
      setCategoryId: NO_CATEGORY,
      setMediaTypeId: NO_MEDIA_TYPE,
      tagIds: [],
      sortOrder: 0,
    });
  });

  it("applies scope preselections when there is no rule", () => {
    expect(buildAutofillRuleDefaultValues(undefined, {
      defaultCategoryId: "cat-1",
      defaultMediaTypeId: "mt-1",
      defaultTagIds: ["t-1"],
    })).toMatchObject({
      setCategoryId: "cat-1",
      setMediaTypeId: "mt-1",
      tagIds: ["t-1"],
    });
  });

  it("prefers the edited rule's values over scope defaults", () => {
    const rule = {
      name: "Rule",
      description: "Desc",
      setCategoryId: "cat-real",
      setMediaTypeId: "mt-real",
      tagIds: ["t-real"],
      sortOrder: 3,
    } as unknown as AutofillRule;
    expect(buildAutofillRuleDefaultValues(rule, {
      defaultCategoryId: "cat-1",
    })).toEqual({
      name: "Rule",
      description: "Desc",
      setCategoryId: "cat-real",
      setMediaTypeId: "mt-real",
      tagIds: ["t-real"],
      sortOrder: 3,
    });
  });
});
