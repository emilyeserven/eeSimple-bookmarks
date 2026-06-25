/**
 * Normalize the payload Android's share sheet hands to the `/quick-add` share target.
 *
 * The PWA manifest's `share_target` maps three fields — `url`, `title`, `text` — onto the
 * query string, but apps are inconsistent about which one carries the link. Chrome usually
 * sends a clean `url`; many apps (and plain "share text") put the link inside `text`, often
 * alongside descriptive text. This collapses those shapes into the `{ url, title }` the
 * bookmark form expects. `BookmarkForm`'s `autoScan` fetches real metadata afterwards, so a
 * best-effort title is fine.
 */
export interface SharedInput {
  url?: string;
  title?: string;
  text?: string;
}

export interface ParsedShare {
  url?: string;
  title?: string;
}

const URL_RE = /https?:\/\/[^\s]+/i;

function clean(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Resolve a shared payload to a URL + title:
 * - prefer an explicit `url`; otherwise pull the first http(s) URL out of `text`;
 * - use `title` for the title, falling back to `text` with the extracted URL removed.
 */
export function parseSharedInput(input: SharedInput): ParsedShare {
  const explicitUrl = clean(input.url);
  const title = clean(input.title);
  const text = clean(input.text);

  const fromText = text ? URL_RE.exec(text)?.[0] : undefined;
  const url = explicitUrl ?? fromText;

  if (title) return {
    url,
    title,
  };

  // No title given — derive one from the leftover text (minus the URL we pulled out).
  const leftover = text && fromText ? clean(text.replace(fromText, "")) : text;
  return {
    url,
    title: leftover,
  };
}
