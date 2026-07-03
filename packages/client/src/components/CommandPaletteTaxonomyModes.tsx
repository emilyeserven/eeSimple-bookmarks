import type { CreateKind } from "./commandPaletteModals";
import type { BookmarkTaxonomyContext } from "./useBookmarkTaxonomyContext";
import type { CommandPaletteTaxonomyState } from "./useCommandPaletteState";
import type { useEntityCommandContext } from "./useEntityCommandContext";

import {
  PeopleSubPalette,
  CategorySubPalette,
  ChoicesSubPalette,
  LocationsSubPalette,
  MediaTypeSubPalette,
  NewsletterSubPalette,
  RatingSubPalette,
  TagsSubPalette,
} from "./commandPaletteSubPalettes";
import { EntityChoiceSubPalette } from "./EntityCommandGroup";

interface CommandPaletteTaxonomyModesProps {
  taxonomy: CommandPaletteTaxonomyState;
  taxonomyContext: BookmarkTaxonomyContext;
  entityCtx: ReturnType<typeof useEntityCommandContext>;
  /** Leave the sub-palette and return to the default palette view. */
  onExitMode: () => void;
  /** Close the whole palette (after a selection was applied). */
  onClose: () => void;
  /** Open the create modal for `kind`, assigning the created entity to the bookmark. */
  onCreateAndAssign: (kind: CreateKind) => void;
}

/**
 * The active sub-palette when the palette has drilled into a taxonomy mode (category / media type /
 * tags / locations / people / newsletter / choices / rating / entity-choice). Renders nothing in
 * the default view — the caller switches on `taxonomy.taxonomyMode === null` for that.
 */
