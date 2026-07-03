import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";
import { checkUrl, decodeEntities, duckDuckGoIconUrl, extractSocialProfileLinks, extractTitle, fetchPageTitle } from "@/services/metadata";

// These tests cover schema validation and the pure title-parsing helpers, so
// they run without a live network or database.

test("GET /api/fetch-title rejects a request with no url", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/fetch-title",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("GET /api/fetch-title rejects an invalid url", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/fetch-title?url=not-a-url",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("extractTitle pulls and normalises the <title> contents", () => {
  assert.equal(
    extractTitle("<html><head><title>  Hello   World </title></head></html>"),
    "Hello World",
  );
  assert.equal(
    extractTitle("<title lang=\"en\">Example Domain</title>"),
    "Example Domain",
  );
  assert.equal(extractTitle("<html><head></head><body>no title</body></html>"), null);
  assert.equal(extractTitle("<title>   </title>"), null);
});

test("extractTitle prefers og:title / twitter:title over the <title> suffix", () => {
  // JOC's <title> carries a site-name suffix and a stray Yoast template artifact ("%"),
  // while og:title holds the clean recipe name. See issue #85.
  const html = "<html><head>"
    + "<title>Miso Butter Pasta with Tuna and Cabbage キャベツとツナの和風パスタ • Just One Cookbook %</title>"
    + "<meta property=\"og:title\" content=\"Miso Butter Pasta with Tuna and Cabbage キャベツとツナの和風パスタ\" />"
    + "</head></html>";
  assert.equal(
    extractTitle(html),
    "Miso Butter Pasta with Tuna and Cabbage キャベツとツナの和風パスタ",
  );

  // twitter:title is used when og:title is absent.
  assert.equal(
    extractTitle("<head><title>Page • Site</title><meta name=\"twitter:title\" content=\"Page\"></head>"),
    "Page",
  );

  // An empty og:title falls through to the <title> element.
  assert.equal(
    extractTitle("<head><meta property=\"og:title\" content=\"  \"><title>Fallback</title></head>"),
    "Fallback",
  );
});

test("extractTitle skips a CDATA-wrapped <title> (feed artifact) but uses other sources", () => {
  // A feed channel <title> is wrapped in CDATA — treat it as no title, never as the label.
  assert.equal(extractTitle("<title><![CDATA[jarango.com Archive Feed]]></title>"), null);
  // A plain <title> is unaffected.
  assert.equal(extractTitle("<title>Real Title</title>"), "Real Title");
  // og:title still wins when present alongside a CDATA <title>.
  assert.equal(
    extractTitle(
      "<head><meta property=\"og:title\" content=\"Clean Name\">"
      + "<title><![CDATA[jarango.com Archive Feed]]></title></head>",
    ),
    "Clean Name",
  );
});

test("extractSocialProfileLinks detects Instagram/X/LinkedIn alongside GitHub, one per platform", () => {
  const html = `
    <a href="https://www.instagram.com/janedoe/">IG</a>
    <a href="https://twitter.com/janedoe">X</a>
    <a href="https://www.linkedin.com/in/jane-doe">LinkedIn</a>
    <a href="https://github.com/janedoe">GitHub</a>
    <a href="https://github.com/settings">GitHub settings (system path, skipped)</a>
    <a href="https://www.instagram.com/janedoe/">IG again (deduped)</a>
  `;
  const links = extractSocialProfileLinks(html, "https://example.com/person");
  assert.deepEqual(links, [
    {
      platform: "instagram",
      url: "https://instagram.com/janedoe",
    },
    {
      platform: "x",
      url: "https://x.com/janedoe",
    },
    {
      platform: "linkedin",
      url: "https://linkedin.com/in/jane-doe",
    },
    {
      platform: "github",
      url: "https://github.com/janedoe",
    },
  ]);
});

test("extractSocialProfileLinks ignores non-profile social URLs", () => {
  const html = `
    <a href="https://instagram.com/p/AbC123/">a post, not a profile</a>
    <a href="https://github.com/janedoe/repo">a repo, not a profile</a>
  `;
  assert.deepEqual(extractSocialProfileLinks(html, "https://example.com"), []);
});

test("duckDuckGoIconUrl builds the DuckDuckGo icon-service URL for a domain", () => {
  assert.equal(
    duckDuckGoIconUrl("example.com"),
    "https://icons.duckduckgo.com/ip3/example.com.ico",
  );
});

test("decodeEntities decodes the common named and numeric entities", () => {
  assert.equal(decodeEntities("Tom &amp; Jerry"), "Tom & Jerry");
  assert.equal(decodeEntities("&lt;tag&gt;"), "<tag>");
  assert.equal(decodeEntities("It&#39;s &quot;quoted&quot;"), "It's \"quoted\"");
  assert.equal(decodeEntities("&#65;&#x42;"), "AB");
});

// fetchPageTitle — unit tests using a mocked global fetch

test("fetchPageTitle returns { kind: 'ok' } when the page has a title", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("<html><head><title>My Page</title></head></html>", {
    status: 200,
  });
  try {
    const result = await fetchPageTitle("https://example.com");
    assert.equal(result.kind, "ok");
    assert.equal(result.kind === "ok" ? result.title : "", "My Page");
  }
  finally { globalThis.fetch = original; }
});

