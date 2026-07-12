// @vitest-environment node
import { describe, expect, it } from "vitest";

import { makeCustomProperty as property } from "../test-utils/factories";
import { buildNumberValuesFromInputs } from "./propertyValues";

describe("buildNumberValuesFromInputs", () => {
  it("keeps only number and ratingScale properties", () => {
    const props = [
      property({
        id: "n",
        type: "number",
      }),
      property({
        id: "r",
        type: "ratingScale",
      }),
      property({
        id: "b",
        type: "boolean",
      }),
      property({
        id: "t",
        type: "datetime",
      }),
    ];
    const result = buildNumberValuesFromInputs(props, {
      n: "1",
      r: "2",
      b: "3",
      t: "4",
    });
    expect(result.map(v => v.propertyId).sort()).toEqual(["n", "r"]);
  });

  it("parses the raw string input to a number", () => {
    const result = buildNumberValuesFromInputs([property({
      id: "n",
      type: "number",
    })], {
      n: "42",
    });
    expect(result).toEqual([{
      propertyId: "n",
      value: 42,
      valueEnd: null,
    }]);
  });

  it("skips blank, whitespace-only, and non-numeric inputs", () => {
    const props = [
      property({
        id: "blank",
        type: "number",
      }),
      property({
        id: "space",
        type: "number",
      }),
      property({
        id: "nan",
        type: "number",
      }),
    ];
    const result = buildNumberValuesFromInputs(props, {
      blank: "",
      space: "   ",
      nan: "abc",
    });
    expect(result).toEqual([]);
  });

  it("treats a missing input key as empty (skipped)", () => {
    const result = buildNumberValuesFromInputs([property({
      id: "n",
      type: "number",
    })], {});
    expect(result).toEqual([]);
  });

  it("parses zero and negative numbers", () => {
    const props = [property({
      id: "z",
      type: "number",
    }), property({
      id: "neg",
      type: "number",
    })];
    const result = buildNumberValuesFromInputs(props, {
      z: "0",
      neg: "-5",
    });
    expect(result).toEqual([
      {
        propertyId: "z",
        value: 0,
        valueEnd: null,
      },
      {
        propertyId: "neg",
        value: -5,
        valueEnd: null,
      },
    ]);
  });

  it("parses a ratingScale range (from~to) only when the property allows a range", () => {
    const rangeProp = property({
      id: "r",
      type: "ratingScale",
      ratingAllowRange: true,
    });
    const single = buildNumberValuesFromInputs([property({
      id: "r",
      type: "ratingScale",
    })], {
      r: "2~4",
    });
    // Without ratingAllowRange the high end is dropped (keeps the low end as a single value).
    expect(single).toEqual([{
      propertyId: "r",
      value: 2,
      valueEnd: null,
    }]);
    const range = buildNumberValuesFromInputs([rangeProp], {
      r: "2~4",
    });
    expect(range).toEqual([{
      propertyId: "r",
      value: 2,
      valueEnd: 4,
    }]);
  });

  it("normalizes a reversed range and collapses equal ends", () => {
    const rangeProp = property({
      id: "r",
      type: "ratingScale",
      ratingAllowRange: true,
    });
    expect(buildNumberValuesFromInputs([rangeProp], {
      r: "5~1",
    })).toEqual([{
      propertyId: "r",
      value: 1,
      valueEnd: 5,
    }]);
    expect(buildNumberValuesFromInputs([rangeProp], {
      r: "3~3",
    })).toEqual([{
      propertyId: "r",
      value: 3,
      valueEnd: null,
    }]);
  });
});
