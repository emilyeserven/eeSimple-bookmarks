import type { DynamicFieldSet, EntityWorkbench } from "../components/workbench/types";
import type { EntityLayout, LayoutStorageKind } from "@eesimple/types";

import { useMemo } from "react";

import { resolveLayout } from "@eesimple/types";

import { useEntityLayouts } from "./useEntityLayouts";
import {
  layoutKindToTaxonomyOwnerType,
  TAXONOMY_FIELD_HOME,
  useTaxonomyDynamicFields,
} from "../components/TaxonomyLayoutFields";
import { augmentDefaultLayout, knownFieldKeys } from "../lib/workbenchLayout";

/** Stable empty dynamic-field set for entities without a `useDynamicFields` source (the common case). */
const EMPTY_DYNAMIC_FIELD_SET: DynamicFieldSet<{ id: string }> = {
  fields: {},
  defaultHome: {
    tabKey: "",
    sectionKey: "",
  },
};

/** A no-op dynamic-fields hook, so `useLayoutDrivenWorkbench` always calls exactly one such hook. */
function useNoDynamicFields<E extends { id: string }>(): DynamicFieldSet<E> {
  return EMPTY_DYNAMIC_FIELD_SET as DynamicFieldSet<E>;
}

/**
 * The stored layout for an entity kind, or `null` when nothing is saved (the kind renders its
 * code-defined `defaultLayout` — a deploy with no override renders exactly as today).
 *
 * **The single render seam (#1159).** This is the one place the layout renderer reads persistence;
 * every consumer goes through {@link useResolvedWorkbenchLayout}. It reads the #1158 `entity_layouts`
 * store (`GET /api/entity-layouts`, one cached query shared across the app) and picks this kind's row.
 * The Page Layouts editor that *writes* the store is #1160/#1162 — this hook only reads.
 */
export function useEntityLayout(kind: LayoutStorageKind | undefined): EntityLayout | null {
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

/**
 * The **dynamic-field merge seam (#1163+).** Returns a workbench whose `fields` include the descriptor's
 * runtime {@link EntityWorkbench.useDynamicFields} source (e.g. one field per custom property) and whose
 * `defaultLayout` gives those keys a home (via {@link augmentDefaultLayout}). Every layout-render consumer
 * (`EntityInfoView`/`EntityEditView`/`WorkbenchRouteTab`, and the bookmark detail/edit bodies) routes its
 * workbench through this **before** `useResolvedWorkbenchLayout` / `deriveWorkbenchTabs` /
 * `LayoutDrivenTabBody`, so dynamic fields resolve, render, and count toward tab visibility exactly like
 * static ones. A no-op (returns the original workbench) for entities without a dynamic source.
 *
 * `useDynamicFields` is selected once via `??` and called unconditionally, so the hook order is stable —
 * safe because a given mounted consumer always renders one entity kind (bookmark uses dedicated
 * components; each slug entity is its own route subtree), so the selected hook never changes identity.
 */
export function useLayoutDrivenWorkbench<E extends { id: string }>(
  workbench: EntityWorkbench<E>,
): EntityWorkbench<E> {
  const useDynamicFields = workbench.useDynamicFields ?? useNoDynamicFields<E>;
  const dynamic = useDynamicFields();
  // Centrally inject one placeable field per user taxonomy on every layout-driven owner (bookmarks +
  // all taxonomy entities), keyed off the descriptor's `layoutKind` — so a taxonomy surfaces on its
  // owners' view/edit pages without per-descriptor wiring. A no-op for config/non-owner kinds.
  const taxonomyDynamic = useTaxonomyDynamicFields<E>(
    layoutKindToTaxonomyOwnerType(workbench.layoutKind),
    TAXONOMY_FIELD_HOME,
  );
  return useMemo(() => {
    const descriptorKeys = Object.keys(dynamic.fields);
    const taxonomyKeys = Object.keys(taxonomyDynamic.fields);
    if (descriptorKeys.length === 0 && taxonomyKeys.length === 0) return workbench;
    let defaultLayout = workbench.defaultLayout;
    if (defaultLayout && descriptorKeys.length > 0) {
      defaultLayout = augmentDefaultLayout(defaultLayout, descriptorKeys, dynamic.defaultHome);
    }
    if (defaultLayout && taxonomyKeys.length > 0) {
      defaultLayout = augmentDefaultLayout(defaultLayout, taxonomyKeys, taxonomyDynamic.defaultHome);
    }
    return {
      ...workbench,
      fields: {
        ...workbench.fields,
        ...dynamic.fields,
        ...taxonomyDynamic.fields,
      },
      defaultLayout,
    };
  }, [workbench, dynamic, taxonomyDynamic]);
}
