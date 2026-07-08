// @vitest-environment node
import { describe, expect, it } from "vitest";

import { sortWebsites } from "./websiteListingSort";

import { makeWebsite } from "../test-utils/factories";

const a = makeWebsite({
  id: "a",
  siteName: "Alpha",
  bookmarkCount: 2,
  createdAt: "2024-01-01T00:00:00.000Z",
});
const b = makeWebsite({
  id: "b",
  siteName: "bravo",
  bookmarkCount: 10,
  createdAt: "2024-03-01T00:00:00.000Z",
});
const c = makeWebsite({
  id: "c",
  siteName: "Charlie",
  bookmarkCount: 0,
  createdAt: "2024-02-01T00:00:00.000Z",
});
const items = [b, c, a];

const ids = (list: ReturnType<typeof sortWebsites>) => list.map(w => w.id);

describe("sortWebsites", () => {
  it("sorts by name case-insensitively both directions", () => {
    expect(ids(sortWebsites(items, "name-asc"))).toEqual(["a", "b", "c"]);
    expect(ids(sortWebsites(items, "name-desc"))).toEqual(["c", "b", "a"]);
  });

  it("sorts by bookmark count both directions (missing count = 0)", () => {
    expect(ids(sortWebsites(items, "count-desc"))).toEqual(["b", "a", "c"]);
    expect(ids(sortWebsites(items, "count-asc"))).toEqual(["c", "a", "b"]);
  });

  it("sorts by createdAt both directions", () => {
    expect(ids(sortWebsites(items, "created-desc"))).toEqual(["b", "c", "a"]);
    expect(ids(sortWebsites(items, "created-asc"))).toEqual(["a", "c", "b"]);
  });

  it("does not mutate the input array", () => {
    const input = [b, c, a];
    sortWebsites(input, "name-asc");
    expect(ids(input)).toEqual(["b", "c", "a"]);
  });
});
