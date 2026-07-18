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

test("sectionsValues round-trips `completed`, `excludeFromProgress`, `url`, and `tagIds` on entries and children (not stripped by removeAdditional)", async () => {
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
      excludeFromProgress: true,
      tagIds: ["22222222-2222-2222-2222-222222222222"],
      children: [{
        id: "s1a",
        name: "1.1",
        type: "page",
        startValue: "1",
        url: "https://example.com/unit-1-1",
        completed: false,
        excludeFromProgress: false,
        tagIds: ["22222222-2222-2222-2222-222222222222", "33333333-3333-3333-3333-333333333333"],
      }],
    }],
  }];
  const body = await echoThroughSchema({
    sectionsValues,
  });
  assert.deepEqual(body.sectionsValues, sectionsValues);
});

test("sectionsValues accepts the `name`-only entry type on entries and children", async () => {
  const sectionsValues = [{
    propertyId: "11111111-1111-1111-1111-111111111111",
    exhaustive: false,
    sections: [{
      id: "s1",
      name: "Getting Started",
      type: "name",
      startValue: "",
      children: [{
        id: "s1a",
        name: "Welcome",
        type: "name",
        startValue: "",
      }],
    }],
  }];
  const body = await echoThroughSchema({
    sectionsValues,
  });
  assert.deepEqual(body.sectionsValues, sectionsValues);
});

test("secondaryUrl survives the PATCH body (not stripped by removeAdditional)", async () => {
  const body = await echoThroughSchema({
    secondaryUrl: "https://example.com/download.pdf",
  });
  assert.equal(body.secondaryUrl, "https://example.com/download.pdf");
  // An explicit null (clear the field) also round-trips.
  const cleared = await echoThroughSchema({
    secondaryUrl: null,
  });
  assert.equal(cleared.secondaryUrl, null);
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
