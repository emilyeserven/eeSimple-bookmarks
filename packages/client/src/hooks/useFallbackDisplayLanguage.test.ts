// @vitest-environment node
import { describe, expect, it } from "vitest";

import { resolveFallbackDisplayLanguage } from "./useAppSettings";

const languages = [
  {
    id: "lang-en",
    isoCode: "en",
  },
  {
    id: "lang-ja",
    isoCode: "ja",
  },
];

describe("resolveFallbackDisplayLanguage", () => {
  it("defaults to English when no fallback id is set (byte-identical to the historical behavior)", () => {
    expect(resolveFallbackDisplayLanguage(null, languages)).toEqual({
      isoCode: "en",
    });
    expect(resolveFallbackDisplayLanguage(undefined, languages)).toEqual({
      isoCode: "en",
    });
  });

  it("resolves a set id to its language reference", () => {
    expect(resolveFallbackDisplayLanguage("lang-ja", languages)).toEqual({
      id: "lang-ja",
      isoCode: "ja",
    });
  });

  it("falls back to English when the id no longer resolves or languages are unloaded", () => {
    expect(resolveFallbackDisplayLanguage("lang-gone", languages)).toEqual({
      isoCode: "en",
    });
    expect(resolveFallbackDisplayLanguage("lang-ja", undefined)).toEqual({
      isoCode: "en",
    });
  });
});
