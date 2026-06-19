import type { Bookmark } from "@eesimple/types";

import { useRef, useState } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";
import { Loader2, Sparkles } from "lucide-react";

import { CategoryCustomFields } from "./BookmarkCustomFields";
import {
  buildCategoryPropertyValues,
  looksLikeYouTube,
  VIDEO_LENGTH_SLUG,
} from "./bookmarkFormSchema";
import { useUpdateBookmark } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useFetchMetadata } from "../hooks/useFetchMetadata";
import { notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputAddon, InputGroup } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

interface BookmarkPropertiesFormProps {
  bookmark: Bookmark;
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
      notifySuccess("Changes saved");
    }
    finally {
      setIsPending(false);
    }
  }

  const videoLengthProp = (customProperties ?? []).find(p => p.slug === VIDEO_LENGTH_SLUG);
  const isYouTubeBookmark = looksLikeYouTube(bookmark.url);

  const hasProperties
    = (videoLengthProp !== undefined && isYouTubeBookmark)
      || (customProperties ?? []).some(
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
      {videoLengthProp && isYouTubeBookmark && (
        <div className="space-y-3">
          <span className="text-sm font-medium">Video</span>
          <div className="space-y-1">
            <Label htmlFor={`property-${videoLengthProp.id}`}>
              Video Length (seconds)
            </Label>
            <InputGroup>
              <Input
                id={`property-${videoLengthProp.id}`}
                type="number"
                className="pe-10"
                value={numberInputs[videoLengthProp.id] ?? ""}
                onChange={event => handleNumberChange(videoLengthProp.id, event.target.value)}
              />
              <InputAddon align="inline-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Fetch video length from YouTube"
                  aria-label="Fetch video length from YouTube"
                  disabled={fetchMetadata.isPending}
                  onClick={async () => {
                    try {
                      const meta = await fetchMetadata.mutateAsync({
                        url: bookmark.url,
                      });
                      if (meta.durationSeconds !== null) {
                        handleNumberChange(videoLengthProp.id, String(meta.durationSeconds));
                      }
                    }
                    catch {
                      // Non-fatal: best-effort convenience.
                    }
                  }}
                >
                  {fetchMetadata.isPending
                    ? <Loader2 className="size-4 animate-spin" />
                    : <Sparkles className="size-4" />}
                </Button>
              </InputAddon>
            </InputGroup>
          </div>
        </div>
      )}
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
