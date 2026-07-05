import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { errorHandler } from "@/utils/errorHandler";
import { AppError, NotFoundError } from "@/utils/errors";

/** A tiny app wired with only the shared error handler + routes that throw — no DB needed. */
function buildTestApp() {
  const app = Fastify();
  app.setErrorHandler(errorHandler);
  app.get("/notfound", async () => {
    throw new NotFoundError("Bookmark");
  });
  // A service `Duplicate*Error` is an `AppError` carrying the `duplicateName` code + params.
  app.get("/duplicate", async () => {
    throw new AppError("A media type named \"Video\" already exists", "duplicateName", 409, {
      entity: "media type",
      name: "Video",
    });
  });
  app.get("/builtin", async () => {
    throw new AppError("Built-in usage levels can't be modified or deleted", "builtInImmutable", 403);
  });
  app.get("/raw-app", async () => {
    throw new AppError("boom", "conflict", 409, {
      foo: "bar",
    });
  });
  app.get("/boom", async () => {
    throw new Error("kaboom");
  });
  app.post("/validated", {
    schema: {
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: {
            type: "string",
          },
        },
      },
    },
  }, async () => ({
    ok: true,
  }));
  return app;
}

test("serializes an AppError to the { message, code, statusCode, params } envelope", async () => {
  const app = buildTestApp();
  const res = await app.inject({
    method: "GET",
    url: "/notfound",
  });
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.json(), {
    message: "Bookmark not found",
    code: "notFound",
    statusCode: 404,
    params: {
      entity: "Bookmark",
    },
  });
});

test("carries duplicateName code + params", async () => {
  const app = buildTestApp();
  const res = await app.inject({
    method: "GET",
    url: "/duplicate",
  });
  assert.equal(res.statusCode, 409);
  const body = res.json();
  assert.equal(body.code, "duplicateName");
  assert.deepEqual(body.params, {
    entity: "media type",
    name: "Video",
  });
});

test("maps a built-in immutable error to 403 / builtInImmutable", async () => {
  const app = buildTestApp();
  const res = await app.inject({
    method: "GET",
    url: "/builtin",
  });
  assert.equal(res.statusCode, 403);
  assert.equal(res.json().code, "builtInImmutable");
});

test("passes an explicit AppError code/status/params through", async () => {
  const app = buildTestApp();
  const res = await app.inject({
    method: "GET",
    url: "/raw-app",
  });
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.json(), {
    message: "boom",
    code: "conflict",
    statusCode: 409,
    params: {
      foo: "bar",
    },
  });
});

test("a schema-validation error becomes a 400 schemaValidation envelope", async () => {
  const app = buildTestApp();
  const res = await app.inject({
    method: "POST",
    url: "/validated",
    payload: {},
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, "schemaValidation");
});

test("an uncoded throw becomes a 500 internal envelope", async () => {
  const app = buildTestApp();
  // Silence the expected error log for this case.
  app.log.level = "silent";
  const res = await app.inject({
    method: "GET",
    url: "/boom",
  });
  assert.equal(res.statusCode, 500);
  assert.equal(res.json().code, "internal");
});
