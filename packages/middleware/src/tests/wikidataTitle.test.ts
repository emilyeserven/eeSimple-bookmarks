import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveTitleWikidata } from "@/services/wikidataTitle";

/**
 * Install a URL-aware `fetch` stub returning canned Wikidata Action-API bodies keyed by request:
 * `haswbstatement` search, `wbsearchentities`, and `wbgetentities` (entity hydration + language ISO).
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

/** A plain-string snak (external-ids / language codes). */
function stringSnak(value: string) {
  return {
    mainsnak: {
      datavalue: {
        value,
      },
    },
  };
}

/** A monolingual-text snak (`{ text, language }`, e.g. P1705 native label). */
function monolingualSnak(text: string, language: string) {
  return {
    mainsnak: {
      datavalue: {
        value: {
          text,
          language,
        },
      },
    },
  };
}

/** An entity-id snak (`{ id: "Q…" }`, e.g. P364 original language). */
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

test("resolveTitleWikidata uses an IMDb ID to pin the item, native label → name, en → romanized", async () => {
  const restore = stubFetch((url) => {
    const srsearch = url.searchParams.get("srsearch");
    if (srsearch === "haswbstatement:P345=tt6751668") {
      return {
        query: {
          search: [{
            title: "Q18535601",
          }],
        },
      };
    }
    if (url.searchParams.get("action") === "wbgetentities") {
      return {
        entities: {
          Q18535601: {
            labels: {
              en: {
                value: "Parasite",
              },
              ko: {
                value: "기생충",
              },
            },
            claims: {
              P1705: [monolingualSnak("기생충", "ko")],
            },
            sitelinks: {
              enwiki: {
                title: "Parasite (2019 film)",
                url: "https://en.wikipedia.org/wiki/Parasite_(2019_film)",
              },
              kowiki: {
                title: "기생충 (영화)",
                url: "https://ko.wikipedia.org/wiki/기생충_(영화)",
              },
            },
          },
        },
      };
    }
    return {};
  });
  try {
    const result = await resolveTitleWikidata({
      name: "Parasite",
      externalIds: [{
        property: "P345",
        value: "tt6751668",
      }],
    });
    assert.ok(result);
    assert.equal(result.wikidataId, "Q18535601");
    assert.equal(result.name, "기생충");
    assert.equal(result.romanizedName, "Parasite");
    assert.equal(result.wikipediaLinkEn, "https://en.wikipedia.org/wiki/Parasite_(2019_film)");
    assert.equal(result.wikipediaLinkLocal, "https://ko.wikipedia.org/wiki/기생충_(영화)");
  }
  finally {
    restore();
  }
});

test("resolveTitleWikidata falls back to a title search and P364 original-language label", async () => {
  const restore = stubFetch((url) => {
    if (url.searchParams.get("action") === "wbsearchentities") {
      return {
        search: [{
          id: "Q18535601",
        }],
      };
    }
    if (url.searchParams.get("action") === "wbgetentities") {
      const ids = url.searchParams.get("ids");
      if (ids === "Q9176") {
        // The Korean-language item resolves to Wikimedia code "ko".
        return {
          entities: {
            Q9176: {
              claims: {
                P424: [stringSnak("ko")],
              },
            },
          },
        };
      }
      return {
        entities: {
          Q18535601: {
            labels: {
              en: {
                value: "Parasite",
              },
              ko: {
                value: "기생충",
              },
            },
            claims: {
              P364: [idSnak("Q9176")],
            },
            sitelinks: {
              kowiki: {
                title: "기생충 (영화)",
                url: "https://ko.wikipedia.org/wiki/기생충_(영화)",
              },
            },
          },
        },
      };
    }
    return {};
  });
  try {
    const result = await resolveTitleWikidata({
      name: "Parasite",
    });
    assert.ok(result);
    assert.equal(result.name, "기생충");
    assert.equal(result.romanizedName, "Parasite");
    assert.equal(result.wikipediaLinkLocal, "https://ko.wikipedia.org/wiki/기생충_(영화)");
    assert.equal(result.wikipediaLinkEn, null);
  }
  finally {
    restore();
  }
});

test("resolveTitleWikidata leaves romanizedName null for an English-only title", async () => {
  const restore = stubFetch((url) => {
    if (url.searchParams.get("action") === "wbsearchentities") {
      return {
        search: [{
          id: "Q83495",
        }],
      };
    }
    if (url.searchParams.get("action") === "wbgetentities") {
      return {
        entities: {
          Q83495: {
            labels: {
              en: {
                value: "The Matrix",
              },
            },
            claims: {},
            sitelinks: {
              enwiki: {
                title: "The Matrix",
                url: "https://en.wikipedia.org/wiki/The_Matrix",
              },
            },
          },
        },
      };
    }
    return {};
  });
  try {
    const result = await resolveTitleWikidata({
      name: "The Matrix",
    });
    assert.ok(result);
    assert.equal(result.name, "The Matrix");
    assert.equal(result.romanizedName, null);
    assert.equal(result.wikipediaLinkEn, "https://en.wikipedia.org/wiki/The_Matrix");
    assert.equal(result.wikipediaLinkLocal, null);
  }
  finally {
    restore();
  }
});

test("resolveTitleWikidata returns null when nothing matches", async () => {
  const restore = stubFetch(() => ({
    search: [],
  }));
  try {
    const result = await resolveTitleWikidata({
      name: "Nonexistent Title",
    });
    assert.equal(result, null);
  }
  finally {
    restore();
  }
});
