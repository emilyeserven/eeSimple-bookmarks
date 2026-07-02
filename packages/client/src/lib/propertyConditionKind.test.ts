// @vitest-environment node
import { describe, expect, it } from "vitest";

import { propertyValueKind } from "./propertyConditionKind";
import { makeCustomProperty as property } from "../test-utils/factories";

describe("propertyValueKind", () => {
  it("maps numeric-ish types to the number kind", () => {
    expect(propertyValueKind(property({
      type: "number",
    }))).toBe("number");
    expect(propertyValueKind(property({
      type: "calculate",
    }))).toBe("number");
    expect(propertyValueKind(property({
      type: "ratingScale",
    }))).toBe("number");
  });

  it("maps datetime to the datetime kind", () => {
    expect(propertyValueKind(property({
      type: "datetime",
    }))).toBe("datetime");
  });

  it("maps image and file to the file kind", () => {
    expect(propertyValueKind(property({
      type: "image",
    }))).toBe("file");
    expect(propertyValueKind(property({
      type: "file",
    }))).toBe("file");
  });

  it("maps boolean (and any other type) to the boolean kind", () => {
    expect(propertyValueKind(property({
      type: "boolean",
    }))).toBe("boolean");
  });
});
