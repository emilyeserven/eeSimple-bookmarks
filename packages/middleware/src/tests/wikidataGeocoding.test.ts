import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveWikipediaLinks, wikidataEnabled, wikidataEndpoint, wikidataGeocode } from "@/services/wikidataGeocoding";

/**
 * Install a URL-aware `fetch` stub: `route(url)` returns the canned body for that request (Wikidata
 * Action API, the Kartographer geoshape service, or Nominatim for composed constituents). Restores
 * the original `fetch` afterward.
 */
function stubFetch(route: (url: URL) => unknown): () => void {
  const original = global.fetch;
  global.fetch = (async (input: string | URL) => {
    const url = new URL(String(input));
    return new Response(JSON.stringify(route(url)), {
      status: 200,
    });
  }) as typeof fetch;
  return () => {
    global.fetch = original;
  };
}

/** A Wikidata entity-id snak (`{ id: "Q…" }`). */
function idSnak(id: string) {
  return {
    mainsnak: {
      datavalue: {
        value: {
          id,
        },
      },
    },
  };
}

/** A plain-string snak (external-ids like `P297` / `P3896`). */
function stringSnak(value: string) {
  return {
    mainsnak: {
      datavalue: {
        value,
      },
    },
  };
}

/** A `P625` globe-coordinate snak. */
function coordSnak(latitude: number, longitude: number) {
  return {
    mainsnak: {
      datavalue: {
        value: {
          latitude,
          longitude,
        },
      },
    },
  };
}

function label(ja: string | null, en: string | null) {
  const labels: Record<string, { value: string }> = {};
  if (ja !== null) labels.ja = {
    value: ja,
  };
  if (en !== null) labels.en = {
    value: en,
  };
  return labels;
}

/** A Nominatim `/search` hit carrying a square Polygon boundary. */
function nominatimPolygon(name: string, ring: number[][]) {
  return [
    {
      display_name: `${name}, 日本`,
      name,
      lat: String(ring[0]?.[1] ?? 0),
      lon: String(ring[0]?.[0] ?? 0),
      addresstype: "state",
      address: {
        country_code: "jp",
      },
      geojson: {
        type: "Polygon",
        coordinates: [ring],
      },
    },
  ];
}

const SQUARE_HIROSHIMA = [[132, 34], [133, 34], [133, 35], [132, 35], [132, 34]];
const SQUARE_OKAYAMA = [[134, 34], [135, 34], [135, 35], [134, 35], [134, 34]];

/**
 * Canned Wikidata graph for 中国地方 (Q127864): a coordinate, country (Q17 → JP), a `P131` that
 * dedups against the country, two `P150` constituents (Hiroshima/Okayama, outlined by Nominatim), and
 * an instance-of for the place type. No linked outline → the area is composed from the constituents.
 */
function chugokuRoute(url: URL): unknown {
  if (url.searchParams.get("action") === "wbsearchentities") {
    return {
      search: [{
        id: "Q127864",
      }],
    };
  }
  if (url.searchParams.get("action") === "wbgetentities") {
    const ids = (url.searchParams.get("ids") ?? "").split("|");
    if (ids.includes("Q127864")) {
      return {
        entities: {
          Q127864: {
            labels: label("中国地方", "Chūgoku region"),
            claims: {
              P625: [coordSnak(35.05, 134.0667)],
              P17: [idSnak("Q17")],
              P131: [idSnak("Q17")],
              P150: [idSnak("Q131287"), idSnak("Q131286")],
              P31: [idSnak("Q9357658")],
            },
          },
        },
      };
    }
    return {
      entities: {
        Q17: {
          labels: label("日本", "Japan"),
          claims: {
            P297: [stringSnak("jp")],
          },
        },
        Q131287: {
          labels: label("広島県", "Hiroshima Prefecture"),
        },
        Q131286: {
          labels: label("岡山県", "Okayama Prefecture"),
        },
        Q9357658: {
          labels: label("地方", "region of Japan"),
        },
      },
    };
  }
  if (url.searchParams.get("q") === "広島県") return nominatimPolygon("広島県", SQUARE_HIROSHIMA);
  if (url.searchParams.get("q") === "岡山県") return nominatimPolygon("岡山県", SQUARE_OKAYAMA);
  return {
    search: [],
  };
}

