import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  getPlexMachineIdentifier,
  plexEnabledAsync,
  resetPlexCache,
  searchPlexItems,
} from "@/services/plex";
import { stubFetchSequence } from "@/tests/kavitaTestUtils";

const PLEX_ENV_KEYS = ["PLEX_ENDPOINT", "PLEX_TOKEN"];

/** Point the connector at a fake server via env vars (the DB is unavailable in tests). */
function configure(): void {
  process.env.PLEX_ENDPOINT = "http://plex:32400";
  process.env.PLEX_TOKEN = "secret-token";
}

afterEach(() => {
  for (const k of PLEX_ENV_KEYS) delete process.env[k];
  resetPlexCache();
});

// A hub-grouped /hubs/search response spanning movies + music, with entries the mapper must keep,
// normalize (numeric ratingKey, year 0), and drop (unlinkable `collection` type, missing title).
const SEARCH_BODY = JSON.stringify({
  MediaContainer: {
    Hub: [
      {
        type: "movie",
        Metadata: [
          {
            ratingKey: 101,
            type: "movie",
            title: "Dune",
            year: 2021,
            librarySectionTitle: "Movies",
            thumb: "/library/metadata/101/thumb/1",
          },
          {
            // Unlinkable type — dropped.
            ratingKey: 999,
            type: "collection",
            title: "Sci-Fi Collection",
          },
        ],
      },
      {
        type: "track",
        Metadata: [
          {
            ratingKey: "202",
            type: "track",
            title: "Time",
            grandparentTitle: "Pink Floyd",
            year: 0,
            librarySectionTitle: "Music",
          },
          {
            // Missing title — dropped.
            ratingKey: 203,
            type: "track",
          },
        ],
      },
    ],
  },
});

test("plexEnabledAsync requires both endpoint and token", async () => {
  assert.equal(await plexEnabledAsync(), false);
  process.env.PLEX_ENDPOINT = "http://plex:32400";
  assert.equal(await plexEnabledAsync(), false);
  process.env.PLEX_TOKEN = "secret-token";
  assert.equal(await plexEnabledAsync(), true);
});

test("searchPlexItems returns [] when unconfigured", async () => {
  assert.deepEqual(await searchPlexItems("dune"), []);
});

test("searchPlexItems flattens hubs, maps items, and drops unlinkable/invalid entries", async () => {
  configure();
  const {
    requests, restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: SEARCH_BODY,
    },
  ]);
  try {
    const results = await searchPlexItems("dune");
    assert.deepEqual(results, [
      {
        ratingKey: "101",
        type: "movie",
        title: "Dune",
        year: 2021,
        librarySectionTitle: "Movies",
        subtitle: "2021 · Movies",
        groupTitle: "Movies",
      },
      {
        ratingKey: "202",
        type: "track",
        title: "Time",
        year: null,
        librarySectionTitle: "Music",
        subtitle: "Pink Floyd · Music",
        groupTitle: "Pink Floyd",
      },
    ]);
    assert.equal(requests.length, 1);
    assert.ok(requests[0].url.startsWith("http://plex:32400/hubs/search?query=dune"));
    const headers = requests[0].init?.headers as Record<string, string>;
    assert.equal(headers["X-Plex-Token"], "secret-token");
  }
  finally {
    restore();
  }
});

test("searchPlexItems returns [] when the request fails", async () => {
  configure();
  const {
    restore,
  } = stubFetchSequence([
    {
      status: 500,
    },
  ]);
  try {
    assert.deepEqual(await searchPlexItems("dune"), []);
  }
  finally {
    restore();
  }
});

test("getPlexMachineIdentifier reads /identity and caches it across calls", async () => {
  configure();
  const {
    requests, restore,
  } = stubFetchSequence([
    {
      status: 200,
      body: JSON.stringify({
        MediaContainer: {
          machineIdentifier: "abc123",
        },
      }),
    },
  ]);
  try {
    assert.equal(await getPlexMachineIdentifier(), "abc123");
    assert.equal(await getPlexMachineIdentifier(), "abc123");
    // Second call is served from the cache — only one /identity request.
    assert.equal(requests.filter(r => r.url.includes("/identity")).length, 1);
  }
  finally {
    restore();
  }
});

test("getPlexMachineIdentifier returns null when unconfigured", async () => {
  assert.equal(await getPlexMachineIdentifier(), null);
});
