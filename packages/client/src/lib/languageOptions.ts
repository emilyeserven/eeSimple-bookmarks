import type { ComboboxGroup, ComboboxOption } from "../components/Combobox";
import type { Language } from "@eesimple/types";
import type { TFunction } from "i18next";

function toOption(language: Language): ComboboxOption {
  return {
    value: language.id,
    label: language.name,
  };
}

/**
 * Build `Combobox` groups for a language list, with a "Favorites" section (when non-empty) shown
 * above the rest. Shared by every single-select language picker so favorites surface consistently
 * app-wide.
 */
export function languageComboboxGroups(languages: Language[], t: TFunction): ComboboxGroup[] {
  const favorites = languages.filter(l => l.isFavorite);
  const rest = languages.filter(l => !l.isFavorite);
  const groups: ComboboxGroup[] = [];
  if (favorites.length > 0) {
    groups.push({
      heading: t("Favorites"),
      options: favorites.map(toOption),
    });
  }
  groups.push({
    heading: favorites.length > 0 ? t("All languages") : t("Languages"),
    options: rest.map(toOption),
  });
  return groups;
}

/**
 * Sort favorited languages to the front of a flat list (stable within each partition). Shared by
 * multi-select language pickers (`MultiCombobox`), which show favorites first without section
 * headings.
 */
export function sortLanguagesFavoritesFirst(languages: Language[]): Language[] {
  return [...languages].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite));
}
