import type { Bookmark, CustomProperty, SectionEntry } from "@eesimple/types";

import { useState } from "react";

import { propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";

import {
  buildAllPropertyValues,
  DATE_POSTED_SLUG,
  looksLikeYouTube,
  RUNTIME_SLUG,
} from "./bookmarkFormSchema";
import { useSeededPropertyInputs } from "./useSeededPropertyInputs";
import { useUpdateBookmark } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useFetchMetadata } from "../hooks/useFetchMetadata";
import { notifySuccess } from "../lib/notifications";

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
  const [isPending, setIsPending] = useState(false);

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
  function handleProgressChange(id: string, field: "current" | "total", value: string): void {
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
  }
  function handleTextChange(id: string, value: string): void {
    setTextInputs(current => ({
      ...current,
      [id]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setIsPending(true);
    try {
      const values = buildAllPropertyValues(
        customProperties ?? [],
        bookmark.categoryId ?? "",
        customRef.current,
        bookmark.mediaType?.id ?? null,
      );
      await updateBookmark.mutateAsync({
        id: bookmark.id,
        input: values,
      });
      notifySuccess("Changes saved");
    }
    finally {
      setIsPending(false);
    }
  }

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
    updateBookmark,
    isPending,
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
    handleSubmit,
    runtimeProp,
    datePostedProp,
    isYouTubeBookmark,
    builtInHiddenSlugs,
    hasEditable,
  };
}
