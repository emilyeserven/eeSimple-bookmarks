import type { Bookmark } from "@eesimple/types";

import { CategoryCustomFields } from "./BookmarkCustomFields";
import { BookmarkYouTubeMetadataFields } from "./BookmarkYouTubeMetadataFields";
import { useBookmarkPropertiesForm } from "./useBookmarkPropertiesForm";

import { Button } from "@/components/ui/button";

interface BookmarkPropertiesFormProps {
  bookmark: Bookmark;
}

/** Edit a bookmark's custom property values. */
export function BookmarkPropertiesForm({
  bookmark,
}: BookmarkPropertiesFormProps) {
  const {
    customProperties,
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
  } = useBookmarkPropertiesForm(bookmark);

  if (!hasEditable) {
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
        properties={customProperties}
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
        properties={customProperties}
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
