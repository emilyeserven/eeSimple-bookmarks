import type { EntityBooleanField } from "./entityPaletteRegistry";

import i18n from "../i18n";

/**
 * The shared "Starred" quick-toggle every favoritable entity's palette config appends to its `fields`
 * (toggles the `isFavorite` flag; starred members surface in the entity's sidebar flyout). Lives in its
 * own module — not `entityPaletteRegistry` — so that a descriptor value-importing it does not create an
 * import cycle back through `ENTITY_DESCRIPTORS` (the type-only `EntityBooleanField` import is erased).
 */
export const starredPaletteField: EntityBooleanField = {
  type: "boolean",
  key: "isFavorite",
  label: i18n.t("Starred"),
  getValue: entity => Boolean((entity as { isFavorite?: boolean }).isFavorite),
};
