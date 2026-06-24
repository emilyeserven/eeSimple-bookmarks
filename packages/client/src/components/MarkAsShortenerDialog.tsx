import type { ImportItem } from "@eesimple/types";

import { useState } from "react";

import { blacklistPatternsFor } from "@eesimple/types";

import { Combobox } from "./Combobox";
import {
  useShortenerIgnoreList,
  useUpdateShortenerIgnoreList,
} from "../hooks/useAppSettings";
import { useUpdateWebsite, useWebsites } from "../hooks/useWebsites";
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

type Mode = "ignore-list" | "website";

interface Props {
  item: ImportItem;
  open: boolean;
  onClose: () => void;
  /** Pre-select the active tab when the dialog opens. */
  initialMode?: Mode;
}

function extractDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    return blacklistPatternsFor(url).domain.value;
  }
  catch {
    return null;
  }
}

/**
 * Dialog for flagging the domain of an inbox item as a link shortener — either by adding it to the
 * generic shortener ignore list or by associating it with a specific website's shortened-link list.
 */
export function MarkAsShortenerDialog({
  item, open, onClose, initialMode = "ignore-list",
}: Props) {
  const domain = extractDomain(item.url);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | undefined>(undefined);

  const {
    data: ignoreList = [], isLoading: loadingList,
  } = useShortenerIgnoreList();
  const {
    data: websites = [], isLoading: loadingWebsites,
  } = useWebsites();
  const updateIgnoreList = useUpdateShortenerIgnoreList();
  const updateWebsite = useUpdateWebsite();

  const isPending = updateIgnoreList.isPending || updateWebsite.isPending;
  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId);

  const alreadyInList = domain !== null && ignoreList.includes(domain);
  const alreadyOnWebsite = domain !== null
    && selectedWebsite !== undefined
    && selectedWebsite.shortenedLinks.some(sl => sl.domain === domain);

  const websiteOptions = websites.map(w => ({
    value: w.id,
    label: w.siteName || w.domain,
  }));

  function confirm(): void {
    if (!domain) return;

    if (mode === "ignore-list") {
      if (alreadyInList) {
        onClose();
        return;
      }
      updateIgnoreList.mutate([...ignoreList, domain], {
        onSuccess: () => {
          notifySuccess(`Added ${domain} to shortener ignore list`);
          onClose();
        },
        onError: () => notifyError("Couldn't update the shortener ignore list"),
      });
    }
    else {
      if (!selectedWebsite) return;
      if (alreadyOnWebsite) {
        onClose();
        return;
      }
      updateWebsite.mutate({
        id: selectedWebsite.id,
        input: {
          shortenedLinks: [
            ...selectedWebsite.shortenedLinks,
            {
              domain,
              expandTo: null,
              keepShortened: false,
            },
          ],
        },
      }, {
        onSuccess: () => {
          notifySuccess(`Added ${domain} to ${selectedWebsite.siteName || selectedWebsite.domain}`);
          onClose();
        },
        onError: () => notifyError("Couldn't update the website"),
      });
    }
  }

  const canConfirm = mode === "ignore-list"
    ? !loadingList && !isPending
    : !loadingWebsites && selectedWebsite !== undefined && !isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as link shortener</DialogTitle>
          <DialogDescription>
            Flag
            {" "}
            <strong>{domain ?? "this domain"}</strong>
            {" "}
            as a link shortener so it&apos;s handled correctly when saving bookmarks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "ignore-list" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("ignore-list")}
            >
              Shortener ignore list
            </Button>
            <Button
              type="button"
              variant={mode === "website" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("website")}
            >
              Associate with website
            </Button>
          </div>

          {mode === "ignore-list"
            ? (
              <p className="text-sm text-muted-foreground">
                {alreadyInList
                  ? `${domain} is already in the shortener ignore list.`
                  : `Adds ${domain ?? "this domain"} to the generic shortener ignore list. When this domain appears in a bookmark URL, you'll be nudged to paste the full URL instead.`}
              </p>
            )
            : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Associates{" "}
                  {domain ?? "this domain"}
                  {" "}as a shortened-link domain for a specific website. You can then set an expansion
                  template on the website&apos;s Shortened Links tab.
                </p>
                {loadingWebsites
                  ? <p className="text-sm text-muted-foreground">Loading websites…</p>
                  : (
                    <Combobox
                      options={websiteOptions}
                      value={selectedWebsiteId}
                      onValueChange={setSelectedWebsiteId}
                      placeholder="Select a website…"
                      searchPlaceholder="Search websites…"
                      emptyText="No websites found."
                      aria-label="Website"
                    />
                  )}
                {alreadyOnWebsite && (
                  <p className="text-sm text-muted-foreground">
                    {domain} is already listed as a shortened link for this website.
                  </p>
                )}
              </div>
            )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={confirm}
            disabled={!canConfirm}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
