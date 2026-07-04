import assert from "node:assert/strict";
import { test } from "node:test";

import type { EntityName } from "./entityNames.js";
import { nameSortKey, resolveDisplayNames, slugSourceFromNames } from "./entityNames.js";

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

test("resolveDisplayNames uses the primary row and no secondary when no preference is given", () => {
  assert.deepEqual(resolveDisplayNames([japanese, english], null, "進撃の巨人"), {
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

test("resolveDisplayNames ignores a preferred language with no matching name", () => {
  assert.deepEqual(resolveDisplayNames([japanese, english], {
    isoCode: "fr",
  }, "進撃の巨人"), {
    primary: "進撃の巨人",
    secondary: null,
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
