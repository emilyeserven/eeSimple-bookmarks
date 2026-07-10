import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";
import { migrateExtensionFillRules, normalizeDomain, stripSiteNameSuffix } from "@/services/websites";

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

// migrateExtensionFillRules: the pure per-website transform behind the backfillExtensionFillPathMatch
// boot step (converts the retired suffix-only pathSuffix gate to the mode-based pathMatch).

test("migrateExtensionFillRules converts a legacy pathSuffix to a suffix pathMatch", () => {
  const migrated = migrateExtensionFillRules([
    {
      id: "r1",
      label: "Pages",
      pathSuffix: "/book",
      target: {
        kind: "field",
        field: "title",
      },
      extract: {
        selector: "h1",
      },
    },
  ]);
  assert.ok(migrated);
  assert.equal("pathSuffix" in migrated[0], false);
  assert.deepEqual(migrated[0].pathMatch, {
    mode: "suffix",
    value: "/book",
  });
});

test("migrateExtensionFillRules drops a blank legacy suffix and is idempotent on migrated rules", () => {
  // A blank suffix was an always-apply gate — it becomes no gate at all.
  const blank = migrateExtensionFillRules([
    {
      id: "r1",
      label: "Pages",
      pathSuffix: "  ",
      target: {
        kind: "field",
        field: "title",
      },
      extract: {
        selector: "h1",
      },
    },
  ]);
  assert.ok(blank);
  assert.equal("pathSuffix" in blank[0], false);
  assert.equal("pathMatch" in blank[0], false);

  // Already on the new shape → no change → null (the boot step skips the write).
  assert.equal(
    migrateExtensionFillRules([
      {
        id: "r1",
        label: "Pages",
        pathMatch: {
          mode: "prefix",
          value: "/course/",
        },
        target: {
          kind: "field",
          field: "title",
        },
        extract: {
          selector: "h1",
        },
      },
    ]),
    null,
  );
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
          pathMatch: {
            mode: "prefix",
            value: "/course/",
          },
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
                kind: "duration",
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

test("PATCH /api/websites/:id accepts a customProperty target's subField / choiceValue sub-value", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/websites/11111111-1111-1111-1111-111111111111",
    payload: {
      extensionFillRules: [
        {
          id: "r1",
          label: "Total pages",
          target: {
            kind: "customProperty",
            propertyId: "22222222-2222-2222-2222-222222222222",
            subField: "total",
          },
          extract: {
            selector: ".pages",
          },
        },
        {
          id: "r2",
          label: "Status",
          target: {
            kind: "customProperty",
            propertyId: "22222222-2222-2222-2222-222222222222",
            choiceValue: "read",
          },
          extract: {
            selector: ".status",
          },
        },
      ],
    },
  });
  assert.notEqual(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/websites/:id accepts an image target with setMain", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/websites/11111111-1111-1111-1111-111111111111",
    payload: {
      extensionFillRules: [
        {
          id: "r1",
          label: "Cover",
          target: {
            kind: "image",
            setMain: true,
          },
          extract: {
            selector: "img.cover",
            read: {
              kind: "attr",
              name: "src",
            },
          },
        },
      ],
    },
  });
  assert.notEqual(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/websites/:id rejects a pathMatch with an unknown mode", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/websites/11111111-1111-1111-1111-111111111111",
    payload: {
      extensionFillRules: [
        {
          id: "r1",
          label: "Pages",
          pathMatch: {
            mode: "startsWith",
            value: "/course/",
          },
          target: {
            kind: "field",
            field: "title",
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

test("PATCH /api/websites/:id rejects a customProperty subField outside the enum", async () => {
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
            kind: "customProperty",
            propertyId: "22222222-2222-2222-2222-222222222222",
            subField: "middle",
          },
          extract: {
            selector: ".pages",
          },
        },
      ],
    },
  });
  assert.equal(res.statusCode, 400);
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

test("PATCH /api/websites/:id accepts a meta-source extract with a metaKey (no selector)", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/websites/11111111-1111-1111-1111-111111111111",
    payload: {
      extensionFillRules: [
        {
          id: "r1",
          label: "Author",
          target: {
            kind: "taxonomy",
            taxonomy: "people",
          },
          extract: {
            source: "meta",
            metaKey: "og:book:author",
          },
        },
      ],
    },
  });
  assert.notEqual(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/websites/:id accepts a taxonomyEntity target (social link)", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/websites/11111111-1111-1111-1111-111111111111",
    payload: {
      extensionFillRules: [
        {
          id: "r1",
          label: "Publisher X",
          target: {
            kind: "taxonomyEntity",
            association: "group",
            field: "socialLink",
            socialPlatform: "x",
          },
          extract: {
            source: "meta",
            metaKey: "twitter:creator",
          },
        },
      ],
    },
  });
  assert.notEqual(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/websites/:id rejects a taxonomyEntity target missing its association", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/websites/11111111-1111-1111-1111-111111111111",
    payload: {
      extensionFillRules: [
        {
          id: "r1",
          label: "Bad",
          target: {
            kind: "taxonomyEntity",
            field: "description",
          },
          extract: {
            selector: ".x",
          },
        },
      ],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/websites/:id rejects a taxonomyEntity target with an unknown association", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/websites/11111111-1111-1111-1111-111111111111",
    payload: {
      extensionFillRules: [
        {
          id: "r1",
          label: "Bad",
          target: {
            kind: "taxonomyEntity",
            association: "bogus",
            field: "description",
          },
          extract: {
            selector: ".x",
          },
        },
      ],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
