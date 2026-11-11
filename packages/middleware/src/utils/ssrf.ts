/**
 * SSRF guard for the middleware's outbound fetches.
 *
 * The server fetches URLs it doesn't control (a bookmarked page, an image URL scraped from it, an
 * oEmbed endpoint the page advertises, a podcast feed, …). Without a guard, any of those could point
 * the server at something only it can reach — the router admin page, another container, the cloud
 * metadata address — and the response would come back to us. Three layers close that:
 *
 * 1. **`isPublicHttpUrl`** — the cheap up-front check on the URL text: http(s) only, and no
 *    loopback / private / link-local / CGNAT (Tailscale) / IPv4-mapped-private IP literal or
 *    `localhost`/`.local` name.
 * 2. **Manual redirects** — `guardedFetch` follows redirects itself and re-checks every hop. The
 *    built-in `redirect: "follow"` never re-checks, so a public page could 302 the server to
 *    `http://192.168.1.1/` after the up-front check passed (the bug this module fixes).
 * 3. **Connect-time IP check** — a hostname that *looks* public can still resolve to a private
 *    address (`evil.example` → `127.0.0.1`). `guardedFetch` connects through an undici `Agent` whose
 *    DNS `lookup` rejects any non-public answer, so the address actually dialled is the one checked.
 *
 * Operator-configured endpoints (Kavita, Plex, Browserless/hosted metadata, ArchiveBox, …) live on
 * the private network on purpose and must NOT go through this guard — they use
 * {@link operatorEndpointFetch}, the explicit private-network path.
 */

import type { LookupAddress } from "node:dns";
import type { LookupFunction } from "node:net";

import { lookup as dnsLookup } from "node:dns";
import { BlockList, isIP } from "node:net";

import { Agent } from "undici";

/** Max redirect hops `guardedFetch` follows before failing. */
export const MAX_REDIRECT_HOPS = 5;

/** Address ranges the server must never be steered into. */
const NON_PUBLIC = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT — includes every Tailscale 100.x address
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, incl. cloud metadata 169.254.169.254
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
] as const) NON_PUBLIC.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["64:ff9b::", 96], // NAT64 — embeds an IPv4 address we can't vouch for
  ["fc00::", 7], // unique-local (Tailscale's fd7a:115c:a1e0::/48 lives here)
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
] as const) NON_PUBLIC.addSubnet(network, prefix, "ipv6");

/**
 * The IPv4 address embedded in an IPv4-mapped IPv6 address (`::ffff:127.0.0.1`, which the WHATWG URL
 * parser normalizes to the hex form `::ffff:7f00:1`), or null when `ip` isn't one.
 */
function mappedIpv4(ip: string): string | null {
  const match = /^::ffff:(?:0:)?(.+)$/i.exec(ip);
  if (!match) return null;
  const tail = match[1];
  if (isIP(tail) === 4) return tail;
  const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(tail);
  if (!hex) return null;
  const high = parseInt(hex[1], 16);
  const low = parseInt(hex[2], 16);
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
}

/** True when `ip` (an IPv4 or IPv6 literal, no brackets) is a publicly routable address. */
export function isPublicIp(ip: string): boolean {
  const family = isIP(ip);
  if (family === 0) return false;
  if (family === 6) {
    const v4 = mappedIpv4(ip);
    if (v4 !== null) return isPublicIp(v4);
    return !NON_PUBLIC.check(ip, "ipv6");
  }
  return !NON_PUBLIC.check(ip, "ipv4");
}

/**
 * Reject non-http(s) URLs and obvious internal/loopback/private hosts. Checks the URL text only — a
 * public-looking hostname that resolves to a private address is caught at connect time by
 * {@link guardedFetch}.
 */
export function isPublicHttpUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  }
  catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  // `url.hostname` returns IPv6 literals bracketed (e.g. "[::1]"); strip them for comparison.
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
  // The URL parser canonicalizes IPv4 shorthands (`2130706433`, `0x7f.1`) to dotted form first.
  return isIP(host) === 0 || isPublicIp(host);
}

/** Thrown when a redirect hop or a resolved address is somewhere the guard rejects. */
export class SsrfBlockedError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = "SsrfBlockedError";
  }
}

