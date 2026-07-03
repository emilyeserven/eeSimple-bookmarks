import type { ComboboxOption } from "../Combobox";
import type { Bookmark, CustomProperty, UpdateBookmarkInput } from "@eesimple/types";

import {
  useBulkBookmarkTags,
  useBulkDeleteBookmarks,
  useBulkUpdateBookmarks,
} from "../../hooks/useBookmarks";
import { useCategories, useCategoryAvailableTags } from "../../hooks/useCategories";
import { useMediaTypes } from "../../hooks/useMediaTypes";
import { CONTENT_STATUS_SLUG } from "../bookmarkFormSchema";
import {
  BulkComboboxDialog,
  BulkConfirmDeleteDialog,
  BulkTagsDialog,
} from "./BulkActionDialogs";
import { BulkSetPropertyButton } from "./BulkSetPropertyButton";

import { CategoryIcon } from "@/lib/icons";

interface BulkActionProps {
  ids: string[];
  /** Called after a bulk action succeeds, so the caller can clear the selection. */
  onDone: () => void;
}

interface SetComboboxDialogProps extends BulkActionProps {
  triggerLabel: string;
  title: string;
  options: ComboboxOption[];
  placeholder: string;
  /** Build the patch from the chosen option id. */
  toPatch: (value: string) => UpdateBookmarkInput;
}

function SetComboboxDialog({
  ids, onDone, triggerLabel, title, options, placeholder, toPatch,
}: SetComboboxDialogProps) {
  const bulkUpdate = useBulkUpdateBookmarks();
  return (
    <BulkComboboxDialog
      ids={ids}
      onDone={onDone}
      triggerLabel={triggerLabel}
      title={title}
      options={options}
      placeholder={placeholder}
      noun="bookmark"
      isPending={bulkUpdate.isPending}
      onApply={(value, cb) => bulkUpdate.mutate({
        ids,
        patch: toPatch(value),
      }, cb)}
    />
  );
}

interface BookmarkBulkActionsProps {
  selectedIds: string[];
  /** The full selected bookmarks — used to gate the tags dialog to a shared category, if any. */
  selectedBookmarks: Bookmark[];
  properties: CustomProperty[];
  onDone: () => void;
}

/** The bulk-action controls for the Bookmarks page, rendered inside the {@link BulkActionBar}. */
export function BookmarkBulkActions({
  selectedIds,
  selectedBookmarks,
  properties,
  onDone,
}: BookmarkBulkActionsProps) {
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: mediaTypes = [],
  } = useMediaTypes();
  const bulkTags = useBulkBookmarkTags();
  const bulkDelete = useBulkDeleteBookmarks();
  const contentStatusProperty = properties.find(p => p.slug === CONTENT_STATUS_SLUG);

  // Only gate the bulk tags picker when every selected bookmark shares one category — a mixed
  // selection falls back to showing every tag.
  const selectedCategoryIds = new Set(selectedBookmarks.map(b => b.categoryId));
  const sharedCategoryId = selectedCategoryIds.size === 1 ? [...selectedCategoryIds][0] : undefined;
  const {
    data: sharedCategoryAvailableTags,
  } = useCategoryAvailableTags(sharedCategoryId ?? "");

  return (
    <>
      <SetComboboxDialog
        ids={selectedIds}
        onDone={onDone}
        triggerLabel="Set category"
        title="Set category"
        placeholder="Select a category"
        options={categories.map(category => ({
          value: category.id,
          label: category.name,
          icon: (
            <CategoryIcon
              name={category.icon}
              className="size-4 shrink-0"
            />
          ),
        }))}
        toPatch={value => ({
          categoryId: value,
        })}
      />
      <SetComboboxDialog
        ids={selectedIds}
        onDone={onDone}
        triggerLabel="Set media type"
        title="Set media type"
        placeholder="Select a media type"
        options={mediaTypes.map(mediaType => ({
          value: mediaType.id,
          label: mediaType.name,
        }))}
        toPatch={value => ({
          mediaTypeId: value,
        })}
      />
      {contentStatusProperty && (
        <SetComboboxDialog
          ids={selectedIds}
          onDone={onDone}
          triggerLabel="Set reading status"
          title="Set reading status"
          placeholder="Select a status"
          options={contentStatusProperty.choicesItems.map(item => ({
            value: item.value,
            label: item.label,
          }))}
          toPatch={value => ({
            choicesValues: [{
              propertyId: contentStatusProperty.id,
              values: [value],
            }],
          })}
        />
      )}
      <BulkTagsDialog
        ids={selectedIds}
        onDone={onDone}
        noun="bookmark"
        title="Add or remove tags"
        isPending={bulkTags.isPending}
        onApply={(tagIds, op, cb) => bulkTags.mutate({
          ids: selectedIds,
          tagIds,
          op,
        }, cb)}
        availableRootTagIds={sharedCategoryId ? sharedCategoryAvailableTags : undefined}
      />
      <BulkSetPropertyButton
        ids={selectedIds}
        properties={properties}
        onDone={onDone}
      />
      <BulkConfirmDeleteDialog
        ids={selectedIds}
        onDone={onDone}
        noun="bookmark"
        isPending={bulkDelete.isPending}
        onDelete={cb => bulkDelete.mutate(selectedIds, cb)}
      />
    </>
  );
}
