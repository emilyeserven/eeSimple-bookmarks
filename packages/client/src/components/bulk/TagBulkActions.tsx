import { useState } from "react";

import { useTranslation } from "react-i18next";

import { TaxonomyBulkActions } from "./TaxonomyBulkActions";
import { useBulkDeleteTags, useBulkReparentTags, useTagTree } from "../../hooks/useTags";
import { selectedSubtrees, subtreeIds, tagNodesToOptions } from "../../lib/tagTree";
import { TreeCombobox } from "../TreeCombobox";

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

interface TagBulkActionsProps {
  selectedIds: string[];
  /** Called after a successful action so the caller can clear its selection. */
  onDone: () => void;
}

/**
 * The Tags listing's bulk actions (inside the shared `BulkActionBar` chrome): "Move to parent…" —
 * reparent every selected tag under a picked tag (or top level) in one batch — plus the standard
 * delete. The parent picker excludes the selected tags and their descendants (a guaranteed cycle);
 * the server's per-item cycle guard still backstops anything the exclusion can't see.
 */
export function TagBulkActions({
  selectedIds, onDone,
}: TagBulkActionsProps) {
  const {
    t,
  } = useTranslation();
  const [moveOpen, setMoveOpen] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const {
    data: tree = [],
  } = useTagTree();
  const reparent = useBulkReparentTags();
  const bulkDelete = useBulkDeleteTags();

  const forbiddenIds = new Set(
    selectedSubtrees(tree, new Set(selectedIds)).flatMap(subtreeIds),
  );
  const parentOptions = tagNodesToOptions(tree, forbiddenIds);

  return (
    <>
      <Dialog
        open={moveOpen}
        onOpenChange={(open) => {
          setMoveOpen(open);
          if (!open) setParentId(null);
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            {t("Move to parent…")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("Move {{count}} tags to a new parent", {
                count: selectedIds.length,
              })}
            </DialogTitle>
            <DialogDescription>
              {t("The selected tags (and their sub-tags) move under the chosen parent. Pick \"(top level)\" to make them root tags.")}
            </DialogDescription>
          </DialogHeader>
          <TreeCombobox
            aria-label={t("New parent")}
            options={parentOptions}
            value={parentId ?? undefined}
            placeholder={t("Choose a parent")}
            searchPlaceholder={t("Search tags…")}
            emptyText={t("No tags found.")}
            leadingOption={{
              value: "",
              label: t("(top level)"),
            }}
            onValueChange={value => setParentId(value || null)}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("Cancel")}</Button>
            </DialogClose>
            <Button
              disabled={reparent.isPending}
              onClick={() => reparent.mutate({
                ids: selectedIds,
                parentId,
              }, {
                onSuccess: () => {
                  setMoveOpen(false);
                  setParentId(null);
                  onDone();
                },
              })}
            >
              {t("Move")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaxonomyBulkActions
        ids={selectedIds}
        bulkDelete={bulkDelete}
        noun={[t("tag"), t("tags")]}
        onDone={onDone}
      />
    </>
  );
}
