import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { mapWithConcurrency, unwrapRedirect, unwrapWithBrowserless } from "@/services/redirectUnwrap";

// These tests stub `globalThis.fetch` to drive redirect chains deterministically (no real network).

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.HOSTED_METADATA_ENDPOINT;
});

/** Build a fetch that resolves each URL to a Response from `routes`, or rejects when unmapped. */
function mockFetch(routes: Record<string, () => Response>): typeof fetch {
  return ((input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const factory = routes[url];
    return factory ? Promise.resolve(factory()) : Promise.reject(new TypeError(`no route: ${url}`));
  }) as typeof fetch;
}

test("unwrapRedirect follows a redirect chain to the final destination", async () => {
  globalThis.fetch = mockFetch({
    "https://track.example.com/c/abc": () => Response.redirect("https://real.example.com/article", 301),
    "https://real.example.com/article": () => new Response("ok", {
      status: 200,
    }),
  });
  const result = await unwrapRedirect("https://track.example.com/c/abc");
  assert.deepEqual(result, {
    kind: "ok",
    finalUrl: "https://real.example.com/article",
    redirected: true,
  });
});

test("unwrapRedirect returns the URL unchanged when there is no redirect", async () => {
  globalThis.fetch = mockFetch({
    "https://example.com/post": () => new Response("ok", {
      status: 200,
    }),
  });
  const result = await unwrapRedirect("https://example.com/post");
  assert.deepEqual(result, {
    kind: "ok",
    finalUrl: "https://example.com/post",
    redirected: false,
  });
});

test("unwrapRedirect blocks a redirect to a private address (SSRF guard on each hop)", async () => {
  globalThis.fetch = mockFetch({
    "https://track.example.com/c/evil": () => Response.redirect("http://169.254.169.254/latest/meta-data", 302),
  });
  assert.deepEqual(await unwrapRedirect("https://track.example.com/c/evil"), {
    kind: "blocked",
  });
});

test("unwrapRedirect blocks a private input without fetching", async () => {
  let called = false;
  globalThis.fetch = (() => {
    called = true;
    return Promise.reject(new Error("should not fetch"));
  }) as typeof fetch;
  assert.deepEqual(await unwrapRedirect("http://localhost/admin"), {
    kind: "blocked",
  });
  assert.equal(called, false);
});

test("unwrapRedirect surfaces an HTTP error status", async () => {
  globalThis.fetch = mockFetch({
    "https://example.com/gone": () => new Response("nope", {
      status: 404,
    }),
  });
  assert.deepEqual(await unwrapRedirect("https://example.com/gone"), {
    kind: "http_error",
    status: 404,
  });
});

test("unwrapRedirect maps an aborted fetch to a timeout", async () => {
  globalThis.fetch = (() =>
    Promise.reject(new DOMException("aborted", "AbortError"))) as typeof fetch;
  assert.deepEqual(await unwrapRedirect("https://example.com/slow"), {
    kind: "timeout",
  });
});

// ---------------------------------------------------------------------------
// unwrapWithBrowserless
// ---------------------------------------------------------------------------

test("unwrapWithBrowserless returns null when no Browserless endpoint is configured", async () => {
  // No HOSTED_METADATA_ENDPOINT set — should return null without fetching.
  let called = false;
  globalThis.fetch = (() => {
    called = true;
    return Promise.reject(new Error("should not fetch"));
  }) as typeof fetch;
  assert.equal(await unwrapWithBrowserless("https://tracker.example.com/c/abc"), null);
  assert.equal(called, false);
});

test("unwrapWithBrowserless returns the navigated URL when the page redirects via JS", async () => {
  process.env.HOSTED_METADATA_ENDPOINT = "http://browserless:3000";
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({
      url: "https://real-article.example.com/post/123",
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })) as typeof fetch;
  const result = await unwrapWithBrowserless("https://tracker.example.com/c/abc");
  assert.equal(result, "https://real-article.example.com/post/123");
});

test("unwrapWithBrowserless returns null when the page does not navigate away", async () => {
  process.env.HOSTED_METADATA_ENDPOINT = "http://browserless:3000";
  // Browserless returns the same URL — no redirect occurred.
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({
      url: "https://tracker.example.com/c/abc",
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })) as typeof fetch;
  assert.equal(await unwrapWithBrowserless("https://tracker.example.com/c/abc"), null);
});

test("unwrapWithBrowserless rejects a private address returned by the browser (SSRF guard)", async () => {
  process.env.HOSTED_METADATA_ENDPOINT = "http://browserless:3000";
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({
      url: "http://169.254.169.254/latest/meta-data",
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })) as typeof fetch;
  assert.equal(await unwrapWithBrowserless("https://tracker.example.com/c/abc"), null);
});

test("unwrapWithBrowserless returns null on a Browserless HTTP error", async () => {
  process.env.HOSTED_METADATA_ENDPOINT = "http://browserless:3000";
  globalThis.fetch = (async () =>
    new Response("", {
      status: 500,
    })) as typeof fetch;
  assert.equal(await unwrapWithBrowserless("https://tracker.example.com/c/abc"), null);
});

test("mapWithConcurrency preserves order and respects the in-flight cap", async () => {
  let inFlight = 0;
  let maxInFlight = 0;
  const result = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (n) => {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise(resolve => setTimeout(resolve, 1));
    inFlight--;
    return n * 2;
  });
  assert.deepEqual(result, [2, 4, 6, 8, 10]);
  assert.ok(maxInFlight <= 2, `max in-flight ${maxInFlight} should be <= 2`);
});
