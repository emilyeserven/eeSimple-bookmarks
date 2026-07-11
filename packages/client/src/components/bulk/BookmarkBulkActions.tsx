import type { ComboboxOption } from "../Combobox";
import type { CustomProperty, UpdateBookmarkInput } from "@eesimple/types";

import { ShoppingBasket } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  useBulkBookmarkTags,
  useBulkDeleteBookmarks,
  useBulkUpdateBookmarks,
} from "../../hooks/useBookmarks";
import { useCategories } from "../../hooks/useCategories";
import { useMediaTypes } from "../../hooks/useMediaTypes";
import { useBasketStore } from "../../stores/basketStore";
import { CONTENT_STATUS_SLUG } from "../bookmarkFormSchema";
import {
  BulkComboboxDialog,
  BulkConfirmDeleteDialog,
  BulkTagsDialog,
} from "./BulkActionDialogs";
import { BulkSetPropertyButton } from "./BulkSetPropertyButton";

import { Button } from "@/components/ui/button";
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
  properties: CustomProperty[];
  onDone: () => void;
}

/** The bulk-action controls for the Bookmarks page, rendered inside the {@link BulkActionBar}. */
export function BookmarkBulkActions({
  selectedIds,
  properties,
  onDone,
}: BookmarkBulkActionsProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: mediaTypes = [],
  } = useMediaTypes();
  const bulkTags = useBulkBookmarkTags();
  const bulkDelete = useBulkDeleteBookmarks();
  const addManyToBasket = useBasketStore(s => s.addMany);
  const contentStatusProperty = properties.find(p => p.slug === CONTENT_STATUS_SLUG);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          addManyToBasket(selectedIds);
          onDone();
        }}
      >
        <ShoppingBasket className="size-4" />
        {t("Add to Basket")}
      </Button>
      <SetComboboxDialog
        ids={selectedIds}
        onDone={onDone}
        triggerLabel={t("Set category")}
        title={t("Set category")}
        placeholder={t("Select a category")}
        options={categories.map(category => ({
          value: category.id,
          label: category.name,
          names: category.names,
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
        triggerLabel={t("Set media type")}
        title={t("Set media type")}
        placeholder={t("Select a media type")}
        options={mediaTypes.filter(mediaType => !mediaType.hidden).map(mediaType => ({
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
          triggerLabel={t("Set reading status")}
          title={t("Set reading status")}
          placeholder={t("Select a status")}
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
        title={t("Add or remove tags")}
        isPending={bulkTags.isPending}
        onApply={(tagIds, op, cb) => bulkTags.mutate({
          ids: selectedIds,
          tagIds,
          op,
        }, cb)}
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
