/* eslint-disable react-refresh/only-export-components -- this module pairs the per-property layout
   field components (edit/view/YouTube-metadata) with the `useBookmarkDynamicFields` hook + the pure
   eligibility helpers they share; splitting them would obscure the one-property-one-field mapping */
import type { CategoryPropertyFieldProps } from "./BookmarkCustomFields";
import type { BookmarkPropertiesFormContextValue } from "./BookmarkPropertiesFormContext";
import type { DynamicFieldSet, WorkbenchField } from "./workbench/types";
import type { Bookmark, CustomProperty } from "@eesimple/types";

import { useMemo } from "react";

import { propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";
import { SlidersHorizontal } from "lucide-react";

import { CategoryPropertyField } from "./BookmarkCustomFields";
import { DATE_POSTED_SLUG, looksLikeYouTube, RUNTIME_SLUG } from "./bookmarkFormSchema";
import { useBookmarkPropertiesFormContext } from "./BookmarkPropertiesFormContext";
import { BookmarkPropertyRow } from "./BookmarkPropertyRow";
import { BookmarkYouTubeMetadataFields } from "./BookmarkYouTubeMetadataFields";
import { useAddBookmarkPeopleByNames } from "../hooks/useAddBookmarkPeopleByNames";
import { useUpdateBookmark } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { mergeBooleanValue } from "../lib/bookmarkFormat";

/** Whether a property is in scope for this bookmark (its own category/media-type gate — the runtime lock). */
function propertyInScope(property: CustomProperty, bookmark: Bookmark): boolean {
  return propertyAppliesToCategory(property, bookmark.categoryId ?? "")
    || propertyAppliesToMediaType(property, bookmark.mediaType?.id ?? null);
}

/**
 * Whether a property's **edit** field renders for this bookmark: enabled, not dropped from the form,
 * in scope, and — on YouTube bookmarks — not one of the two built-ins edited via the YouTube-metadata
 * field. Mirrors the old `selectVisibleFormProperties(placement:"all")` + `builtInHiddenSlugs` gate.
 */
export function bookmarkPropertyEditEligible(
  property: CustomProperty,
  bookmark: Bookmark,
): boolean {
  if (!property.enabled || property.hiddenFromForm) return false;
  if (!propertyInScope(property, bookmark)) return false;
  if (looksLikeYouTube(bookmark.url ?? "") && (property.slug === RUNTIME_SLUG || property.slug === DATE_POSTED_SLUG)) {
    return false;
  }
  return true;
}

/**
 * Whether the property's placeable field should appear at all for this bookmark — edit-eligible OR
 * view-eligible (`showInDetails`). The per-mode renderers refine this: the edit renderer re-checks
 * {@link bookmarkPropertyEditEligible}, the view renderer ({@link BookmarkPropertyRow}) self-hides when
 * the property has no resolvable value. So a field never renders where it shouldn't, and the Properties
 * tab's view-emptiness is still gated by `useBookmarkViewTabs`' `hasPropertyRows` check.
 */
function bookmarkPropertyFieldApplies(property: CustomProperty, bookmark: Bookmark): boolean {
  return bookmarkPropertyEditEligible(property, bookmark) || property.showInDetails;
}

/** The shared-controller value bundle a single property edit field needs (keyed by property id). */
function editBundle(ctrl: BookmarkPropertiesFormContextValue): Omit<CategoryPropertyFieldProps, "property" | "bookmark"> {
  return {
    numberInputs: ctrl.numberInputs,
    booleanInputs: ctrl.booleanInputs,
    dateTimeInputs: ctrl.dateTimeInputs,
    choicesInputs: ctrl.choicesInputs,
    progressInputs: ctrl.progressInputs,
    sectionsInputs: ctrl.sectionsInputs,
    textInputs: ctrl.textInputs,
    onNumberChange: ctrl.handleNumberChange,
    onBooleanChange: ctrl.handleBooleanChange,
    onDateTimeChange: ctrl.handleDateTimeChange,
    onChoicesChange: ctrl.handleChoicesChange,
    onProgressChange: ctrl.handleProgressChange,
    onSectionsChange: ctrl.handleSectionsChange,
    onTextChange: ctrl.handleTextChange,
    onSectionsImport: ctrl.canImportSections
      ? (propertyId: string) => void ctrl.handleSectionsImport(propertyId)
      : undefined,
    isSectionsImportPending: ctrl.isSectionsImportPending,
  };
}

/** One custom property's **edit** input, reading the shared properties controller from context. */
function BookmarkPropertyEditField({
  property, bookmark,
}: {
  property: CustomProperty;
  bookmark: Bookmark;
}) {
  const ctrl = useBookmarkPropertiesFormContext();
  const addPeople = useAddBookmarkPeopleByNames(bookmark);
  if (!bookmarkPropertyEditEligible(property, bookmark)) return null;
  return (
    <CategoryPropertyField
      property={property}
      bookmark={bookmark}
      {...editBundle(ctrl)}
      onAddPeople={names => void addPeople(names)}
    />
  );
}

/** One custom property's read-only **view** row, with the in-view boolean toggle wired. */
function BookmarkPropertyViewField({
  property, bookmark,
}: {
  property: CustomProperty;
  bookmark: Bookmark;
}) {
  const updateBookmark = useUpdateBookmark();
  function saveBoolean(propertyId: string, value: boolean) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        booleanValues: mergeBooleanValue(bookmark.booleanValues, propertyId, value),
      },
    });
  }
  return (
    <BookmarkPropertyRow
      bookmark={bookmark}
      property={property}
      onSaveBoolean={saveBoolean}
    />
  );
}

