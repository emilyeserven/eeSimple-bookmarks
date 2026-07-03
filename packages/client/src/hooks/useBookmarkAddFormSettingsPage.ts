import type {
  BookmarkAddFormPlacement,
  BookmarkAddFormSettings,
  BookmarkAddFormStandardField,
  CustomProperty,
  UpdateCustomPropertyInput,
} from "@eesimple/types";

import { BOOKMARK_FORM_DETAIL_SLUGS } from "@eesimple/types";

import {
  useBookmarkAddFormConfig,
  useUpdateBookmarkAddFormSettings,
} from "./useAppSettings";
import { useCustomProperties, useUpdateCustomProperty } from "./useCustomProperties";
import { usePropertyGroups } from "./usePropertyGroups";
import { notifyError, notifySuccess } from "../lib/notifications";

/** Human labels for each standard Add Bookmark form field (used for both rows and toast wording). */
export const BOOKMARK_ADD_FORM_STANDARD_LABELS: Record<BookmarkAddFormStandardField, string> = {
  title: "Name",
  romanizedTitle: "Romanized name",
  categoryId: "Category",
  mediaTypeId: "Media Type",
  languageId: "Language",
  groupId: "Group",
  descriptionTags: "Description & Tags",
  personIds: "People",
  image: "Image",
};

/** A built-in detail property row: its slug, resolved display label, and current placement. */
export interface DetailPropertyRow {
  slug: string;
  label: string;
  placement: BookmarkAddFormPlacement;
}

/** A user custom-property row: the property, its derived placement, and an optional scope hint. */
export interface CustomPropertyRow {
  property: CustomProperty;
  placement: BookmarkAddFormPlacement;
  hint?: string;
}

/** Title-case a slug segment for a loading/missing-property fallback label (`page-range` → `Page Range`). */
function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Membership-based placement of a standard field: hidden > advanced > default (the main area). */
export function standardFieldPlacement(
  config: BookmarkAddFormSettings,
  field: BookmarkAddFormStandardField,
): BookmarkAddFormPlacement {
  if (config.hiddenFields.includes(field)) return "hidden";
  if (config.advancedFields.includes(field)) return "advanced";
  return "default";
}

/** A custom property's current placement, derived from its existing form-visibility flags. */
function customPropertyPlacement(property: CustomProperty): BookmarkAddFormPlacement {
  if (property.hiddenFromForm) return "hidden";
  if (property.showInForm) return "default";
  return "advanced";
}

/** The property-update payload that realizes a chosen placement via the existing visibility flags. */
function customPropertyPayload(placement: BookmarkAddFormPlacement): UpdateCustomPropertyInput {
  if (placement === "hidden") return {
    hiddenFromForm: true,
  };
  if (placement === "default") return {
    showInForm: true,
    hiddenFromForm: false,
  };
  return {
    showInForm: false,
    hiddenFromForm: false,
  };
}

/** A hint for properties scoped to specific categories/media types (they only appear conditionally). */
function propertyScopeHint(property: CustomProperty): string | undefined {
  const scopedToCategory = !property.allCategories && property.categoryIds.length > 0;
  const scopedToMediaType = !property.allMediaTypes && property.mediaTypeIds.length > 0;
  return scopedToCategory || scopedToMediaType
    ? "Only appears when a matching category or media type is selected"
    : undefined;
}

/**
 * Owns the Add Bookmark form placement state and every persist handler for
 * `DisplayBookmarkAddSettings`. Standard fields + built-in detail properties persist through the
 * server-side `BookmarkAddFormSettings` group (the full payload each time); user custom properties
 * persist through their own `showInForm`/`hiddenFromForm` flags. Each save fires a field-named toast.
 */
export function useBookmarkAddFormSettingsPage() {
  const config = useBookmarkAddFormConfig();
  const updateSettings = useUpdateBookmarkAddFormSettings();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: groups,
  } = usePropertyGroups();
  const updateProperty = useUpdateCustomProperty();

  const allProperties = properties ?? [];
  const allGroups = groups ?? [];

  function persistSettings(next: BookmarkAddFormSettings, label: string): void {
    updateSettings.mutate(next, {
      onSuccess: () => notifySuccess(`${label} placement saved`),
      onError: error => notifyError(error.message),
    });
  }

  function setStandardFieldPlacement(
    field: BookmarkAddFormStandardField,
    placement: BookmarkAddFormPlacement,
  ): void {
    const advancedFields = config.advancedFields.filter(f => f !== field);
    const hiddenFields = config.hiddenFields.filter(f => f !== field);
    if (placement === "advanced") advancedFields.push(field);
    if (placement === "hidden") hiddenFields.push(field);
    persistSettings({
      ...config,
      advancedFields,
      hiddenFields,
    }, BOOKMARK_ADD_FORM_STANDARD_LABELS[field]);
  }

  function setBuiltInPropertyPlacement(slug: string, label: string, placement: BookmarkAddFormPlacement): void {
    persistSettings(
      {
        ...config,
        builtInPropertyPlacements: {
          ...config.builtInPropertyPlacements,
          [slug]: placement,
        },
      },
      label,
    );
  }

  function setCustomPropertyPlacement(property: CustomProperty, placement: BookmarkAddFormPlacement): void {
    updateProperty.mutate({
      id: property.id,
      input: customPropertyPayload(placement),
    }, {
      onSuccess: () => notifySuccess(`${property.name} placement saved`),
      onError: error => notifyError(error.message),
    });
  }

  const detailProperties: DetailPropertyRow[] = BOOKMARK_FORM_DETAIL_SLUGS.map((slug) => {
    const property = allProperties.find(p => p.slug === slug);
    return {
      slug,
      label: property?.name ?? titleCaseSlug(slug),
      placement: config.builtInPropertyPlacements[slug] ?? "hidden",
    };
  });

  const groupOrder = new Map(
    [...allGroups]
      .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
      .map((group, index) => [group.id, index] as const),
  );
  const detailSlugs = new Set<string>(BOOKMARK_FORM_DETAIL_SLUGS);
  const customProperties: CustomPropertyRow[] = allProperties
    .filter(p => p.enabled && !detailSlugs.has(p.slug))
    .sort((a, b) => {
      const orderA = a.propertyGroupId !== null ? groupOrder.get(a.propertyGroupId) ?? Infinity : Infinity;
      const orderB = b.propertyGroupId !== null ? groupOrder.get(b.propertyGroupId) ?? Infinity : Infinity;
      return orderA - orderB || a.name.localeCompare(b.name);
    })
    .map(property => ({
      property,
      placement: customPropertyPlacement(property),
      hint: propertyScopeHint(property),
    }));

  return {
    config,
    setStandardFieldPlacement,
    setBuiltInPropertyPlacement,
    setCustomPropertyPlacement,
    detailProperties,
    customProperties,
  };
}
