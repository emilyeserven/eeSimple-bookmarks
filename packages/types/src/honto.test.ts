import assert from "node:assert/strict";
import { test } from "node:test";

import { extractHontoIsbn, isHontoProductUrl } from "./honto.js";

const ISBN10 = "0131103628"; // a real, checksum-valid ISBN-10

test("isHontoProductUrl recognizes a honto.jp product page", () => {
  assert.equal(isHontoProductUrl("https://honto.jp/netstore/pd-book_12345678.html"), true);
});

test("isHontoProductUrl recognizes a www. subdomain", () => {
  assert.equal(isHontoProductUrl("https://www.honto.jp/netstore/pd-book_12345678.html"), true);
});

test("isHontoProductUrl returns false for non-product honto.jp pages", () => {
  assert.equal(isHontoProductUrl("https://honto.jp/"), false);
  assert.equal(isHontoProductUrl("https://honto.jp/netstore/search_1000.html"), false);
});

test("isHontoProductUrl returns false for non-honto hosts or malformed URLs", () => {
  assert.equal(isHontoProductUrl("https://not-honto.jp/netstore/pd-book_12345678.html"), false);
  assert.equal(isHontoProductUrl("https://honto.jp.fake.com/netstore/pd-book_12345678.html"), false);
  assert.equal(isHontoProductUrl("not a url"), false);
});

test("extractHontoIsbn finds an ISBN in a schema.org/Book JSON-LD block", () => {
  const html = "<script type=\"application/ld+json\">{\"@type\":\"Book\",\"isbn\":\"9780131103627\"}</script>";
  assert.equal(extractHontoIsbn(html), "9780131103627");
});

test("extractHontoIsbn converts an ISBN-10 found in JSON-LD to ISBN-13", () => {
  const html = `<script type="application/ld+json">{"@type":"Book","isbn":"${ISBN10}"}</script>`;
  assert.equal(extractHontoIsbn(html), "9780131103627");
});

test("extractHontoIsbn falls back to an 'ISBN13' product-details row", () => {
  const html = "<tr><th>ISBN13</th><td>9780131103627</td></tr>";
  assert.equal(extractHontoIsbn(html), "9780131103627");
});

test("extractHontoIsbn falls back to an 'ISBN10' product-details row, converted to ISBN-13", () => {
  const html = `<tr><th>ISBN10</th><td>${ISBN10}</td></tr>`;
  assert.equal(extractHontoIsbn(html), "9780131103627");
});

test("extractHontoIsbn returns null when no ISBN is present", () => {
  assert.equal(extractHontoIsbn("<html><body>no isbn here</body></html>"), null);
});

test("extractHontoIsbn ignores a checksum-invalid ISBN13 row", () => {
  const html = "<tr><th>ISBN13</th><td>978-0000000000</td></tr>";
  assert.equal(extractHontoIsbn(html), null);
});
