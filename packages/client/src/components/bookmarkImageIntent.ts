/** What should happen to a bookmark's image when the form is saved. */
export interface ImageIntent {
  /** A newly chosen file to upload, or null. */
  file: File | null;
  /** Auto-fetch the page's preview image (og:image) on save. */
  auto: boolean;
  /** Remove the existing image on save. */
  remove: boolean;
}

/** The "do nothing to the image" intent — the default and post-reset state. */
export const EMPTY_IMAGE_INTENT: ImageIntent = {
  file: null,
  auto: false,
  remove: false,
};
