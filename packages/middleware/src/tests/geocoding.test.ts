import assert from "node:assert/strict";
import { test } from "node:test";
import { geocodeLocation, geocodingEnabled, geocodingEndpoint } from "@/services/geocoding";

const NOMINATIM_HIT = JSON.stringify([
  {
    display_name: "Tokyo, Japan",
    name: "Tokyo",
    lat: "35.6828",
    lon: "139.7595",
    addresstype: "city",
    address: {
      country_code: "jp",
    },
  },
]);

/** Stub `global.fetch` with a single canned response, restoring it afterward. */
function stubFetch(make: () => Response): () => void {
  const original = global.fetch;
  global.fetch = (async () => make()) as typeof fetch;
  return () => {
    global.fetch = original;
  };
}

test("geocoding is keyless and reports its endpoint", () => {
  assert.equal(geocodingEnabled(), true);
  assert.ok(geocodingEndpoint().startsWith("http"));
});

test("geocodeLocation maps a Nominatim hit to a candidate with coordinates and a map link", async () => {
  const restore = stubFetch(() => new Response(NOMINATIM_HIT, {
    status: 200,
  }));
  try {
    const result = await geocodeLocation("Tokyo");
    assert.equal(result.results.length, 1);
    const [hit] = result.results;
    assert.equal(hit.name, "Tokyo");
    assert.equal(hit.displayName, "Tokyo, Japan");
    assert.equal(hit.latitude, 35.6828);
    assert.equal(hit.longitude, 139.7595);
    assert.equal(hit.placeType, "city");
    assert.equal(hit.countryCode, "JP");
    assert.match(hit.mapUrl ?? "", /google\.com\/maps/);
  }
  finally {
    restore();
  }
});

test("geocodeLocation returns no results for an empty query (no fetch)", async () => {
  const result = await geocodeLocation("   ");
  assert.deepEqual(result.results, []);
});

test("geocodeLocation degrades to empty on a non-OK response", async () => {
  const restore = stubFetch(() => new Response("nope", {
    status: 500,
  }));
  try {
    assert.deepEqual((await geocodeLocation("Tokyo")).results, []);
  }
  finally {
    restore();
  }
});
