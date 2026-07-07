import type { CreateKind } from "./commandPaletteModals";
import type { BookmarkTaxonomyContext } from "./useBookmarkTaxonomyContext";
import type { CommandPaletteTaxonomyState } from "./useCommandPaletteState";
import type { useEntityCommandContext } from "./useEntityCommandContext";

import {
  PeopleSubPalette,
  CategorySubPalette,
  ChoicesSubPalette,
  GroupsSubPalette,
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

function CategoryMode({
  taxonomy, taxonomyContext, onExitMode, onClose, onCreateAndAssign,
}: CommandPaletteTaxonomyModesProps) {
  const {
    bookmarkId, bookmark, categories, updateBookmark,
  } = taxonomyContext;
  if (taxonomy.taxonomyMode !== "category" || !bookmarkId) return null;
  return (
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
  );
}

function MediaTypeMode({
  taxonomy, taxonomyContext, onExitMode, onClose, onCreateAndAssign,
}: CommandPaletteTaxonomyModesProps) {
  const {
    bookmarkId, bookmark, flatMediaTypes, updateBookmark,
  } = taxonomyContext;
  if (taxonomy.taxonomyMode !== "media-type" || !bookmarkId) return null;
  return (
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
  );
}

function TagsMode({
  taxonomy, taxonomyContext, onExitMode, onClose, onCreateAndAssign,
}: CommandPaletteTaxonomyModesProps) {
  const {
    bookmarkId, flatTags, updateBookmark,
  } = taxonomyContext;
  if (taxonomy.taxonomyMode !== "tags" || !bookmarkId) return null;
  return (
    <TagsSubPalette
      flatTags={flatTags}
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
  );
}

function LocationsMode({
  taxonomy, taxonomyContext, onExitMode, onClose, onCreateAndAssign,
}: CommandPaletteTaxonomyModesProps) {
  const {
    bookmarkId, flatLocations, updateBookmark,
  } = taxonomyContext;
  if (taxonomy.taxonomyMode !== "locations" || !bookmarkId) return null;
  return (
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
  );
}

function PeopleMode({
  taxonomy, taxonomyContext, onExitMode, onClose, onCreateAndAssign,
}: CommandPaletteTaxonomyModesProps) {
  const {
    bookmarkId, people, updateBookmark,
  } = taxonomyContext;
  if (taxonomy.taxonomyMode !== "people" || !bookmarkId) return null;
  return (
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
  );
}

function GroupsMode({
  taxonomy, taxonomyContext, onExitMode, onClose, onCreateAndAssign,
}: CommandPaletteTaxonomyModesProps) {
  const {
    bookmarkId, groups, updateBookmark,
  } = taxonomyContext;
  if (taxonomy.taxonomyMode !== "groups" || !bookmarkId) return null;
  return (
    <GroupsSubPalette
      groups={groups}
      pendingGroupIds={taxonomy.pendingGroupIds}
      onToggleGroup={groupId =>
        taxonomy.setPendingGroupIds(prev =>
          prev.includes(groupId)
            ? prev.filter(id => id !== groupId)
            : [...prev, groupId])}
      onBack={onExitMode}
      onDone={() => {
        updateBookmark.mutate({
          id: bookmarkId,
          input: {
            groupIds: taxonomy.pendingGroupIds,
          },
        });
        onClose();
      }}
      onCreateNew={() => onCreateAndAssign("group")}
    />
  );
}

function NewsletterMode({
  taxonomy, taxonomyContext, onExitMode, onClose, onCreateAndAssign,
}: CommandPaletteTaxonomyModesProps) {
  const {
    bookmarkId, bookmark, newsletters, updateBookmark,
  } = taxonomyContext;
  if (taxonomy.taxonomyMode !== "newsletter" || !bookmarkId) return null;
  return (
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
  );
}

function ChoicesPropertyMode({
  taxonomy, taxonomyContext, onExitMode, onClose,
}: CommandPaletteTaxonomyModesProps) {
  const {
    bookmarkId, bookmark, customProperties, updateBookmark,
  } = taxonomyContext;
  if (taxonomy.taxonomyMode !== "choices-property" || !bookmarkId || !taxonomy.choicesPropertyId) {
    return null;
  }
  return (
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
  );
}

function EntityChoiceMode({
  taxonomy, entityCtx, onExitMode, onClose,
}: CommandPaletteTaxonomyModesProps) {
  if (taxonomy.taxonomyMode !== "entity-choice" || !entityCtx.matched || !taxonomy.entityChoiceField) {
    return null;
  }
  return (
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
  );
}

function RatingPropertyMode({
  taxonomy, taxonomyContext, onExitMode, onClose,
}: CommandPaletteTaxonomyModesProps) {
  const {
    bookmarkId, bookmark, customProperties, updateBookmark,
  } = taxonomyContext;
  if (taxonomy.taxonomyMode !== "rating-property" || !bookmarkId || !taxonomy.ratingPropertyId) {
    return null;
  }
  return (
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
  );
}

/**
 * The active sub-palette when the palette has drilled into a taxonomy mode (category / media type /
 * tags / locations / people / newsletter / choices / rating / entity-choice). Renders nothing in
 * the default view — the caller switches on `taxonomy.taxonomyMode === null` for that. Each mode is
 * its own component (scored independently by fallow) so the guard chain doesn't accumulate onto this
 * coordinator.
 */
export function CommandPaletteTaxonomyModes(props: CommandPaletteTaxonomyModesProps) {
  return (
    <>
      <CategoryMode {...props} />
      <MediaTypeMode {...props} />
      <TagsMode {...props} />
      <LocationsMode {...props} />
      <PeopleMode {...props} />
      <GroupsMode {...props} />
      <NewsletterMode {...props} />
      <ChoicesPropertyMode {...props} />
      <EntityChoiceMode {...props} />
      <RatingPropertyMode {...props} />
    </>
  );
}
