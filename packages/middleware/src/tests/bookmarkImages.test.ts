import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import sharp from "sharp";
import { downloadImage, extractFaviconUrl, extractFaviconUrls, extractImageUrl, fetchOgImage, isPublicHttpUrl } from "@/services/metadata";
import { MAX_IMAGE_EDGE, processImage } from "@/utils/image";

// Pure-function coverage for the bookmark-image pipeline and og:image parsing — no DB or network.

test("processImage resizes to fit the max edge and re-encodes to WebP", async () => {
  const wide = await sharp({
    create: {
      width: 2400,
      height: 600,
      channels: 3,
      background: {
        r: 200,
        g: 30,
        b: 30,
      },
    },
  }).png().toBuffer();

  const result = await processImage(wide);
  assert.ok(result, "expected a processed image");
  assert.equal(result.contentType, "image/webp");
  // 2400x600 fits within 1200x1200 by scaling to 1200x300 (aspect ratio preserved).
  assert.equal(result.width, MAX_IMAGE_EDGE);
  assert.equal(result.height, 300);
  assert.ok(result.body.byteLength > 0);
});

test("processImage returns null for non-image bytes", async () => {
  const result = await processImage(Buffer.from("definitely not an image"));
  assert.equal(result, null);
});

test("extractImageUrl prefers og:image and resolves relative URLs", () => {
  assert.equal(
    extractImageUrl(
      "<meta property=\"og:image\" content=\"https://cdn.example.com/a.png\">",
      "https://example.com/page",
    ),
    "https://cdn.example.com/a.png",
  );
  assert.equal(
    extractImageUrl(
      "<meta property=\"og:image\" content=\"/img/hero.jpg\">",
      "https://example.com/page",
    ),
    "https://example.com/img/hero.jpg",
  );
  assert.equal(
    extractImageUrl(
      "<meta name=\"twitter:image\" content=\"https://example.com/t.png\">",
      "https://example.com/",
    ),
    "https://example.com/t.png",
  );
  assert.equal(
    extractImageUrl(
      "<link rel=\"apple-touch-icon\" href=\"/icon.png\">",
      "https://example.com/",
    ),
    "https://example.com/icon.png",
  );
  assert.equal(extractImageUrl("<head></head>", "https://example.com/"), null);
});

test("extractFaviconUrl prefers icon links over og:image", () => {
  // apple-touch-icon wins over a plain icon and over og:image.
  assert.equal(
    extractFaviconUrl(
      "<meta property=\"og:image\" content=\"https://cdn.example.com/share.png\">"
      + "<link rel=\"icon\" href=\"/favicon-32.png\">"
      + "<link rel=\"apple-touch-icon\" href=\"/touch.png\">",
      "https://example.com/page",
    ),
    "https://example.com/touch.png",
  );
  // `rel="shortcut icon"` is matched by the icon pattern.
  assert.equal(
    extractFaviconUrl(
      "<link rel=\"shortcut icon\" href=\"https://example.com/legacy.ico\">",
      "https://example.com/",
    ),
    "https://example.com/legacy.ico",
  );
  // Falls back to og:image only when no icon link is declared.
  assert.equal(
    extractFaviconUrl(
      "<meta property=\"og:image\" content=\"https://cdn.example.com/share.png\">",
      "https://example.com/",
    ),
    "https://cdn.example.com/share.png",
  );
  assert.equal(extractFaviconUrl("<head></head>", "https://example.com/"), null);
});

