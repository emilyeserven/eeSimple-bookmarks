import i18n from "../i18n";

export interface IsbnLink {
  label: string;
  url: string;
}

export function buildIsbnLinks(value: string): IsbnLink[] {
  const v = value.trim();
  if (!v) return [];
  return [
    {
      label: i18n.t("Amazon (US)"),
      url: `https://www.amazon.com/dp/${v}`,
    },
    {
      label: i18n.t("Amazon (Japan)"),
      url: `https://www.amazon.co.jp/dp/${v}`,
    },
    {
      label: i18n.t("Open Library"),
      url: `https://openlibrary.org/isbn/${v}`,
    },
    {
      label: i18n.t("WorldCat"),
      url: `https://www.worldcat.org/isbn/${v}`,
    },
    {
      label: i18n.t("Goodreads"),
      url: `https://www.goodreads.com/book/isbn/${v}`,
    },
  ];
}
