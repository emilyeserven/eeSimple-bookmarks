// @vitest-environment node
import { describe, expect, it } from "vitest";

import { ApiError, describeError } from "./apiError";

describe("describeError", () => {
  it("includes the diagnostic code for an ApiError that carries one", () => {
    expect(describeError(new ApiError("Duplicate URL", "DUPLICATE_URL")))
      .toBe("Duplicate URL (DUPLICATE_URL)");
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
