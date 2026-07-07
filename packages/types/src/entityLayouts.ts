/**
 * Shared entity-layout types and resolution rules for the per-entity "Page Layouts" editor
 * (#1106). A layout is a user-editable Tab > Section > Field tree; every layoutable entity kind
 * ships a code-defined `defaultLayout`, and a stored (possibly stale) layout is reconciled against
 * it at read time by {@link resolveLayout}.
 *
 * This module is pure — no dependencies, no side effects — so it can run unchanged in both the
 * Fastify API (`@eesimple/middleware`) and the browser (`@eesimple/client`), mirroring
 * `conditions.ts`. `LAYOUTABLE_ENTITY_KINDS` mirrors the `CUSTOM_PROPERTY_TYPES` pattern in
 * `customProperties.ts`: an `as const` tuple with a derived union type, so a new layoutable kind is
 * a one-line change here rather than a hand-mirrored edit across packages.
 *
 * Frozen design spec: https://github.com/emilyeserven/eeSimple-bookmarks/issues/1106#issuecomment-4907908956
 * (§1 shape, §2 resolution rules). Everything else in that comment (the `WorkbenchField` registry
 * contract, the per-entity field inventory, the bookmark tab map, `?tab=` routing) belongs to later
 * sub-issues and isn't implemented here.
 */

/**
 * The 21 slug-routed workbench entity kinds (the `ENTITY_DESCRIPTORS` keys in
 * `packages/client/src/entities/registry.ts`), plus `"bookmark"` — bookmarks adopt the field
 * registry + a `"bookmark"` layout kind but stay off `ENTITY_DESCRIPTORS` since they aren't a
 * slug-routed workbench entity.
 */
export const LAYOUTABLE_ENTITY_KINDS = [
  "category",
  "tag",
  "website",
  "media-type",
  "genre-mood",
  "language",
  "location",
  "place-type",
  "location-relation",
  "youtube-channel",
  "newsletter",
  "person",
  "group",
  "group-type",
  "property-group",
  "relationship-type",
  "custom-property",
  "autofill",
  "import-rule",
  "saved-filter",
  "card-display-rule",
  "bookmark",
] as const;

/** A layoutable entity kind. Derived from {@link LAYOUTABLE_ENTITY_KINDS}. */
export type LayoutableEntityKind = typeof LAYOUTABLE_ENTITY_KINDS[number];

/**
 * One field row within a section. `key` is a stable machine slug (identity for merge/diff
 * purposes, never shown to the user); `title` is an optional user-editable display title (absent =
 * untitled section); `fields` are field keys (from the entity's field registry, see #1159) in
 * render order.
 */
export interface LayoutSection {
  key: string;
  title?: string;
  fields: string[];
}

/**
 * One tab of an {@link EntityLayout}. `icon` is a serialized icon name (not a component — a
 * user-created tab must be jsonb-serializable; the field registry's icon is a real component,
 * resolved from this name at render time).
 */
export interface LayoutTab {
  key: string;
  label: string;
  icon?: string;
  sections: LayoutSection[];
}