test("wikidata fallback is keyless and reports its endpoint", () => {
  assert.equal(wikidataEnabled(), true);
  assert.ok(wikidataEndpoint().startsWith("http"));
});

test("wikidataGeocode resolves a region Nominatim lacks, with names, country, and ancestors", async () => {
  const restore = stubFetch(chugokuRoute);
  try {
    const {
      results,
    } = await wikidataGeocode("中国地方");
    assert.equal(results.length, 1);
    const [hit] = results;
    assert.equal(hit?.name, "中国地方");
    assert.equal(hit?.romanizedName, "Chūgoku region");
    assert.equal(hit?.latitude, 35.05);
    assert.equal(hit?.longitude, 134.0667);
    assert.equal(hit?.countryCode, "JP");
    assert.equal(hit?.placeType, "region of Japan");
    assert.equal(hit?.displayName, "中国地方, 日本");
    assert.equal(hit?.wikidataId, "Q127864");
    // P131 (Q17) dedups against the P17 country, leaving a single 日本 ancestor.
    assert.deepEqual(hit?.ancestors, [
      {
        name: "日本",
        placeType: null,
        countryCode: "JP",
        wikidataId: "Q17",
      },
    ]);
    assert.match(hit?.mapUrl ?? "", /google\.com\/maps/);
  }
  finally {
    restore();
  }
});

test("wikidataGeocode composes a region's area from its constituents, dissolved into one outline", async () => {
  const restore = stubFetch(chugokuRoute);
  try {
    const {
      results,
    } = await wikidataGeocode("中国地方");
    const boundary = results[0]?.boundary;
    // Two disjoint constituent squares union into a single MultiPolygon (not two stacked boundaries).
    assert.equal(boundary?.type, "MultiPolygon");
    assert.equal((boundary?.coordinates as number[][][][]).length, 2);
  }
  finally {
    restore();
  }
});

test("wikidataGeocode uses a linked OSM/geoshape outline when the item has one (no compose)", async () => {
  let nominatimCalled = false;
  const restore = stubFetch((url) => {
    if (url.hostname.includes("nominatim")) {
      nominatimCalled = true;
      return [];
    }
    if (url.pathname.endsWith("/geoshape")) {
      return {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            },
          },
        ],
      };
    }
    if (url.searchParams.get("action") === "wbsearchentities") {
      return {
        search: [{
          id: "Q1",
        }],
      };
    }
    // wbgetentities — the item carries a P3896 geoshape link, so the linked outline path is taken.
    const ids = (url.searchParams.get("ids") ?? "").split("|");
    if (ids.includes("Q1")) {
      return {
        entities: {
          Q1: {
            labels: label(null, "Linked Region"),
            claims: {
              P625: [coordSnak(0.5, 0.5)],
              P17: [idSnak("Q17")],
              P3896: [stringSnak("Data:Linked.map")],
            },
          },
        },
      };
    }
    return {
      entities: {
        Q17: {
          labels: label("日本", "Japan"),
          claims: {
            P297: [stringSnak("JP")],
          },
        },
      },
    };
  });
  try {
    const {
      results,
    } = await wikidataGeocode("Linked Region");
    assert.equal(results[0]?.boundary?.type, "Polygon");
    // The linked outline short-circuits constituent composition.
    assert.equal(nominatimCalled, false);
  }
  finally {
    restore();
  }
});

test("wikidataGeocode skips entities with no coordinate", async () => {
  const restore = stubFetch((url) => {
    if (url.searchParams.get("action") === "wbsearchentities") {
      return {
        search: [{
          id: "Q404",
        }],
      };
    }
    return {
      entities: {
        Q404: {
          labels: label(null, "Abstract concept"),
          claims: {},
        },
      },
    };
  });
  try {
    assert.deepEqual((await wikidataGeocode("something")).results, []);
  }
  finally {
    restore();
  }
});

test("wikidataGeocode returns no results when the search is empty", async () => {
  const restore = stubFetch(() => ({
    search: [],
  }));
  try {
    assert.deepEqual((await wikidataGeocode("nonexistent place")).results, []);
  }
  finally {
    restore();
  }
});

