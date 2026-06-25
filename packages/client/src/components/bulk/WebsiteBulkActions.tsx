import type { ComboboxOption } from "../Combobox";
import type { UpdateWebsiteInput } from "@eesimple/types";

import { useState } from "react";

import { useCategories } from "../../hooks/useCategories";
import { useMediaTypes } from "../../hooks/useMediaTypes";
import { useTagTree } from "../../hooks/useTags";
import {
  useBulkDeleteWebsites,
  useBulkUpdateWebsites,
  useBulkWebsiteTags,
} from "../../hooks/useWebsites";
import { Combobox } from "../Combobox";
import { TagPickerWithCreate } from "../TagPickerWithCreate";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CategoryIcon } from "@/lib/icons";

interface BulkActionProps {
  ids: string[];
  onDone: () => void;
}

function BulkDeleteButton({
  ids, onDone,
}: BulkActionProps) {
  const [open, setOpen] = useState(false);
  const bulkDelete = useBulkDeleteWebsites();
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
        >Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete
            {" "}
            {ids.length}
            {" "}
            {ids.length === 1 ? "website" : "websites"}
            ?
          </DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={bulkDelete.isPending}
            onClick={() => bulkDelete.mutate(ids, {
              onSuccess: () => {
                setOpen(false);
                onDone();
              },
            })}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SetComboboxDialogProps extends BulkActionProps {
  triggerLabel: string;
  title: string;
  options: ComboboxOption[];
  placeholder: string;
  toPatch: (value: string) => UpdateWebsiteInput;
}

function SetComboboxDialog({
  ids,
  onDone,
  triggerLabel,
  title,
  options,
  placeholder,
  toPatch,
}: SetComboboxDialogProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | undefined>(undefined);
  const bulkUpdate = useBulkUpdateWebsites();
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
        >{triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Applies to
            {" "}
            {ids.length}
            {" "}
            selected
            {" "}
            {ids.length === 1 ? "website" : "websites"}
            .
          </DialogDescription>
        </DialogHeader>
        <Combobox
          options={options}
          value={value}
          onValueChange={setValue}
          placeholder={placeholder}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={value === undefined || bulkUpdate.isPending}
            onClick={() => {
              if (value === undefined) return;
              bulkUpdate.mutate({
                ids,
                patch: toPatch(value),
              }, {
                onSuccess: () => {
                  setOpen(false);
                  setValue(undefined);
                  onDone();
                },
              });
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkTagsButton({
  ids, onDone,
}: BulkActionProps) {
  const [open, setOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const {
    data: tagTree = [],
  } = useTagTree();
  const bulkTags = useBulkWebsiteTags();

  function apply(op: "add" | "remove") {
    if (selectedTagIds.length === 0) return;
    bulkTags.mutate({
      ids,
      tagIds: selectedTagIds,
      op,
    }, {
      onSuccess: () => {
        setOpen(false);
        setSelectedTagIds([]);
        onDone();
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
        >Default tags
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add or remove default tags</DialogTitle>
          <DialogDescription>
            Choose tags, then add or remove them as defaults across
            {" "}
            {ids.length}
            {" "}
            selected
            {" "}
            {ids.length === 1 ? "website" : "websites"}
            .
          </DialogDescription>
        </DialogHeader>
        <TagPickerWithCreate
          tree={tagTree}
          selectedIds={selectedTagIds}
          onToggle={id => setSelectedTagIds(current =>
            current.includes(id) ? current.filter(x => x !== id) : [...current, id])}
        />
        <DialogFooter>
          <Button
            variant="outline"
            disabled={selectedTagIds.length === 0 || bulkTags.isPending}
            onClick={() => apply("remove")}
          >
            Remove
          </Button>
          <Button
            disabled={selectedTagIds.length === 0 || bulkTags.isPending}
            onClick={() => apply("add")}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    data: categories = [],
  } = useCategories();
  const {
    data: mediaTypes = [],
  } = useMediaTypes();

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
      <BulkTagsButton
        ids={selectedIds}
        onDone={onDone}
      />
      <BulkDeleteButton
        ids={selectedIds}
        onDone={onDone}
      />
    </>
  );
}
