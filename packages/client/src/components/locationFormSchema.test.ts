import { describe, expect, it } from "vitest";

import { emptyAncestorDraft, splitAncestorChain } from "./locationFormSchema";

describe("splitAncestorChain", () => {
  it("returns a root chain (no parent) when every ancestor is newly named", () => {
    const ancestors = [
      {
        ...emptyAncestorDraft(),
        name: "Yamaguchi Prefecture",
      },
      {
        ...emptyAncestorDraft(),
        name: "Japan",
      },
    ];

    const split = splitAncestorChain(ancestors);

    expect(split.parentId).toBeNull();
    expect(split.newAncestors.map(a => a.name)).toEqual(["Yamaguchi Prefecture", "Japan"]);
  });

  it("drops blank (unnamed, non-existing) ancestor rows", () => {
    const ancestors = [
      {
        ...emptyAncestorDraft(),
        name: "Yamaguchi Prefecture",
      },
      emptyAncestorDraft(),
    ];

    const split = splitAncestorChain(ancestors);

    expect(split.parentId).toBeNull();
    expect(split.newAncestors.map(a => a.name)).toEqual(["Yamaguchi Prefecture"]);
  });

  it("anchors the chain to a reused existing ancestor and keeps the new rows below it", () => {
    const ancestors = [
      {
        ...emptyAncestorDraft(),
        name: "Yamaguchi Prefecture",
      },
      {
        ...emptyAncestorDraft(),
        existingId: "japan-id",
      },
    ];

    const split = splitAncestorChain(ancestors);

    expect(split.parentId).toBe("japan-id");
    expect(split.newAncestors.map(a => a.name)).toEqual(["Yamaguchi Prefecture"]);
  });

  it("uses an existing ancestor alone as the parent with no new rows", () => {
    const ancestors = [
      {
        ...emptyAncestorDraft(),
        existingId: "japan-id",
      },
    ];

    const split = splitAncestorChain(ancestors);

    expect(split.parentId).toBe("japan-id");
    expect(split.newAncestors).toEqual([]);
  });
});
