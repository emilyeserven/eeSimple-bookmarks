import type { SyncDiff, SyncFieldDiff } from "./syncSourceTypes";
import type { ScanResult } from "@eesimple/types";

import { fillEmptyDefault, rowDiffers } from "./syncSourceTypes";
import i18n from "../../i18n";

/** The bookmark's current values, for building the current-vs-scan diff. */
export interface BookmarkDiffCurrent {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}

/** What a bookmark diff row carries in `payload` for the registration hook to apply. */
export type BookmarkSyncPayload
  = | { kind: "field";
    field: "title" | "description";
    value: string; }
    | { kind: "image";
      image: "og"; };

/**
 * Builds the "Page metadata" diff group from a fresh `/api/scan` result and the bookmark's current
 * values: Title and Description as staged text rows, and the page (og) image as an immediate-apply
 * image row previewing the scanned thumbnail against the current image. Text rows default to checked
 * only when they fill an empty field. People / language / linked-media covers stay on the existing
 * Rescan + one-click flows (they need match-or-create / post-link resolution). Pure + unit-tested.
 */
export function buildBookmarkDiff(scan: ScanResult, current: BookmarkDiffCurrent): SyncDiff {
  const rows: SyncFieldDiff[] = [];

  if (scan.title && rowDiffers(current.title, scan.title)) {
    rows.push({
      key: "title",
      label: i18n.t("Title"),
      current: current.title,
      next: scan.title,
      kind: "text",
      defaultChecked: fillEmptyDefault(current.title, scan.title),
      payload: {
        kind: "field",
        field: "title",
        value: scan.title,
      },
    });
  }

  if (scan.description && rowDiffers(current.description, scan.description)) {
    rows.push({
      key: "description",
      label: i18n.t("Description"),
      current: current.description,
      next: scan.description,
      kind: "text",
      defaultChecked: fillEmptyDefault(current.description, scan.description),
      payload: {
        kind: "field",
        field: "description",
        value: scan.description,
      },
    });
  }

  const nextImage = scan.thumbnailUrl ?? scan.imageCandidates[0]?.url ?? null;
  if (nextImage) {
    rows.push({
      key: "image",
      label: i18n.t("Page image"),
      current: null,
      next: null,
      kind: "image",
      currentThumb: current.imageUrl,
      nextThumb: nextImage,
      applyImmediately: true,
      defaultChecked: fillEmptyDefault(current.imageUrl, nextImage),
      payload: {
        kind: "image",
        image: "og",
      },
    });
  }

  return {
    groups: [
      {
        source: i18n.t("Page metadata"),
        rows,
      },
    ],
  };
}