/** A full entity layout: ordered tabs, each with ordered sections, each with ordered field keys. */
export interface EntityLayout {
  tabs: LayoutTab[];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

function isValidLayoutSection(value: unknown): value is LayoutSection {
  if (typeof value !== "object" || value === null) return false;
  const section = value as Record<string, unknown>;
  if (typeof section.key !== "string") return false;
  if (section.title !== undefined && typeof section.title !== "string") return false;
  return isStringArray(section.fields);
}

function isValidLayoutTab(value: unknown): value is LayoutTab {
  if (typeof value !== "object" || value === null) return false;
  const tab = value as Record<string, unknown>;
  if (typeof tab.key !== "string") return false;
  if (typeof tab.label !== "string") return false;
  if (tab.icon !== undefined && typeof tab.icon !== "string") return false;
  return Array.isArray(tab.sections) && tab.sections.every(isValidLayoutSection);
}

/**
 * Structural guard for the API/DB boundary: validates the tabs/sections/fields nesting shape only
 * (string keys, arrays where expected). Does NOT validate field keys against a known-field list —
 * that's {@link resolveLayout}'s job at read time, since it requires entity-specific context this
 * guard doesn't have.
 */
export function isValidEntityLayout(value: unknown): value is EntityLayout {
  if (typeof value !== "object" || value === null) return false;
  const layout = value as Record<string, unknown>;
  return Array.isArray(layout.tabs) && layout.tabs.every(isValidLayoutTab);
}

interface FieldHome {
  tab: LayoutTab;
  section: LayoutSection;
}

/** Build a `fieldKey -> { tab, section }` lookup from a layout (first occurrence wins). */
function buildFieldHomes(layout: EntityLayout): Map<string, FieldHome> {
  const homes = new Map<string, FieldHome>();
  for (const tab of layout.tabs) {
    for (const section of tab.sections) {
      for (const field of section.fields) {
        if (!homes.has(field)) homes.set(field, {
          tab,
          section,
        });
      }
    }
  }
  return homes;
}

/**
 * Resolve a possibly-stale/partial stored layout against the current default + known field keys.
 * Pure function; implements the frozen resolution rules verbatim (numbering matches §2 of the
 * design-spike comment linked above):
 *
 * 1. `stored` null/empty (no tabs) resolves straight to `defaultLayout`.
 * 2. Unknown field keys (not in `knownFieldKeys`) are silently dropped.
 * 3. Known field keys absent from the (filtered) stored layout are appended to the section they
 *    occupy in `defaultLayout` — recreating that section (appended to its default tab) if the user
 *    deleted it, and recreating the tab too (appended to `tabs`) if that was deleted as well. A
 *    recreated tab/section is always appended to the END of its parent array, never reinserted at a
 *    literal index from `defaultLayout` — there's no principled index once the user has
 *    reordered/deleted surrounding siblings (the same "no positional guarantee" resolution
 *    `applyAdvancedRules` in `bookmarkAddForm.ts` already uses for unplaced items). This keeps the
 *    core invariant: a newly code-added field can never be invisible.
 * 4. Empty sections are kept in the tree (not pruned) — hiding a zero-field section at render (while
 *    still showing it in the editor) is a renderer concern, out of scope for this pure function.
 * 5. Likewise, hiding a tab whose fields are all absent in the active view/edit mode is a renderer
 *    concern (it requires the `WorkbenchField` registry's view/edit renderers, which this function
 *    has no notion of) — nothing to do here either.
 * 6. At least one tab always resolves: if resolution would otherwise produce zero tabs, fall back to
 *    `defaultLayout`.
 */
export function resolveLayout(
  stored: EntityLayout | null | undefined,
  defaultLayout: EntityLayout,
  knownFieldKeys: Set<string>,
): EntityLayout {
  // Rule 1.
  if (!stored || stored.tabs.length === 0) return defaultLayout;

  // Rule 2: drop unknown field keys.
  const workingTabs: LayoutTab[] = stored.tabs.map(tab => ({
    ...tab,
    sections: tab.sections.map(section => ({
      ...section,
      fields: section.fields.filter(field => knownFieldKeys.has(field)),
    })),
  }));

  // Rule 3: append known-but-unplaced fields to their default home, recreating containers as needed.
  const fieldHomes = buildFieldHomes(defaultLayout);
  const placedFields = new Set(
    workingTabs.flatMap(tab => tab.sections.flatMap(section => section.fields)),
  );
  const missingFields: string[] = [];
  for (const [field] of fieldHomes) {
    if (knownFieldKeys.has(field) && !placedFields.has(field)) missingFields.push(field);
  }

  for (const field of missingFields) {
    const home = fieldHomes.get(field);
    if (!home) continue;

    let targetTab = workingTabs.find(tab => tab.key === home.tab.key);
    if (!targetTab) {
      targetTab = {
        key: home.tab.key,
        label: home.tab.label,
        icon: home.tab.icon,
        sections: [],
      };
      workingTabs.push(targetTab);
    }

    let targetSection = targetTab.sections.find(section => section.key === home.section.key);
    if (!targetSection) {
      targetSection = {
        key: home.section.key,
        title: home.section.title,
        fields: [],
      };
      targetTab.sections.push(targetSection);
    }

    targetSection.fields.push(field);
  }

  // Rule 6: guarantee at least one tab.
  if (workingTabs.length === 0) return defaultLayout;

  return {
    tabs: workingTabs,
  };
}
