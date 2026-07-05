import type { SyncDiff, SyncFieldDiff } from "./syncSourceTypes";

import { fillEmptyDefault, rowDiffers } from "./syncSourceTypes";
import i18n from "../../i18n";

/** The Plex-backed title's current values, for building the current-vs-source diff. */
export interface PlexTitleDiffCurrent {
  /** Native-script display name (the title field). */
  name: string | null;
  romanizedName: string | null;
  wikipediaLinkEn: string | null;
  wikipediaLinkLocal: string | null;
  /** The entity's current main image URL, for the poster row's "current" preview. */
  imageUrl: string | null;
}

/** The freshly-resolved source values: Wikidata metadata + the Plex poster proxy URL. */
export interface PlexTitleDiffSource {
  name: string | null;
  romanizedName: string | null;
  wikipediaLinkEn: string | null;
  wikipediaLinkLocal: string | null;
  posterUrl: string | null;
}

/** Which editable text field a diff row stages (the poster row is handled separately, by key). */
export type PlexTitleSyncField = "name" | "romanizedName" | "wikipediaLinkEn" | "wikipediaLinkLocal";

const FIELD_LABELS: Record<PlexTitleSyncField, string> = {
  name: i18n.t("Name (native)"),
  romanizedName: i18n.t("Romanized name"),
  wikipediaLinkEn: i18n.t("Wikipedia (English)"),
  wikipediaLinkLocal: i18n.t("Wikipedia (local)"),
};

/**
 * Builds the "Plex" diff group from the resolved `source` (Wikidata native/romanized names + Wikipedia
 * links, plus the Plex poster) and the title's `current` values. Only fields the source returned that
 * differ from the current value become rows; each text row's checkbox defaults to checked only when it
 * fills an empty field (fill-empty). Text rows carry a `{ field, value }` payload the registration hook
 * stages into the edit form; the poster row applies immediately (image sources store on apply). Pure +
 * unit-tested.
 */
export function buildPlexTitleDiff(
  current: PlexTitleDiffCurrent,
  source: PlexTitleDiffSource,
  sourceLabel: string,
): SyncDiff {
  const rows: SyncFieldDiff[] = [];
  const pushText = (field: PlexTitleSyncField, currentValue: string | null, nextValue: string | null) => {
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

  pushText("name", current.name, source.name);
  pushText("romanizedName", current.romanizedName, source.romanizedName);
  pushText("wikipediaLinkEn", current.wikipediaLinkEn, source.wikipediaLinkEn);
  pushText("wikipediaLinkLocal", current.wikipediaLinkLocal, source.wikipediaLinkLocal);

  if (source.posterUrl) {
    rows.push({
      key: "poster",
      label: i18n.t("Poster"),
      current: null,
      next: null,
      kind: "image",
      currentThumb: current.imageUrl,
      nextThumb: source.posterUrl,
      applyImmediately: true,
      defaultChecked: fillEmptyDefault(current.imageUrl, source.posterUrl),
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
