import type { Bookmark, PropertyGroup } from "@eesimple/types";

import { propertyGroupAppliesToCategory, propertyGroupAppliesToMediaType } from "@eesimple/types";

/**
 * Whether a property group's scope matches a bookmark — i.e. whether the group's card/section should
 * render on that bookmark's edit form and detail view. Mirrors the custom-property union semantics:
 * the group shows when its category scope matches OR its (additive) media-type scope matches. An
 * unscoped group (empty `categoryIds`, `allCategories` false) matches every bookmark.
 */
export function groupAppliesToBookmark(
  group: PropertyGroup,
  bookmark: Pick<Bookmark, "categoryId" | "mediaType">,
): boolean {
  return propertyGroupAppliesToCategory(group, bookmark.categoryId ?? "")
    || propertyGroupAppliesToMediaType(group, bookmark.mediaType?.id ?? null);
}
