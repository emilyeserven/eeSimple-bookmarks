import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { YouTubeMetadata } from "@/services/youtube";

// Tier B (the `with*` functions) needs the DB-backed property-id lookups stubbed before the module
// under test is first imported (ES module imports are cached process-wide). Tier A (`channelHintFrom`)
// is pure and needs no mocking at all.
let runtimePropertyId: string | null = "runtime-prop";
const datePostedPropertyId: string | null = "date-posted-prop";
let contentStatusPropertyId: string | null = "content-status-prop";

mock.module("@/services/customProperties", {
  namedExports: {
    getRuntimePropertyId: async () => runtimePropertyId,
    getDatePostedPropertyId: async () => datePostedPropertyId,
    getContentStatusPropertyId: async () => contentStatusPropertyId,
  },
});

const {
  channelHintFrom,
  withContentStatusDefault,
  withDatePosted,
  withRuntime,
} = await import("@/services/bookmarkEnrichment");

function makeMeta(overrides: Partial<YouTubeMetadata> = {}): YouTubeMetadata {
  return {
    title: "A Video",
    description: null,
    channelName: null,
    channelUrl: null,
    durationSeconds: null,
    datePosted: null,
    languageCode: null,
    thumbnailUrl: null,
    warnings: [],
    ...overrides,
  };
}

// --- Tier A: channelHintFrom (pure) ---

test("channelHintFrom returns a trimmed client hint when present", () => {
  const result = channelHintFrom({
    key: "  @someone  ",
    name: "  Some One  ",
    selfIds: ["id-1"],
  }, null);
  assert.deepEqual(result, {
    key: "@someone",
    name: "Some One",
    selfIds: ["id-1"],
  });
});

test("channelHintFrom falls through to metadata when the client hint is blank", () => {
  const meta = makeMeta({
    channelName: "Some Channel",
    channelUrl: "https://www.youtube.com/@somechannel",
  });
  const result = channelHintFrom({
    key: "   ",
    name: "   ",
  }, meta);
  assert.deepEqual(result, {
    key: "@somechannel",
    name: "Some Channel",
  });
});

test("channelHintFrom derives {key, name} from metadata when there is no client hint", () => {
  const meta = makeMeta({
    channelName: "Some Channel",
    channelUrl: "https://www.youtube.com/@somechannel",
  });
  assert.deepEqual(channelHintFrom(null, meta), {
    key: "@somechannel",
    name: "Some Channel",
  });
});

test("channelHintFrom returns null when the metadata channel URL yields no key", () => {
  const meta = makeMeta({
    channelName: "Some Channel",
    channelUrl: "https://www.youtube.com",
  });
  assert.equal(channelHintFrom(null, meta), null);
});

test("channelHintFrom returns null when there is no hint and no metadata", () => {
  assert.equal(channelHintFrom(null, null), null);
  assert.equal(channelHintFrom(undefined, null), null);
});

// --- Tier B: withRuntime ---

test("withRuntime leaves values unchanged when the metadata has no duration", async () => {
  const values = await withRuntime([], makeMeta({
    durationSeconds: null,
  }), "test");
  assert.deepEqual(values, []);
});

test("withRuntime leaves values unchanged when the Runtime property is not seeded", async () => {
  runtimePropertyId = null;
  try {
    const values = await withRuntime([], makeMeta({
      durationSeconds: 120,
    }), "test");
    assert.deepEqual(values, []);
  }
  finally {
    runtimePropertyId = "runtime-prop";
  }
});

test("withRuntime keeps the caller's value when Runtime was already supplied — a user edit always wins", async () => {
  const existing = [{
    propertyId: "runtime-prop",
    value: 999,
  }];
  const values = await withRuntime(existing, makeMeta({
    durationSeconds: 120,
  }), "test");
  assert.deepEqual(values, existing);
});

test("withRuntime appends the duration as a new Runtime value when none was supplied", async () => {
  const values = await withRuntime([], makeMeta({
    durationSeconds: 120,
  }), "test");
  assert.deepEqual(values, [{
    propertyId: "runtime-prop",
    value: 120,
  }]);
});

// --- Tier B: withDatePosted (only the divergent cases; the missing-property-id branch is
// structurally identical to withRuntime's, already proven above) ---

test("withDatePosted leaves values unchanged when the metadata has no date", async () => {
  const values = await withDatePosted([], makeMeta({
    datePosted: null,
  }), "test");
  assert.deepEqual(values, []);
});

test("withDatePosted keeps the caller's value when Date Posted was already supplied — a user edit always wins", async () => {
  const existing = [{
    propertyId: "date-posted-prop",
    value: "2020-01-01",
  }];
  const values = await withDatePosted(existing, makeMeta({
    datePosted: "2024-06-01",
  }), "test");
  assert.deepEqual(values, existing);
});

test("withDatePosted appends the publish date as a new Date Posted value when none was supplied", async () => {
  const values = await withDatePosted([], makeMeta({
    datePosted: "2024-06-01",
  }), "test");
  assert.deepEqual(values, [{
    propertyId: "date-posted-prop",
    value: "2024-06-01",
  }]);
});

// --- Tier B: withContentStatusDefault ---

test("withContentStatusDefault leaves values unchanged when the Content Status property is not seeded", async () => {
  contentStatusPropertyId = null;
  try {
    assert.deepEqual(await withContentStatusDefault([]), []);
  }
  finally {
    contentStatusPropertyId = "content-status-prop";
  }
});

test("withContentStatusDefault leaves values unchanged when a value was already supplied", async () => {
  const existing = [{
    propertyId: "content-status-prop",
    values: ["in-progress"],
  }];
  assert.deepEqual(await withContentStatusDefault(existing), existing);
});

test("withContentStatusDefault defaults to not-started when neither is the case", async () => {
  assert.deepEqual(await withContentStatusDefault([]), [{
    propertyId: "content-status-prop",
    values: ["not-started"],
  }]);
});
