import type { Bookmark } from "@eesimple/types";

import { useRef, useState } from "react";

import { propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";
import { Loader2, Sparkles } from "lucide-react";

import { CategoryCustomFields } from "./BookmarkCustomFields";
import {
  buildCategoryPropertyValues,
  DATE_POSTED_SLUG,
  looksLikeYouTube,
  RUNTIME_SLUG,
} from "./bookmarkFormSchema";
import { DateTimePicker } from "./DateTimePicker";
import { useUpdateBookmark } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useFetchMetadata } from "../hooks/useFetchMetadata";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputAddon, InputGroup } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

interface BookmarkPropertiesFormProps {
  bookmark: Bookmark;
}

/** Build an error-toast message for a failed metadata fetch, appending the server's reason if any. */
function metadataErrorMessage(label: string, diagnostics?: string[]): string {
  const reason = diagnostics?.length ? ` ${diagnostics.join("; ")}` : "";
  return `Couldn't fetch ${label} from YouTube.${reason}`;
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
        bookmark.mediaType?.id ?? null,
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

  const runtimeProp = (customProperties ?? []).find(p => p.slug === RUNTIME_SLUG);
  const datePostedProp = (customProperties ?? []).find(p => p.slug === DATE_POSTED_SLUG);
  const isYouTubeBookmark = looksLikeYouTube(bookmark.url);

  const hasProperties
    = ((runtimeProp !== undefined || datePostedProp !== undefined) && isYouTubeBookmark)
      || (customProperties ?? []).some(
        property =>
          property.enabled
          && !property.hiddenFromForm
          && property.slug !== RUNTIME_SLUG
          && property.slug !== DATE_POSTED_SLUG
          && (propertyAppliesToCategory(property, bookmark.categoryId ?? "")
            || propertyAppliesToMediaType(property, bookmark.mediaType?.id ?? null)),
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
      {(runtimeProp || datePostedProp) && isYouTubeBookmark && (
        <div className="space-y-3">
          <span className="text-sm font-medium">Video</span>
          {runtimeProp && (
            <div className="space-y-1">
              <Label htmlFor={`property-${runtimeProp.id}`}>
                Runtime (seconds)
              </Label>
              <InputGroup>
                <Input
                  id={`property-${runtimeProp.id}`}
                  type="number"
                  className="pe-10"
                  value={numberInputs[runtimeProp.id] ?? ""}
                  onChange={event => handleNumberChange(runtimeProp.id, event.target.value)}
                />
                <InputAddon align="inline-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Fetch runtime from YouTube"
                    aria-label="Fetch runtime from YouTube"
                    disabled={fetchMetadata.isPending}
                    onClick={async () => {
                      try {
                        const meta = await fetchMetadata.mutateAsync({
                          url: bookmark.url,
                        });
                        if (meta.durationSeconds !== null) {
                          handleNumberChange(runtimeProp.id, String(meta.durationSeconds));
                        }
                        else {
                          notifyError(metadataErrorMessage("runtime", meta.diagnostics));
                        }
                      }
                      catch {
                        notifyError(metadataErrorMessage("runtime"));
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
          )}
          {datePostedProp && (
            <div className="space-y-1">
              <Label htmlFor={`property-${datePostedProp.id}`}>Date Posted</Label>
              <InputGroup>
                <DateTimePicker
                  id={`property-${datePostedProp.id}`}
                  format="date"
                  value={dateTimeInputs[datePostedProp.id] ?? null}
                  onChange={value => handleDateTimeChange(datePostedProp.id, value ?? "")}
                />
                <InputAddon align="inline-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Fetch date posted from YouTube"
                    aria-label="Fetch date posted from YouTube"
                    disabled={fetchMetadata.isPending}
                    onClick={async () => {
                      try {
                        const meta = await fetchMetadata.mutateAsync({
                          url: bookmark.url,
                        });
                        if (meta.datePosted !== null) {
                          handleDateTimeChange(datePostedProp.id, meta.datePosted);
                        }
                        else {
                          notifyError(metadataErrorMessage("date posted", meta.diagnostics));
                        }
                      }
                      catch {
                        notifyError(metadataErrorMessage("date posted"));
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
          )}
        </div>
      )}
      <CategoryCustomFields
        placement="default"
        categoryId={bookmark.categoryId ?? ""}
        mediaTypeId={bookmark.mediaType?.id ?? null}
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
        mediaTypeId={bookmark.mediaType?.id ?? null}
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
