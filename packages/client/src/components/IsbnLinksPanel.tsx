import type { IsbnLink } from "../lib/isbnLinks";

/** A wrap row of external ISBN store/library links, shown under a text property value. */
export function IsbnLinksPanel({
  links,
}: { links: IsbnLink[] }) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
      {links.map(link => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="
            text-primary underline-offset-2
            hover:underline
          "
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
