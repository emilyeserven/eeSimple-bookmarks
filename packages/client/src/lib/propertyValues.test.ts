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
      },
      {
        propertyId: "neg",
        value: -5,
      },
    ]);
  });
});