/**
 * The YouTube-only Runtime / Date Posted metadata-fetch block, as its own **edit-only** placeable
 * field. Reads the shared properties controller; self-hides on non-YouTube bookmarks or when neither
 * built-in applies (matching the old inline `(runtimeProp || datePostedProp) && isYouTubeBookmark` gate).
 */
function BookmarkYouTubeMetadataEditField({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  const ctrl = useBookmarkPropertiesFormContext();
  if (!ctrl.isYouTubeBookmark || (!ctrl.runtimeProp && !ctrl.datePostedProp)) return null;
  return (
    <BookmarkYouTubeMetadataFields
      bookmark={bookmark}
      fetchMetadata={ctrl.fetchMetadata}
      runtimeProp={ctrl.runtimeProp}
      datePostedProp={ctrl.datePostedProp}
      numberInputs={ctrl.numberInputs}
      dateTimeInputs={ctrl.dateTimeInputs}
      onNumberChange={ctrl.handleNumberChange}
      onDateTimeChange={ctrl.handleDateTimeChange}
    />
  );
}

/** The static YouTube-metadata field registered directly in the bookmark registry (`bookmark.tsx`). */
export const bookmarkYouTubeMetadataField: WorkbenchField<Bookmark> = {
  key: "youtubeMetadata",
  label: "YouTube metadata",
  icon: SlidersHorizontal,
  showIf: bookmark => looksLikeYouTube(bookmark.url ?? ""),
  edit: ({
    entity,
  }) => <BookmarkYouTubeMetadataEditField bookmark={entity} />,
};

/**
 * The **dynamic** placeable bookmark fields (#1163+): one field per custom property, keyed by the
 * property id (the Card Display Rules card-field convention). Each carries a `view` row + an `edit`
 * input (both reading the shared controller / entity) and a `showIf` scope gate, so every enabled or
 * detail-visible property becomes an independently placeable layout field. Unplaced/new properties get
 * a home in the Properties tab via the engine's `augmentDefaultLayout`.
 */
export function useBookmarkDynamicFields(): DynamicFieldSet<Bookmark> {
  const {
    data: properties,
  } = useCustomProperties();
  return useMemo(() => {
    const fields: Record<string, WorkbenchField<Bookmark>> = {};
    for (const property of properties ?? []) {
      // Skip properties that can never surface (fully off + not shown in details) so the editor tray
      // stays clean; everything else becomes a placeable field gated per-bookmark by `showIf`.
      if (!property.enabled && !property.showInDetails) continue;
      fields[property.id] = {
        key: property.id,
        label: property.name,
        icon: SlidersHorizontal,
        showIf: bookmark => bookmarkPropertyFieldApplies(property, bookmark),
        view: ({
          entity,
        }) => (
          <BookmarkPropertyViewField
            property={property}
            bookmark={entity}
          />
        ),
        edit: ({
          entity,
        }) => (
          <BookmarkPropertyEditField
            property={property}
            bookmark={entity}
          />
        ),
      };
    }
    return {
      fields,
      defaultHome: {
        tabKey: "properties",
        sectionKey: "properties",
      },
    };
  }, [properties]);
}