/**
 * A `dns.lookup` replacement for the guarded agent: resolves every address for the hostname and fails
 * the connection if **any** of them is non-public (so a mixed public/private answer can't be raced).
 * Exported for tests.
 */
export const guardedLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, {
    ...options,
    all: true,
  }, (err, addresses: LookupAddress[]) => {
    if (err) {
      callback(err, "", 0);
      return;
    }
    const blocked = addresses.find(a => !isPublicIp(a.address));
    if (blocked || addresses.length === 0) {
      const reason = blocked ? `resolves to non-public address ${blocked.address}` : "has no addresses";
      callback(new SsrfBlockedError(`Blocked: ${hostname} ${reason}`), "", 0);
      return;
    }
    if (options.all) {
      (callback as unknown as (e: null, all: LookupAddress[]) => void)(null, addresses);
      return;
    }
    callback(null, addresses[0].address, addresses[0].family);
  });
};

/** Shared connection pool whose every DNS answer passes {@link guardedLookup}. */
export const guardedDispatcher = new Agent({
  connect: {
    lookup: guardedLookup,
  },
});

/** The fetch `init` for the next hop: 303 (and 301/302 after a POST) downgrade to a bodyless GET, per the Fetch spec. */
function nextHopInit(init: RequestInit, status: number): RequestInit {
  const method = (init.method ?? "GET").toUpperCase();
  const downgrade = status === 303 ? method !== "HEAD" : (status === 301 || status === 302) && method === "POST";
  return downgrade
    ? {
      ...init,
      method: "GET",
      body: undefined,
    }
    : init;
}

/** Options for {@link guardedFetch}. */
export interface GuardedFetchOptions {
  /**
   * Trust the starting URL's own hostname (any port), whatever it is or resolves to — for a URL the user typed
   * themselves (a bookmark), where an intranet/localhost bookmark is legitimate and stays fetchable.
   * Redirects to any *other* host are still fully guarded, so a public page still can't bounce the
   * server onto the private network. Default false: every hop is guarded, including the first.
   */
  trustInitialHost?: boolean;
}

/**
 * `fetch(url, init)` hardened against SSRF: redirects are followed manually (at most
 * {@link MAX_REDIRECT_HOPS}), every guarded hop must pass {@link isPublicHttpUrl}, and guarded hops
 * connect through an agent that rejects private DNS answers. A rejection is a `TypeError`
 * ({@link SsrfBlockedError}), so callers' existing "network error" handling covers it.
 * `init.redirect` is ignored (always manual).
 */
export async function guardedFetch(
  url: string,
  init: RequestInit = {},
  options: GuardedFetchOptions = {},
): Promise<Response> {
  const trustedHost = options.trustInitialHost ? new URL(url).hostname : null;
  let current = url;
  let currentInit: RequestInit = init;
  for (let hop = 0; ; hop++) {
    const trusted = new URL(current).hostname === trustedHost;
    if (!trusted && !isPublicHttpUrl(current)) {
      throw new SsrfBlockedError(`Blocked request to a non-public address: ${current}`);
    }
    const res = await fetch(current, {
      ...currentInit,
      redirect: "manual",
      // Node's fetch accepts an undici dispatcher; the DOM `RequestInit` type doesn't declare it.
      ...(trusted
        ? {}
        : {
          dispatcher: guardedDispatcher,
        }),
    } as RequestInit);
    const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (location === null) return res;

    // Release the redirect response's connection before moving on.
    await res.body?.cancel().catch(() => undefined);
    if (hop >= MAX_REDIRECT_HOPS) throw new TypeError("Too many redirects");
    const next = new URL(location, current); // a relative Location resolves against the current hop
    if (next.protocol !== "http:" && next.protocol !== "https:") {
      throw new SsrfBlockedError(`Blocked redirect to a non-http(s) URL: ${next.href}`);
    }
    currentInit = nextHopInit(currentInit, res.status);
    current = next.href;
  }
}

/**
 * The explicit private-network path: a plain `fetch` for **operator-configured** endpoints (Kavita,
 * Plex, Browserless/hosted metadata, the Instagram profile API, …) that intentionally live on the
 * LAN/tailnet. Not SSRF-guarded by design — the operator chose the address in Settings → Connectors
 * or an env var. Never pass a URL that came from a scraped page or other third-party content here.
 */
export function operatorEndpointFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  return fetch(url, init);
}
