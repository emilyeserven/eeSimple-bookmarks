import { isbn13ToIsbn10 } from "@eesimple/types";

import i18n from "../i18n";

export interface IsbnLink {
  label: string;
  url: string;
}

export function buildIsbnLinks(value: string): IsbnLink[] {
  const v = value.trim();
  if (!v) return [];
  // Amazon's /dp/ path expects an ASIN/ISBN-10, not ISBN-13 — derive it when the stored value is a
  // 978-prefixed ISBN-13 (lossless); a 979-prefixed ISBN-13 has no ISBN-10 form, so omit the Amazon
  // links rather than emit a broken URL.
  const isbn10 = v.length === 13 ? isbn13ToIsbn10(v) : v;
  const amazonLinks: IsbnLink[] = isbn10
    ? [
      {
        label: i18n.t("Amazon (US)"),
        url: `https://www.amazon.com/dp/${isbn10}`,
      },
      {
        label: i18n.t("Amazon (Japan)"),
        url: `https://www.amazon.co.jp/dp/${isbn10}`,
      },
    ]
    : [];
  return [
    ...amazonLinks,
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
