import { describe, expect, it } from "vitest";

import { CREATE_DEFAULTS, payloadFromValues, sectionVisibility } from "./propertyFormSchema";

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

  it("converts empty propertyGroupId to null and inverts the inForm flag", () => {
    expect(payloadFromValues({
      ...CREATE_DEFAULTS,
      propertyGroupId: "",
    }).propertyGroupId).toBeNull();
    expect(payloadFromValues({
      ...CREATE_DEFAULTS,
      inForm: true,
    }).hiddenFromForm).toBe(false);
    expect(payloadFromValues({
      ...CREATE_DEFAULTS,
      inForm: false,
    }).hiddenFromForm).toBe(true);
  });
});
