import type { EntityRouteKind } from "./entityRoutes";

import { ENTITY_DESCRIPTORS } from "../entities/registry";

/** The minimal shape the CMD+K entity context needs from any slug-routed entity. */
export interface PaletteEntity {
  id: string;
  slug?: string | null;
}

/** A boolean quick-toggle surfaced as a direct CommandItem on the entity's detail pages. */
export interface EntityBooleanField {
  type: "boolean";
  /** The `Update*Input` key PATCHed with the toggled value. */
  key: string;
  label: string;
  getValue: (entity: PaletteEntity) => boolean;
  /** When present and returning false, the toggle is hidden (e.g. built-in guard). */
  isEditable?: (entity: PaletteEntity) => boolean;
}

/** A single-select field surfaced as an "entity-choice" sub-palette (options from a flat list). */
export interface EntityChoiceField {
  type: "choice";
  /** The `Update*Input` key PATCHed with the chosen id (or `null` to clear). */
  key: string;
  label: string;
  /** Which cached flat list supplies the options. */
  options: "categories" | "media-types";
  getValue: (entity: PaletteEntity) => string | null;
}

export type EntityPaletteField = EntityBooleanField | EntityChoiceField;

/**
 * The hand-authored data-layer half of a CMD+K entity registry entry — everything that can't be
 * derived from `ENTITY_ROUTES` (which supplies route matching, labels, and view/edit paths).
 * `listFn`/`queryKey` reuse the entity's existing list query so the palette shares the app cache.
 */
export interface EntityPaletteConfig {
  queryKey: readonly string[];
  listFn: () => Promise<PaletteEntity[]>;
  updateFn: (id: string, patch: Record<string, unknown>) => Promise<unknown>;
  /** Query keys invalidated after a palette mutation (the entity's own key is always included). */
  extraInvalidateKeys?: readonly (readonly string[])[];
  /** The entity's display name (defaults to `entity.name`; e.g. websites use `siteName`). */
  getName?: (entity: PaletteEntity) => string;
  /** Extra edit-tab nav items beyond General, as `…/edit/<tab>` suffixes. */
  extraEditTabs?: readonly { label: string;
    tab: string; }[];
  /** Quick-action fields rendered as direct toggles / choice sub-palettes. */
  fields?: readonly EntityPaletteField[];
}

/**
 * One entry per slug-routed entity kind, derived from `ENTITY_DESCRIPTORS`.
 *
 * Exhaustiveness now lives on `ENTITY_DESCRIPTORS` (`satisfies Record<EntityRouteKind, …>`) — a
 * missing kind still fails `tsc`, there. The cast only re-labels `fromEntries`' string-keyed result.
 */
export const ENTITY_PALETTE_CONFIGS = Object.fromEntries(
  Object.entries(ENTITY_DESCRIPTORS).map(([kind, d]) => [kind, d.palette]),
) as Record<EntityRouteKind, EntityPaletteConfig>;
