/**
 * Image processing for bookmark images. One pipeline serves both the manual-upload and the
 * auto-fetched `og:image` paths: resize to fit a fixed longest edge (never upscaling) and
 * re-encode to WebP so stored images stay small and uniform.
 *
 * SVGs are the exception: {@link prepareStoredImage} stores them verbatim (vector passthrough)
 * rather than rasterizing through sharp — see its doc-comment. Raster bytes still flow through
 * {@link processImage}, whose output is always WebP.
 */

import sharp from "sharp";

/** Longest-edge cap (px) for a stored bookmark image. */
export const MAX_IMAGE_EDGE = 1200;

/** Content type of a stored SVG image (vector passthrough — never rasterized to WebP). */
export const SVG_CONTENT_TYPE = "image/svg+xml";

export interface ProcessedImage {
  body: Buffer;
  width: number;
  height: number;
  // "image/webp" for the raster pipeline; "image/svg+xml" when an SVG was stored verbatim.
  contentType: "image/webp" | "image/svg+xml";
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

/**
 * Detect whether `input` is an SVG document by sniffing its leading bytes. Decodes a small UTF-8
 * slice, skips a UTF-8 BOM, leading whitespace, an XML declaration, comments, and a DOCTYPE, then
 * checks for an `<svg` root element. Deliberately lenient so a hand-authored or CDN SVG (which may
 * lead with `<?xml …?>` or a licence comment) is recognised without a full parse. Mirrors the
 * intent of the favicon "skip SVG without librsvg" handling in `services/metadata.ts`.
 */
export function isSvgBytes(input: Buffer): boolean {
  // 1 KiB is plenty to clear any XML prolog / comment / DOCTYPE before the root element.
  let head = input.subarray(0, 1024).toString("utf8");
  // Strip a UTF-8 BOM if present.
  if (head.charCodeAt(0) === 0xfeff) head = head.slice(1);
  head = head.trimStart();
  // Drop an XML declaration, comments, and a DOCTYPE that may precede the root element.
  let prev: string;
  do {
    prev = head;
    head = head
      .replace(/^<\?xml[\s\S]*?\?>/, "")
      .replace(/^<!--[\s\S]*?-->/, "")
      .replace(/^<!DOCTYPE[^>]*>/i, "")
      .trimStart();
  } while (head !== prev);
  return /^<svg[\s>]/i.test(head);
}

/**
 * Intrinsic pixel size of an SVG, read from the root element's `width`/`height` attributes (a
 * trailing `px` is tolerated) or, failing that, the last two numbers of its `viewBox`. When neither
 * yields a usable value the dimension defaults to {@link MAX_IMAGE_EDGE}. Each dimension is rounded
 * and clamped to `>= 1` so aspect-ratio consumers never divide by zero. This never rasterizes — it
 * only records nominal dimensions for the stored row.
 */
export function svgIntrinsicSize(svg: string): { width: number;
  height: number; } {
  const root = /<svg\b[^>]*>/i.exec(svg)?.[0] ?? "";
  const attr = (name: string): number | null => {
    const raw = new RegExp(`\\b${name}\\s*=\\s*["']\\s*([0-9]*\\.?[0-9]+)\\s*(?:px)?\\s*["']`, "i").exec(root)?.[1];
    if (raw == null) return null;
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : null;
  };
  const viewBox = /\bviewBox\s*=\s*["']\s*([-0-9.\s,]+?)\s*["']/i.exec(root)?.[1];
  const viewBoxDims = viewBox
    ? viewBox.trim().split(/[\s,]+/).map(Number)
    : [];
  const clamp = (value: number | null | undefined): number =>
    value != null && Number.isFinite(value) && value >= 1 ? Math.round(value) : 0;

  const width = clamp(attr("width")) || clamp(viewBoxDims[2]) || MAX_IMAGE_EDGE;
  const height = clamp(attr("height")) || clamp(viewBoxDims[3]) || MAX_IMAGE_EDGE;
  return {
    width,
    height,
  };
}

/**
 * Prepare `input` for storage as a bookmark image. An SVG is stored **verbatim** (vector
 * passthrough): its bytes are returned unchanged with a `image/svg+xml` content type and dimensions
 * read from the markup, so crisp logos survive and storage doesn't depend on sharp having librsvg.
 * Any other input is resized and re-encoded to WebP by {@link processImage}. Returns a
 * {@link ProcessImageError} (never throws) when raster bytes can't be decoded.
 */
export async function prepareStoredImage(
  input: Buffer,
  opts?: ProcessImageOptions,
): Promise<ProcessedImage | ProcessImageError> {
  if (isSvgBytes(input)) {
    const {
      width, height,
    } = svgIntrinsicSize(input.toString("utf8"));
    return {
      body: input,
      width,
      height,
      contentType: SVG_CONTENT_TYPE,
    };
  }
  return processImage(input, opts);
}
