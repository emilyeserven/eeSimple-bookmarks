import type { FillTransform } from "@eesimple/types";

import {
  applyTransform,
  normalizeDateValue,
  parseDurationSeconds,
} from "@eesimple/extension/fill";

/*
 * The Transforms editor's live preview: the browser extension's own transform runtime
 * (`packages/extension/src/lib/fill/fillTransforms.ts`), so a preview always matches a real fill. The
 * one difference: the runtime throws on an invalid `regex`/`replace` pattern (the engine reports it as
 * a per-rule error), while the preview yields an empty string so it degrades gracefully mid-typing.
 */

export { normalizeDateValue, parseDurationSeconds };

/**
 * Apply one transform to a single value (empty string on a miss or an invalid regex/replace).
 * `baseUrl` is the page URL an `absoluteUrl` transform resolves against; empty = no-op passthrough.
 */
export function applyFillTransform(value: string, transform: FillTransform, baseUrl = ""): string {
  try {
    return applyTransform(value, transform, baseUrl);
  }
  catch {
    return "";
  }
}

/** Run a full transform list over one value, in order — the extension's per-value pipeline. */
export function applyFillTransforms(value: string, transforms: FillTransform[], baseUrl = ""): string {
  return transforms.reduce((current, transform) => applyFillTransform(current, transform, baseUrl), value);
}
