import type { SyncProvider } from "@/lib/syncSources/syncSourceTypes";

import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SyncDiffRow } from "@/components/SyncDiffRow";
import { SyncImageDiffRow } from "@/components/SyncImageDiffRow";
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
import { Separator } from "@/components/ui/separator";
import { useSyncFromSourceModal } from "@/components/useSyncFromSourceModal";

/**
 * The "Sync from outside source" review modal. Opened from the header-strip Sync button for a
 * mounted edit form's {@link SyncProvider}, it fetches fresh values from the entity's source, shows a
 * Current | New diff grouped by source with a per-row checkbox, and on Apply hands the checked rows
 * to `provider.applyStaged` (staging into the form / firing immediate image POSTs). Locations get a
 * default-off "re-geocode" toggle that force-overwrites coordinates.
 */
export function SyncFromSourceModal({
  provider, open, onOpenChange,
}: {
  provider: SyncProvider;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    diff, isLoading, error, selectedKeys, toggle, regeocode, setRegeocode, apply, applying, selectedCount,
  } = useSyncFromSourceModal(provider, open, () => onOpenChange(false));

  const isEmpty = !isLoading && !error && diff !== null && diff.groups.every(group => group.rows.length === 0);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="
          max-h-[85vh] gap-0 overflow-hidden
          sm:max-w-lg
        "
      >
        <DialogHeader>
          <DialogTitle>{t("Sync from source")}</DialogTitle>
          <DialogDescription>
            {t("Review the latest values for")}
            {" "}
            <span className="font-medium text-foreground">{provider.entityLabel}</span>
            {" "}
            {t("and choose what to apply. Nothing is saved until you save the form (images apply immediately).")}
          </DialogDescription>
        </DialogHeader>

        {provider.supportsRegeocode
          ? (
            <label
              className="
                mt-3 flex cursor-pointer items-start gap-3 rounded-md border
                bg-muted/40 p-3
              "
            >
              <Checkbox
                checked={regeocode}
                onCheckedChange={value => setRegeocode(value === true)}
                className="mt-0.5"
              />
              <div className="text-sm">
                <div className="font-medium">{t("Re-geocode from the provider")}</div>
                <div className="text-muted-foreground">
                  {t("Overwrite existing coordinates & boundary, not just fill empty fields.")}
                </div>
              </div>
            </label>
          )
          : null}

        <div
          className="mt-3 max-h-[52vh] overflow-y-auto pr-1"
        >
          {isLoading
            ? (
              <div
                className="
                  flex items-center gap-2 py-8 text-sm text-muted-foreground
                "
              >
                <Loader2 className="size-4 animate-spin" />
                {t("Checking the source for the latest values…")}
              </div>
            )
            : null}

          {error
            ? (
              <div className="py-8 text-sm text-destructive">{error}</div>
            )
            : null}

          {isEmpty
            ? (
              <div className="py-8 text-sm text-muted-foreground">
                {t("Everything is already in sync with the source.")}
              </div>
            )
            : null}

          {!isLoading && !error && diff
            ? diff.groups
              .filter(group => group.rows.length > 0)
              .map((group, groupIndex) => (
                <div key={group.source}>
                  {groupIndex > 0 ? <Separator className="my-2" /> : null}
                  <div
                    className="
                      py-1 text-xs font-semibold tracking-wide
                      text-muted-foreground uppercase
                    "
                  >
                    {group.source}
                  </div>
                  {group.rows.map(row =>
                    row.kind === "image"
                      ? (
                        <SyncImageDiffRow
                          key={row.key}
                          row={row}
                          checked={selectedKeys.has(row.key)}
                          onToggle={checked => toggle(row.key, checked)}
                        />
                      )
                      : (
                        <SyncDiffRow
                          key={row.key}
                          row={row}
                          checked={selectedKeys.has(row.key)}
                          onToggle={checked => toggle(row.key, checked)}
                        />
                      ))}
                </div>
              ))
            : null}
        </div>

        <DialogFooter className="mt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={applying}
          >
            {t("Cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void apply()}
            disabled={applying || selectedCount === 0}
          >
            {applying ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("Apply")}
            {selectedCount > 0 ? ` ${selectedCount}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