export function CommandPaletteTaxonomyModes({
  taxonomy,
  taxonomyContext,
  entityCtx,
  onExitMode,
  onClose,
  onCreateAndAssign,
}: CommandPaletteTaxonomyModesProps) {
  const {
    bookmarkId,
    bookmark,
    categories,
    flatMediaTypes,
    flatTags,
    flatLocations,
    people,
    newsletters,
    customProperties,
    updateBookmark,
  } = taxonomyContext;

  return (
    <>
      {taxonomy.taxonomyMode === "category" && bookmarkId && (
        <CategorySubPalette
          categories={categories}
          currentCategoryId={bookmark?.categoryId}
          onBack={onExitMode}
          onSelect={(categoryId) => {
            updateBookmark.mutate({
              id: bookmarkId,
              input: {
                categoryId,
              },
            });
            onClose();
          }}
          onCreateNew={() => onCreateAndAssign("category")}
        />
      )}

      {taxonomy.taxonomyMode === "media-type" && bookmarkId && (
        <MediaTypeSubPalette
          flatMediaTypes={flatMediaTypes}
          currentMediaTypeId={bookmark?.mediaType?.id}
          onBack={onExitMode}
          onSelect={(mediaTypeId) => {
            updateBookmark.mutate({
              id: bookmarkId,
              input: {
                mediaTypeId,
              },
            });
            onClose();
          }}
          onCreateNew={() => onCreateAndAssign("media-type")}
        />
      )}

      {taxonomy.taxonomyMode === "tags" && bookmarkId && (
        <TagsSubPalette
          flatTags={flatTags}
          categoryId={bookmark?.categoryId ?? undefined}
          pendingTagIds={taxonomy.pendingTagIds}
          onToggleTag={tagId =>
            taxonomy.setPendingTagIds(prev =>
              prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId])}
          onBack={onExitMode}
          onDone={() => {
            updateBookmark.mutate({
              id: bookmarkId,
              input: {
                tagIds: taxonomy.pendingTagIds,
              },
            });
            onClose();
          }}
          onCreateNew={() => onCreateAndAssign("tag")}
        />
      )}

      {taxonomy.taxonomyMode === "locations" && bookmarkId && (
        <LocationsSubPalette
          flatLocations={flatLocations}
          pendingLocationIds={taxonomy.pendingLocationIds}
          onToggleLocation={locationId =>
            taxonomy.setPendingLocationIds(prev =>
              prev.includes(locationId)
                ? prev.filter(id => id !== locationId)
                : [...prev, locationId])}
          onBack={onExitMode}
          onDone={() => {
            updateBookmark.mutate({
              id: bookmarkId,
              input: {
                locationIds: taxonomy.pendingLocationIds,
              },
            });
            onClose();
          }}
          onCreateNew={() => onCreateAndAssign("location")}
        />
      )}

      {taxonomy.taxonomyMode === "people" && bookmarkId && (
        <PeopleSubPalette
          people={people}
          pendingPersonIds={taxonomy.pendingPersonIds}
          onTogglePerson={personId =>
            taxonomy.setPendingPersonIds(prev =>
              prev.includes(personId)
                ? prev.filter(id => id !== personId)
                : [...prev, personId])}
          onBack={onExitMode}
          onDone={() => {
            updateBookmark.mutate({
              id: bookmarkId,
              input: {
                personIds: taxonomy.pendingPersonIds,
              },
            });
            onClose();
          }}
          onCreateNew={() => onCreateAndAssign("person")}
        />
      )}

      {taxonomy.taxonomyMode === "newsletter" && bookmarkId && (
        <NewsletterSubPalette
          newsletters={newsletters}
          currentNewsletterId={bookmark?.newsletter?.id}
          onBack={onExitMode}
          onSelect={(newsletterId) => {
            updateBookmark.mutate({
              id: bookmarkId,
              input: {
                newsletterId,
              },
            });
            onClose();
          }}
          onCreateNew={() => onCreateAndAssign("newsletter")}
        />
      )}

      {taxonomy.taxonomyMode === "choices-property" && bookmarkId && taxonomy.choicesPropertyId && (
        <ChoicesSubPalette
          prop={customProperties.find(p => p.id === taxonomy.choicesPropertyId)}
          pendingValues={taxonomy.pendingChoiceValues}
          onToggleValue={value =>
            taxonomy.setPendingChoiceValues(prev =>
              prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value])}
          onBack={onExitMode}
          onSelectSingle={(value) => {
            const propId = taxonomy.choicesPropertyId ?? "";
            updateBookmark.mutate({
              id: bookmarkId,
              input: {
                choicesValues: [
                  ...(bookmark?.choicesValues.filter(
                    v => v.propertyId !== propId,
                  ) ?? []),
                  {
                    propertyId: propId,
                    values: [value],
                  },
                ],
              },
            });
            onClose();
          }}
          onDoneMultiple={() => {
            const propId = taxonomy.choicesPropertyId ?? "";
            updateBookmark.mutate({
              id: bookmarkId,
              input: {
                choicesValues: [
                  ...(bookmark?.choicesValues.filter(
                    v => v.propertyId !== propId,
                  ) ?? []),
                  {
                    propertyId: propId,
                    values: taxonomy.pendingChoiceValues,
                  },
                ],
              },
            });
            onClose();
          }}
        />
      )}

      {taxonomy.taxonomyMode === "entity-choice" && entityCtx.matched && taxonomy.entityChoiceField && (
        <EntityChoiceSubPalette
          matched={entityCtx.matched}
          field={taxonomy.entityChoiceField}
          choiceOptions={entityCtx.choiceOptions}
          onBack={onExitMode}
          onSelect={(id) => {
            const field = taxonomy.entityChoiceField;
            if (field) {
              entityCtx.matched?.saveField(field.label, {
                [field.key]: id,
              });
            }
            onClose();
          }}
        />
      )}

      {taxonomy.taxonomyMode === "rating-property" && bookmarkId && taxonomy.ratingPropertyId && (
        <RatingSubPalette
          prop={customProperties.find(p => p.id === taxonomy.ratingPropertyId)}
          currentValue={
            bookmark?.numberValues.find(v => v.propertyId === taxonomy.ratingPropertyId)
              ?.value ?? null
          }
          onBack={onExitMode}
          onSelect={(n) => {
            const propId = taxonomy.ratingPropertyId ?? "";
            updateBookmark.mutate({
              id: bookmarkId,
              input: {
                numberValues: [
                  ...(bookmark?.numberValues.filter(
                    v => v.propertyId !== propId,
                  ) ?? []),
                  ...(n !== null
                    ? [{
                      propertyId: propId,
                      value: n,
                    }]
                    : []),
                ],
              },
            });
            onClose();
          }}
        />
      )}
    </>
  );
}
