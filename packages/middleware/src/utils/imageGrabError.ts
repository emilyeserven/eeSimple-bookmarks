/**
 * Shared 502 envelope builder for the typed image-grab failure reasons the entity-image auto-capture
 * helpers report (`fetchOgImage` / `fetchAndStoreWebsiteFavicon` / `fetchAndStorePersonImage` /
 * `fetchAndStoreGroupImage` / `fetchAndStoreChannelImage`). These routes map a *discriminated result*
 * (returned data, not a thrown error) — the sanctioned `reply.code().send()` carve-out — but must
 * still emit the standard `{ message, code, statusCode }` error envelope. This helper replaces the
 * per-route copy-pasted `IMAGE_GRAB_ERROR_MESSAGES` maps so the shape can't drift again.
 */

/** The typed reasons an image grab can fail (mirrors `OgImageResult`'s non-buffer arms). */
export const IMAGE_GRAB_ERROR_KINDS = [
  "no_image",
  "bad_image",
  "blocked",
  "server_error",
  "fetch_error",
] as const;

export type ImageGrabErrorKind = typeof IMAGE_GRAB_ERROR_KINDS[number];

/** English fallback messages, parametrized by the grabbed thing ("avatar", "favicon", …). */
const IMAGE_GRAB_ERROR_MESSAGES: Record<ImageGrabErrorKind, (noun: string) => string> = {
  no_image: noun => `No ${noun} found for that source`,
  bad_image: noun => `${noun.charAt(0).toUpperCase()}${noun.slice(1)} couldn't be loaded`,
  blocked: () => "Request was blocked — wait a moment and try again",
  server_error: () => "The source returned a server error",
  fetch_error: () => "The source couldn't be reached",
};

/**
 * Build the full `{ message, code, statusCode }` error envelope for a typed image-grab failure.
 * `noun` names what was being fetched ("avatar", "image", "favicon", "preview image") so the English
 * fallback message reads naturally; the client translates `code` (each kind is an `ErrorCode`).
 */
export function imageGrabErrorReply(kind: ImageGrabErrorKind, noun: string): {
  message: string;
  code: ImageGrabErrorKind;
  statusCode: 502;
} {
  return {
    message: IMAGE_GRAB_ERROR_MESSAGES[kind](noun),
    code: kind,
    statusCode: 502,
  };
}
