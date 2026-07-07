import { describe, expect, it } from "vitest";

import type { CustomPropertyInputs } from "../components/bookmarkFormSchema";

import { makeCustomProperty } from "@/test-utils/factories";

import { formStateToConditionInput } from "./bookmarkFormConditionInput";

/** A blank set of custom-property inputs, overridden per test. */
function inputs(overrides: Partial<CustomPropertyInputs> = {}): CustomPropertyInputs {
  return {
    numberInputs: {},
    booleanInputs: {},
    dateTimeInputs: {},
    choicesInputs: {},
    progressInputs: {},
    sectionsInputs: {},
    textInputs: {},
    ...overrides,
  };
}

const baseValues = {
  url: "https://example.com",
  title: "Example",
  names: ["Alternate name"],
  categoryId: "cat-1",
  mediaTypeId: "mt-1",
  youtubeChannelId: "",
  tagIds: ["t1", "t2"],
  locationIds: ["loc-1"],
  genreMoodIds: ["gm-1"],
};

describe("formStateToConditionInput", () => {
  it("projects the scalar/relation form values into a ConditionInput", () => {
    const input = formStateToConditionInput(baseValues, inputs(), []);
    expect(input.url).toBe("https://example.com");
    expect(input.title).toBe("Example");
    expect(input.names).toEqual(["Alternate name"]);
    expect(input.categoryId).toBe("cat-1");
    expect(input.mediaTypeId).toBe("mt-1");
    expect([...input.tagIds]).toEqual(["t1", "t2"]);
    expect([...input.locationIds]).toEqual(["loc-1"]);
    expect([...input.genreMoodIds]).toEqual(["gm-1"]);
  });

  it("coerces empty youtubeChannelId/mediaTypeId to null", () => {
    const input = formStateToConditionInput(
      {
        ...baseValues,
        mediaTypeId: "",
        youtubeChannelId: "",
      },
      inputs(),
      [],
    );
    expect(input.mediaTypeId).toBeNull();
    expect(input.youtubeChannelId).toBeNull();
  });

  it("builds the value Maps from the custom-property inputs (scoped by category)", () => {
    const textProp = makeCustomProperty({
      id: "p-text",
      slug: "notes",
      type: "text",
      allCategories: true,
    });
    const boolProp = makeCustomProperty({
      id: "p-bool",
      slug: "fav",
      type: "boolean",
      allCategories: true,
    });
    const input = formStateToConditionInput(
      baseValues,
      inputs({
        textInputs: {
          "p-text": "hello",
        },
        booleanInputs: {
          "p-bool": true,
        },
      }),
      [textProp, boolProp],
    );
    expect(input.textValues.get("p-text")).toBe("hello");
    expect(input.booleanValues.get("p-bool")).toBe(true);
  });

  it("leaves add-time-unavailable fields empty (relationships, language usages, files)", () => {
    const input = formStateToConditionInput(baseValues, inputs(), []);
    expect([...input.relationshipTypeIds]).toEqual([]);
    expect(input.languageUsages).toEqual([]);
    expect([...input.fileValues]).toEqual([]);
  });
});
