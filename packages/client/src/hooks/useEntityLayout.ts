import type { EntityWorkbench } from "../components/workbench/types";
import type { EntityLayout, LayoutableEntityKind } from "@eesimple/types";

import { resolveLayout } from "@eesimple/types";

import { knownFieldKeys } from "../lib/workbenchLayout";

/**
 * The stored layout for an entity kind, or `null` when nothing is saved.
 *
 * **Stub seam (#1159).** The `entity_layouts` persistence (table + `/api/entity-layouts/:kind`
 * endpoint) is a parallel sub-issue (#1158); the Page Layouts editor that writes it is #1160/#1162.
 * Until those land there is nothing to read, so this returns `null` and every layout-driven entity
 * resolves straight to its code-defined `defaultLayout` — a deploy renders exactly as today. When
 * persistence lands, this is the single place to swap in the real query (keyed by `kind`); every
 * consumer already goes through {@link useResolvedWorkbenchLayout}.
 */
export function useEntityLayout(kind: LayoutableEntityKind | undefined): EntityLayout | null {
  void kind;
  return null;
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
