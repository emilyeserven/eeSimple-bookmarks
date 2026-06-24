import type { ComboboxOption } from "../Combobox";
import type { CustomProperty, UpdateBookmarkInput } from "@eesimple/types";

import { useState } from "react";

import {
  useBulkBookmarkTags,
  useBulkDeleteBookmarks,
  useBulkUpdateBookmarks,
} from "../../hooks/useBookmarks";
import { useCategories } from "../../hooks/useCategories";
import { useMediaTypes } from "../../hooks/useMediaTypes";
import { useTagTree } from "../../hooks/useTags";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryIcon } from "@/lib/icons";

/** Property types whose value is a single scalar we can set in bulk (number, boolean, date). */
const BULK_SETTABLE_TYPES = new Set<CustomProperty["type"]>([
  "number",
  "ratingScale",
  "boolean",
  "datetime",
]);

interface BulkActionProps {
  ids: string[];
  /** Called after a bulk action succeeds, so the caller can clear the selection. */
  onDone: () => void;
}

/** Confirm-then-delete the selected bookmarks. */
function BulkDeleteButton({
  ids, onDone,
}: BulkActionProps) {
  const [open, setOpen] = useState(false);
  const bulkDelete = useBulkDeleteBookmarks();
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
        >
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete
            {" "}
            {ids.length}
            {" "}
            {ids.length === 1 ? "bookmark" : "bookmarks"}
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
  /** Build the patch from the chosen option id. */
  toPatch: (value: string) => UpdateBookmarkInput;
}

/** A dialog that picks one option and applies it to every selected bookmark. */
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
  const bulkUpdate = useBulkUpdateBookmarks();
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
        >
          {triggerLabel}
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
            {ids.length === 1 ? "bookmark" : "bookmarks"}
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

/** Add or remove a set of tags across the selected bookmarks. */
function BulkTagsButton({
  ids, onDone,
}: BulkActionProps) {
  const [open, setOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const {
    data: tagTree = [],
  } = useTagTree();
  const bulkTags = useBulkBookmarkTags();

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
        >
          Tags
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add or remove tags</DialogTitle>
          <DialogDescription>
            Choose tags, then add or remove them across
            {" "}
            {ids.length}
            {" "}
            selected
            {" "}
            {ids.length === 1 ? "bookmark" : "bookmarks"}
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

/** Build the value patch for a single custom property from the raw input string. */
function propertyValuePatch(property: CustomProperty, raw: string): UpdateBookmarkInput | null {
  if (property.type === "boolean") {
    return {
      booleanValues: [{
        propertyId: property.id,
        value: raw === "true",
      }],
    };
  }
  if (property.type === "datetime") {
    if (raw === "") return null;
    return {
      dateTimeValues: [{
        propertyId: property.id,
        value: new Date(raw).toISOString(),
      }],
    };
  }
  // number / ratingScale
  if (raw === "" || Number.isNaN(Number(raw))) return null;
  return {
    numberValues: [{
      propertyId: property.id,
      value: Number(raw),
    }],
  };
}

/** Set one custom-property value across the selected bookmarks (merged with their existing values). */
function BulkSetPropertyButton({
  ids,
  properties,
  onDone,
}: BulkActionProps & { properties: CustomProperty[] }) {
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);
  const [raw, setRaw] = useState("");
  const bulkUpdate = useBulkUpdateBookmarks();

  const settable = properties.filter(property => BULK_SETTABLE_TYPES.has(property.type));
  const property = settable.find(p => p.id === propertyId);
  if (settable.length === 0) return null;

  function apply() {
    if (!property) return;
    const patch = propertyValuePatch(property, raw);
    if (!patch) return;
    bulkUpdate.mutate({
      ids,
      patch,
    }, {
      onSuccess: () => {
        setOpen(false);
        setPropertyId(undefined);
        setRaw("");
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
        >
          Set property
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set a property value</DialogTitle>
          <DialogDescription>
            Sets one property on
            {" "}
            {ids.length}
            {" "}
            selected
            {" "}
            {ids.length === 1 ? "bookmark" : "bookmarks"}
            , keeping their other values.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Combobox
            options={settable.map(p => ({
              value: p.id,
              label: p.name,
            }))}
            value={propertyId}
            onValueChange={(next) => {
              setPropertyId(next);
              setRaw("");
            }}
            placeholder="Select a property"
          />
          {property
            ? (
              <div className="space-y-1">
                <Label>{property.name}</Label>
                <PropertyValueInput
                  property={property}
                  value={raw}
                  onChange={setRaw}
                />
              </div>
            )
            : null}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={!property || bulkUpdate.isPending}
            onClick={apply}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The value input for a settable property — a Yes/No combobox, a date, or a number. */
function PropertyValueInput({
  property,
  value,
  onChange,
}: {
  property: CustomProperty;
  value: string;
  onChange: (value: string) => void;
}) {
  if (property.type === "boolean") {
    return (
      <Combobox
        options={[
          {
            value: "true",
            label: "Yes",
          },
          {
            value: "false",
            label: "No",
          },
        ]}
        value={value || undefined}
        onValueChange={next => onChange(next ?? "")}
        placeholder="Select a value"
      />
    );
  }
  if (property.type === "datetime") {
    return (
      <Input
        type="datetime-local"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    );
  }
  return (
    <Input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Enter a number"
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
      <BulkSetPropertyButton
        ids={selectedIds}
        properties={properties}
        onDone={onDone}
      />
      <BulkDeleteButton
        ids={selectedIds}
        onDone={onDone}
      />
    </>
  );
}
