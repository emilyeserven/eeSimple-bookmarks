import assert from "node:assert/strict";
import { test } from "node:test";

import { extractIsbnFromHtml } from "./isbnScrape.js";

const ISBN10 = "0131103628"; // a real, checksum-valid ISBN-10
const ISBN13 = "9780131103627"; // its ISBN-13 form

test("extractIsbnFromHtml finds an ISBN in a JSON-LD block", () => {
  const html = `<script type="application/ld+json">{"@type":"Book","isbn":"${ISBN13}"}</script>`;
  assert.equal(extractIsbnFromHtml(html), ISBN13);
});

test("extractIsbnFromHtml converts an ISBN-10 found in JSON-LD to ISBN-13", () => {
  const html = `<script type="application/ld+json">{"@type":"Book","isbn":"${ISBN10}"}</script>`;
  assert.equal(extractIsbnFromHtml(html), ISBN13);
});

test("extractIsbnFromHtml matches a dash-style 'ISBN-13' label", () => {
  const html = "<li><span>ISBN-13</span><span>‏ : ‎978-0131103627</span></li>";
  assert.equal(extractIsbnFromHtml(html), ISBN13);
});

test("extractIsbnFromHtml matches a no-dash 'ISBN13' label", () => {
  const html = "<tr><th>ISBN13</th><td>9780131103627</td></tr>";
  assert.equal(extractIsbnFromHtml(html), ISBN13);
});

test("extractIsbnFromHtml falls back to an 'ISBN-10' label, converted to ISBN-13", () => {
  const html = `<li><span>ISBN-10</span><span>‏ : ‎${ISBN10}</span></li>`;
  assert.equal(extractIsbnFromHtml(html), ISBN13);
});

test("extractIsbnFromHtml returns null when no ISBN is present", () => {
  assert.equal(extractIsbnFromHtml("<html><body>no isbn here</body></html>"), null);
});

test("extractIsbnFromHtml ignores a checksum-invalid ISBN-13 label", () => {
  const html = "<li><span>ISBN-13</span><span>‏ : ‎978-0000000000</span></li>";
  assert.equal(extractIsbnFromHtml(html), null);
});
