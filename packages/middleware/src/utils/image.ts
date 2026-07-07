/**
 * Image processing for bookmark images. One pipeline serves both the manual-upload and the
 * auto-fetched `og:image` paths: resize to fit a fixed longest edge (never upscaling) and
 * re-encode to WebP so stored images stay small and uniform.
 */

import sharp from "sharp";

/** Longest-edge cap (px) for a stored bookmark image. */
export const MAX_IMAGE_EDGE = 1200;

export interface ProcessedImage {
  body: Buffer;
  width: number;
  height: number;
  contentType: "image/webp";
}

/** Failure outcome of {@link processImage}, carrying the underlying decode error's message. */
export interface ProcessImageError {
  error: string;
}

/** Options overriding the default resize/quality behavior of {@link processImage}. */
export interface ProcessImageOptions {
  /** Longest-edge cap (px). Defaults to {@link MAX_IMAGE_EDGE}. */
  maxEdge?: number;
  /** WebP re-encode quality (1-100). Defaults to 80. */
  quality?: number;
}

/**
 * Resize `input` to fit within `opts.maxEdge` (defaulting to {@link MAX_IMAGE_EDGE}) on its longest
 * side (without enlarging smaller images) and re-encode it to WebP at `opts.quality` (defaulting to
 * 80). Returns a {@link ProcessImageError} (rather than throwing) when the bytes can't be decoded as
 * an image, so callers can treat a bad upload / non-image URL as a clean 4xx rather than a 500 —
 * but the underlying sharp error message is preserved so it can be surfaced to the caller instead
 * of being silently swallowed.
 */
export async function processImage(
  input: Buffer,
  opts?: ProcessImageOptions,
): Promise<ProcessedImage | ProcessImageError> {
  const maxEdge = opts?.maxEdge ?? MAX_IMAGE_EDGE;
  const quality = opts?.quality ?? 80;
  try {
    const {
      data, info,
    } = await sharp(input, {
      failOn: "error",
    })
      // Apply EXIF orientation, then drop metadata, so the stored image looks right everywhere.
      .rotate()
      .resize({
        width: maxEdge,
        height: maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality,
      })
      .toBuffer({
        resolveWithObject: true,
      });
    return {
      body: data,
      width: info.width,
      height: info.height,
      contentType: "image/webp",
    };
  }
  catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
