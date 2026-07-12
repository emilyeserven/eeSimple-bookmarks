import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { createPropertyBody, updatePropertyBody } from "@/routes/customProperties";

// The custom-property bodies are `additionalProperties: false` and Fastify's default AJV config has
// `removeAdditional: true`, so any field missing from `updatePropertyBody.properties` is SILENTLY
// STRIPPED from every PATCH before the handler sees it (this is how the Display tab's `editableViaCmdk`
// toggle stopped saving). This suite pins the round-trip through the exact validation pipeline the real
// route uses (an echo route with the exported body schema), plus a create⊇update guard so a mutable
// field present on create but missing on update fails CI.

async function echoThroughSchema(payload: unknown): Promise<Record<string, unknown>> {
  const app = Fastify();
  app.patch("/echo", {
    schema: {
      body: updatePropertyBody,
    },
  }, async req => req.body as Record<string, unknown>);
  const res = await app.inject({
    method: "PATCH",
    url: "/echo",
    payload: payload as Record<string, unknown>,
  });
  assert.equal(res.statusCode, 200, res.payload);
  await app.close();
  return JSON.parse(res.payload) as Record<string, unknown>;
}

test("editableViaCmdk survives the PATCH body (not stripped by removeAdditional)", async () => {
  const body = await echoThroughSchema({
    editableViaCmdk: true,
  });
  assert.equal(body.editableViaCmdk, true);
});

test("editableOnCard also round-trips (sibling of editableViaCmdk)", async () => {
  const body = await echoThroughSchema({
    editableOnCard: true,
  });
  assert.equal(body.editableOnCard, true);
});

test("the update body still strips genuinely unknown props", async () => {
  const body = await echoThroughSchema({
    junkProp: "dropped",
    name: "Priority",
  });
  assert.equal("junkProp" in body, false);
  assert.equal(body.name, "Priority");
});

test("every mutable create field is accepted on update (only `type` is create-only)", () => {
  const createKeys = Object.keys(createPropertyBody.properties);
  const updateKeys = new Set(Object.keys(updatePropertyBody.properties));
  const missingOnUpdate = createKeys.filter(key => !updateKeys.has(key));
  // `type` is intentionally immutable — a property's kind can't change after creation.
  assert.deepEqual(missingOnUpdate, ["type"]);
});
