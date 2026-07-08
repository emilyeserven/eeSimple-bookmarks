import type {
  EntityWorkbench,
  WorkbenchField,
  WorkbenchMode,
  WorkbenchTab,
} from "../components/workbench/types";
import type { EntityLayout, LayoutSection, LayoutTab } from "@eesimple/types";

/**
 * Pure render-time helpers for the layout-driven entity UI (#1106/#1159). No React — these decide
 * *which* tabs/sections/fields are visible for a given mode + entity, so `EntityInfoView`,
 * `EntityEditView`, and `LayoutDrivenTabBody` all agree. Kept side-effect-free and node-testable
 * (see `workbenchLayout.test.ts`).
 *
 * The shape of a resolved layout is settled upstream by `resolveLayout` in `@eesimple/types` (unknown
 * field keys already dropped, unplaced fields already appended); these helpers only apply the two
 * render-time gates the pure resolver deferred to the renderer (design §2.4/§2.5): a section with no
 * mode-visible field is hidden, and a tab with no visible section is hidden — which is what makes
 * today's view-only/edit-only tabs fall out for free.
 */

/** The registry keys a workbench knows about — the `knownFieldKeys` arg to `resolveLayout`. */
export function knownFieldKeys<E extends { id: string }>(
  workbench: EntityWorkbench<E>,
): Set<string> {
  return new Set(Object.keys(workbench.fields ?? {}));
}

/**
 * Give dynamic (runtime-sourced) field keys a **home** in the default layout so `resolveLayout` keeps
 * the invisibility invariant for them too: any dynamic key not explicitly placed by the operator is
 * appended to `home` (`resolveLayout` Rule 3 needs a key to appear in the default layout to auto-append
 * it). Pure — clones only the affected tab/section. Keys already present anywhere in `defaultLayout` are
 * skipped (a dynamic key never collides with a static one in practice, but this keeps it idempotent).
 * The home tab/section is created if the default layout doesn't already contain it (label falls back to
 * the key), so a misconfigured home can't drop the fields.
 */
export function augmentDefaultLayout(
  defaultLayout: EntityLayout,
  dynamicKeys: string[],
  home: { tabKey: string;
    sectionKey: string; },
): EntityLayout {
  const existing = new Set(
    defaultLayout.tabs.flatMap(tab => tab.sections.flatMap(section => section.fields)),
  );
  const toAppend = dynamicKeys.filter(key => !existing.has(key));
  if (toAppend.length === 0) return defaultLayout;

  let homeTabFound = false;
  const tabs: LayoutTab[] = defaultLayout.tabs.map((tab) => {
    if (tab.key !== home.tabKey) return tab;
    homeTabFound = true;
    let homeSectionFound = false;
    const sections: LayoutSection[] = tab.sections.map((section) => {
      if (section.key !== home.sectionKey) return section;
      homeSectionFound = true;
      return {
        ...section,
        fields: [...section.fields, ...toAppend],
      };
    });
    if (!homeSectionFound) {
      sections.push({
        key: home.sectionKey,
        fields: [...toAppend],
      });
    }
    return {
      ...tab,
      sections,
    };
  });

  if (!homeTabFound) {
    tabs.push({
      key: home.tabKey,
      label: home.tabKey,
      sections: [{
        key: home.sectionKey,
        fields: [...toAppend],
      }],
    });
  }

  return {
    tabs,
  };
}

/**
 * Whether a field renders for this mode + entity: its mode renderer exists AND (`showIf` absent, OR
 * the entity hasn't loaded yet, OR `showIf(entity)` passes). The `!entity` clause reproduces the
 * "optimistically include while loading, re-filter once loaded" behavior of the legacy tab filters.
 */
export function fieldRendersInMode<E>(
  field: WorkbenchField<E>,
  mode: WorkbenchMode,
  entity: E | undefined,
): boolean {
  const renderer = mode === "edit" ? field.edit : field.view;
  if (renderer == null) return false;
  if (field.showIf && entity && !field.showIf(entity)) return false;
  return true;
}

