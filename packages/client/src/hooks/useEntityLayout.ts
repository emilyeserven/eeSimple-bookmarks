import type { EntityWorkbench } from "../components/workbench/types";
import type { EntityLayout, LayoutableEntityKind } from "@eesimple/types";

import { resolveLayout } from "@eesimple/types";

import { useEntityLayouts } from "./useEntityLayouts";
import { knownFieldKeys } from "../lib/workbenchLayout";

/**
 * The stored layout for an entity kind, or `null` when nothing is saved (the kind renders its
 * code-defined `defaultLayout` — a deploy with no override renders exactly as today).
 *
 * **The single render seam (#1159).** This is the one place the layout renderer reads persistence;
 * every consumer goes through {@link useResolvedWorkbenchLayout}. It reads the #1158 `entity_layouts`
 * store (`GET /api/entity-layouts`, one cached query shared across the app) and picks this kind's row.
 * The Page Layouts editor that *writes* the store is #1160/#1162 — this hook only reads.
 */
export function useEntityLayout(kind: LayoutableEntityKind | undefined): EntityLayout | null {
  // Called unconditionally (Rules of Hooks) even for registry-less kinds; a single shared query.
  const {
    data,
  } = useEntityLayouts();
  if (!kind) return null;
  return (data ?? []).find(record => record.entityKind === kind)?.layout ?? null;
}

/**
 * The resolved layout a layout-driven entity should render, or `null` for a registry-less entity
 * (which stays on the opaque-pane path). Reconciles the stored layout against the descriptor's
 * `defaultLayout` + known field keys via the shared pure `resolveLayout` (unknown-key drop,
 * unplaced-field append, ≥1-tab fallback).
 *
 * `useEntityLayout` is called unconditionally (Rules of Hooks) even for registry-less entities.
 */
export function useResolvedWorkbenchLayout<E extends { id: string }>(
  workbench: EntityWorkbench<E>,
): EntityLayout | null {
  const stored = useEntityLayout(workbench.layoutKind);
  if (!workbench.fields || !workbench.defaultLayout) return null;
  return resolveLayout(stored, workbench.defaultLayout, knownFieldKeys(workbench));
}
