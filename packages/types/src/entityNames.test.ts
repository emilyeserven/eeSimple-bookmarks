import assert from "node:assert/strict";
import { test } from "node:test";

import type { EntityName } from "./entityNames.js";
import { nameSortKey, namesWithLegacyFallback, resolveDisplayNames, resolveNameSortKey, slugSourceFromNames } from "./entityNames.js";

function makeName(overrides: Partial<EntityName> & { value: string;
  isoCode: string | null;
  languageId?: string; }): EntityName {
  return {
    id: overrides.id ?? `${overrides.value}-id`,
    language: {
      id: overrides.languageId ?? `lang-${overrides.isoCode ?? "x"}`,
      name: overrides.isoCode ?? "Custom",
      slug: overrides.isoCode ?? "custom",
      isoCode: overrides.isoCode,
    },
    value: overrides.value,
    isPrimary: overrides.isPrimary ?? false,
    sortOrder: overrides.sortOrder ?? 0,
  };
}

const japanese = makeName({
  value: "進撃の巨人",
  isoCode: "ja",
  languageId: "lang-ja",
  isPrimary: true,
  sortOrder: 0,
});
const english = makeName({
  value: "Attack on Titan",
  isoCode: "en",
  languageId: "lang-en",
  sortOrder: 1,
});

// --- resolveDisplayNames ---

test("resolveDisplayNames falls back to base with no names", () => {
  assert.deepEqual(resolveDisplayNames([], null, "進撃の巨人"), {
    primary: "進撃の巨人",
    secondary: null,
  });
});

test("resolveDisplayNames falls back to the most useful other name when no preference is given", () => {
  assert.deepEqual(resolveDisplayNames([japanese, english], null, "進撃の巨人"), {
    primary: "進撃の巨人",
    secondary: "Attack on Titan",
  });
});

test("resolveDisplayNames prefers an English other name over a non-English one in the fallback", () => {
  const french = makeName({
    value: "L'Attaque des Titans",
    isoCode: "fr",
    languageId: "lang-fr",
    sortOrder: 2,
  });
  assert.deepEqual(resolveDisplayNames([japanese, french, english], null, "進撃の巨人"), {
    primary: "進撃の巨人",
    secondary: "Attack on Titan",
  });
});

test("resolveDisplayNames falls back to the first other name when none is English", () => {
  const french = makeName({
    value: "L'Attaque des Titans",
    isoCode: "fr",
    languageId: "lang-fr",
  });
  assert.deepEqual(resolveDisplayNames([japanese, french], null, "進撃の巨人"), {
    primary: "進撃の巨人",
    secondary: "L'Attaque des Titans",
  });
});

test("resolveDisplayNames has no secondary when there is only one name", () => {
  const onlyJa = makeName({
    value: "進撃の巨人",
    isoCode: "ja",
    languageId: "lang-ja",
    isPrimary: true,
  });
  assert.deepEqual(resolveDisplayNames([onlyJa], null, "進撃の巨人"), {
    primary: "進撃の巨人",
    secondary: null,
  });
});

test("resolveDisplayNames promotes the preferred-language name and de-emphasizes the primary", () => {
  assert.deepEqual(resolveDisplayNames([japanese, english], {
    isoCode: "en",
  }, "進撃の巨人"), {
    primary: "Attack on Titan",
    secondary: "進撃の巨人",
  });
});

test("resolveDisplayNames matches the preferred language by id too", () => {
  assert.deepEqual(resolveDisplayNames([japanese, english], {
    id: "lang-en",
  }, "進撃の巨人"), {
    primary: "Attack on Titan",
    secondary: "進撃の巨人",
  });
});

test("resolveDisplayNames yields no secondary when the preferred name equals the primary", () => {
  const onlyJa = makeName({
    value: "進撃の巨人",
    isoCode: "ja",
    languageId: "lang-ja",
    isPrimary: true,
  });
  assert.deepEqual(resolveDisplayNames([onlyJa], {
    isoCode: "ja",
  }, "進撃の巨人"), {
    primary: "進撃の巨人",
    secondary: null,
  });
});

test("resolveDisplayNames falls back to the most useful other name when the preferred language has no match", () => {
  assert.deepEqual(resolveDisplayNames([japanese, english], {
    isoCode: "fr",
  }, "進撃の巨人"), {
    primary: "進撃の巨人",
    secondary: "Attack on Titan",
  });
});

