/**
 * Which kept image should become the bookmark's main/primary image — referencing a newly uploaded
 * file (by index), a kept scan candidate (by URL), an already-saved image (by id), or none.
 */
export type ImageMainSelection
  = | { kind: "upload";
    index: number; }
    | { kind: "candidate";
      url: string; }
      | { kind: "existing";
        id: string; }
        | null;

/**
 * What should happen to a bookmark's images when the form is saved. A bookmark can keep several
 * images now, so this carries the full set of intended changes (applied after the bookmark saves):
 * newly chosen uploads, scan candidates to keep, the main selection, and existing images to remove.
 */
export interface ImageIntent {
  /** Newly chosen files to add to the bookmark. */
  uploads: File[];
  /** Scan candidate image URLs the user chose to keep (the server re-derives + fetches them safely). */
  keepCandidateUrls: string[];
  /** Which kept image is the main/primary one, or null to leave it to the default (first kept). */
  mainSelection: ImageMainSelection;
  /** Ids of already-saved images to delete (edit mode). */
  removeImageIds: string[];
  /**
   * Fallback for back-compat: when no uploads/candidates were chosen, fetch the page's preview image
   * on save (the old auto-fetch behavior). Ignored once the user keeps a candidate or uploads a file.
   */
  auto: boolean;
}

/** The "do nothing to the images" intent — the default and post-reset state. */
export const EMPTY_IMAGE_INTENT: ImageIntent = {
  uploads: [],
  keepCandidateUrls: [],
  mainSelection: null,
  removeImageIds: [],
  auto: false,
};
