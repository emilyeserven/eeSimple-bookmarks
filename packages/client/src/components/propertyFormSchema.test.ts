// @vitest-environment node
import { describe, expect, it } from "vitest";

import { CREATE_DEFAULTS, payloadFromValues, sectionVisibility, valuesFromProperty } from "./propertyFormSchema";
import { makeCustomProperty } from "../test-utils/factories";

describe("sectionVisibility", () => {
  it("shows every section in the full form (no section)", () => {
    expect(sectionVisibility(undefined)).toEqual({
      full: true,
      showGeneral: true,
      showOptions: true,
      showCategories: true,
      showMediaTypes: true,
      showDisplay: true,
    });
  });

  it("shows only the named section when a tab is selected", () => {
    expect(sectionVisibility("categories")).toEqual({
      full: false,
      showGeneral: false,
      showOptions: false,
      showCategories: true,
      showMediaTypes: false,
      showDisplay: false,
    });
  });

  it("maps each tab to its own flag", () => {
    expect(sectionVisibility("general").showGeneral).toBe(true);
    expect(sectionVisibility("options").showOptions).toBe(true);
    expect(sectionVisibility("media-types").showMediaTypes).toBe(true);
    expect(sectionVisibility("display").showDisplay).toBe(true);
  });
});

describe("payloadFromValues", () => {
  it("trims the name and passes through the type", () => {
    const payload = payloadFromValues({
      ...CREATE_DEFAULTS,
      name: "  Rating  ",
      type: "ratingScale",
    });
    expect(payload.name).toBe("Rating");
    expect(payload.type).toBe("ratingScale");
  });

  it("nulls out number-only fields when the type is not number", () => {
    const payload = payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "boolean",
      unitSingular: "min",
      numberFormat: "duration",
    });
    expect(payload.numberMin).toBeNull();
    expect(payload.numberMax).toBeNull();
    expect(payload.unitSingular).toBeNull();
    expect(payload.numberFormat).toBeNull();
  });

  it("includes number bounds only when the disable flags are off", () => {
    const enabled = payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "number",
      disableMin: false,
      disableMax: false,
      numberMin: "2",
      numberMax: "8",
    });
    expect(enabled.numberMin).toBe(2);
    expect(enabled.numberMax).toBe(8);

    const disabled = payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "number",
      disableMin: true,
      disableMax: true,
    });
    expect(disabled.numberMin).toBeNull();
    expect(disabled.numberMax).toBeNull();
  });

  it("only sets dateTimeFormat for datetime properties", () => {
    expect(payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "datetime",
      dateTimeFormat: "datetime",
    }).dateTimeFormat)
      .toBe("datetime");
    expect(payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "number",
    }).dateTimeFormat).toBeNull();
  });

  it("passes operand ids only for calculate and forces editableOnCard off", () => {
    const calc = payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "calculate",
      operandIds: ["a", "b"],
      editableOnCard: true,
    });
    expect(calc.operandPropertyIds).toEqual(["a", "b"]);
    expect(calc.editableOnCard).toBe(false);

    const number = payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "number",
      editableOnCard: true,
    });
    expect(number.operandPropertyIds).toBeUndefined();
    expect(number.editableOnCard).toBe(true);
  });

  it("emits custom boolean labels only when the preset is custom", () => {
    const custom = payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "boolean",
      booleanLabelPreset: "custom",
      booleanTrueLabel: "  On  ",
      booleanFalseLabel: "Off",
    });
    expect(custom.booleanTrueLabel).toBe("On");
    expect(custom.booleanFalseLabel).toBe("Off");

    const preset = payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "boolean",
      booleanLabelPreset: "yes-no",
      booleanTrueLabel: "On",
    });
    expect(preset.booleanTrueLabel).toBeNull();
    expect(preset.booleanFalseLabel).toBeNull();
  });

  it("maps rating fields only for ratingScale and coerces ratingMax to a number", () => {
    const rating = payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "ratingScale",
      ratingMax: "3",
      ratingLabel: "  stars  ",
    });
    expect(rating.ratingMax).toBe(3);
    expect(rating.ratingLabel).toBe("stars");

    const nonRating = payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "number",
    });
    expect(nonRating.ratingMax).toBeNull();
    expect(nonRating.ratingLabel).toBeNull();
    expect(nonRating.ratingAllowZero).toBeUndefined();
    expect(nonRating.ratingCategoryLabels).toBeNull();
  });

  it("accepts any whole ratingMax and clamps out-of-range or invalid input", () => {
    const max = (ratingMax: string) => payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "ratingScale",
      ratingMax,
    }).ratingMax;
    expect(max("7")).toBe(7);
    expect(max("10")).toBe(10);
    expect(max("25")).toBe(20);
    expect(max("1")).toBe(2);
    expect(max("abc")).toBe(5);
  });

  it("prunes rating labels above the max (and blank entries) on save", () => {
    const payload = payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "ratingScale",
      ratingMax: "3",
      ratingLabels: {
        1: "Beginner",
        2: "  ",
        5: "Stale (max was lowered)",
      },
    });
    expect(payload.ratingLabels).toEqual({
      1: "Beginner",
    });
  });

  it("rebuilds the category-label record from rows, dropping empty rows and stale levels", () => {
    const payload = payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "ratingScale",
      ratingMax: "5",
      ratingCategoryLabels: [
        {
          categoryId: "cat-japanese",
          labels: {
            1: "N5",
            5: " N1 ",
            9: "Stale",
          },
        },
        {
          categoryId: "",
          labels: {
            1: "No category picked",
          },
        },
        {
          categoryId: "cat-empty",
          labels: {
            1: "  ",
          },
        },
      ],
    });
    expect(payload.ratingCategoryLabels).toEqual({
      "cat-japanese": {
        1: "N5",
        5: "N1",
      },
    });
    // No surviving rows at all → explicit null (clears the stored jsonb).
    expect(payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "ratingScale",
    }).ratingCategoryLabels).toBeNull();
  });

  it("maps the boolean value-formatting preset only for boolean properties", () => {
    const bool = payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "boolean",
      booleanLabelPreset: "custom",
      booleanTrueLabel: "Read",
      booleanFalseLabel: "Unread",
    });
    expect(bool.booleanLabelPreset).toBe("custom");
    expect(bool.booleanTrueLabel).toBe("Read");
    expect(bool.booleanFalseLabel).toBe("Unread");

    const number = payloadFromValues({
      ...CREATE_DEFAULTS,
      type: "number",
    });
    expect(number.booleanLabelPreset).toBeNull();
  });

  it("round-trips the category-label record through form rows, keeping dangling categories", () => {
    const property = makeCustomProperty({
      type: "ratingScale",
      ratingMax: 7,
      ratingCategoryLabels: {
        "cat-japanese": {
          1: "N5",
        },
        // A since-deleted category's row is kept so the editor can surface it for removal.
        "cat-deleted": {
          1: "Old",
        },
      },
    });
    const values = valuesFromProperty(property);
    expect(values.ratingMax).toBe("7");
    expect(values.ratingCategoryLabels).toEqual([
      {
        categoryId: "cat-japanese",
        labels: {
          1: "N5",
        },
      },
      {
        categoryId: "cat-deleted",
        labels: {
          1: "Old",
        },
      },
    ]);
    expect(payloadFromValues({
      ...CREATE_DEFAULTS,
      ...values,
    }).ratingCategoryLabels).toEqual(property.ratingCategoryLabels);
  });

  it("hardcodes the bookmark-form placement flags for a new property (managed centrally in Settings → Display → Bookmark Add Form)", () => {
    const payload = payloadFromValues(CREATE_DEFAULTS);
    expect(payload.hiddenFromForm).toBe(false);
    expect(payload.showInForm).toBe(false);
  });
});
