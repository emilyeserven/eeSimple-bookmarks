import assert from "node:assert/strict";
import { test } from "node:test";

import {
  extractAmazonIsbn,
  extractIsbn13FromAmazonUrl,
  isAmazonProductUrl,
  parseAmazonProduct,
} from "./amazon.js";

const ISBN10_ASIN = "0131103628"; // a real, checksum-valid ISBN-10
const KINDLE_ASIN = "B0BXYZ1234"; // an opaque catalog ASIN, not an ISBN

test("parseAmazonProduct handles /dp/{ASIN}", () => {
  assert.deepEqual(parseAmazonProduct(`https://www.amazon.com/dp/${ISBN10_ASIN}`), {
    asin: ISBN10_ASIN,
  });
});

test("parseAmazonProduct handles /Title-Slug/dp/{ASIN}/ref=...", () => {
  assert.deepEqual(
    parseAmazonProduct(`https://www.amazon.com/Some-Book-Title/dp/${ISBN10_ASIN}/ref=sr_1_1`),
    {
      asin: ISBN10_ASIN,
    },
  );
});

test("parseAmazonProduct handles /gp/product/{ASIN}", () => {
  assert.deepEqual(parseAmazonProduct(`https://www.amazon.co.uk/gp/product/${ISBN10_ASIN}`), {
    asin: ISBN10_ASIN,
  });
});

test("parseAmazonProduct works across TLDs and subdomains", () => {
  for (const host of ["amazon.com", "amazon.co.jp", "amazon.co.uk", "amazon.de", "smile.amazon.com"]) {
    assert.deepEqual(
      parseAmazonProduct(`https://${host}/dp/${ISBN10_ASIN}`),
      {
        asin: ISBN10_ASIN,
      },
      host,
    );
  }
});

test("parseAmazonProduct returns null for non-Amazon hosts", () => {
  assert.equal(parseAmazonProduct(`https://not-amazon.com/dp/${ISBN10_ASIN}`), null);
  assert.equal(parseAmazonProduct(`https://amazon.fake.com/dp/${ISBN10_ASIN}`), null);
});

test("parseAmazonProduct returns null for a non-product Amazon URL or malformed URL", () => {
  assert.equal(parseAmazonProduct("https://www.amazon.com/gp/cart/view.html"), null);
  assert.equal(parseAmazonProduct("not a url"), null);
});

test("isAmazonProductUrl mirrors parseAmazonProduct", () => {
  assert.equal(isAmazonProductUrl(`https://www.amazon.com/dp/${ISBN10_ASIN}`), true);
  assert.equal(isAmazonProductUrl("https://example.com/dp/1234567890"), false);
});

test("extractIsbn13FromAmazonUrl converts a real ISBN-10 ASIN to ISBN-13", () => {
  assert.equal(
    extractIsbn13FromAmazonUrl(`https://www.amazon.com/dp/${ISBN10_ASIN}`),
    "9780131103627",
  );
});

test("extractIsbn13FromAmazonUrl returns null for a non-ISBN (Kindle-style) ASIN", () => {
  assert.equal(extractIsbn13FromAmazonUrl(`https://www.amazon.com/dp/${KINDLE_ASIN}`), null);
});

test("extractIsbn13FromAmazonUrl returns null for a non-Amazon URL", () => {
  assert.equal(extractIsbn13FromAmazonUrl(`https://example.com/dp/${ISBN10_ASIN}`), null);
});

test("extractAmazonIsbn finds an ISBN in a schema.org/Book JSON-LD block", () => {
  const html = "<script type=\"application/ld+json\">{\"@type\":\"Book\",\"isbn\":\"9780131103627\"}</script>";
  assert.equal(extractAmazonIsbn(html), "9780131103627");
});

test("extractAmazonIsbn converts an ISBN-10 found in JSON-LD to ISBN-13", () => {
  const html = `<script type="application/ld+json">{"@type":"Book","isbn":"${ISBN10_ASIN}"}</script>`;
  assert.equal(extractAmazonIsbn(html), "9780131103627");
});

test("extractAmazonIsbn falls back to an 'ISBN-13' product-details bullet", () => {
  const html = "<li><span>ISBN-13</span><span>‏ : ‎978-0131103627</span></li>";
  assert.equal(extractAmazonIsbn(html), "9780131103627");
});

test("extractAmazonIsbn falls back to an 'ISBN-10' product-details bullet, converted to ISBN-13", () => {
  const html = `<li><span>ISBN-10</span><span>‏ : ‎${ISBN10_ASIN}</span></li>`;
  assert.equal(extractAmazonIsbn(html), "9780131103627");
});

test("extractAmazonIsbn returns null when no ISBN is present", () => {
  assert.equal(extractAmazonIsbn("<html><body>no isbn here</body></html>"), null);
});

test("extractAmazonIsbn ignores a checksum-invalid ISBN-13 bullet", () => {
  const html = "<li><span>ISBN-13</span><span>‏ : ‎978-0000000000</span></li>";
  assert.equal(extractAmazonIsbn(html), null);
});
