import type { SyncDiff, SyncFieldDiff } from "./syncSourceTypes";

import { fillEmptyDefault, rowDiffers } from "./syncSourceTypes";

/** A podcast's current values, for building the current-vs-source diff. */
export interface PodcastDiffCurrent {
  name: string | null;
  author: string | null;
  description: string | null;
  /** The podcast's current main image URL, for the artwork row's "current" preview. */
  imageUrl: string | null;
}

/** The freshly-resolved source values from the RSS feed / iTunes lookup. */
export interface PodcastDiffSource {
  title: string | null;
  author: string | null;
  description: string | null;
  imageUrl: string | null;
}

/** Which editable text field a diff row stages (the artwork row is handled separately, by key). */
export type PodcastSyncField = "name" | "author" | "description";

const FIELD_LABELS: Record<PodcastSyncField, string> = {
  name: "Name",
  author: "Author",
  description: "Description",
};

/**
 * Builds the "Podcast feed" diff group from the resolved `source` (RSS/iTunes title/author/description +
 * artwork) and the podcast's `current` values. Only fields the source returned that differ become rows;
 * each text row's checkbox defaults to checked only when it fills an empty field (fill-empty). Text rows
 * carry a `{ field, value }` payload the registration hook stages into the edit form; the artwork row
 * applies immediately (image sources store on apply). Pure + unit-tested.
 */
export function buildPodcastDiff(
  current: PodcastDiffCurrent,
  source: PodcastDiffSource,
  sourceLabel: string,
): SyncDiff {
  const rows: SyncFieldDiff[] = [];
  const pushText = (field: PodcastSyncField, currentValue: string | null, nextValue: string | null) => {
    if (nextValue === null || nextValue === "") return;
    if (!rowDiffers(currentValue, nextValue)) return;
    rows.push({
      key: field,
      label: FIELD_LABELS[field],
      current: currentValue,
      next: nextValue,
      kind: "text",
      defaultChecked: fillEmptyDefault(currentValue, nextValue),
      payload: {
        field,
        value: nextValue,
      },
    });
  };

  pushText("name", current.name, source.title);
  pushText("author", current.author, source.author);
  pushText("description", current.description, source.description);

  if (source.imageUrl) {
    rows.push({
      key: "artwork",
      label: "Artwork",
      current: null,
      next: null,
      kind: "image",
      currentThumb: current.imageUrl,
      nextThumb: source.imageUrl,
      applyImmediately: true,
      defaultChecked: fillEmptyDefault(current.imageUrl, source.imageUrl),
    });
  }

  return {
    groups: rows.length > 0
      ? [{
        source: sourceLabel,
        rows,
      }]
      : [],
  };
}
