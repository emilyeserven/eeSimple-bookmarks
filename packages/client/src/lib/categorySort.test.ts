// @vitest-environment node
import { describe, expect, it } from "vitest";

import { sortCategories } from "./categorySort";
import { makeCategory } from "../test-utils/factories";

const alpha = makeCategory({
  id: "a",
  name: "Alpha",
  bookmarkCount: 2,
});
const beta = makeCategory({
  id: "b",
  name: "Beta",
  bookmarkCount: 5,
});
const gamma = makeCategory({
  id: "g",
  name: "Gamma",
  bookmarkCount: 5,
});

const items = [gamma, alpha, beta];

function ids(list: ReturnType<typeof sortCategories>): string[] {
  return list.map(item => item.id);
}

describe("sortCategories", () => {
  it("sorts by name ascending", () => {
    expect(ids(sortCategories(items, "name-asc"))).toEqual(["a", "b", "g"]);
  });

  it("sorts by name descending", () => {
    expect(ids(sortCategories(items, "name-desc"))).toEqual(["g", "b", "a"]);
  });

  it("sorts by bookmark count descending, name as tie-break", () => {
    // beta & gamma both have 5 → alphabetical tie-break keeps beta before gamma.
    expect(ids(sortCategories(items, "count-desc"))).toEqual(["b", "g", "a"]);
  });

  it("sorts by bookmark count ascending, name as tie-break", () => {
    expect(ids(sortCategories(items, "count-asc"))).toEqual(["a", "b", "g"]);
  });

  it("treats a missing bookmarkCount as zero", () => {
    const none = makeCategory({
      id: "n",
      name: "Zeta",
      bookmarkCount: undefined,
    });
    expect(ids(sortCategories([alpha, none], "count-asc"))).toEqual(["n", "a"]);
  });

  it("does not mutate the input array", () => {
    const input = [gamma, alpha, beta];
    sortCategories(input, "name-asc");
    expect(ids(input)).toEqual(["g", "a", "b"]);
  });
});
