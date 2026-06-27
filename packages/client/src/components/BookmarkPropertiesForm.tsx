import type { Bookmark, CustomProperty } from "@eesimple/types";

import { useState } from "react";

import { propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";

import { CategoryCustomFields } from "./BookmarkCustomFields";
import {
  buildAllPropertyValues,
  DATE_POSTED_SLUG,
  looksLikeYouTube,
  RUNTIME_SLUG,
} from "./bookmarkFormSchema";
import { BookmarkYouTubeMetadataFields } from "./BookmarkYouTubeMetadataFields";
import { useSeededPropertyInputs } from "./useSeededPropertyInputs";
import { useUpdateBookmark } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useFetchMetadata } from "../hooks/useFetchMetadata";
import { notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";

interface BookmarkPropertiesFormProps {
  bookmark: Bookmark;
}

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

/** Edit a bookmark's custom property values. */
export function BookmarkPropertiesForm({
  bookmark,
}: BookmarkPropertiesFormProps) {
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
    sections: import("@eesimple/types").SectionEntry[]; }): void {
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

  if (!hasEditableProperties(customProperties ?? [], bookmark, runtimeProp, datePostedProp, isYouTubeBookmark)) {
    return (
      <p className="text-sm text-muted-foreground">
        No custom properties are assigned to this bookmark&apos;s category.
      </p>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={event => void handleSubmit(event)}
    >
      {(runtimeProp || datePostedProp) && isYouTubeBookmark && (
        <BookmarkYouTubeMetadataFields
          bookmark={bookmark}
          fetchMetadata={fetchMetadata}
          runtimeProp={runtimeProp}
          datePostedProp={datePostedProp}
          numberInputs={numberInputs}
          dateTimeInputs={dateTimeInputs}
          onNumberChange={handleNumberChange}
          onDateTimeChange={handleDateTimeChange}
        />
      )}
      <CategoryCustomFields
        placement="default"
        layout="stack"
        categoryId={bookmark.categoryId ?? ""}
        mediaTypeId={bookmark.mediaType?.id ?? null}
        properties={customProperties ?? []}
        bookmark={bookmark}
        hiddenSlugs={builtInHiddenSlugs}
        numberInputs={numberInputs}
        booleanInputs={booleanInputs}
        dateTimeInputs={dateTimeInputs}
        choicesInputs={choicesInputs}
        progressInputs={progressInputs}
        sectionsInputs={sectionsInputs}
        textInputs={textInputs}
        onNumberChange={handleNumberChange}
        onBooleanChange={handleBooleanChange}
        onDateTimeChange={handleDateTimeChange}
        onChoicesChange={handleChoicesChange}
        onProgressChange={handleProgressChange}
        onSectionsChange={handleSectionsChange}
        onTextChange={handleTextChange}
      />
      <CategoryCustomFields
        placement="advanced"
        layout="stack"
        categoryId={bookmark.categoryId ?? ""}
        mediaTypeId={bookmark.mediaType?.id ?? null}
        properties={customProperties ?? []}
        bookmark={bookmark}
        hiddenSlugs={builtInHiddenSlugs}
        numberInputs={numberInputs}
        booleanInputs={booleanInputs}
        dateTimeInputs={dateTimeInputs}
        choicesInputs={choicesInputs}
        progressInputs={progressInputs}
        sectionsInputs={sectionsInputs}
        textInputs={textInputs}
        onNumberChange={handleNumberChange}
        onBooleanChange={handleBooleanChange}
        onDateTimeChange={handleDateTimeChange}
        onChoicesChange={handleChoicesChange}
        onProgressChange={handleProgressChange}
        onSectionsChange={handleSectionsChange}
        onTextChange={handleTextChange}
      />
      <div>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || updateBookmark.isPending}
        >
          {isPending || updateBookmark.isPending ? "Saving…" : "Save changes"}
        </Button>
        {updateBookmark.isError
          ? <p className="mt-2 text-sm text-destructive">{updateBookmark.error?.message}</p>
          : null}
      </div>
    </form>
  );
}
