import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { updateBookmarkBody } from "@/routes/bookmarks";

// The bookmark body schemas are `additionalProperties: false` and Fastify's default AJV config has
// `removeAdditional: true`, so any optional SectionEntry field missing from the schema is SILENTLY
// STRIPPED from every whole-set PATCH (the client's debounced Properties form and the extension
// popup both send the full sectionsValues array — a missing key would wipe that field on every
// save). This suite pins the round-trip through the exact validation pipeline the real routes use:
// an echo route registered with the exported body schema.

async function echoThroughSchema(payload: unknown): Promise<Record<string, unknown>> {
  const app = Fastify();
  app.post("/echo", {
    schema: {
      body: updateBookmarkBody,
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

test("sectionsValues round-trips `completed` and `url` on entries and children (not stripped by removeAdditional)", async () => {
  const sectionsValues = [{
    propertyId: "11111111-1111-1111-1111-111111111111",
    exhaustive: true,
    sections: [{
      id: "s1",
      name: "Unit 1",
      type: "page",
      startValue: "1",
      endValue: "10",
      url: "https://example.com/unit-1",
      completed: true,
      children: [{
        id: "s1a",
        name: "1.1",
        type: "page",
        startValue: "1",
        url: "https://example.com/unit-1-1",
        completed: false,
      }],
    }],
  }];
  const body = await echoThroughSchema({
    sectionsValues,
  });
  assert.deepEqual(body.sectionsValues, sectionsValues);
});

test("sectionsValues still strips genuinely unknown entry props", async () => {
  const body = await echoThroughSchema({
    sectionsValues: [{
      propertyId: "11111111-1111-1111-1111-111111111111",
      exhaustive: false,
      sections: [{
        id: "s1",
        name: "Unit 1",
        type: "url",
        startValue: "https://example.com",
        junkProp: "dropped",
      }],
    }],
  });
  const value = (body.sectionsValues as Record<string, unknown>[])[0];
  const entry = (value.sections as Record<string, unknown>[])[0];
  assert.equal("junkProp" in entry, false);
  assert.equal(entry.name, "Unit 1");
});
