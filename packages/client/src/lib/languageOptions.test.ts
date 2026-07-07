// @vitest-environment node
import type { TFunction } from "i18next";
import type { Language } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { languageComboboxGroups, sortLanguagesFavoritesFirst } from "./languageOptions";

const t = ((s: string) => s) as TFunction;

function makeLanguage(overrides: Partial<Language> & Pick<Language, "id" | "name">): Language {
  return {
    isFavorite: false,
    isoCode: null,
    ...overrides,
  } as Language;
}

describe("languageComboboxGroups", () => {
  it("returns a single 'Languages' group when there are no favorites", () => {
    const languages = [
      makeLanguage({
        id: "1",
        name: "English",
      }),
      makeLanguage({
        id: "2",
        name: "Japanese",
      }),
    ];
    const groups = languageComboboxGroups(languages, t);
    expect(groups).toEqual([
      {
        heading: "Languages",
        options: [
          {
            value: "1",
            label: "English",
          },
          {
            value: "2",
            label: "Japanese",
          },
        ],
      },
    ]);
  });

  it("splits favorites into their own leading group", () => {
    const languages = [
      makeLanguage({
        id: "1",
        name: "English",
        isFavorite: true,
      }),
      makeLanguage({
        id: "2",
        name: "Japanese",
      }),
      makeLanguage({
        id: "3",
        name: "Spanish",
        isFavorite: true,
      }),
    ];
    const groups = languageComboboxGroups(languages, t);
    expect(groups).toEqual([
      {
        heading: "Favorites",
        options: [
          {
            value: "1",
            label: "English",
          },
          {
            value: "3",
            label: "Spanish",
          },
        ],
      },
      {
        heading: "All languages",
        options: [
          {
            value: "2",
            label: "Japanese",
          },
        ],
      },
    ]);
  });
});

describe("sortLanguagesFavoritesFirst", () => {
  it("moves favorites to the front, preserving relative order within each partition", () => {
    const languages = [
      makeLanguage({
        id: "1",
        name: "English",
      }),
      makeLanguage({
        id: "2",
        name: "Japanese",
        isFavorite: true,
      }),
      makeLanguage({
        id: "3",
        name: "Spanish",
      }),
      makeLanguage({
        id: "4",
        name: "French",
        isFavorite: true,
      }),
    ];
    const sorted = sortLanguagesFavoritesFirst(languages);
    expect(sorted.map(l => l.id)).toEqual(["2", "4", "1", "3"]);
  });

  it("does not mutate the input array", () => {
    const languages = [
      makeLanguage({
        id: "1",
        name: "English",
      }),
      makeLanguage({
        id: "2",
        name: "Japanese",
        isFavorite: true,
      }),
    ];
    const original = [...languages];
    sortLanguagesFavoritesFirst(languages);
    expect(languages).toEqual(original);
  });
});
