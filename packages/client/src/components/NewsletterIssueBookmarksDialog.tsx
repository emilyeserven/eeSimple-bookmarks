import type { Bookmark } from "@eesimple/types";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { useAddIssueBookmarks, useRemoveIssueBookmarks } from "../hooks/useImports";
import { notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Props {
  importId: string;
  /** Every bookmark, so the user can attach any of them to this issue. */
  allBookmarks: Bookmark[];
  /** Ids of the bookmarks already in this issue. */
  memberIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Manage which bookmarks belong to a newsletter issue. Pre-checks current members; saving diffs the
 * selection and applies the add / remove association mutations.
 */
export function NewsletterIssueBookmarksDialog({
  importId, allBookmarks, memberIds, open, onOpenChange,
}: Props) {
  const {
    t,
  } = useTranslation();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(memberIds));
  const addBookmarks = useAddIssueBookmarks(importId);
  const removeBookmarks = useRemoveIssueBookmarks(importId);
  const busy = addBookmarks.isPending || removeBookmarks.isPending;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allBookmarks;
    return allBookmarks.filter(b =>
      b.title.toLowerCase().includes(q) || (b.url?.toLowerCase() ?? "").includes(q));
  }, [allBookmarks, query]);

  function toggle(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save(): Promise<void> {
    const members = new Set(memberIds);
    const toAdd = [...selected].filter(id => !members.has(id));
    const toRemove = memberIds.filter(id => !selected.has(id));
    if (toAdd.length > 0) await addBookmarks.mutateAsync(toAdd);
    if (toRemove.length > 0) await removeBookmarks.mutateAsync(toRemove);
    notifySuccess(t("Issue bookmarks updated"));
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage issue bookmarks</DialogTitle>
          <DialogDescription>
            Check the bookmarks that belong to this issue. Approved import items are already attached.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search bookmarks…"
        />

        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {filtered.map(bookmark => (
            <li key={bookmark.id}>
              <label
                className="
                  flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm
                  hover:bg-muted
                "
              >
                <Checkbox
                  checked={selected.has(bookmark.id)}
                  onCheckedChange={() => toggle(bookmark.id)}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="block font-medium wrap-break-word">{bookmark.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{bookmark.url}</span>
                </span>
              </label>
            </li>
          ))}
          {filtered.length === 0
            ? <li className="p-2 text-sm text-muted-foreground">No bookmarks match.</li>
            : null}
        </ul>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void save()}
            disabled={busy}
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
