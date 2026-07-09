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

test("stripSiteNameSuffix strips the fullwidth solidus (／) separator", () => {
  assert.equal(stripSiteNameSuffix("Episode Title ／ ChannelName", {
    siteName: "ChannelName",
  }), "Episode Title");
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

// PATCH /api/websites/:id schema-validation tests for extensionFillRules. Schema validation runs
// before the handler/DB lookup, so a nonexistent website id still proves whether the body passed
// or failed the schema (see the bookmarks.test.ts / people.test.ts precedent).

test("PATCH /api/websites/:id accepts a well-formed extensionFillRules payload covering every variant", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/websites/11111111-1111-1111-1111-111111111111",
    payload: {
      extensionFillRules: [
        {
          id: "r1",
          label: "Pages",
          pathSuffix: "/book",
          target: {
            kind: "customProperty",
            propertyId: "22222222-2222-2222-2222-222222222222",
          },
          extract: {
            selector: "._statBlockTitle_1ckth_86 > *",
            filters: [
              {
                kind: "siblingText",
                match: {
                  mode: "contains",
                  value: "PRINT LENGTH:",
                  caseSensitive: false,
                },
              },
              {
                kind: "ancestorText",
                match: {
                  mode: "regex",
                  value: "^Details$",
                },
                maxDepth: 3,
              },
              {
                kind: "closest",
                selector: ".stat-block",
              },
              {
                kind: "nth",
                index: 0,
              },
              {
                kind: "selfText",
                match: {
                  mode: "equals",
                  value: "Pages",
                },
              },
            ],
            read: {
              kind: "attr",
              name: "data-value",
            },
            transform: [
              {
                kind: "regex",
                pattern: "(\\d+)",
                flags: "i",
                group: 1,
              },
              {
                kind: "number",
              },
              {
                kind: "replace",
                pattern: ",",
                flags: "g",
                replacement: "",
              },
              {
                kind: "trim",
              },
            ],
          },
        },
        {
          id: "r2",
          label: "Title",
          target: {
            kind: "field",
            field: "title",
          },
          extract: {
            selector: "h1",
            read: {
              kind: "text",
            },
          },
        },
        {
          id: "r3",
          label: "Authors",
          target: {
            kind: "taxonomy",
            taxonomy: "people",
          },
          extract: {
            selector: ".authors a",
            split: ",",
          },
        },
      ],
    },
  });
  // Schema-valid → not rejected by AJV; a nonexistent id may still 404 from the handler.
  assert.notEqual(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/websites/:id rejects an extensionFillRules entry with an unknown target kind", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/websites/11111111-1111-1111-1111-111111111111",
    payload: {
      extensionFillRules: [
        {
          id: "r1",
          label: "Pages",
          target: {
            kind: "bogus",
          },
          extract: {
            selector: "h1",
          },
        },
      ],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/websites/:id rejects a fillFilter missing its required match", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/websites/11111111-1111-1111-1111-111111111111",
    payload: {
      extensionFillRules: [
        {
          id: "r1",
          label: "Pages",
          target: {
            kind: "field",
            field: "title",
          },
          extract: {
            selector: "h1",
            filters: [{
              kind: "siblingText",
            }],
          },
        },
      ],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/websites/:id accepts a payload that omits extensionFillRules entirely", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/websites/11111111-1111-1111-1111-111111111111",
    payload: {
      siteName: "Example",
    },
  });
  assert.notEqual(res.statusCode, 400);
  await app.close();
});
