import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";
import { normalizeDomain, stripSiteNameSuffix } from "@/services/websites";

// Pure-helper tests run without a live database, matching the `isValidUrl` style.

test("normalizeDomain lower-cases the host and strips a leading www.", () => {
  assert.equal(normalizeDomain("https://github.com/foo"), "github.com");
  assert.equal(normalizeDomain("https://www.GitHub.com"), "github.com");
  assert.equal(normalizeDomain("http://Sub.Example.COM/x?y=1"), "sub.example.com");
});

test("normalizeDomain returns null for values without a host", () => {
  assert.equal(normalizeDomain("not a url"), null);
  assert.equal(normalizeDomain(""), null);
});

test("stripSiteNameSuffix removes a trailing site name after a separator", () => {
  assert.equal(stripSiteNameSuffix("Pricing · GitHub", {
    siteName: "GitHub",
    domain: "github.com",
  }), "Pricing");
  assert.equal(stripSiteNameSuffix("Docs - GitHub", {
    siteName: "GitHub",
    domain: "github.com",
  }), "Docs");
  assert.equal(stripSiteNameSuffix("Home | GitHub", {
    siteName: null,
    domain: "github.com",
  }), "Home");
});

test("stripSiteNameSuffix matches the brand from the domain when no site name is set", () => {
  // siteName still defaults to the domain for fresh sites; the brand label should match.
  assert.equal(stripSiteNameSuffix("Some Article — Example", {
    siteName: "example.com",
    domain: "example.com",
  }), "Some Article");
});

test("stripSiteNameSuffix leaves a title alone when nothing matches or the prefix is empty", () => {
  assert.equal(stripSiteNameSuffix("Just a Title", {
    siteName: "GitHub",
    domain: "github.com",
  }), "Just a Title");
  // Would-be-empty prefix is preserved rather than stripped to "".
  assert.equal(stripSiteNameSuffix("GitHub", {
    siteName: "GitHub",
    domain: "github.com",
  }), "GitHub");
});

// Schema-validation tests via `inject` (no database needed).

test("GET /api/websites/lookup requires a url query param", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/websites/lookup",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/websites requires a domain", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/websites",
    payload: {
      siteName: "Example",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/websites/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/websites/not-a-uuid",
    payload: {
      siteName: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
