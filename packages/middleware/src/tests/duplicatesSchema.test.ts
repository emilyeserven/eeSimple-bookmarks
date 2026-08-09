import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { MERGE_SCALAR_FIELDS } from "@eesimple/types";
import { mergeBody } from "@/routes/duplicatesSchema";

// The merge body is `additionalProperties: false`, so Fastify's AJV `removeAdditional` silently
// strips any fieldChoices key the schema doesn't declare. The schema derives its properties from
// the shared MERGE_SCALAR_FIELDS tuple; this suite pins the round-trip so a tuple/schema drift
// (a new mergeable field whose pick vanishes before the service sees it) is a test failure, not a
// silent no-op merge.

const SURVIVOR = "00000000-0000-0000-0000-00000000000a";
const LOSER = "00000000-0000-0000-0000-00000000000b";

async function echoThroughSchema(payload: unknown): Promise<{ statusCode: number;
  body: Record<string, unknown>; }> {
  const app = Fastify();
  app.post("/echo", {
    schema: {
      body: mergeBody,
    },
  }, async req => req.body as Record<string, unknown>);
  const res = await app.inject({
    method: "POST",
    url: "/echo",
    payload: payload as Record<string, unknown>,
  });
  await app.close();
  return {
    statusCode: res.statusCode,
    body: res.statusCode === 200 ? JSON.parse(res.payload) as Record<string, unknown> : {},
  };
}

test("every MERGE_SCALAR_FIELDS key survives validation unstripped", async () => {
  const fieldChoices = Object.fromEntries(MERGE_SCALAR_FIELDS.map(field => [field, LOSER]));
  const {
    statusCode, body,
  } = await echoThroughSchema({
    survivorId: SURVIVOR,
    loserIds: [LOSER],
    fieldChoices,
  });
  assert.equal(statusCode, 200);
  assert.deepEqual(body.fieldChoices, fieldChoices);
});

test("an undeclared fieldChoices key is stripped rather than reaching the service", async () => {
  const {
    statusCode, body,
  } = await echoThroughSchema({
    survivorId: SURVIVOR,
    loserIds: [LOSER],
    fieldChoices: {
      title: LOSER,
      migrationSource: LOSER,
    },
  });
  assert.equal(statusCode, 200);
  assert.deepEqual(body.fieldChoices, {
    title: LOSER,
  });
});

test("missing required keys and out-of-range loserIds are rejected", async () => {
  assert.equal((await echoThroughSchema({})).statusCode, 400);
  assert.equal((await echoThroughSchema({
    survivorId: SURVIVOR,
    loserIds: [],
    fieldChoices: {},
  })).statusCode, 400);
  assert.equal((await echoThroughSchema({
    survivorId: SURVIVOR,
    loserIds: Array.from({
      length: 21,
    }, (_, i) => `00000000-0000-0000-0000-0000000000${String(i).padStart(2, "0")}`),
    fieldChoices: {},
  })).statusCode, 400);
});
