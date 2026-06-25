import type { ComboboxOption } from "../Combobox";

import { useState } from "react";

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

interface ApplyCallbacks {
  onSuccess: () => void;
}

interface BulkComboboxDialogProps {
  /** Count of selected items — used in the description. */
  ids: string[];
  onDone: () => void;
  triggerLabel: string;
  title: string;
  options: ComboboxOption[];
  placeholder: string;
  /** Singular noun for selected items, e.g. "bookmark" or "website". */
  noun: string;
  isPending: boolean;
  onApply: (value: string, cb: ApplyCallbacks) => void;
}

/** Generic pick-one-and-apply dialog — shared by Bookmark and Website bulk actions. */
export function BulkComboboxDialog({
  ids,
  onDone,
  triggerLabel,
  title,
  options,
  placeholder,
  noun,
  isPending,
  onApply,
}: BulkComboboxDialogProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | undefined>(undefined);
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
            {ids.length === 1 ? noun : `${noun}s`}
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
            disabled={value === undefined || isPending}
            onClick={() => {
              if (value === undefined) return;
              onApply(value, {
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

interface BulkTagsDialogProps {
  ids: string[];
  onDone: () => void;
  /** Singular noun for selected items, e.g. "bookmark" or "website". */
  noun: string;
  /** Dialog title, e.g. "Add or remove tags" or "Add or remove default tags". */
  title: string;
  isPending: boolean;
  onApply: (tagIds: string[], op: "add" | "remove", cb: ApplyCallbacks) => void;
}

/** Generic add/remove tags dialog — shared by Bookmark and Website bulk actions. */
export function BulkTagsDialog({
  ids,
  onDone,
  noun,
  title,
  isPending,
  onApply,
}: BulkTagsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const {
    data: tagTree = [],
  } = useTagTree();

  function apply(op: "add" | "remove") {
    if (selectedTagIds.length === 0) return;
    onApply(selectedTagIds, op, {
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
        >Tags
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Choose tags, then add or remove them across
            {" "}
            {ids.length}
            {" "}
            selected
            {" "}
            {ids.length === 1 ? noun : `${noun}s`}
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
            disabled={selectedTagIds.length === 0 || isPending}
            onClick={() => apply("remove")}
          >
            Remove
          </Button>
          <Button
            disabled={selectedTagIds.length === 0 || isPending}
            onClick={() => apply("add")}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BulkConfirmDeleteDialogProps {
  ids: string[];
  onDone: () => void;
  /** Singular noun for selected items, e.g. "bookmark" or "website". */
  noun: string;
  isPending: boolean;
  onDelete: (cb: ApplyCallbacks) => void;
}

/** Generic confirm-then-delete dialog — shared by Bookmark and Website bulk actions. */
export function BulkConfirmDeleteDialog({
  ids,
  onDone,
  noun,
  isPending,
  onDelete,
}: BulkConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false);
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
            {ids.length === 1 ? noun : `${noun}s`}
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
            disabled={isPending}
            onClick={() => onDelete({
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
