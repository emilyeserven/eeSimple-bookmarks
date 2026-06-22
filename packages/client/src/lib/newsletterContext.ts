/** A run of the newsletter-context passage, flagged for bold when it is the link's anchor text. */
export interface ContextSegment {
  text: string;
  bold: boolean;
}

/**
 * Split `context` into segments, marking case-insensitive occurrences of `anchor` as bold so the UI
 * can highlight where the link was attached within the surrounding passage. Returns a single
 * non-bold segment when `anchor` is empty/absent or never appears. Pure (JSX-free).
 */
export function highlightAnchor(
  context: string,
  anchor: string | null | undefined,
): ContextSegment[] {
  const needle = anchor?.trim() ?? "";
  if (needle.length === 0) return [{
    text: context,
    bold: false,
  }];

  const hay = context.toLowerCase();
  const target = needle.toLowerCase();
  const segments: ContextSegment[] = [];
  let i = 0;
  for (let idx = hay.indexOf(target, i); idx !== -1; idx = hay.indexOf(target, i)) {
    if (idx > i) segments.push({
      text: context.slice(i, idx),
      bold: false,
    });
    segments.push({
      text: context.slice(idx, idx + needle.length),
      bold: true,
    });
    i = idx + needle.length;
  }
  if (i < context.length) segments.push({
    text: context.slice(i),
    bold: false,
  });

  return segments.length > 0
    ? segments
    : [{
      text: context,
      bold: false,
    }];
}