/** The field keys of a section that have a mode-visible registry entry, in layout order. */
export function visibleFieldKeys<E extends { id: string }>(
  section: LayoutSection,
  fields: Record<string, WorkbenchField<E>>,
  mode: WorkbenchMode,
  entity: E | undefined,
): string[] {
  return section.fields.filter((key) => {
    const field = fields[key];
    return field != null && fieldRendersInMode(field, mode, entity);
  });
}

/** One section paired with its mode-visible field keys. */
export interface VisibleSection {
  section: LayoutSection;
  fieldKeys: string[];
}

/** The sections of a tab that have ≥1 mode-visible field (design §2.4 empty-section hiding). */
export function visibleSectionsForTab<E extends { id: string }>(
  tab: LayoutTab,
  fields: Record<string, WorkbenchField<E>>,
  mode: WorkbenchMode,
  entity: E | undefined,
): VisibleSection[] {
  const visible: VisibleSection[] = [];
  for (const section of tab.sections) {
    const fieldKeys = visibleFieldKeys(section, fields, mode, entity);
    if (fieldKeys.length > 0) visible.push({
      section,
      fieldKeys,
    });
  }
  return visible;
}

/** A tab entry for a rail: the machine `key`, its display `label`, and (legacy only) its `group`. */
export interface RenderTab {
  key: string;
  label: string;
  group?: string;
}

/**
 * The tabs of a resolved layout that have ≥1 mode-visible section (design §2.5 empty-in-mode tab
 * hiding — reproduces today's view-only "Hierarchy" / edit-only "Display" tabs). Labels come from the
 * layout tab (user-editable); the serialized `icon` name is intentionally not surfaced here (the v1
 * rail renders labels only, matching today). `group` is attached by {@link deriveWorkbenchTabs}, not
 * here — it is code-only nav metadata (`WorkbenchTab.group`), never stored in the layout jsonb.
 */
export function modeVisibleTabs<E extends { id: string }>(
  layout: EntityLayout,
  fields: Record<string, WorkbenchField<E>>,
  mode: WorkbenchMode,
  entity: E | undefined,
): RenderTab[] {
  return layout.tabs
    .filter(tab => visibleSectionsForTab(tab, fields, mode, entity).length > 0)
    .map(tab => ({
      key: tab.key,
      label: tab.label,
    }));
}

/**
 * The single tab list both rails (`EntityInfoView` / `EntityEditView`) consume. Layout-driven when a
 * resolved `layout` is present → {@link modeVisibleTabs}, with each tab's `group` re-attached from the
 * matching `workbench.tabs` entry by key (so the edit strip's "More" dropdown grouping survives the
 * migration — `group` is code-only nav metadata, kept on `WorkbenchTab`, never persisted in the layout
 * jsonb; a user-created tab has no matching entry and stays flat). Otherwise the legacy path:
 * `workbench.tabs` filtered to those carrying the mode's pane and passing tab-level `showIf`
 * (optimistically while the entity loads), carrying `group` through directly.
 */
export function deriveWorkbenchTabs<E extends { id: string }>(
  workbench: EntityWorkbench<E>,
  layout: EntityLayout | null,
  mode: WorkbenchMode,
  entity: E | undefined,
): RenderTab[] {
  if (layout && workbench.fields) {
    const groupByKey = new Map(workbench.tabs.map(tab => [tab.key, tab.group]));
    return modeVisibleTabs(layout, workbench.fields, mode, entity).map(tab => ({
      ...tab,
      group: groupByKey.get(tab.key),
    }));
  }
  return workbench.tabs
    .filter((tab: WorkbenchTab<E>) => {
      const pane = mode === "edit" ? tab.edit : tab.view;
      return pane != null && (!tab.showIf || !entity || tab.showIf(entity));
    })
    .map((tab: WorkbenchTab<E>) => ({
      key: tab.key,
      label: tab.label,
      group: tab.group,
    }));
}
