import type { Bookmark } from "@eesimple/types";

import { useRef, useState } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";
import { toast } from "sonner";

import { CategoryCustomFields } from "./BookmarkCustomFields";
import { buildCategoryPropertyValues, VIDEO_LENGTH_SLUG } from "./bookmarkFormSchema";
import { useUpdateBookmark } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";

import { Button } from "@/components/ui/button";

interface BookmarkPropertiesFormProps {
  bookmark: Bookmark;
}

/** Edit a bookmark's custom property values. */
export function BookmarkPropertiesForm({
  bookmark,
}: BookmarkPropertiesFormProps) {
  const updateBookmark = useUpdateBookmark();
  const {
    data: customProperties,
  } = useCustomProperties();

  const [numberInputs, setNumberInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((bookmark.numberValues ?? []).map(entry => [entry.propertyId, String(entry.value)])));
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((bookmark.booleanValues ?? []).map(entry => [entry.propertyId, entry.value])));
  const [dateTimeInputs, setDateTimeInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((bookmark.dateTimeValues ?? []).map(entry => [entry.propertyId, entry.value])));
  const [isPending, setIsPending] = useState(false);

  const customRef = useRef({
    numberInputs,
    booleanInputs,
    dateTimeInputs,
  });
  customRef.current = {
    numberInputs,
    booleanInputs,
    dateTimeInputs,
  };

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

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setIsPending(true);
    try {
      const {
        numberValues, booleanValues, dateTimeValues,
      } = buildCategoryPropertyValues(
        customProperties ?? [],
        bookmark.categoryId ?? "",
        customRef.current,
      );
      await updateBookmark.mutateAsync({
        id: bookmark.id,
        input: {
          numberValues,
          booleanValues,
          dateTimeValues,
        },
      });
      toast.success("Changes saved");
    }
    finally {
      setIsPending(false);
    }
  }

  const hasProperties = (customProperties ?? []).some(
    property =>
      property.enabled
      && !property.hiddenFromForm
      && property.slug !== VIDEO_LENGTH_SLUG
      && propertyAppliesToCategory(property, bookmark.categoryId ?? ""),
  );

  if (!hasProperties) {
    return (
      <p className="text-sm text-muted-foreground">
        No custom properties are assigned to this bookmark&apos;s category.
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={event => void handleSubmit(event)}
    >
      <CategoryCustomFields
        placement="default"
        categoryId={bookmark.categoryId ?? ""}
        properties={customProperties ?? []}
        numberInputs={numberInputs}
        booleanInputs={booleanInputs}
        dateTimeInputs={dateTimeInputs}
        onNumberChange={handleNumberChange}
        onBooleanChange={handleBooleanChange}
        onDateTimeChange={handleDateTimeChange}
      />
      <CategoryCustomFields
        placement="advanced"
        categoryId={bookmark.categoryId ?? ""}
        properties={customProperties ?? []}
        numberInputs={numberInputs}
        booleanInputs={booleanInputs}
        dateTimeInputs={dateTimeInputs}
        onNumberChange={handleNumberChange}
        onBooleanChange={handleBooleanChange}
        onDateTimeChange={handleDateTimeChange}
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
