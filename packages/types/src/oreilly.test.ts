import assert from "node:assert/strict";
import { test } from "node:test";

import { extractIsbn13FromOreillyUrl, isOreillyProductUrl } from "./oreilly.js";

const ISBN13_A = "9798341662681"; // real, checksum-valid ISBN-13
const ISBN13_B = "9781098119058"; // real, checksum-valid ISBN-13

test("extractIsbn13FromOreillyUrl finds the ISBN in a learning.oreilly.com continue URL", () => {
  assert.equal(
    extractIsbn13FromOreillyUrl(`https://learning.oreilly.com/api/v1/continue/${ISBN13_A}/`),
    ISBN13_A,
  );
});

test("extractIsbn13FromOreillyUrl finds the ISBN in a www.oreilly.com library/view URL", () => {
  assert.equal(
    extractIsbn13FromOreillyUrl(`https://www.oreilly.com/library/view/designing-data-intensive-applications/${ISBN13_B}/`),
    ISBN13_B,
  );
});

test("extractIsbn13FromOreillyUrl works with a bare oreilly.com host", () => {
  assert.equal(
    extractIsbn13FromOreillyUrl(`https://oreilly.com/library/view/some-title/${ISBN13_B}/`),
    ISBN13_B,
  );
});

test("extractIsbn13FromOreillyUrl returns null for a non-O'Reilly host", () => {
  assert.equal(extractIsbn13FromOreillyUrl(`https://example.com/library/view/some-title/${ISBN13_B}/`), null);
  assert.equal(extractIsbn13FromOreillyUrl(`https://not-oreilly.com/library/view/some-title/${ISBN13_B}/`), null);
});

test("extractIsbn13FromOreillyUrl returns null when no path segment is a valid ISBN-13", () => {
  assert.equal(extractIsbn13FromOreillyUrl("https://www.oreilly.com/library/view/some-title/"), null);
  assert.equal(extractIsbn13FromOreillyUrl("https://www.oreilly.com/library/view/some-title/1234567890123/"), null);
});

test("extractIsbn13FromOreillyUrl returns null for a malformed URL", () => {
  assert.equal(extractIsbn13FromOreillyUrl("not a url"), null);
});

test("isOreillyProductUrl mirrors extractIsbn13FromOreillyUrl", () => {
  assert.equal(isOreillyProductUrl(`https://learning.oreilly.com/api/v1/continue/${ISBN13_A}/`), true);
  assert.equal(isOreillyProductUrl("https://www.oreilly.com/library/view/some-title/"), false);
});
