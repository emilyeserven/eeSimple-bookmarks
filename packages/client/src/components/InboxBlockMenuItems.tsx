import type { ImportItem } from "@eesimple/types";

import { useState } from "react";

import { blacklistPatternsFor } from "@eesimple/types";

import { useBlockImportItem } from "../hooks/useImports";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

/**
 * The three block menu items (URL / domain / page-path) plus the path-prefix dialog.
 * Extracted so `MoreActionsMenu` can embed them in a submenu without nesting dropdowns.
 */
export function BlockMenuItems({
  item,
}: { item: ImportItem }) {
  const block = useBlockImportItem();
  const [pathPrefixDialog, setPathPrefixDialog] = useState<string | null>(null);

  const patterns = item.url ? blacklistPatternsFor(item.url) : null;
  if (!patterns) return null;

  function blockWith(entry: { kind: "exact" | "domain" | "path-prefix";
    value: string; }, message: string) {
    block.mutate({
      itemId: item.id,
      entry,
    }, {
      onSuccess: () => notifySuccess(message),
      onError: () => notifyError("Couldn't block this link"),
    });
  }

  return (
    <>
      <DropdownMenuItem onClick={() => blockWith(patterns.exact, "Blocked this URL")}>
        Block this URL
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => blockWith(patterns.domain, `Blocked ${patterns.domain.value}`)}>
        Block this domain
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={(e) => {
          // Prevent Radix from auto-closing the dropdown before the dialog can take focus.
          e.preventDefault();
          setPathPrefixDialog(patterns.pathPrefix.value);
        }}
      >
        Block this page path
      </DropdownMenuItem>

      <Dialog
        open={pathPrefixDialog !== null}
        onOpenChange={(open) => {
          if (!open) setPathPrefixDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block page path</DialogTitle>
            <DialogDescription>
              Block any URL whose path starts with this prefix (including the host). Shorten
              the path to block a wider set of URLs from the same site.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={pathPrefixDialog ?? ""}
            onChange={e => setPathPrefixDialog(e.target.value)}
            aria-label="Path prefix"
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPathPrefixDialog(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={!pathPrefixDialog || block.isPending}
              onClick={() => {
                if (!pathPrefixDialog) return;
                blockWith({
                  kind: "path-prefix",
                  value: pathPrefixDialog,
                }, "Blocked this page path");
                setPathPrefixDialog(null);
              }}
            >
              Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
