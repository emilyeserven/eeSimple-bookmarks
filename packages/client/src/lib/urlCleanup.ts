/**
 * URL canonicalization now lives in `@eesimple/types` so the middleware (newsletter ingest) and the
 * client share one implementation. This module is a thin re-export kept for the existing client
 * import path — import from here or from `@eesimple/types` directly.
 */

export {
  canonicalize,
  cleanUrl,
} from "@eesimple/types";
export type {
  CanonicalizeData,
  CanonicalizeResult,
  UrlCleanupMode,
} from "@eesimple/types";
