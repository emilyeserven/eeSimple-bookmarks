/**
 * Editor-state helpers for the Website "Extension Fill" rules editor (#1244). The editor holds the
 * stored {@link WebsiteExtensionFillRule} shape directly as draft state; these pure helpers build
 * blank drafts, coerce a variant when its `kind` select changes (keeping only that variant's fields),
 * and — most importantly — {@link normalizeExtensionFillRules} serialize the drafts into a
 * **schema-clean** payload. The middleware body schema is `additionalProperties: false` at every
 * level (see `routes/websites.ts`), so a stray field from a previously-selected variant, or an
 * incomplete rule, would 400; normalize drops those before the auto-save PATCH.
 *
 * Split across four cohesive modules (re-exported here so consumers keep one import path):
 * `extensionFillDrafts` (blank drafts + `moveItem`), `extensionFillDescribe` (collapsed/read-only
 * summaries + label maps), `extensionFillCoerce` (kind-change rebuild switches), and
 * `extensionFillClean` (schema-clean serialization).
 */
export * from "./extensionFillClean";
export * from "./extensionFillCoerce";
export * from "./extensionFillDescribe";
export * from "./extensionFillDrafts";
