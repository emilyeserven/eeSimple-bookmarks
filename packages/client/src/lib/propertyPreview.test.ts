// @vitest-environment node
import { describe, expect, it } from "vitest";

import { propertyPreviewSummary } from "./propertyPreview";
import { makeCustomProperty } from "../test-utils/factories";

describe("propertyPreviewSummary", () => {
  it("renders a number range with the plural unit", () => {
    const property = makeCustomProperty({
      type: "number",
      numberMin: 1,
      numberMax: 100,
      unitPlural: "pages",
    });
    expect(propertyPreviewSummary(property, [property])).toBe("1 – 100 pages");
  });

  it("falls back to 'auto' for unset number bounds and omits a blank unit", () => {
    const property = makeCustomProperty({
      type: "number",
      numberMin: null,
      numberMax: null,
      unitPlural: null,
    });
    expect(propertyPreviewSummary(property, [property])).toBe("auto – auto");
  });

  it("sums a calculate property's resolvable operand names", () => {
    const a = makeCustomProperty({
      id: "a",
      name: "Pages",
    });
    const b = makeCustomProperty({
      id: "b",
      name: "Words",
    });
    const calc = makeCustomProperty({
      type: "calculate",
      operandPropertyIds: ["a", "b"],
    });
    expect(propertyPreviewSummary(calc, [a, b, calc])).toBe("Σ Pages + Words");
  });

  it("returns null for a calculate property whose operands can't be resolved", () => {
    const calc = makeCustomProperty({
      type: "calculate",
      operandPropertyIds: ["missing"],
    });
    expect(propertyPreviewSummary(calc, [calc])).toBeNull();
  });

  it("returns null for property types without a summary", () => {
    expect(propertyPreviewSummary(makeCustomProperty({
      type: "boolean",
    }), [])).toBeNull();
    expect(propertyPreviewSummary(makeCustomProperty({
      type: "text",
    }), [])).toBeNull();
  });
});
