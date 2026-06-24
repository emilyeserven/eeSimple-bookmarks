export interface IsbnLink {
  label: string;
  url: string;
}

export function buildIsbnLinks(value: string): IsbnLink[] {
  const v = value.trim();
  if (!v) return [];
  return [
    {
      label: "Amazon (US)",
      url: `https://www.amazon.com/dp/${v}`,
    },
    {
      label: "Amazon (Japan)",
      url: `https://www.amazon.co.jp/dp/${v}`,
    },
    {
      label: "Open Library",
      url: `https://openlibrary.org/isbn/${v}`,
    },
    {
      label: "WorldCat",
      url: `https://www.worldcat.org/isbn/${v}`,
    },
    {
      label: "Goodreads",
      url: `https://www.goodreads.com/book/isbn/${v}`,
    },
  ];
}
