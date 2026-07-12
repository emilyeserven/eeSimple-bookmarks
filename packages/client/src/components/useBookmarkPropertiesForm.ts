import type { ProgressInputEntry } from "./bookmarkFormSchema";
import type { Bookmark, CustomProperty, SectionEntry } from "@eesimple/types";

import { useEffect, useRef } from "react";

import { countSectionLeaves, propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";

import {
  buildAllPropertyValues,
  DATE_POSTED_SLUG,
  looksLikeYouTube,
  RUNTIME_SLUG,
} from "./bookmarkFormSchema";
import { useKavitaSectionsImport } from "./useKavitaSectionsImport";
import { useSeededPropertyInputs } from "./useSeededPropertyInputs";
import { useUpdateBookmark } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useFetchMetadata } from "../hooks/useFetchMetadata";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

/**
 * Whether any property is editable for this bookmark: a YouTube built-in (Runtime/Date Posted) on a
 * YouTube URL, or any enabled, form-visible property scoped to the bookmark's category or media type.
 * On a non-YouTube bookmark, Runtime/Date Posted render as ordinary fields (not the metadata-fetch
 * fields), so they count here too — they're only excluded for YouTube bookmarks, where the dedicated
 * metadata fields handle them.
 */
function hasEditableProperties(
  customProperties: CustomProperty[],
  bookmark: Bookmark,
  runtimeProp: CustomProperty | undefined,
  datePostedProp: CustomProperty | undefined,
  isYouTubeBookmark: boolean,
): boolean {
  if ((runtimeProp !== undefined || datePostedProp !== undefined) && isYouTubeBookmark) return true;
  return customProperties.some((property) => {
    if (isYouTubeBookmark && (property.slug === RUNTIME_SLUG || property.slug === DATE_POSTED_SLUG)) {
      return false;
    }
    return property.enabled
      && !property.hiddenFromForm
      && (propertyAppliesToCategory(property, bookmark.categoryId ?? "")
        || propertyAppliesToMediaType(property, bookmark.mediaType?.id ?? null));
  });
}

