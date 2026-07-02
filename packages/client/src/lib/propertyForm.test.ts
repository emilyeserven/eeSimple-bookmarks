// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  BOOLEAN_LABEL_PRESET_OPTIONS,
  DATE_TIME_FORMAT_OPTIONS,
  hasPropertyOptions,
  NUMBER_FORMAT_OPTIONS,
  summarizeBooleanOptions,
  summarizeCategories,
  summarizeMediaTypes,
  summarizeNumberOptions,
  summarizeRatingOptions,
  toggleId,
  TYPE_OPTIONS,
} from "./propertyForm";
import { makeCustomProperty as property } from "../test-utils/factories";

describe("hasPropertyOptions", () => {
  it("is false only for calculate properties", () => {
    expect(hasPropertyOptions(property({
      type: "calculate",
    }))).toBe(false);
    expect(hasPropertyOptions(property({
      type: "number",
    }))).toBe(true);
    expect(hasPropertyOptions(property({
      type: "boolean",
    }))).toBe(true);
    expect(hasPropertyOptions(property({
      type: "ratingScale",
    }))).toBe(true);
  });
});

describe("derived option lists", () => {
  it("derives one TYPE_OPTIONS entry per shared property type", () => {
    const values = TYPE_OPTIONS.map(o => o.value);
    expect(values).toContain("number");
    expect(values).toContain("calculate");
    expect(values).toContain("file");
    // Every option carries a non-empty label.
    expect(TYPE_OPTIONS.every(o => o.label.length > 0)).toBe(true);
  });

  it("derives date-time and number format options with labels", () => {
    expect(DATE_TIME_FORMAT_OPTIONS).toEqual([
      {
        value: "date",
        label: "Date only",
      },
      {
        value: "time",
        label: "Time only",
      },
      {
        value: "datetime",
        label: "Date & time",
      },
    ]);
    const numberValues = NUMBER_FORMAT_OPTIONS.map(o => o.value);
    expect(numberValues).toContain("plain");
    expect(numberValues).toContain("duration");
  });

  it("offers a custom boolean preset", () => {
    expect(BOOLEAN_LABEL_PRESET_OPTIONS.some(o => o.value === "custom")).toBe(true);
  });
});

describe("toggleId", () => {
  it("adds an id that is absent and removes one that is present", () => {
    expect(toggleId(["a", "b"], "c")).toEqual(["a", "b", "c"]);
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });

  it("does not mutate the input array", () => {
    const ids = ["a"];
    toggleId(ids, "b");
    expect(ids).toEqual(["a"]);
    toggleId(ids, "a");
    expect(ids).toEqual(["a"]);
  });
});

describe("summarizeNumberOptions", () => {
  const base = {
    disableMin: false,
    disableMax: false,
    numberMin: "",
    numberMax: "",
    unitPlural: "",
    valuePrefix: "",
  };

  it("returns the fallback when nothing is set", () => {
    expect(summarizeNumberOptions(base)).toBe("No options set");
  });

  it("renders an explicit min/max range with the unit", () => {
    expect(summarizeNumberOptions({
      ...base,
      numberMin: "1",
      numberMax: "5",
      unitPlural: "stars",
    })).toBe("1–5 stars");
  });

  it("treats disabled or blank bounds as auto", () => {
    expect(summarizeNumberOptions({
      ...base,
      disableMin: true,
      numberMax: "10",
    })).toBe("auto–10");
    // Both bounds auto and no unit → fallback.
    expect(summarizeNumberOptions({
      ...base,
      disableMin: true,
      disableMax: true,
    })).toBe("No options set");
  });

  it("shows the unit alone when there is no range, and appends the prefix", () => {
    expect(summarizeNumberOptions({
      ...base,
      unitPlural: "points",
    })).toBe("points");
    expect(summarizeNumberOptions({
      ...base,
      numberMin: "0",
      numberMax: "9",
      valuePrefix: "$",
    })).toBe("0–9 · prefix $");
  });
});

describe("summarizeBooleanOptions", () => {
  it("renders custom labels, falling back to Yes/No", () => {
    expect(summarizeBooleanOptions({
      booleanLabelPreset: "custom",
      booleanTrueLabel: "Done",
      booleanFalseLabel: "Todo",
    })).toBe("Done / Todo");
    expect(summarizeBooleanOptions({
      booleanLabelPreset: "custom",
      booleanTrueLabel: "",
      booleanFalseLabel: "",
    })).toBe("Yes / No");
  });

  it("renders the preset label for a non-custom preset and a fallback for an unknown one", () => {
    expect(summarizeBooleanOptions({
      booleanLabelPreset: "true-false",
      booleanTrueLabel: "",
      booleanFalseLabel: "",
    })).toBe("True / False");
    expect(summarizeBooleanOptions({
      booleanLabelPreset: "mystery",
      booleanTrueLabel: "",
      booleanFalseLabel: "",
    })).toBe("Yes / No");
  });
});

describe("summarizeRatingOptions", () => {
  const base = {
    ratingMax: "5",
    ratingAllowZero: false,
    ratingAllowHalf: false,
    ratingShowLabel: false,
    ratingLabel: "",
  };

  it("describes the star range and defaults the max", () => {
    expect(summarizeRatingOptions(base)).toBe("1–5 stars");
    expect(summarizeRatingOptions({
      ...base,
      ratingMax: "",
    })).toBe("1–5 stars");
    expect(summarizeRatingOptions({
      ...base,
      ratingAllowZero: true,
      ratingMax: "3",
    })).toBe("0–3 stars");
  });

  it("appends half-step and label notes when enabled", () => {
    expect(summarizeRatingOptions({
      ...base,
      ratingAllowHalf: true,
      ratingShowLabel: true,
      ratingLabel: "out of 5",
    })).toBe("1–5 stars · half steps · label \"out of 5\"");
    // Show-label on but blank label → no label segment.
    expect(summarizeRatingOptions({
      ...base,
      ratingShowLabel: true,
      ratingLabel: "  ",
    })).toBe("1–5 stars");
  });
});

describe("summarizeCategories / summarizeMediaTypes", () => {
  it("handles all/none/singular/plural for categories", () => {
    expect(summarizeCategories(true, [])).toBe("All categories");
    expect(summarizeCategories(false, [])).toBe("No categories");
    expect(summarizeCategories(false, ["a"])).toBe("1 category");
    expect(summarizeCategories(false, ["a", "b"])).toBe("2 categories");
  });

  it("handles all/none/singular/plural for media types", () => {
    expect(summarizeMediaTypes(true, [])).toBe("All media types");
    expect(summarizeMediaTypes(false, [])).toBe("No media types");
    expect(summarizeMediaTypes(false, ["a"])).toBe("1 media type");
    expect(summarizeMediaTypes(false, ["a", "b"])).toBe("2 media types");
  });
});