test("fetchPageTitle reads YouTube's clean og:title (issue #124)", async () => {
  // YouTube's <title> carries a "- YouTube" suffix; og:title holds the clean, non-localized name.
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(
    "<head><title>なとり - Puppet - YouTube</title>"
    + "<meta property=\"og:title\" content=\"なとり - Puppet\"></head>",
    {
      status: 200,
    },
  );
  try {
    const result = await fetchPageTitle("https://www.youtube.com/watch?v=4d9RSxd7Soo");
    assert.equal(result.kind, "ok");
    assert.equal(result.kind === "ok" ? result.title : "", "なとり - Puppet");
  }
  finally { globalThis.fetch = original; }
});

test("fetchPageTitle identifies as a browser so sites serve full HTML (issue #124)", async () => {
  const original = globalThis.fetch;
  let sentUserAgent: string | undefined;
  globalThis.fetch = async (_input, init) => {
    sentUserAgent = (init?.headers as Record<string, string> | undefined)?.["User-Agent"];
    return new Response("<head><title>My Page</title></head>", {
      status: 200,
    });
  };
  try {
    await fetchPageTitle("https://example.com");
    assert.ok(sentUserAgent?.startsWith("Mozilla/"), `expected a browser UA, got ${sentUserAgent}`);
  }
  finally { globalThis.fetch = original; }
});

test("fetchPageTitle sends Chrome's companion headers so anti-bot CDNs don't 403 a bare request", async () => {
  // A browser UA alone (issue #124) isn't enough: a Chrome UA with an otherwise-empty header set is
  // itself a bot signal that sites behind Cloudflare/DataDome 403 (e.g. japan-guide.com). Verify we
  // send the consistent companion set a real Chrome would.
  const original = globalThis.fetch;
  let sent: Record<string, string> | undefined;
  globalThis.fetch = async (_input, init) => {
    sent = init?.headers as Record<string, string> | undefined;
    return new Response("<head><title>My Page</title></head>", {
      status: 200,
    });
  };
  try {
    await fetchPageTitle("https://example.com");
    assert.ok(sent?.["Accept-Language"], "expected an Accept-Language header");
    assert.equal(sent?.["Sec-Fetch-Mode"], "navigate");
    assert.ok(sent?.["Sec-Ch-Ua"], "expected a Sec-Ch-Ua client-hint header");
    // Accept-Encoding must NOT be set, or undici hands back a still-compressed body.
    assert.equal(sent?.["Accept-Encoding"], undefined);
  }
  finally { globalThis.fetch = original; }
});

