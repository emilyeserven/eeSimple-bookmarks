import type {
  BookmarkAddFormAdvancedRule,
  BookmarkAddFormPlacement,
  BookmarkAddFormSettings,
  BookmarkAddFormStandardField,
  CustomProperty,
  UpdateCustomPropertyInput,
} from "@eesimple/types";
import type { LucideIcon } from "lucide-react";

import { BOOKMARK_FORM_DETAIL_SLUGS, makeEmptyAdvancedRule } from "@eesimple/types";
import {
  Ban,
  CaseSensitive,
  Clapperboard,
  Drama,
  Film,
  FolderOpen,
  Image,
  MapPin,
  MapPinOff,
  Tags,
  Type,
  UserRound,
  Users,
} from "lucide-react";

import {
  useBookmarkAddFormConfig,
  useUpdateBookmarkAddFormSettings,
} from "./useAppSettings";
import { useCategories } from "./useCategories";
import { useCustomProperties, useUpdateCustomProperty } from "./useCustomProperties";
import { useTagTree } from "./useTags";
import { useTranslatedLabel } from "./useTranslatedLabel";
import { notifyError, notifySuccess } from "../lib/notifications";
import { randomId } from "../lib/utils";

/** Human labels for each standard Add Bookmark form field (used for both rows and toast wording). */
export const BOOKMARK_ADD_FORM_STANDARD_LABELS: Record<BookmarkAddFormStandardField, string> = {
  title: "Name",
  names: "Other titles",
  categoryId: "Category",
  mediaTypeId: "Media Type",
  descriptionTags: "Description & Tags",
  personIds: "People",
  image: "Image",
  groupIds: "Groups",
  genreMoodIds: "Genres & Moods",
  locationIds: "Locations",
  mediaLink: "Media (Book/Movie/TV…)",
  blacklistedTagIds: "Excluded Tags",
  blacklistedLocationIds: "Excluded Locations",
};

/** A distinct lucide icon per standard field (shared by the settings card and the advanced-rule editor). */
export const STANDARD_FIELD_ICONS: Record<BookmarkAddFormStandardField, LucideIcon> = {
  title: Type,
  names: CaseSensitive,
  categoryId: FolderOpen,
  mediaTypeId: Clapperboard,
  descriptionTags: Tags,
  personIds: UserRound,
  image: Image,
  groupIds: Users,
  genreMoodIds: Drama,
  locationIds: MapPin,
  mediaLink: Film,
  blacklistedTagIds: Ban,
  blacklistedLocationIds: MapPinOff,
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

/** Resolved placement of a standard field from the config's placement map (defaulting to the main area). */
export function standardFieldPlacement(
  config: BookmarkAddFormSettings,
  field: BookmarkAddFormStandardField,
): BookmarkAddFormPlacement {
  return config.standardFieldPlacements[field] ?? "default";
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
function propertyScopeHint(property: CustomProperty, t: (key: string) => string): string | undefined {
  const scopedToCategory = !property.allCategories && property.categoryIds.length > 0;
  const scopedToMediaType = !property.allMediaTypes && property.mediaTypeIds.length > 0;
  return scopedToCategory || scopedToMediaType
    ? t("Only appears when a matching category or media type is selected")
    : undefined;
}

/**
 * Owns the Add Bookmark form placement state and every persist handler for
 * `DisplayBookmarkAddSettings`. Standard fields + built-in detail properties persist through the
 * server-side `BookmarkAddFormSettings` group (the full payload each time); user custom properties
 * persist through their own `showInForm`/`hiddenFromForm` flags. Each save fires a field-named toast.
 */
export function useBookmarkAddFormSettingsPage() {
  const tLabel = useTranslatedLabel();
  const config = useBookmarkAddFormConfig();
  const updateSettings = useUpdateBookmarkAddFormSettings();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: tagTree = [],
  } = useTagTree();
  const updateProperty = useUpdateCustomProperty();

  const allProperties = properties ?? [];

  function persistSettings(next: BookmarkAddFormSettings, label: string): void {
    updateSettings.mutate(next, {
      onSuccess: () => notifySuccess(tLabel("{{label}} placement saved", {
        label,
      })),
      onError: error => notifyError(error.message),
    });
  }

  function setStandardFieldPlacement(
    field: BookmarkAddFormStandardField,
    placement: BookmarkAddFormPlacement,
  ): void {
    persistSettings({
      ...config,
      standardFieldPlacements: {
        ...config.standardFieldPlacements,
        [field]: placement,
      },
    }, tLabel(BOOKMARK_ADD_FORM_STANDARD_LABELS[field]));
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

  function setRevealAutofilledInMain(enabled: boolean): void {
    persistSettings(
      {
        ...config,
        revealAutofilledInMain: enabled,
      },
      tLabel("Reveal auto-filled fields"),
    );
  }

  function setCustomPropertyPlacement(property: CustomProperty, placement: BookmarkAddFormPlacement): void {
    updateProperty.mutate({
      id: property.id,
      input: customPropertyPayload(placement),
    }, {
      onSuccess: () => notifySuccess(tLabel("{{label}} placement saved", {
        label: property.name,
      })),
      onError: error => notifyError(error.message),
    });
  }

  /** Persist a new advanced-rules array (the whole settings payload), with the shared section toast. */
  function persistAdvancedRules(advancedRules: BookmarkAddFormAdvancedRule[]): void {
    persistSettings({
      ...config,
      advancedRules,
    }, tLabel("Advanced rules"));
  }

  function addAdvancedRule(): void {
    const nextSortOrder = config.advancedRules.reduce((max, rule) => Math.max(max, rule.sortOrder), 0) + 1;
    persistAdvancedRules([...config.advancedRules, makeEmptyAdvancedRule(randomId(), nextSortOrder)]);
  }

  function updateAdvancedRule(id: string, patch: Partial<BookmarkAddFormAdvancedRule>): void {
    persistAdvancedRules(config.advancedRules.map(rule => (rule.id === id
      ? {
        ...rule,
        ...patch,
      }
      : rule)));
  }

  function deleteAdvancedRule(id: string): void {
    persistAdvancedRules(config.advancedRules.filter(rule => rule.id !== id));
  }

  const advancedRules = [...config.advancedRules].sort((a, b) => a.sortOrder - b.sortOrder);

  const detailProperties: DetailPropertyRow[] = BOOKMARK_FORM_DETAIL_SLUGS.map((slug) => {
    const property = allProperties.find(p => p.slug === slug);
    return {
      slug,
      label: property?.name ?? titleCaseSlug(slug),
      placement: config.builtInPropertyPlacements[slug] ?? "hidden",
    };
  });

  const detailSlugs = new Set<string>(BOOKMARK_FORM_DETAIL_SLUGS);
  const customProperties: CustomPropertyRow[] = allProperties
    .filter(p => p.enabled && !detailSlugs.has(p.slug))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(property => ({
      property,
      placement: customPropertyPlacement(property),
      hint: propertyScopeHint(property, tLabel),
    }));

  return {
    config,
    setStandardFieldPlacement,
    setBuiltInPropertyPlacement,
    setRevealAutofilledInMain,
    setCustomPropertyPlacement,
    detailProperties,
    customProperties,
    // Advanced Rules — conditional placement overrides.
    advancedRules,
    addAdvancedRule,
    updateAdvancedRule,
    deleteAdvancedRule,
    // Data for the rule editor's embedded ConditionsField.
    conditionCategories: categories,
    conditionProperties: allProperties,
    conditionTagTree: tagTree,
  };
}
