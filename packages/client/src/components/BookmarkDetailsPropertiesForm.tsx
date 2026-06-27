import type { Bookmark, CustomProperty } from "@eesimple/types";

import { useState } from "react";

import { propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";

import { CategoryCustomFields } from "./BookmarkCustomFields";
import { buildAllPropertyValues } from "./bookmarkFormSchema";
import { useSeededPropertyInputs } from "./useSeededPropertyInputs";
import { useUpdateBookmark } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface BookmarkDetailsPropertiesFormProps {
  bookmark: Bookmark;
}

function hasDetailsProperties(
  customProperties: CustomProperty[],
  bookmark: Bookmark,
): boolean {
  return customProperties.some(
    p =>
      p.enabled
      && !p.hiddenFromForm
      && p.showInDetails
      && (propertyAppliesToCategory(p, bookmark.categoryId ?? "")
        || propertyAppliesToMediaType(p, bookmark.mediaType?.id ?? null)),
  );
}

/**
 * Renders editable inputs for custom properties with `showInDetails` enabled, shown in the General
 * edit tab so users can update "details-page" property values without switching to the Properties tab.
 * Returns null when no such properties apply to this bookmark's category/media type.
 */
export function BookmarkDetailsPropertiesForm({
  bookmark,
}: BookmarkDetailsPropertiesFormProps) {
  const updateBookmark = useUpdateBookmark();
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

  if (!hasDetailsProperties(customProperties ?? [], bookmark)) return null;

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

  return (
    <>
      <Separator />
      <form
        className="space-y-4"
        onSubmit={event => void handleSubmit(event)}
      >
        <CategoryCustomFields
          placement="details"
          categoryId={bookmark.categoryId ?? ""}
          mediaTypeId={bookmark.mediaType?.id ?? null}
          properties={customProperties ?? []}
          bookmark={bookmark}
          numberInputs={numberInputs}
          booleanInputs={booleanInputs}
          dateTimeInputs={dateTimeInputs}
          choicesInputs={choicesInputs}
          progressInputs={progressInputs}
          sectionsInputs={sectionsInputs}
          textInputs={textInputs}
          onNumberChange={(id, value) => setNumberInputs(cur => ({
            ...cur,
            [id]: value,
          }))}
          onBooleanChange={(id, value) => setBooleanInputs(cur => ({
            ...cur,
            [id]: value,
          }))}
          onDateTimeChange={(id, value) => setDateTimeInputs(cur => ({
            ...cur,
            [id]: value,
          }))}
          onChoicesChange={(id, values) => setChoicesInputs(cur => ({
            ...cur,
            [id]: values,
          }))}
          onProgressChange={(id, field, value) =>
            setProgressInputs(cur => ({
              ...cur,
              [id]: {
                ...(cur[id] ?? {
                  current: "",
                  total: "",
                }),
                [field]: value,
              },
            }))}
          onSectionsChange={(id, value) => setSectionsInputs(cur => ({
            ...cur,
            [id]: value,
          }))}
          onTextChange={(id, value) => setTextInputs(cur => ({
            ...cur,
            [id]: value,
          }))}
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
    </>
  );
}