test("extractFaviconUrls returns all candidates ordered and deduped", () => {
  // apple-touch-icons come first, then rel="icon" links, then og:image.
  assert.deepEqual(
    extractFaviconUrls(
      "<link rel=\"icon\" href=\"/favicon.svg\">"
      + "<link rel=\"icon\" sizes=\"32x32\" href=\"/favicon-32.png\">"
      + "<link rel=\"apple-touch-icon\" href=\"/touch.png\">"
      + "<meta property=\"og:image\" content=\"https://cdn.example.com/share.png\">",
      "https://example.com/",
    ),
    [
      "https://example.com/touch.png",
      "https://example.com/favicon.svg",
      "https://example.com/favicon-32.png",
      "https://cdn.example.com/share.png",
    ],
  );

  // Duplicates (same resolved URL) appear only once.
  assert.deepEqual(
    extractFaviconUrls(
      "<link rel=\"apple-touch-icon\" href=\"/touch.png\">"
      + "<link rel=\"icon\" href=\"/touch.png\">",
      "https://example.com/",
    ),
    ["https://example.com/touch.png"],
  );

  // Empty head returns an empty array.
  assert.deepEqual(extractFaviconUrls("<head></head>", "https://example.com/"), []);
});

// --- downloadImage: header identity + content-type/byte-cap handling (mocked fetch) ---

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Build a Response-like stub whose body streams `chunks` (Uint8Arrays) through a reader. */
function fakeResponse(opts: {
  ok?: boolean;
  status?: number;
  contentType?: string | null;
  chunks?: Uint8Array[];
}): Response {
  const chunks = opts.chunks ?? [];
  let i = 0;
  const body = {
    getReader() {
      return {
        read() {
          if (i < chunks.length) {
            return Promise.resolve({
              done: false,
              value: chunks[i++],
            });
          }
          return Promise.resolve({
            done: true,
            value: undefined,
          });
        },
        cancel() {
          return Promise.resolve();
        },
      };
    },
  };
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? (opts.ok === false ? 403 : 200),
    body: body as unknown as ReadableStream<Uint8Array>,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? (opts.contentType ?? null) : null,
    },
  } as unknown as Response;
}

/** Build HTML with an `og:image` meta tag, for `fetchOgImage`'s page-fetch leg. */
function htmlResponse(imageUrl: string): Response {
  return fakeResponse({
    contentType: "text/html",
    chunks: [new TextEncoder().encode(`<head><meta property="og:image" content="${imageUrl}"></head>`)],
  });
}

/** Replace `fetch`, recording the init of the last call, and return the recorder. */
function mockFetch(response: Response): { lastInit: () => RequestInit | undefined } {
  let captured: RequestInit | undefined;
  globalThis.fetch = ((_url: string | URL | Request, init?: RequestInit) => {
    captured = init;
    return Promise.resolve(response);
  }) as typeof fetch;
  return {
    lastInit: () => captured,
  };
}

/** Replace `fetch` with a queue of canned responses, returned one per call in order. */
function mockFetchSequence(responses: Response[]): void {
  let i = 0;
  globalThis.fetch = (() => Promise.resolve(responses[Math.min(i++, responses.length - 1)])) as typeof fetch;
}

function headerValue(init: RequestInit | undefined, name: string): string | undefined {
  const headers = (init?.headers ?? {}) as Record<string, string>;
  return headers[name];
}

test("downloadImage sends a browser User-Agent (not a bot UA) and a Referer when given", async () => {
  const recorder = mockFetch(fakeResponse({
    contentType: "image/png",
    chunks: [new Uint8Array([1, 2, 3])],
  }));
  const bytes = await downloadImage("https://cdn.example.com/icon.png", "https://example.com/");
  assert.ok(bytes, "expected bytes back");

  const ua = headerValue(recorder.lastInit(), "User-Agent") ?? "";
  assert.ok(ua.includes("Mozilla/"), `expected a browser UA, got: ${ua}`);
  assert.ok(!ua.includes("eeSimple-bookmarks"), "must not send the bot UA that CDNs block");
  assert.equal(headerValue(recorder.lastInit(), "Referer"), "https://example.com/");
});

test("downloadImage omits Referer when none is provided", async () => {
  const recorder = mockFetch(fakeResponse({
    contentType: "image/png",
    chunks: [new Uint8Array([1])],
  }));
  await downloadImage("https://cdn.example.com/icon.png");
  assert.equal(headerValue(recorder.lastInit(), "Referer"), undefined);
});