test("resolveDisplayNames prefers the secondaryLanguage match over the English-tagged fallback", () => {
  const french = makeName({
    value: "L'Attaque des Titans",
    isoCode: "fr",
    languageId: "lang-fr",
    sortOrder: 2,
  });
  assert.deepEqual(resolveDisplayNames([japanese, french, english], null, "進撃の巨人", {
    isoCode: "fr",
  }), {
    primary: "進撃の巨人",
    secondary: "L'Attaque des Titans",
  });
});

test("resolveDisplayNames matches secondaryLanguage by id too", () => {
  const french = makeName({
    value: "L'Attaque des Titans",
    isoCode: "fr",
    languageId: "lang-fr",
    sortOrder: 2,
  });
  assert.deepEqual(resolveDisplayNames([japanese, french, english], null, "進撃の巨人", {
    id: "lang-fr",
  }), {
    primary: "進撃の巨人",
    secondary: "L'Attaque des Titans",
  });
});

test("resolveDisplayNames falls back to the English/first-other name when secondaryLanguage has no match", () => {
  assert.deepEqual(resolveDisplayNames([japanese, english], null, "進撃の巨人", {
    isoCode: "fr",
  }), {
    primary: "進撃の巨人",
    secondary: "Attack on Titan",
  });
});

// --- nameSortKey ---

test("nameSortKey sorts by the primary name by default", () => {
  assert.equal(nameSortKey([japanese, english], "進撃の巨人"), "進撃の巨人");
});

test("nameSortKey sorts by the preferred-language name when present", () => {
  assert.equal(nameSortKey([japanese, english], "進撃の巨人", {
    isoCode: "en",
  }), "Attack on Titan");
});

test("nameSortKey falls back to base when there are no names", () => {
  assert.equal(nameSortKey([], "Fallback", {
    isoCode: "en",
  }), "Fallback");
});

// --- resolveNameSortKey ---

test("resolveNameSortKey prefers the preferred-language name over the romanized fallback", () => {
  assert.equal(
    resolveNameSortKey([japanese, english], "進撃の巨人", {
      preferredLanguage: {
        isoCode: "ja",
      },
      preferRomanized: true,
    }),
    "進撃の巨人",
  );
});

test("resolveNameSortKey uses the English/romanized name when preferRomanized and no preferred match", () => {
  // No German name; preferRomanized falls to the English name rather than the primary.
  assert.equal(
    resolveNameSortKey([japanese, english], "進撃の巨人", {
      preferredLanguage: {
        isoCode: "de",
      },
      preferRomanized: true,
    }),
    "Attack on Titan",
  );
});

test("resolveNameSortKey falls back to the primary name when preferRomanized is off", () => {
  assert.equal(
    resolveNameSortKey([japanese, english], "進撃の巨人", {
      preferRomanized: false,
    }),
    "進撃の巨人",
  );
});

test("resolveNameSortKey uses a synthesized legacy-romanized row as the romanized fallback", () => {
  const names = namesWithLegacyFallback([], "Shingeki no Kyojin");
  assert.equal(
    resolveNameSortKey(names, "進撃の巨人", {
      preferRomanized: true,
    }),
    "Shingeki no Kyojin",
  );
});

// --- slugSourceFromNames ---

test("slugSourceFromNames prefers the English name so slugs stay ASCII", () => {
  assert.equal(slugSourceFromNames([japanese, english], "進撃の巨人"), "Attack on Titan");
});

test("slugSourceFromNames falls back to the base name with no English name", () => {
  assert.equal(slugSourceFromNames([japanese], "進撃の巨人"), "進撃の巨人");
});

test("slugSourceFromNames ignores an empty English value", () => {
  const blankEn = makeName({
    value: "   ",
    isoCode: "en",
    languageId: "lang-en",
  });
  assert.equal(slugSourceFromNames([japanese, blankEn], "進撃の巨人"), "進撃の巨人");
});

// --- namesWithLegacyFallback ---

test("namesWithLegacyFallback returns real names unchanged when present", () => {
  assert.deepEqual(namesWithLegacyFallback([japanese, english], "ignored"), [japanese, english]);
});

test("namesWithLegacyFallback synthesizes a row from the legacy romanized value when names is empty", () => {
  const result = namesWithLegacyFallback([], "Attack on Titan");
  assert.equal(result.length, 1);
  assert.equal(result[0].value, "Attack on Titan");
  assert.equal(result[0].isPrimary, false);
});

test("namesWithLegacyFallback returns an empty array with no names and no legacy value", () => {
  assert.deepEqual(namesWithLegacyFallback([], null), []);
  assert.deepEqual(namesWithLegacyFallback(null, undefined), []);
  assert.deepEqual(namesWithLegacyFallback(undefined, "   "), []);
});
