import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { extractImageUrl, isPublicHttpUrl } from "@/services/metadata";
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