test("fetchPageTitle returns { kind: 'no_title' } when body has no <title>", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("<html><body>no title here</body></html>", {
    status: 200,
  });
  try {
    const result = await fetchPageTitle("https://example.com");
    assert.equal(result.kind, "no_title");
  }
  finally { globalThis.fetch = original; }
});

test("fetchPageTitle returns { kind: 'http_error' } with the status on a non-ok response", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, {
    status: 403,
  });
  try {
    const result = await fetchPageTitle("https://example.com");
    assert.equal(result.kind, "http_error");
    assert.equal(result.kind === "http_error" ? result.status : 0, 403);
  }
  finally { globalThis.fetch = original; }
});

test("fetchPageTitle returns { kind: 'timeout' } on an AbortError", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new DOMException("The operation was aborted", "AbortError");
  };
  try {
    const result = await fetchPageTitle("https://example.com");
    assert.equal(result.kind, "timeout");
  }
  finally {
    globalThis.fetch = original;
  }
});

test("fetchPageTitle returns { kind: 'network_error' } on a non-abort exception", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Connection refused");
  };
  try {
    const result = await fetchPageTitle("https://example.com");
    assert.equal(result.kind, "network_error");
  }
  finally {
    globalThis.fetch = original;
  }
});

// checkUrl — unit tests using a mocked global fetch

test("checkUrl returns { kind: 'ok' } with the status on a reachable link", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, {
    status: 200,
  });
  try {
    const result = await checkUrl("https://example.com");
    assert.equal(result.kind, "ok");
    assert.equal(result.kind === "ok" ? result.status : 0, 200);
  }
  finally { globalThis.fetch = original; }
});

test("checkUrl returns { kind: 'http_error' } with the status on a 404", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, {
    status: 404,
  });
  try {
    const result = await checkUrl("https://example.com/missing");
    assert.equal(result.kind, "http_error");
    assert.equal(result.kind === "http_error" ? result.status : 0, 404);
  }
  finally { globalThis.fetch = original; }
});

test("checkUrl falls back to GET when HEAD is rejected with 405", async () => {
  const original = globalThis.fetch;
  const methods: (string | undefined)[] = [];
  globalThis.fetch = async (_input, init) => {
    methods.push(init?.method);
    return init?.method === "HEAD"
      ? new Response(null, {
        status: 405,
      })
      : new Response(null, {
        status: 200,
      });
  };
  try {
    const result = await checkUrl("https://example.com");
    assert.deepEqual(methods, ["HEAD", "GET"]);
    assert.equal(result.kind, "ok");
  }
  finally { globalThis.fetch = original; }
});

test("checkUrl falls back to GET when HEAD throws", async () => {
  const original = globalThis.fetch;
  const methods: (string | undefined)[] = [];
  globalThis.fetch = async (_input, init) => {
    methods.push(init?.method);
    if (init?.method === "HEAD") throw new Error("HEAD not allowed");
    return new Response(null, {
      status: 200,
    });
  };
  try {
    const result = await checkUrl("https://example.com");
    assert.deepEqual(methods, ["HEAD", "GET"]);
    assert.equal(result.kind, "ok");
  }
  finally { globalThis.fetch = original; }
});

test("checkUrl returns { kind: 'timeout' } on an AbortError", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new DOMException("The operation was aborted", "AbortError");
  };
  try {
    const result = await checkUrl("https://example.com");
    assert.equal(result.kind, "timeout");
  }
  finally { globalThis.fetch = original; }
});

test("checkUrl returns { kind: 'network_error' } on a non-abort exception", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Connection refused");
  };
  try {
    const result = await checkUrl("https://example.com");
    assert.equal(result.kind, "network_error");
  }
  finally { globalThis.fetch = original; }
});

test("GET /api/check-url rejects an invalid url", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/check-url?url=not-a-url",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("GET /api/scan rejects a request with no url", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/scan",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("GET /api/scan rejects an invalid url", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/scan?url=not-a-url",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