test("downloadImage returns bytes even when content-type is octet-stream or absent", async () => {
  mockFetch(fakeResponse({
    contentType: "application/octet-stream",
    chunks: [new Uint8Array([9, 8, 7])],
  }));
  const octet = await downloadImage("https://cdn.example.com/icon");
  assert.ok(octet, "octet-stream image bytes should pass through to the decoder");

  mockFetch(fakeResponse({
    contentType: null,
    chunks: [new Uint8Array([4, 5, 6])],
  }));
  const noType = await downloadImage("https://cdn.example.com/icon");
  assert.ok(noType, "missing content-type should pass through to the decoder");
});

test("downloadImage returns null on a non-OK response", async () => {
  mockFetch(fakeResponse({
    ok: false,
    contentType: "image/png",
    chunks: [new Uint8Array([1])],
  }));
  assert.equal(await downloadImage("https://cdn.example.com/icon.png"), null);
});

test("downloadImage returns null when the body exceeds the byte cap", async () => {
  // MAX_IMAGE_BYTES is 5 MiB; a single oversized chunk must trip the cap.
  const oversized = new Uint8Array(5 * 1024 * 1024 + 1);
  mockFetch(fakeResponse({
    contentType: "image/png",
    chunks: [oversized],
  }));
  assert.equal(await downloadImage("https://cdn.example.com/huge.png"), null);
});

test("fetchOgImage reports a rate-limited/403 image download as \"blocked\", not \"bad_image\"", async () => {
  // Regression: a CDN (e.g. YouTube's avatar host) rejecting the image fetch after the page parsed
  // fine must not be collapsed into "bad_image" — that mislabels a transient failure as a permanent
  // decode error and skips `withTransientRetry`'s retry.
  mockFetchSequence([
    htmlResponse("https://yt3.googleusercontent.com/avatar.jpg"),
    fakeResponse({
      ok: false,
      status: 403,
    }),
  ]);
  assert.equal(await fetchOgImage("https://www.youtube.com/@netflix"), "blocked");
});

test("fetchOgImage reports a 5xx image download as \"server_error\", not \"bad_image\"", async () => {
  mockFetchSequence([
    htmlResponse("https://yt3.googleusercontent.com/avatar.jpg"),
    fakeResponse({
      ok: false,
      status: 503,
    }),
  ]);
  assert.equal(await fetchOgImage("https://www.youtube.com/@netflix"), "server_error");
});

test("fetchOgImage still returns the bytes on a successful image download", async () => {
  mockFetchSequence([
    htmlResponse("https://yt3.googleusercontent.com/avatar.jpg"),
    fakeResponse({
      contentType: "image/jpeg",
      chunks: [new Uint8Array([1, 2, 3])],
    }),
  ]);
  const result = await fetchOgImage("https://www.youtube.com/@netflix");
  assert.ok(Buffer.isBuffer(result), "expected raw image bytes back");
});

test("isPublicHttpUrl rejects non-http(s) and internal hosts", () => {
  assert.equal(isPublicHttpUrl("https://example.com/a.png"), true);
  assert.equal(isPublicHttpUrl("http://example.com/a.png"), true);
  assert.equal(isPublicHttpUrl("ftp://example.com/a.png"), false);
  assert.equal(isPublicHttpUrl("https://localhost/a.png"), false);
  assert.equal(isPublicHttpUrl("http://127.0.0.1/a.png"), false);
  assert.equal(isPublicHttpUrl("http://192.168.1.5/a.png"), false);
  assert.equal(isPublicHttpUrl("http://10.0.0.1/a.png"), false);
  assert.equal(isPublicHttpUrl("http://169.254.1.1/a.png"), false);
  assert.equal(isPublicHttpUrl("http://[::1]/a.png"), false);
  assert.equal(isPublicHttpUrl("not-a-url"), false);
});
