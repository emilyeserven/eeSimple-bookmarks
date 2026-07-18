import type { ComboboxOption } from "../Combobox";
import type { UpdateWebsiteInput } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { BulkComboboxDialog, BulkConfirmDeleteDialog, BulkTagsDialog } from "./BulkActionDialogs";
import { useCategories } from "../../hooks/useCategories";
import { useMediaTypes } from "../../hooks/useMediaTypes";
import {
  useBulkDeleteWebsites,
  useBulkUpdateWebsites,
  useBulkWebsiteTags,
} from "../../hooks/useWebsites";

import { sortFavoritesFirst } from "@/lib/favoritesOrder";
import { CategoryIcon } from "@/lib/icons";

interface SetComboboxDialogProps {
  ids: string[];
  onDone: () => void;
  triggerLabel: string;
  title: string;
  options: ComboboxOption[];
  placeholder: string;
  toPatch: (value: string) => UpdateWebsiteInput;
}

function SetComboboxDialog({
  ids, onDone, triggerLabel, title, options, placeholder, toPatch,
}: SetComboboxDialogProps) {
  const bulkUpdate = useBulkUpdateWebsites();
  return (
    <BulkComboboxDialog
      ids={ids}
      onDone={onDone}
      triggerLabel={triggerLabel}
      title={title}
      options={options}
      placeholder={placeholder}
      noun="website"
      isPending={bulkUpdate.isPending}
      onApply={(value, cb) => bulkUpdate.mutate({
        ids,
        patch: toPatch(value),
      }, cb)}
    />
  );
}

interface WebsiteBulkActionsProps {
  selectedIds: string[];
  onDone: () => void;
}

/** The bulk-action controls for the Websites listing, rendered inside the {@link BulkActionBar}. */
export function WebsiteBulkActions({
  selectedIds, onDone,
}: WebsiteBulkActionsProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: mediaTypes = [],
  } = useMediaTypes();
  const bulkTags = useBulkWebsiteTags();
  const bulkDelete = useBulkDeleteWebsites();

  return (
    <>
      <SetComboboxDialog
        ids={selectedIds}
        onDone={onDone}
        triggerLabel={t("Set category")}
        title={t("Set category")}
        placeholder={t("Select a category")}
        options={sortFavoritesFirst(categories).map(category => ({
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
      <BulkTagsDialog
        ids={selectedIds}
        onDone={onDone}
        noun="website"
        title={t("Add or remove default tags")}
        isPending={bulkTags.isPending}
        onApply={(tagIds, op, cb) => bulkTags.mutate({
          ids: selectedIds,
          tagIds,
          op,
        }, cb)}
      />
      <BulkConfirmDeleteDialog
        ids={selectedIds}
        onDone={onDone}
        noun="website"
        isPending={bulkDelete.isPending}
        onDelete={cb => bulkDelete.mutate(selectedIds, cb)}
      />
    </>
  );
}
