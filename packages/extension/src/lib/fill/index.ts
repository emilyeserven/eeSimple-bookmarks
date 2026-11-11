/*
 * The fill engine's public surface for the web app (`@eesimple/extension/fill`): the in-app rule
 * preview and the Transforms editor run this exact code, so a preview always matches a real fill.
 */
export type { FillRunResult } from "./fillEngine";
export { runRules } from "./fillEngine";
export { applyTransform, normalizeDateValue, parseDurationSeconds } from "./fillTransforms";
