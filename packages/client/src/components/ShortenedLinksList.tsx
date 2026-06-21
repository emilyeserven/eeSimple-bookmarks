import type { ShortenedLink } from "@eesimple/types";

interface ShortenedLinksListProps {
  links: ShortenedLink[];
  /** Text shown when there are no links (the card and the tab word this differently). */
  emptyText: string;
}

/**
 * Read-only list of a website's verified shortened links — each short domain and how it expands (or
 * a note that it is kept shortened). Shared by `WebsiteCard` and the Shortened Links view tab.
 */
export function ShortenedLinksList({
  links, emptyText,
}: ShortenedLinksListProps) {
  if (links.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2 text-sm">
      {links.map(link => (
        <li
          key={link.domain}
          className="rounded-md border p-2"
        >
          <span className="font-mono">{link.domain}</span>
          {link.keepShortened || !link.expandTo
            ? <span className="text-muted-foreground"> — kept shortened</span>
            : (
              <>
                <span className="text-muted-foreground"> → </span>
                <span className="font-mono">{link.expandTo}</span>
              </>
            )}
        </li>
      ))}
    </ul>
  );
}
