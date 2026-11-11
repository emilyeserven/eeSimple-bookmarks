import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { downloadImage, fetchPageTitle } from "@/services/metadata";
import {
  guardedDispatcher,
  guardedFetch,
  guardedLookup,
  isPublicHttpUrl,
  isPublicIp,
  MAX_REDIRECT_HOPS,
  SsrfBlockedError,
} from "@/utils/ssrf";

// These tests stub `globalThis.fetch` to drive redirect chains deterministically (no real network).

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

interface Call {
  url: string;
  init: RequestInit & { dispatcher?: unknown };
}

/** A fetch that answers each URL from `routes` and records every call, or rejects when unmapped. */
function mockFetch(routes: Record<string, () => Response>): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push({
      url,
      init: init ?? {},
    });
    const factory = routes[url];
    return factory ? Promise.resolve(factory()) : Promise.reject(new TypeError(`no route: ${url}`));
  }) as typeof fetch;
  return calls;
}

const redirect = (location: string, status = 302) => () => new Response(null, {
  status,
  headers: {
    location,
  },
});
const ok = (body = "ok") => () => new Response(body, {
  status: 200,
});

test("isPublicIp blocks private, loopback, link-local, CGNAT/Tailscale and IPv4-mapped addresses", () => {
  for (const ip of [
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "100.101.102.103",
    "0.0.0.0",
    "::1",
    "fd7a:115c:a1e0::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::ffff:c0a8:101",
  ]) assert.equal(isPublicIp(ip), false, ip);
  for (const ip of ["8.8.8.8", "100.128.0.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"]) {
    assert.equal(isPublicIp(ip), true, ip);
  }
});

test("isPublicHttpUrl rejects CGNAT, IPv4-mapped IPv6 and integer-encoded loopback hosts", () => {
  assert.equal(isPublicHttpUrl("http://100.100.100.100/"), false);
  assert.equal(isPublicHttpUrl("http://[::ffff:127.0.0.1]/"), false);
  assert.equal(isPublicHttpUrl("http://2130706433/"), false);
  assert.equal(isPublicHttpUrl("http://localhost:3000/"), false);
  assert.equal(isPublicHttpUrl("ftp://example.com/"), false);
  assert.equal(isPublicHttpUrl("https://example.com/page"), true);
});

test("guardedFetch blocks a public page that redirects to a private address", async () => {
  mockFetch({
    "https://evil.example.com/img": redirect("http://169.254.169.254/latest/meta-data"),
  });
  await assert.rejects(guardedFetch("https://evil.example.com/img"), SsrfBlockedError);
});

test("guardedFetch follows public redirects manually through the guarded dispatcher", async () => {
  const calls = mockFetch({
    "https://a.example.com/start": redirect("/next", 301),
    "https://a.example.com/next": redirect("https://b.example.com/final"),
    "https://b.example.com/final": ok("final"),
  });
  const res = await guardedFetch("https://a.example.com/start");
  assert.equal(await res.text(), "final");
  assert.deepEqual(calls.map(c => c.url), [
    "https://a.example.com/start",
    "https://a.example.com/next",
    "https://b.example.com/final",
  ]);
  for (const call of calls) {
    assert.equal(call.init.redirect, "manual");
    assert.equal(call.init.dispatcher, guardedDispatcher);
  }
});

test("guardedFetch refuses a private starting URL unless its host is trusted", async () => {
  mockFetch({
    "http://192.168.1.5/": ok(),
  });
  await assert.rejects(guardedFetch("http://192.168.1.5/"), SsrfBlockedError);
  const res = await guardedFetch("http://192.168.1.5/", {}, {
    trustInitialHost: true,
  });
  assert.equal(res.status, 200);
});

test("guardedFetch with a trusted host still guards a redirect to another host", async () => {
  const calls = mockFetch({
    "https://my-bookmark.example.com/": redirect("http://10.0.0.1/admin"),
    "http://localhost:8080/a": redirect("http://localhost:8080/b"),
    "http://localhost:8080/b": ok(),
  });
  await assert.rejects(
    guardedFetch("https://my-bookmark.example.com/", {}, {
      trustInitialHost: true,
    }),
    SsrfBlockedError,
  );
  // Same-host redirects on a trusted intranet bookmark keep working, without the guarded dispatcher.
  const res = await guardedFetch("http://localhost:8080/a", {}, {
    trustInitialHost: true,
  });
  assert.equal(res.status, 200);
  assert.equal(calls.at(-1)?.init.dispatcher, undefined);
});

test("guardedFetch rejects a redirect to a non-http(s) scheme", async () => {
  mockFetch({
    "https://a.example.com/": redirect("file:///etc/passwd"),
  });
  await assert.rejects(guardedFetch("https://a.example.com/"), SsrfBlockedError);
});

test("guardedFetch gives up after the hop cap", async () => {
  const routes: Record<string, () => Response> = {};
  for (let i = 0; i <= MAX_REDIRECT_HOPS + 1; i++) {
    routes[`https://loop.example.com/${i}`] = redirect(`https://loop.example.com/${i + 1}`);
  }
  mockFetch(routes);
  await assert.rejects(guardedFetch("https://loop.example.com/0"), /Too many redirects/);
});

test("guardedFetch downgrades a 303 after POST to a bodyless GET", async () => {
  const calls = mockFetch({
    "https://a.example.com/form": redirect("https://a.example.com/done", 303),
    "https://a.example.com/done": ok(),
  });
  await guardedFetch("https://a.example.com/form", {
    method: "POST",
    body: "x=1",
  });
  assert.equal(calls[1].init.method, "GET");
  assert.equal(calls[1].init.body, undefined);
});

test("guardedLookup fails the connection when a hostname resolves to a private address", async () => {
  for (const all of [false, true]) {
    const err = await new Promise<Error | null>((resolve) => {
      guardedLookup("localhost", {
        all,
      }, e => resolve(e));
    });
    assert.ok(err instanceof SsrfBlockedError, `all=${all}`);
  }
});

test("downloadImage returns null when the image URL redirects to a private address", async () => {
  mockFetch({
    "https://cdn.example.com/pic.png": redirect("http://127.0.0.1:5432/"),
  });
  assert.equal(await downloadImage("https://cdn.example.com/pic.png"), null);
});

test("fetchPageTitle reports a network error when the page redirects to a private address", async () => {
  mockFetch({
    "https://example.com/article": redirect("http://192.168.0.1/"),
  });
  assert.deepEqual(await fetchPageTitle("https://example.com/article"), {
    kind: "network_error",
  });
});
