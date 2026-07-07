import type { Category, MediaType, PropertyGroup, UpdatePropertyGroupInput } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { CategoryCheckboxList, MediaTypeCheckboxList, summarizeMediaTypes, toggleId } from "./propertyFormParts";
import { useUpdatePropertyGroup } from "../hooks/usePropertyGroups";
import { useSectionAutoSave } from "../hooks/useSectionAutoSave";

/**
 * The Categories scope tab for a property group: choose which categories show this group on the
 * bookmark form (and detail view). Auto-saves `{ allCategories, categoryIds }` together in one request
 * with a single "Categories" toast. Empty (and not "all") means the group shows for every category.
 */
export function PropertyGroupCategoriesEditForm({
  group,
  categories,
}: {
  group: PropertyGroup;
  categories: Category[];
}) {
  const {
    t,
  } = useTranslation();
  const updateGroup = useUpdatePropertyGroup();
  const {
    saveSection,
  } = useSectionAutoSave<UpdatePropertyGroupInput, PropertyGroup>({
    id: group.id,
    update: updateGroup,
    initial: {
      allCategories: group.allCategories,
      categoryIds: group.categoryIds,
    },
  });

  const [allCategories, setAllCategories] = useState(group.allCategories);
  const [categoryIds, setCategoryIds] = useState<string[]>(group.categoryIds);
  // Re-seed when the panel switches to a different group without remounting.
  useEffect(() => {
    setAllCategories(group.allCategories);
    setCategoryIds(group.categoryIds);
  }, [group.id, group.allCategories, group.categoryIds]);

  const commit = (nextAll: boolean, nextIds: string[]) => {
    setAllCategories(nextAll);
    setCategoryIds(nextIds);
    saveSection({
      allCategories: nextAll,
      categoryIds: nextIds,
    }, t("Categories"));
  };

  // Empty scope means "applies to all" for a group, so present that as "All categories".
  const preview = allCategories || categoryIds.length === 0
    ? t("All categories")
    : t("{{count}} categories", {
      count: categoryIds.length,
    });

  return (
    <CollapsibleFormSection
      title={t("Categories")}
      description={t("Choose which categories show this group on the bookmark form. Leave empty to show it for every category.")}
      defaultOpen
      preview={preview}
    >
      <CategoryCheckboxList
        categories={categories}
        selectedIds={categoryIds}
        allCategories={allCategories}
        onToggle={(id) => {
          if (allCategories) {
            // Toggling one category drops the "all categories" flag and falls back to an explicit
            // list of every current category except the one just unchecked.
            commit(false, categories.map(category => category.id).filter(categoryId => categoryId !== id));
          }
          else {
            commit(false, toggleId(categoryIds, id));
          }
        }}
        onToggleAll={selectAll =>
          // Select all also means "apply to categories created later" via the flag.
          commit(selectAll, selectAll ? categories.map(category => category.id) : [])}
        idPrefix={`property-group-${group.id}-category`}
      />
    </CollapsibleFormSection>
  );
}

/**
 * The Media Types scope tab for a property group: additionally show the group on bookmarks of the
 * chosen media types. Auto-saves `{ allMediaTypes, mediaTypeIds }` together with a single "Media Types"
 * toast. Media types are additive on top of the category scope (they widen, never restrict).
 */
export function PropertyGroupMediaTypesEditForm({
  group,
  mediaTypes,
}: {
  group: PropertyGroup;
  mediaTypes: MediaType[];
}) {
  const {
    t,
  } = useTranslation();
  const updateGroup = useUpdatePropertyGroup();
  const {
    saveSection,
  } = useSectionAutoSave<UpdatePropertyGroupInput, PropertyGroup>({
    id: group.id,
    update: updateGroup,
    initial: {
      allMediaTypes: group.allMediaTypes,
      mediaTypeIds: group.mediaTypeIds,
    },
  });

  const [allMediaTypes, setAllMediaTypes] = useState(group.allMediaTypes);
  const [mediaTypeIds, setMediaTypeIds] = useState<string[]>(group.mediaTypeIds);
  useEffect(() => {
    setAllMediaTypes(group.allMediaTypes);
    setMediaTypeIds(group.mediaTypeIds);
  }, [group.id, group.allMediaTypes, group.mediaTypeIds]);

  const commit = (nextAll: boolean, nextIds: string[]) => {
    setAllMediaTypes(nextAll);
    setMediaTypeIds(nextIds);
    saveSection({
      allMediaTypes: nextAll,
      mediaTypeIds: nextIds,
    }, t("Media Types"));
  };

  return (
    <CollapsibleFormSection
      title={t("Media Types")}
      description={t("Also show this group on bookmarks of the chosen media types (in addition to its categories).")}
      defaultOpen
      preview={summarizeMediaTypes(allMediaTypes, mediaTypeIds)}
    >
      <MediaTypeCheckboxList
        mediaTypes={mediaTypes}
        selectedIds={mediaTypeIds}
        allMediaTypes={allMediaTypes}
        onToggle={(id) => {
          if (allMediaTypes) {
            commit(false, mediaTypes.map(mt => mt.id).filter(mediaTypeId => mediaTypeId !== id));
          }
          else {
            commit(false, toggleId(mediaTypeIds, id));
          }
        }}
        onToggleAll={selectAll =>
          commit(selectAll, selectAll ? mediaTypes.map(mt => mt.id) : [])}
        idPrefix={`property-group-${group.id}-mt`}
      />
    </CollapsibleFormSection>
  );
}
