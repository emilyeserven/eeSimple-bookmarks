import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { searchBookmarksBody } from "@/routes/bookmarksSchema";

// The search body's nested `search`/`scope`/`titleSort` objects are DELIBERATELY schema-free
// (`type: "object"` with no `properties`): mirroring BookmarkSearch's ~35 evolving keys into AJV
// under `additionalProperties: false` would turn every future facet into a silent
// `removeAdditional` drop before the shared `validateBookmarkSearch` ever sees it. This suite pins
// the round-trip through the exact validation pipeline the real route uses — if someone "tightens"
// the nested objects, a facet key vanishing here is the regression signal.

async function echoThroughSchema(payload: unknown): Promise<Record<string, unknown>> {
  const app = Fastify();
  app.post("/echo", {
    schema: {
      body: searchBookmarksBody,
    },
  }, async req => req.body as Record<string, unknown>);
  const res = await app.inject({
    method: "POST",
    url: "/echo",
    payload: payload as Record<string, unknown>,
  });
  assert.equal(res.statusCode, 200, res.payload);
  await app.close();
  return JSON.parse(res.payload) as Record<string, unknown>;
}

test("a fully-populated search object survives validation unstripped (every facet key)", async () => {
  // One entry per BookmarkSearch key — including nested records and arrays.
  const search = {
    tags: ["t-1"],
    tagPresence: "exclude",
    categories: ["c-1"],
    categoryPresence: "has",
    mediaTypes: ["mt-1"],
    mediaTypePresence: "missing",
    youtubeChannels: ["yc-1"],
    youtubeChannelPresence: "has",
    websites: ["w-1"],
    websitePresence: "exclude",
    relationshipTypes: ["rt-1"],
    languageUsageLanguages: ["lang-1"],
    languageUsageLevels: ["lvl-1"],
    placeTypes: ["city"],
    placeTypePresence: "has",
    people: ["p-1"],
    peoplePresence: "exclude",
    genreMoods: ["gm-1"],
    genreMoodPresence: "has",
    num: {
      "prop-1": [1, 10],
    },
    bool: {
      "prop-2": true,
    },
    date: {
      "prop-3": ["2026-01-01", null],
    },
    presence: {
      "prop-4": "missing",
    },
    choices: {
      "prop-5": ["a", "b"],
    },
    sectionsPresence: "has",
    sectionTypes: ["page", "timestamp"],
    mediaSourcePresence: "has",
    plexRatingKey: "12345",
    kavitaSeriesId: 7,
    isbn: "9780131103627",
    feedUrl: "https://example.com/feed.xml",
    fillableFieldsPresence: "fillable",
    sort: {
      primary: {
        field: "title",
        direction: "asc",
      },
      secondary: {
        field: "createdAt",
        direction: "desc",
      },
    },
  };

  const echoed = await echoThroughSchema({
    search,
    q: "seahorse",
    offset: 25,
    limit: 25,
    scope: {
      kind: "tag",
      id: "t-1",
      taggedSections: true,
    },
    titleSort: {
      preferredLanguage: {
        isoCode: "ja",
      },
      locale: "ja",
    },
  });

  assert.deepEqual(echoed.search, search);
  assert.deepEqual(echoed.scope, {
    kind: "tag",
    id: "t-1",
    taggedSections: true,
  });
  assert.deepEqual(echoed.titleSort, {
    preferredLanguage: {
      isoCode: "ja",
    },
    locale: "ja",
  });
  assert.equal(echoed.q, "seahorse");
  assert.equal(echoed.offset, 25);
  assert.equal(echoed.limit, 25);
});

test("offset/limit defaults apply and out-of-range values are rejected", async () => {
  const echoed = await echoThroughSchema({
    search: {},
  });
  assert.equal(echoed.offset, 0);
  assert.equal(echoed.limit, 25);

  const app = Fastify();
  app.post("/echo", {
    schema: {
      body: searchBookmarksBody,
    },
  }, async req => req.body as Record<string, unknown>);
  const tooBig = await app.inject({
    method: "POST",
    url: "/echo",
    payload: {
      search: {},
      limit: 501,
    },
  });
  assert.equal(tooBig.statusCode, 400);
  const missingSearch = await app.inject({
    method: "POST",
    url: "/echo",
    payload: {},
  });
  assert.equal(missingSearch.statusCode, 400);
  await app.close();
});
