import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  fetchKavitaSeriesCover,
  fetchKavitaSeriesDetail,
  kavitaEnabledAsync,
  resetKavitaAuthCache,
  searchKavitaByIsbn,
  searchKavitaSeries,
} from "@/services/kavita";
import { clearKavitaEnv, configureKavitaEnv as configure, stubFetchSequence } from "@/tests/kavitaTestUtils";

afterEach(() => {
  clearKavitaEnv();
  resetKavitaAuthCache();
});

const SEARCH_BODY = JSON.stringify({
  series: [
    {
      seriesId: 12,
      libraryId: 3,
      name: "Berserk",
      libraryName: "Manga",
      releaseYear: 1989,
    },
    {
      // Missing seriesId — dropped by the mapper.
      libraryId: 3,
      name: "Broken entry",
    },
    {
      seriesId: 44,
      libraryId: 1,
      name: "Dune",
      releaseYear: 0,
    },
  ],
});

test("kavitaEnabledAsync requires both endpoint and API key", async () => {
  assert.equal(await kavitaEnabledAsync(), false);
  process.env.KAVITA_ENDPOINT = "http://kavita:5000";
  assert.equal(await kavitaEnabledAsync(), false);
  process.env.KAVITA_API_KEY = "secret-key";
  assert.equal(await kavitaEnabledAsync(), true);
});

test("searchKavitaSeries returns [] when unconfigured", async () => {
  assert.deepEqual(await searchKavitaSeries("dune"), []);
});

test("searchKavitaSeries authenticates then maps the series results", async () => {
  configure();
  const {
    requests, restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: JSON.stringify({
        token: "jwt-token",
      }),
    },
    {
      status: 200,
      body: SEARCH_BODY,
    },
  ]);
  try {
    const results = await searchKavitaSeries("dune");
    assert.deepEqual(results, [
      {
        seriesId: 12,
        libraryId: 3,
        name: "Berserk",
        libraryName: "Manga",
        releaseYear: 1989,
      },
      {
        seriesId: 44,
        libraryId: 1,
        name: "Dune",
        libraryName: null,
        releaseYear: null,
      },
    ]);
    assert.equal(requests.length, 2);
    // Auth call carries the encoded key + plugin name as query params.
    assert.ok(requests[0].url.startsWith("http://kavita:5000/api/Plugin/authenticate?"));
    assert.ok(requests[0].url.includes("apiKey=secret-key"));
    assert.ok(requests[0].url.includes("pluginName=eeSimple%20Bookmarks"));
    assert.equal(requests[0].init?.method, "POST");
    // Search call carries the JWT.
    assert.ok(requests[1].url.startsWith("http://kavita:5000/api/Search/search?queryString=dune"));
    const headers = requests[1].init?.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer jwt-token");
  }
  finally {
    restore();
  }
});

test("searchKavitaSeries reuses the cached token across calls", async () => {
  configure();
  const {
    requests, restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: JSON.stringify({
        token: "jwt-token",
      }),
    },
    {
      status: 200,
      body: SEARCH_BODY,
    },
  ]);
  try {
    await searchKavitaSeries("first");
    await searchKavitaSeries("second");
    // One auth + two searches — no re-authentication for the second search.
    assert.equal(requests.filter(r => r.url.includes("/api/Plugin/authenticate")).length, 1);
    assert.equal(requests.filter(r => r.url.includes("/api/Search/search")).length, 2);
  }
  finally {
    restore();
  }
});

test("searchKavitaSeries re-authenticates once on a 401 and retries", async () => {
  configure();
  const {
    requests, restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: JSON.stringify({
        token: "stale-token",
      }),
    },
    {
      status: 401,
    },
    {
      status: 200,
      body: JSON.stringify({
        token: "fresh-token",
      }),
    },
    {
      status: 200,
      body: SEARCH_BODY,
    },
  ]);
  try {
    const results = await searchKavitaSeries("dune");
    assert.equal(results.length, 2);
    assert.equal(requests.filter(r => r.url.includes("/api/Plugin/authenticate")).length, 2);
    const lastSearch = requests[requests.length - 1];
    const headers = lastSearch.init?.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer fresh-token");
  }
  finally {
    restore();
  }
});

test("searchKavitaSeries returns [] when the retry is also unauthorized", async () => {
  configure();
  const {
    restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: JSON.stringify({
        token: "token",
      }),
    },
    {
      status: 401,
    },
    {
      status: 200,
      body: JSON.stringify({
        token: "token-2",
      }),
    },
    {
      status: 401,
    },
  ]);
  try {
    assert.deepEqual(await searchKavitaSeries("dune"), []);
  }
  finally {
    restore();
  }
});

test("searchKavitaSeries returns [] when authentication fails", async () => {
  configure();
  const {
    restore,
  } = stubFetchSequence([
    {
      status: 500,
    },
  ]);
  try {
    assert.deepEqual(await searchKavitaSeries("dune"), []);
  }
  finally {
    restore();
  }
});

