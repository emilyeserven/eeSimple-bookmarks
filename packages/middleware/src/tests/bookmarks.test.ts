import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";
import { isValidUrl } from "@/utils/url";

test("POST /api/bookmarks accepts a well-formed textValues payload (ISBN/text values are no longer rejected by the schema)", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/bookmarks",
    payload: {
      url: "https://example.com",
      title: "Example",
      textValues: [{
        propertyId: "11111111-1111-1111-1111-111111111111",
        value: "9780134685991",
      }],
    },
  });
  // Before the schema fix this 400'd (`additionalProperties: false` rejected `textValues`). It now
  // passes schema validation and reaches the handler (which may then fail on the DB in this harness).
  assert.notEqual(res.statusCode, 400);
  await app.close();
});

test("POST /api/bookmarks rejects a textValue with a non-uuid propertyId", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/bookmarks",
    payload: {
      url: "https://example.com",
      title: "Example",
      textValues: [{
        propertyId: "not-a-uuid",
        value: "x",
      }],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("GET /api/bookmarks/url-check accepts an identity-only query with no url (see #1072)", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/bookmarks/url-check?isbn=9780134685991",
  });
  // No schema-validation 400 for an identity-only check; the handler may still fail on the DB here.
  assert.notEqual(res.statusCode, 400);
  await app.close();
});

test("GET /api/bookmarks/url-check rejects a query with neither url nor an identity field", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/bookmarks/url-check",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/bookmarks/quick-add accepts a well-formed url + title payload", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/bookmarks/quick-add",
    payload: {
      url: "https://example.com/direct",
      title: "Direct",
    },
  });
  // Passes schema validation and reaches the handler (which may then fail on the DB in this harness).
  assert.notEqual(res.statusCode, 400);
  await app.close();
});

test("POST /api/bookmarks/quick-add rejects a payload with no url", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/bookmarks/quick-add",
    payload: {
      title: "No URL",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/bookmarks/quick-add rejects a non-http(s) url", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/bookmarks/quick-add",
    payload: {
      url: "ftp://example.com/file",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("isValidUrl accepts http(s) URLs and rejects everything else", () => {
  assert.equal(isValidUrl("https://example.com"), true);
  assert.equal(isValidUrl("http://example.com/path?q=1"), true);
  assert.equal(isValidUrl("not-a-url"), false);
  assert.equal(isValidUrl("ftp://example.com"), false);
});
