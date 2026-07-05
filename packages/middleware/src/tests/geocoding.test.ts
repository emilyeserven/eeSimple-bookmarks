import assert from "node:assert/strict";
import { test } from "node:test";
import { geocodeLocation, geocodingEnabled, geocodingEndpoint } from "@/services/geocoding";

const NOMINATIM_HIT = JSON.stringify([
  {
    display_name: "萩市, 山口県, 日本",
    name: "Hagi",
    lat: "34.4083",
    lon: "131.3990",
    addresstype: "city",
    address: {
      city: "萩市",
      state: "山口県",
      country: "日本",
      country_code: "jp",
    },
    namedetails: {
      "name": "萩市",
      "name:en": "Hagi",
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

test("geocodeLocation prefers the local name as title and the English name as englishName", async () => {
  const restore = stubFetch(() => new Response(NOMINATIM_HIT, {
    status: 200,
  }));
  try {
    const result = await geocodeLocation("Hagi");
    assert.equal(result.results.length, 1);
    const [hit] = result.results;
    // Native-script name is the title; English is relegated to the romanized form.
    assert.equal(hit.name, "萩市");
    assert.equal(hit.englishName, "Hagi");
    assert.equal(hit.displayName, "萩市, 山口県, 日本");
    assert.equal(hit.latitude, 34.4083);
    assert.equal(hit.longitude, 131.399);
    assert.equal(hit.placeType, "city");
    assert.equal(hit.countryCode, "JP");
    assert.match(hit.mapUrl ?? "", /google\.com\/maps/);
    // The address hierarchy above the city becomes ancestors, immediate-parent-first; the city
    // itself (the leaf) is excluded, and each ancestor carries the shared country code.
    assert.deepEqual(hit.ancestors, [
      {
        name: "山口県",
        placeType: "state",
        countryCode: "JP",
        wikidataId: null,
      },
      {
        name: "日本",
        placeType: "country",
        countryCode: "JP",
        wikidataId: null,
      },
    ]);
  }
  finally {
    restore();
  }
});

test("geocodeLocation returns no ancestors when the address has no admin levels above the leaf", async () => {
  const flatHit = JSON.stringify([
    {
      display_name: "Null Island",
      name: "Null Island",
      lat: "0",
      lon: "0",
      addresstype: "city",
      address: {
        city: "Null Island",
        country_code: "xx",
      },
      namedetails: {
        name: "Null Island",
      },
    },
  ]);
  const restore = stubFetch(() => new Response(flatHit, {
    status: 200,
  }));
  try {
    const [hit] = (await geocodeLocation("Null Island")).results;
    assert.deepEqual(hit.ancestors, []);
  }
  finally {
    restore();
  }
});

test("geocodeLocation leaves englishName null when the name is already Latin", async () => {
  const latinHit = JSON.stringify([
    {
      display_name: "Springfield, Illinois, United States",
      name: "Springfield",
      lat: "39.8",
      lon: "-89.6",
      addresstype: "city",
      address: {
        country_code: "us",
      },
      namedetails: {
        "name": "Springfield",
        "name:en": "Springfield",
      },
    },
  ]);
  const restore = stubFetch(() => new Response(latinHit, {
    status: 200,
  }));
  try {
    const [hit] = (await geocodeLocation("Springfield")).results;
    assert.equal(hit.name, "Springfield");
    assert.equal(hit.englishName, null);
  }
  finally {
    restore();
  }
});

test("geocodeLocation captures a Polygon geojson as the boundary but drops a Point geojson", async () => {
  const hits = JSON.stringify([
    {
      display_name: "Kyoto, Japan",
      name: "Kyoto",
      lat: "35.0",
      lon: "135.76",
      addresstype: "city",
      address: {
        country_code: "jp",
      },
      geojson: {
        type: "Polygon",
        coordinates: [[[135.7, 35.0], [135.8, 35.0], [135.8, 35.1], [135.7, 35.0]]],
      },
    },
    {
      display_name: "A point place",
      name: "Point",
      lat: "1",
      lon: "2",
      geojson: {
        type: "Point",
        coordinates: [2, 1],
      },
    },
  ]);
  const restore = stubFetch(() => new Response(hits, {
    status: 200,
  }));
  try {
    const {
      results,
    } = await geocodeLocation("Kyoto");
    assert.equal(results[0]?.boundary?.type, "Polygon");
    // A Point geojson is just the coordinate we already store → no boundary.
    assert.equal(results[1]?.boundary, null);
  }
  finally {
    restore();
  }
});

test("geocodeLocation returns no results for an empty query (no fetch)", async () => {
  const result = await geocodeLocation("   ");
  assert.deepEqual(result.results, []);
});

/** A URL-aware stub so the Nominatim miss and the Wikidata fallback can return different bodies. */
function stubByUrl(route: (url: URL) => unknown): () => void {
  const original = global.fetch;
  global.fetch = (async (input: string | URL) => {
    return new Response(JSON.stringify(route(new URL(String(input)))), {
      status: 200,
    });
  }) as typeof fetch;
  return () => {
    global.fetch = original;
  };
}

test("geocodeLocation falls back to Wikidata when Nominatim has no entry", async () => {
  const restore = stubByUrl((url) => {
    // Nominatim returns nothing for a traditional region with no admin boundary…
    if (url.hostname.includes("nominatim")) return [];
    // …so the Wikidata fallback resolves it (coordinate + country, no constituents → pin).
    if (url.searchParams.get("action") === "wbsearchentities") {
      return {
        search: [{
          id: "Q127864",
        }],
      };
    }
    const ids = (url.searchParams.get("ids") ?? "").split("|");
    if (ids.includes("Q127864")) {
      return {
        entities: {
          Q127864: {
            labels: {
              ja: {
                value: "中国地方",
              },
              en: {
                value: "Chūgoku region",
              },
            },
            claims: {
              P625: [{
                mainsnak: {
                  datavalue: {
                    value: {
                      latitude: 35.05,
                      longitude: 134.0667,
                    },
                  },
                },
              }],
              P17: [{
                mainsnak: {
                  datavalue: {
                    value: {
                      id: "Q17",
                    },
                  },
                },
              }],
            },
          },
        },
      };
    }
    return {
      entities: {
        Q17: {
          labels: {
            en: {
              value: "Japan",
            },
          },
          claims: {
            P297: [{
              mainsnak: {
                datavalue: {
                  value: "JP",
                },
              },
            }],
          },
        },
      },
    };
  });
  try {
    const {
      results,
    } = await geocodeLocation("中国地方");
    assert.equal(results.length, 1);
    assert.equal(results[0]?.name, "中国地方");
    assert.equal(results[0]?.countryCode, "JP");
    // No P150/P402/P3896 in this fixture → the region resolves to a pin (boundary backfillable later).
    assert.equal(results[0]?.boundary, null);
  }
  finally {
    restore();
  }
});

test("geocodeLocation keeps the Nominatim result and never calls Wikidata on a hit", async () => {
  let wikidataCalled = false;
  const restore = stubByUrl((url) => {
    if (url.hostname.includes("wikidata") || url.pathname.endsWith("/geoshape")) {
      wikidataCalled = true;
      return {};
    }
    return JSON.parse(NOMINATIM_HIT) as unknown;
  });
  try {
    const {
      results,
    } = await geocodeLocation("Hagi");
    assert.equal(results[0]?.name, "萩市");
    assert.equal(wikidataCalled, false);
  }
  finally {
    restore();
  }
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
