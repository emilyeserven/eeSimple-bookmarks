// @vitest-environment node
import { describe, expect, it } from "vitest";

import { ApiError, describeError } from "./apiError";

describe("describeError", () => {
  it("translates a known error code to its mapped phrase", () => {
    // At `lng: "en"` the phrase key resolves to itself; params are interpolated.
    expect(
      describeError(new ApiError("Bookmark not found", "notFound", undefined, {
        entity: "Bookmark",
      })),
    ).toBe("Bookmark not found");
  });

  it("interpolates params into a coded message", () => {
    expect(
      describeError(
        new ApiError("A media type named \"X\" already exists", "duplicateName", undefined, {
          entity: "media type",
          name: "X",
        }),
      ),
    ).toBe("A media type named \"X\" already exists");
  });

  it("falls back to the raw message for an unmapped code", () => {
    expect(
      describeError(new ApiError("A calculate property needs at least two operands", "validation")),
    ).toBe("A calculate property needs at least two operands");
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
