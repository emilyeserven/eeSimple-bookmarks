import type { LocationLookupAncestor } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { ancestorToInput, emptyAncestorDraft, geocodedAncestorsToDrafts, splitAncestorChain } from "./locationFormSchema";

function ancestor(name: string, placeType = "state"): LocationLookupAncestor {
  return {
    name,
    placeType,
    countryCode: "JP",
  };
}

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

describe("geocodedAncestorsToDrafts", () => {
  it("makes every level a new draft when nothing matches an existing location", () => {
    const drafts = geocodedAncestorsToDrafts(
      [ancestor("山口県", "state"), ancestor("日本", "country")],
      [],
    );

    expect(drafts).toHaveLength(2);
    expect(drafts.every(d => d.existingId === null)).toBe(true);
    expect(drafts.map(d => d.name)).toEqual(["山口県", "日本"]);
    expect(drafts.map(d => d.placeType)).toEqual(["state", "country"]);
    expect(drafts.map(d => d.countryCode)).toEqual(["JP", "JP"]);
  });

  it("reuses an existing location and caps the chain there, keeping new rows below it", () => {
    const drafts = geocodedAncestorsToDrafts(
      [ancestor("山口県", "state"), ancestor("日本", "country")],
      [{
        id: "japan-id",
        name: "日本",
      }],
    );

    // New leaf-side row kept, existing match caps the chain, nothing emitted above it.
    expect(drafts.map(d => d.name)).toEqual(["山口県", "日本"]);
    expect(drafts[0].existingId).toBeNull();
    expect(drafts[1].existingId).toBe("japan-id");
  });

  it("matches on the romanized name too", () => {
    const drafts = geocodedAncestorsToDrafts(
      [ancestor("日本", "country")],
      [{
        id: "japan-id",
        name: "日本国",
        romanizedName: "日本",
      }],
    );

    expect(drafts[0].existingId).toBe("japan-id");
  });

  it("leaves an ambiguous level (more than one match) as a new draft", () => {
    const drafts = geocodedAncestorsToDrafts(
      [ancestor("Springfield", "city")],
      [
        {
          id: "il",
          name: "Springfield",
        },
        {
          id: "mo",
          name: "springfield",
        },
      ],
    );

    expect(drafts).toHaveLength(1);
    expect(drafts[0].existingId).toBeNull();
    expect(drafts[0].name).toBe("Springfield");
  });
});

describe("ancestorToInput", () => {
  it("trims the name and collapses a blank romanized name to null", () => {
    const input = ancestorToInput({
      ...emptyAncestorDraft(),
      name: "  Yamaguchi Prefecture  ",
      romanizedName: "   ",
    });

    expect(input.name).toBe("Yamaguchi Prefecture");
    expect(input.romanizedName).toBeNull();
  });

  it("carries the looked-up coordinates and metadata through", () => {
    const input = ancestorToInput({
      ...emptyAncestorDraft(),
      name: "Japan",
      romanizedName: "Japan",
      latitude: 36,
      longitude: 138,
      placeType: "country",
      countryCode: "JP",
    });

    expect(input).toMatchObject({
      name: "Japan",
      romanizedName: "Japan",
      latitude: 36,
      longitude: 138,
      placeType: "country",
      countryCode: "JP",
    });
  });
});
