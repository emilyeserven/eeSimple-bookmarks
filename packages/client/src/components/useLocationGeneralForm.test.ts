// @vitest-environment node
import type { EntityName, LocationNode } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { makeLocation } from "@/test-utils/factories";

import { buildLocationAutoSaveInitial, buildLocationFormDefaults, ROOT } from "./useLocationGeneralForm";

/** A minimal English-labelled name for location fixtures. */
function enName(value: string): EntityName {
  return {
    id: value,
    language: {
      id: "en",
      name: "English",
      slug: "english",
      isoCode: "en",
    },
    value,
    isPrimary: false,
    sortOrder: 0,
  };
}

function node(overrides: Partial<LocationNode> = {}): LocationNode {
  return {
    ...makeLocation(),
    children: [],
    ...overrides,
  };
}

describe("buildLocationAutoSaveInitial", () => {
  it("resolves nullable columns to blank/zero fallbacks", () => {
    const initial = buildLocationAutoSaveInitial(node({
      name: "Tokyo",
      names: [],
      latitude: null,
      longitude: null,
      mapUrl: null,
      officialLink: null,
      tagIds: [],
    }));
    expect(initial).toMatchObject({
      name: "Tokyo",
      englishName: "",
      latitude: 0,
      longitude: 0,
      mapUrl: "",
      officialLink: "",
      parentId: null,
      tagIds: [],
    });
  });

  it("preserves present values verbatim", () => {
    const initial = buildLocationAutoSaveInitial(node({
      names: [enName("Tokyo")],
      latitude: 35.6,
      longitude: 139.7,
      parentId: "parent",
      tagIds: ["t1"],
    }));
    expect(initial.englishName).toBe("Tokyo");
    expect(initial.latitude).toBe(35.6);
    expect(initial.parentId).toBe("parent");
    expect(initial.tagIds).toEqual(["t1"]);
  });
});

describe("buildLocationFormDefaults", () => {
  it("maps a null parentId to the ROOT sentinel", () => {
    expect(buildLocationFormDefaults(node({
      parentId: null,
    })).parent).toBe(ROOT);
  });

  it("keeps a real parentId as the parent value", () => {
    expect(buildLocationFormDefaults(node({
      parentId: "p1",
    })).parent).toBe("p1");
  });

  it("falls back blank/zero for the text and coordinate fields", () => {
    const defaults = buildLocationFormDefaults(node({
      placeType: null,
      countryCode: null,
    }));
    expect(defaults.placeType).toBe("");
    expect(defaults.countryCode).toBe("");
    expect(defaults.latitude).toBe(0);
  });
});
