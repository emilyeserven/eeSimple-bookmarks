// @vitest-environment node
import { describe, expect, it } from "vitest";

import { validateTagSearch } from "./-tagSearch";

describe("validateTagSearch", () => {
  it("accepts true / 'true' / '1' and drops anything else", () => {
    expect(validateTagSearch({
      taggedSections: true,
    }).taggedSections).toBe(true);
    expect(validateTagSearch({
      taggedSections: "true",
    }).taggedSections).toBe(true);
    expect(validateTagSearch({
      taggedSections: "1",
    }).taggedSections).toBe(true);
    expect(validateTagSearch({
      taggedSections: "0",
    }).taggedSections).toBeUndefined();
    expect(validateTagSearch({}).taggedSections).toBeUndefined();
  });

  it("preserves the shared bookmark-search fields", () => {
    expect(validateTagSearch({
      categories: ["dev"],
      taggedSections: "1",
    })).toMatchObject({
      categories: ["dev"],
      taggedSections: true,
    });
  });
});
