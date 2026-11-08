// @vitest-environment node
import { describe, expect, it } from "vitest";

import { ApiError, describeError } from "./apiError";

describe("describeError", () => {
  it("translates a known error code to its mapped phrase", () => {
    // At `lng: "en"` the phrase key resolves to itself; params are interpolated.
    expect(
      describeError(new ApiError("Item not found", "notFound", undefined, {
        entity: "Item",
      })),
    ).toBe("Item not found");
  });

  it("interpolates params into a coded message", () => {
    expect(
      describeError(
        new ApiError("A widget named \"X\" already exists", "duplicateName", undefined, {
          entity: "widget",
          name: "X",
        }),
      ),
    ).toBe("A widget named \"X\" already exists");
  });

  it("falls back to the raw message for an unmapped code", () => {
    expect(
      describeError(new ApiError("A widget needs at least two parts", "validation")),
    ).toBe("A widget needs at least two parts");
  });

  it("returns just the message for an ApiError without a code", () => {
    expect(describeError(new ApiError("Tag not found"))).toBe("Tag not found");
  });

  it("returns a plain Error's message", () => {
    expect(describeError(new Error("network down"))).toBe("network down");
  });

  it("falls back when the error has no useful message", () => {
    expect(describeError(new Error(""), "Reorder failed")).toBe("Reorder failed");
    expect(describeError(undefined, "Reorder failed")).toBe("Reorder failed");
    expect(describeError("just a string")).toBe("Something went wrong");
  });
});
