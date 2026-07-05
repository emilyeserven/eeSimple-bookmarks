import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isbn10ToIsbn13,
  isbn13ToIsbn10,
  isValidIsbn10,
  isValidIsbn13,
  normalizeIsbnTo13,
} from "./isbn.js";

test("isValidIsbn10 accepts a real checksum-valid ISBN-10", () => {
  assert.equal(isValidIsbn10("0131103628"), true);
  assert.equal(isValidIsbn10("0-13-110362-8"), true);
});

test("isValidIsbn10 rejects wrong checksum, length, or shape", () => {
  assert.equal(isValidIsbn10("0131103620"), false);
  assert.equal(isValidIsbn10("013110362"), false);
  assert.equal(isValidIsbn10("B0BXYZ1234"), false);
});

test("isValidIsbn10 accepts a trailing X check digit", () => {
  assert.equal(isValidIsbn10("097522980X"), true);
});

test("isValidIsbn13 accepts a real checksum-valid ISBN-13", () => {
  assert.equal(isValidIsbn13("9780131103627"), true);
  assert.equal(isValidIsbn13("978-0-13-110362-7"), true);
});

test("isValidIsbn13 rejects wrong checksum or length", () => {
  assert.equal(isValidIsbn13("9780131103620"), false);
  assert.equal(isValidIsbn13("978013110362"), false);
});

test("isbn10ToIsbn13 converts a standard ISBN-10", () => {
  assert.equal(isbn10ToIsbn13("0131103628"), "9780131103627");
});

test("isbn10ToIsbn13 is checksum-blind (recomputes the check digit)", () => {
  // Deliberately wrong check digit on the input — conversion still succeeds using the first 9 digits.
  assert.equal(isbn10ToIsbn13("0131103620"), "9780131103627");
});

test("isbn10ToIsbn13 returns null for non-ISBN-10-shaped input", () => {
  assert.equal(isbn10ToIsbn13("B0BXYZ1234"), null);
  assert.equal(isbn10ToIsbn13("12345"), null);
});

test("isbn13ToIsbn10 round-trips a 978-prefixed ISBN-13 losslessly", () => {
  assert.equal(isbn13ToIsbn10("9780131103627"), "0131103628");
});

test("isbn13ToIsbn10 returns null for 979-prefixed ISBN-13 (no ISBN-10 form)", () => {
  assert.equal(isbn13ToIsbn10("9791234567896"), null);
});

test("isbn13ToIsbn10 returns null for wrong length", () => {
  assert.equal(isbn13ToIsbn10("978013110362"), null);
});

test("normalizeIsbnTo13 passes through a 13-digit value, stripping separators", () => {
  assert.equal(normalizeIsbnTo13("978-0-13-110362-7"), "9780131103627");
});

test("normalizeIsbnTo13 converts a 10-char value", () => {
  assert.equal(normalizeIsbnTo13("0-13-110362-8"), "9780131103627");
});

test("normalizeIsbnTo13 returns null for garbage input", () => {
  assert.equal(normalizeIsbnTo13("not an isbn"), null);
  assert.equal(normalizeIsbnTo13("12345"), null);
});
