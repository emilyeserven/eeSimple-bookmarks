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

/**
 * Resize `input` to fit within {@link MAX_IMAGE_EDGE} on its longest side (without enlarging
 * smaller images) and re-encode it to WebP. Returns a {@link ProcessImageError} (rather than
 * throwing) when the bytes can't be decoded as an image, so callers can treat a bad upload /
 * non-image URL as a clean 4xx rather than a 500 — but the underlying sharp error message is
 * preserved so it can be surfaced to the caller instead of being silently swallowed.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage | ProcessImageError> {
  try {
    const {
      data, info,
    } = await sharp(input, {
      failOn: "error",
    })
      // Apply EXIF orientation, then drop metadata, so the stored image looks right everywhere.
      .rotate()
      .resize({
        width: MAX_IMAGE_EDGE,
        height: MAX_IMAGE_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 80,
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
