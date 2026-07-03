import type { SyncDiff, SyncFieldDiff } from "./syncSourceTypes";

import { fillEmptyDefault, rowDiffers } from "./syncSourceTypes";

/** A podcast's current values, for building the current-vs-source diff. */
export interface PodcastDiffCurrent {
  name: string | null;
  description: string | null;
  /** The podcast's current main image URL, for the artwork row's "current" preview. */
  imageUrl: string | null;
  /** Current service-link URLs, for the cross-resolved link rows. */
  itunesUrl: string | null;
  pocketCastsUrl: string | null;
}

/** The freshly-resolved source values from the RSS feed / iTunes lookup + cross-resolved links. */
export interface PodcastDiffSource {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  itunesUrl: string | null;
  pocketCastsUrl: string | null;
}

/** Which editable text field a diff row stages into the form (artwork/link rows are keyed separately). */
export type PodcastSyncField = "name" | "description";

/** A service-link field that persists directly (not a form field) when its row is applied. */
export type PodcastLinkSyncField = "itunesUrl" | "pocketCastsUrl";

const FIELD_LABELS: Record<PodcastSyncField, string> = {
  name: "Name",
  description: "Description",
};

const LINK_LABELS: Record<PodcastLinkSyncField, string> = {
  itunesUrl: "Apple Podcasts link",
  pocketCastsUrl: "Pocket Casts link",
};

/**
 * Builds the "Podcast feed" diff group from the resolved `source` (RSS/iTunes title/description +
 * artwork) and the podcast's `current` values. Only fields the source returned that differ become rows;
 * each text row's checkbox defaults to checked only when it fills an empty field (fill-empty). Text rows
 * carry a `{ field, value }` payload the registration hook stages into the edit form; the artwork row
 * applies immediately (image sources store on apply). The author is no longer synced as text — it is
 * modeled as People/Group credits, resolved from the feed at pick time. Pure + unit-tested.
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

  const pushLink = (field: PodcastLinkSyncField, currentValue: string | null, nextValue: string | null) => {
    if (nextValue === null || nextValue === "") return;
    if (!rowDiffers(currentValue, nextValue)) return;
    rows.push({
      key: field,
      label: LINK_LABELS[field],
      current: currentValue,
      next: nextValue,
      kind: "text",
      defaultChecked: fillEmptyDefault(currentValue, nextValue),
      payload: {
        field,
        value: nextValue,
        isLink: true,
      },
    });
  };

  pushText("name", current.name, source.title);
  pushText("description", current.description, source.description);
  pushLink("itunesUrl", current.itunesUrl, source.itunesUrl);
  pushLink("pocketCastsUrl", current.pocketCastsUrl, source.pocketCastsUrl);

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
