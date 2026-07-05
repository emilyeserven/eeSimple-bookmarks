import type { SyncDiff } from "./syncSourceTypes";

import { fillEmptyDefault } from "./syncSourceTypes";
import i18n from "../../i18n";

/**
 * Builds the single image-diff row for an image-only taxonomy (YouTube channel avatar, website
 * favicon, person avatar, Plex poster): the entity's current main image vs the freshly-resolved
 * source image. Returns an empty group when the source has no image to offer. The row applies
 * immediately (image sources store on apply — they can't be staged into a form field). Pure +
 * unit-tested.
 */
export function buildImageTaxonomyDiff(
  currentImageUrl: string | null,
  nextImageUrl: string | null,
  label: string,
): SyncDiff {
  if (!nextImageUrl) {
    return {
      groups: [],
    };
  }
  return {
    groups: [
      {
        source: label,
        rows: [
          {
            key: "image",
            label: i18n.t("Source image"),
            current: null,
            next: null,
            kind: "image",
            currentThumb: currentImageUrl,
            nextThumb: nextImageUrl,
            applyImmediately: true,
            defaultChecked: fillEmptyDefault(currentImageUrl, nextImageUrl),
          },
        ],
      },
    ],
  };
}