/** State + handlers for {@link BookmarkPropertiesForm}: the seeded property inputs and submit. */
export function useBookmarkPropertiesForm(bookmark: Bookmark) {
  const updateBookmark = useUpdateBookmark();
  const fetchMetadata = useFetchMetadata();
  const {
    data: customProperties,
  } = useCustomProperties();

  const {
    numberInputs,
    booleanInputs,
    dateTimeInputs,
    choicesInputs,
    progressInputs,
    sectionsInputs,
    textInputs,
    setNumberInputs,
    setBooleanInputs,
    setDateTimeInputs,
    setChoicesInputs,
    setProgressInputs,
    setSectionsInputs,
    setTextInputs,
    customRef,
  } = useSeededPropertyInputs(bookmark);

  // Per-field auto-save (edit-tab standard — no Save button). The property values ride in one
  // array-shaped PATCH, so we mirror the Languages tab: debounce-persist the whole set whenever it
  // changes from the last-saved snapshot, firing a single "Properties" toast. The serialized entries
  // last persisted, so the debounce skips no-op saves (including the initial seed on load).
  const savedRef = useRef<string | null>(null);
  const mutateRef = useRef(updateBookmark.mutate);
  mutateRef.current = updateBookmark.mutate;

  useEffect(() => {
    if (!customProperties) return;
    const values = buildAllPropertyValues(
      customProperties,
      bookmark.categoryId ?? "",
      customRef.current,
      bookmark.mediaType?.id ?? null,
    );
    const serialized = JSON.stringify(values);
    // Seed the snapshot on first load without saving.
    if (savedRef.current === null) {
      savedRef.current = serialized;
      return;
    }
    if (serialized === savedRef.current) return;
    const timer = setTimeout(() => {
      mutateRef.current(
        {
          id: bookmark.id,
          input: values,
        },
        {
          onSuccess: () => {
            savedRef.current = serialized;
            notifyFieldSaved("Properties");
          },
          onError: error => notifyFieldSaveError("Properties", describeError(error)),
        },
      );
    }, 700);
    return () => clearTimeout(timer);
    // customRef is a stable ref mirroring the maps below; the maps are the reactive triggers.
  }, [
    numberInputs,
    booleanInputs,
    dateTimeInputs,
    choicesInputs,
    progressInputs,
    sectionsInputs,
    textInputs,
    customProperties,
    bookmark,
    customRef,
  ]);

  function handleNumberChange(id: string, value: string): void {
    setNumberInputs(current => ({
      ...current,
      [id]: value,
    }));
  }
  function handleBooleanChange(id: string, value: boolean): void {
    setBooleanInputs(current => ({
      ...current,
      [id]: value,
    }));
  }
  function handleDateTimeChange(id: string, value: string): void {
    setDateTimeInputs(current => ({
      ...current,
      [id]: value,
    }));
  }
  function handleChoicesChange(id: string, values: string[]): void {
    setChoicesInputs(current => ({
      ...current,
      [id]: values,
    }));
  }
  function handleProgressChange(id: string, field: keyof ProgressInputEntry, value: string): void {
    setProgressInputs(current => ({
      ...current,
      [id]: {
        ...(current[id] ?? {
          current: "",
          total: "",
        }),
        [field]: value,
      },
    }));
  }
  function handleSectionsChange(id: string, value: { exhaustive: boolean;
    sections: SectionEntry[]; }): void {
    setSectionsInputs(current => ({
      ...current,
      [id]: value,
    }));
    // Live-preview any linked derived Progress value (the same countSectionLeaves rule the server
    // applies on save, so the disabled inputs track the checkboxes in real time).
    const derived = (customProperties ?? []).filter(p => p.itemInItemsSourcePropertyId === id);
    if (derived.length > 0 && value.sections.length > 0) {
      const counts = countSectionLeaves(value.sections);
      setProgressInputs(current => ({
        ...current,
        ...Object.fromEntries(derived.map(p => [p.id, {
          current: String(counts.completed),
          total: String(counts.total),
        }])),
      }));
    }
  }
  function handleTextChange(id: string, value: string): void {
    setTextInputs(current => ({
      ...current,
      [id]: value,
    }));
  }

  const {
    canImportSections,
    handleSectionsImport,
    isSectionsImportPending,
  } = useKavitaSectionsImport({
    bookmark,
    onApply: handleSectionsChange,
  });

  const runtimeProp = (customProperties ?? []).find(p => p.slug === RUNTIME_SLUG);
  const datePostedProp = (customProperties ?? []).find(p => p.slug === DATE_POSTED_SLUG);
  const isYouTubeBookmark = looksLikeYouTube(bookmark.url ?? "");
  // On YouTube bookmarks Runtime/Date Posted are edited via the metadata-fetch fields above, so keep
  // them out of the generic property list there. On every other bookmark they render as ordinary
  // number/date fields so their values stay editable.
  const builtInHiddenSlugs = isYouTubeBookmark ? [RUNTIME_SLUG, DATE_POSTED_SLUG] : [];

  const hasEditable = hasEditableProperties(
    customProperties ?? [],
    bookmark,
    runtimeProp,
    datePostedProp,
    isYouTubeBookmark,
  );

  return {
    customProperties: customProperties ?? [],
    fetchMetadata,
    numberInputs,
    booleanInputs,
    dateTimeInputs,
    choicesInputs,
    progressInputs,
    sectionsInputs,
    textInputs,
    handleNumberChange,
    handleBooleanChange,
    handleDateTimeChange,
    handleChoicesChange,
    handleProgressChange,
    handleSectionsChange,
    handleTextChange,
    canImportSections,
    handleSectionsImport,
    isSectionsImportPending,
    runtimeProp,
    datePostedProp,
    isYouTubeBookmark,
    builtInHiddenSlugs,
    hasEditable,
  };
}