test("searchKavitaByIsbn passes includeChapterAndFiles=true and resolves the matching chapter's series", async () => {
  configure();
  const {
    requests, restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: JSON.stringify({
        token: "jwt-token",
      }),
    },
    {
      status: 200,
      body: JSON.stringify({
        series: [],
        chapters: [{
          id: 77,
          isbn: "9780345391803",
        }],
      }),
    },
    {
      status: 200,
      body: JSON.stringify({
        id: 12,
        libraryId: 3,
        name: "The Hitchhiker's Guide to the Galaxy",
        libraryName: "Books",
      }),
    },
  ]);
  try {
    const outcome = await searchKavitaByIsbn("9780345391803");
    assert.deepEqual(outcome, {
      status: "ok",
      result: {
        seriesId: 12,
        libraryId: 3,
        name: "The Hitchhiker's Guide to the Galaxy",
        libraryName: "Books",
        releaseYear: null,
      },
    });
    assert.ok(requests[1].url.includes("includeChapterAndFiles=true"));
    assert.ok(requests[1].url.includes("queryString=9780345391803"));
    assert.ok(requests[2].url.startsWith("http://kavita:5000/api/Search/series-for-chapter?chapterId=77"));
  }
  finally {
    restore();
  }
});

test("searchKavitaByIsbn reports no_match when no chapter's ISBN matched", async () => {
  configure();
  const {
    restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: JSON.stringify({
        token: "jwt-token",
      }),
    },
    {
      status: 200,
      body: JSON.stringify({
        series: [],
        chapters: [],
      }),
    },
  ]);
  try {
    assert.deepEqual(await searchKavitaByIsbn("9780345391803"), {
      status: "no_match",
    });
  }
  finally {
    restore();
  }
});

test("searchKavitaByIsbn reports unreachable when the search request fails", async () => {
  configure();
  const {
    restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: JSON.stringify({
        token: "jwt-token",
      }),
    },
    {
      status: 500,
    },
  ]);
  try {
    assert.deepEqual(await searchKavitaByIsbn("9780345391803"), {
      status: "unreachable",
    });
  }
  finally {
    restore();
  }
});

test("fetchKavitaSeriesCover fetches bytes with the apiKey query param (no JWT)", async () => {
  configure();
  const bytes = new TextEncoder().encode("fake-image-bytes");
  const {
    requests, restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: bytes.buffer as ArrayBuffer,
    },
  ]);
  try {
    const cover = await fetchKavitaSeriesCover(12);
    assert.ok(cover);
    assert.equal(cover.toString(), "fake-image-bytes");
    assert.equal(requests.length, 1);
    assert.ok(requests[0].url.startsWith("http://kavita:5000/api/Image/series-cover?seriesId=12&apiKey=secret-key"));
    assert.equal(requests[0].init?.headers, undefined);
  }
  finally {
    restore();
  }
});

test("fetchKavitaSeriesCover returns null when unconfigured or on failure", async () => {
  assert.equal(await fetchKavitaSeriesCover(12), null);
  configure();
  const {
    restore,
  } = stubFetchSequence([
    {
      status: 404,
    },
  ]);
  try {
    assert.equal(await fetchKavitaSeriesCover(12), null);
  }
  finally {
    restore();
  }
});

test("fetchKavitaSeriesDetail reports unavailable when unconfigured", async () => {
  assert.deepEqual(await fetchKavitaSeriesDetail(12), {
    status: "unavailable",
  });
});

test("fetchKavitaSeriesDetail fetches the current name and release year", async () => {
  configure();
  const {
    requests, restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: JSON.stringify({
        token: "jwt-token",
      }),
    },
    {
      status: 200,
      body: JSON.stringify({
        name: "Berserk",
      }),
    },
    {
      status: 200,
      body: JSON.stringify({
        releaseYear: 1989,
      }),
    },
  ]);
  try {
    const outcome = await fetchKavitaSeriesDetail(12);
    assert.deepEqual(outcome, {
      status: "ok",
      result: {
        seriesId: 12,
        name: "Berserk",
        releaseYear: 1989,
      },
    });
    assert.ok(requests[1].url.startsWith("http://kavita:5000/api/Series/12"));
    assert.ok(requests[2].url.startsWith("http://kavita:5000/api/Metadata/series/12"));
  }
  finally {
    restore();
  }
});

test("fetchKavitaSeriesDetail falls back to a null release year when the metadata call fails", async () => {
  configure();
  const {
    restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: JSON.stringify({
        token: "jwt-token",
      }),
    },
    {
      status: 200,
      body: JSON.stringify({
        name: "Berserk",
      }),
    },
    {
      status: 500,
    },
  ]);
  try {
    const outcome = await fetchKavitaSeriesDetail(12);
    assert.deepEqual(outcome, {
      status: "ok",
      result: {
        seriesId: 12,
        name: "Berserk",
        releaseYear: null,
      },
    });
  }
  finally {
    restore();
  }
});

test("fetchKavitaSeriesDetail reports not_found on a 404", async () => {
  configure();
  const {
    restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: JSON.stringify({
        token: "jwt-token",
      }),
    },
    {
      status: 404,
    },
  ]);
  try {
    assert.deepEqual(await fetchKavitaSeriesDetail(12), {
      status: "not_found",
    });
  }
  finally {
    restore();
  }
});

test("fetchKavitaSeriesDetail reports unavailable when the series request errors", async () => {
  configure();
  const {
    restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: JSON.stringify({
        token: "jwt-token",
      }),
    },
    {
      status: 500,
    },
  ]);
  try {
    assert.deepEqual(await fetchKavitaSeriesDetail(12), {
      status: "unavailable",
    });
  }
  finally {
    restore();
  }
});
