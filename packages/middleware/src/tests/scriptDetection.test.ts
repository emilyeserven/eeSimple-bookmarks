import assert from "node:assert/strict";
import { test } from "node:test";

import { detectNameLanguage } from "@/utils/scriptDetection";

test("detectNameLanguage classifies pure Hangul as Korean", () => {
  assert.equal(detectNameLanguage("강남"), "ko");
  assert.equal(detectNameLanguage("오징어 게임"), "ko");
});

test("detectNameLanguage classifies kana + kanji as Japanese", () => {
  assert.equal(detectNameLanguage("進撃の巨人"), "ja");
  assert.equal(detectNameLanguage("ドラえもん"), "ja");
  // kana mixed with Latin is still Japanese
  assert.equal(detectNameLanguage("NARUTO ナルト"), "ja");
});

test("detectNameLanguage leaves kanji-only (Han, no kana) undetermined by default", () => {
  // Ambiguous Japanese vs. Chinese — never guess without a preference.
  assert.equal(detectNameLanguage("三国志"), null);
  assert.equal(detectNameLanguage("中国"), null);
});

test("detectNameLanguage resolves kanji-only via the Han fallback preference", () => {
  assert.equal(detectNameLanguage("三国志", "ja"), "ja");
  assert.equal(detectNameLanguage("中国", "zh"), "zh");
  // The fallback only applies to Han-only text — kana still wins as Japanese, hangul as Korean.
  assert.equal(detectNameLanguage("進撃の巨人", "zh"), "ja");
  assert.equal(detectNameLanguage("강남", "zh"), "ko");
  // Latin is unaffected by the Han fallback.
  assert.equal(detectNameLanguage("Attack on Titan", "zh"), "en");
});

test("detectNameLanguage classifies Latin text as English", () => {
  assert.equal(detectNameLanguage("Attack on Titan"), "en");
  assert.equal(detectNameLanguage("The Lord of the Rings"), "en");
  // digits/punctuation around Latin letters do not change the verdict
  assert.equal(detectNameLanguage("Blade Runner 2049"), "en");
});

test("detectNameLanguage leaves mixed Latin + Han undetermined", () => {
  assert.equal(detectNameLanguage("Ghibli 三国"), null);
  assert.equal(detectNameLanguage("Movie 中国"), null);
});

test("detectNameLanguage leaves digits/punctuation-only undetermined", () => {
  assert.equal(detectNameLanguage("2049"), null);
  assert.equal(detectNameLanguage("!!! — ???"), null);
  assert.equal(detectNameLanguage("   "), null);
});

test("detectNameLanguage leaves empty string undetermined", () => {
  assert.equal(detectNameLanguage(""), null);
});

test("detectNameLanguage leaves other scripts (Cyrillic) undetermined", () => {
  assert.equal(detectNameLanguage("Война и мир"), null);
});
