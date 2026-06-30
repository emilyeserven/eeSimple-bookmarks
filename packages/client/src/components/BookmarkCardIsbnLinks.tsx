import type { Bookmark, CustomProperty } from "@eesimple/types";

import { buildIsbnLinks } from "../lib/isbnLinks";

/**
 * Compact Amazon/Open Library/WorldCat/Goodreads links for any text-typed property with a non-empty
 * value (e.g. ISBN/ASIN). Renders `null` when the bookmark has no qualifying text values.
 */
export function BookmarkCardIsbnLinks({
  bookmark, properties,
}: { bookmark: Bookmark;
  properties: CustomProperty[]; }) {
  const propById = new Map(properties.map(p => [p.id, p]));
  const isbnLinks = bookmark.textValues.flatMap((entry) => {
    const prop = propById.get(entry.propertyId);
    if (!prop || prop.type !== "text" || !entry.value.trim()) return [];
    return buildIsbnLinks(entry.value).slice(0, 2);
  });

  if (isbnLinks.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 px-3 pb-2 text-xs">
      {isbnLinks.map(link => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="
            text-muted-foreground underline-offset-2
            hover:text-foreground hover:underline
          "
          onClick={e => e.stopPropagation()}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
