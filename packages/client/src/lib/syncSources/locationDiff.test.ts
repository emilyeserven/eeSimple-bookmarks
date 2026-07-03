// @vitest-environment node
import type { LocationLookupCandidate } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildLocationDiff } from "./locationDiff";

function candidate(overrides: Partial<LocationLookupCandidate> = {}): LocationLookupCandidate {
  return {
    name: "Tokyo",
    romanizedName: "Tokyo",
    displayName: "Tokyo, Japan",
    latitude: 35.6762,
    longitude: 139.6503,
    placeType: "city",
    countryCode: "JP",
    mapUrl: "https://maps.example/tokyo",
    boundary: null,
    ancestors: [],
    wikidataId: null,
    ...overrides,
  };
}

const EMPTY_CURRENT = {
  latitude: null,
  longitude: null,
  mapUrl: null,
  placeType: null,
  countryCode: null,
};

describe("buildLocationDiff", () => {
  it("offers every geocoded field when the location has none yet, all checked (fill-empty)", () => {
    const diff = buildLocationDiff(candidate(), EMPTY_CURRENT);
    const rows = diff.groups[0].rows;
    expect(rows.map(r => r.key)).toEqual([
      "latitude", "longitude", "mapUrl", "placeType", "countryCode",
    ]);
    expect(rows.every(r => r.defaultChecked)).toBe(true);
    expect(diff.groups[0].source).toBe("Geocoding");
  });

  it("marks a would-overwrite row unchecked by default", () => {
    const diff = buildLocationDiff(candidate({
      placeType: "metropolis",
    }), {
      ...EMPTY_CURRENT,
      placeType: "city",
    });
    const placeType = diff.groups[0].rows.find(r => r.key === "placeType");
    expect(placeType?.defaultChecked).toBe(false);
    expect(placeType?.current).toBe("city");
    expect(placeType?.next).toBe("metropolis");
  });

  it("omits fields that already match and fields the geocoder didn't return", () => {
    const diff = buildLocationDiff(candidate({
      mapUrl: null,
      countryCode: "JP",
    }), {
      ...EMPTY_CURRENT,
      latitude: 35.6762,
      longitude: 139.6503,
      countryCode: "JP",
    });
    const keys = diff.groups[0].rows.map(r => r.key);
    expect(keys).not.toContain("latitude"); // already matches
    expect(keys).not.toContain("longitude"); // already matches
    expect(keys).not.toContain("mapUrl"); // candidate has none
    expect(keys).not.toContain("countryCode"); // already matches
    expect(keys).toContain("placeType");
  });

  it("carries a { field, value } payload for the registration hook to apply", () => {
    const diff = buildLocationDiff(candidate(), EMPTY_CURRENT);
    const lat = diff.groups[0].rows.find(r => r.key === "latitude");
    expect(lat?.payload).toEqual({
      field: "latitude",
      value: 35.6762,
    });
  });
});
