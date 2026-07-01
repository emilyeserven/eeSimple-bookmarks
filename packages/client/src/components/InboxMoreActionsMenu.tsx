import type { ImportItem } from "@eesimple/types";

import { useState } from "react";

import { Ban, FolderInput, MoreHorizontal, RefreshCw, Scissors } from "lucide-react";

import { BlockMenuItems } from "./InboxBlockMenuItems";
import { MarkAsShortenerDialog } from "./MarkAsShortenerDialog";
import {
  useIngestUrl,
  useRecheckImportItemUrl,
} from "../hooks/useImports";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Re-exported so existing importers keep their import site stable.

type ShortenerMode = "ignore-list" | "website";

/**
 * The two shortener menu items (ignore list / associate with website). Extracted so
 * `MoreActionsMenu` can embed them in a submenu without nesting dropdowns.
 */
export function ShortenerMenuItems({
  item,
  onSelect,
}: {
  item: ImportItem;
  onSelect: (mode: ShortenerMode) => void;
}) {
  if (!item.url) return null;
  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          onSelect("ignore-list");
        }}
      >
        Add to shortener ignore list
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          onSelect("website");
        }}
      >
        Associate with website
      </DropdownMenuItem>
    </>
  );
}

/**
 * The single "More" (kebab) dropdown that collects the secondary row actions — Block URL and
 * Mark as link shortener (each a submenu over the embeddable `*MenuItems` fragments), plus Recheck
 * link URL and Import links from this URL — so they don't crowd the inline action bar.
 *
 * The shortener dialog is kept as a sibling of the `DropdownMenu` (not inside its content) so it
 * survives the menu closing; `BlockMenuItems` carries its own path-prefix dialog, which already runs
 * inside a dropdown today.
 */
export function MoreActionsMenu({
  item,
}: { item: ImportItem }) {
  const recheck = useRecheckImportItemUrl();
  const ingest = useIngestUrl();
  const [shortenerMode, setShortenerMode] = useState<ShortenerMode | null>(null);
  const url = item.url;

  return (
    <>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="More actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent align="end">
            {url
              ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Ban className="size-4 text-muted-foreground" />
                    Block URL
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <BlockMenuItems item={item} />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )
              : null}
            {url
              ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Scissors className="size-4 text-muted-foreground" />
                    Mark as link shortener
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <ShortenerMenuItems
                      item={item}
                      onSelect={m => setShortenerMode(m)}
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )
              : null}
            <DropdownMenuItem
              disabled={recheck.isPending}
              onClick={() =>
                recheck.mutate(item.id, {
                  onSuccess: ({
                    updated,
                  }) =>
                    updated ? notifySuccess("Link resolved") : notifySuccess("No change"),
                  onError: () => notifyError("Couldn't recheck this link"),
                })}
            >
              <RefreshCw className="size-4 text-muted-foreground" />
              Recheck link URL
            </DropdownMenuItem>
            {url
              ? (
                <DropdownMenuItem
                  disabled={ingest.isPending}
                  onClick={() =>
                    ingest.mutate({
                      url,
                    }, {
                      onSuccess: () => notifySuccess("Queued as new import group"),
                      onError: () => notifyError("Couldn't queue this URL for import"),
                    })}
                >
                  <FolderInput className="size-4 text-muted-foreground" />
                  Import links from this URL
                </DropdownMenuItem>
              )
              : null}
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>More actions</TooltipContent>
      </Tooltip>

      {shortenerMode !== null && (
        <MarkAsShortenerDialog
          item={item}
          open
          initialMode={shortenerMode}
          onClose={() => setShortenerMode(null)}
        />
      )}
    </>
  );
}
