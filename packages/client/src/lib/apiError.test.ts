// @vitest-environment node
import { describe, expect, it } from "vitest";

import { ApiError, describeError } from "./apiError";

describe("describeError", () => {
  it("returns the server's message for an ApiError and keeps its code/params", () => {
    const err = new ApiError("A widget named \"X\" already exists", "duplicateName", undefined, {
      entity: "widget",
      name: "X",
    });
    expect(describeError(err)).toBe("A widget named \"X\" already exists");
    expect(err.code).toBe("duplicateName");
    expect(err.params).toEqual({
      entity: "widget",
      name: "X",
    });
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