test("wikidataGeocode degrades to empty on a failed request", async () => {
  const original = global.fetch;
  global.fetch = (async () => new Response("nope", {
    status: 500,
  })) as typeof fetch;
  try {
    assert.deepEqual((await wikidataGeocode("中国地方")).results, []);
  }
  finally {
    global.fetch = original;
  }
});

test("wikidataGeocode returns no results for an empty query (no fetch)", async () => {
  const original = global.fetch;
  global.fetch = (async () => {
    throw new Error("should not fetch");
  }) as typeof fetch;
  try {
    assert.deepEqual((await wikidataGeocode("   ")).results, []);
  }
  finally {
    global.fetch = original;
  }
});

/** Route a `wbsearchentities` search to `qid` and `wbgetentities` sitelinks lookup to `sitelinks`. */
function sitelinksRoute(qid: string, sitelinks: Record<string, { title: string;
  url: string; }>) {
  return (url: URL): unknown => {
    if (url.searchParams.get("action") === "wbsearchentities") {
      return {
        search: [{
          id: qid,
        }],
      };
    }
    return {
      entities: {
        [qid]: {
          sitelinks,
        },
      },
    };
  };
}

test("resolveWikipediaLinks picks jawiki for an all-kanji Japanese title (no kana to disambiguate from Chinese)", async () => {
  // 平泉寺白山神社 carries no hiragana/katakana, so script alone is ambiguous with Chinese —
  // the location's JP country code must break the tie toward "ja".
  const restore = stubFetch(sitelinksRoute("Q1", {
    enwiki: {
      title: "Heisenji Hakusan Shrine",
      url: "https://en.wikipedia.org/wiki/Heisenji_Hakusan_Shrine",
    },
    jawiki: {
      title: "平泉寺白山神社",
      url: "https://ja.wikipedia.org/wiki/%E5%B9%B3%E6%B3%89%E5%AF%BA%E7%99%BD%E5%B1%B1%E7%A5%9E%E7%A4%BE",
    },
    zhwiki: {
      title: "平泉寺白山神社",
      url: "https://zh.wikipedia.org/wiki/%E5%B9%B3%E6%B3%89%E5%AF%BA%E7%99%BD%E5%B1%B1%E7%A5%9E%E7%A4%BE",
    },
  }));
  try {
    const result = await resolveWikipediaLinks("平泉寺白山神社", null, null, "JP");
    assert.equal(result.wikipediaLinkEn, "https://en.wikipedia.org/wiki/Heisenji_Hakusan_Shrine");
    assert.equal(
      result.wikipediaLinkLocal,
      "https://ja.wikipedia.org/wiki/%E5%B9%B3%E6%B3%89%E5%AF%BA%E7%99%BD%E5%B1%B1%E7%A5%9E%E7%A4%BE",
    );
  }
  finally {
    restore();
  }
});

test("resolveWikipediaLinks picks kowiki for an all-hanja Korean title", async () => {
  const restore = stubFetch(sitelinksRoute("Q2", {
    enwiki: {
      title: "Gyeongbokgung",
      url: "https://en.wikipedia.org/wiki/Gyeongbokgung",
    },
    kowiki: {
      title: "景福宮",
      url: "https://ko.wikipedia.org/wiki/%E6%99%AF%E7%A6%8F%E5%AE%AE",
    },
  }));
  try {
    const result = await resolveWikipediaLinks("景福宮", null, null, "KR");
    assert.equal(result.wikipediaLinkLocal, "https://ko.wikipedia.org/wiki/%E6%99%AF%E7%A6%8F%E5%AE%AE");
  }
  finally {
    restore();
  }
});

test("resolveWikipediaLinks falls back to zh for bare CJK ideographs with no country hint", async () => {
  const restore = stubFetch(sitelinksRoute("Q3", {
    zhwiki: {
      title: "測試",
      url: "https://zh.wikipedia.org/wiki/%E6%B8%AC%E8%A9%A6",
    },
  }));
  try {
    const result = await resolveWikipediaLinks("測試", null, null, null);
    assert.equal(result.wikipediaLinkLocal, "https://zh.wikipedia.org/wiki/%E6%B8%AC%E8%A9%A6");
  }
  finally {
    restore();
  }
});
