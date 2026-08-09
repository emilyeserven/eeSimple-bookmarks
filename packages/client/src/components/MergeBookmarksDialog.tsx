import type { DuplicateGroup } from "@eesimple/types";

import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MergeFieldRow } from "@/components/MergeFieldRow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useMergeBookmarksDialog } from "@/components/useMergeBookmarksDialog";
import { unitDisplayValue } from "@/lib/mergePlanner";
import { cn } from "@/lib/utils";

/**
 * The merge review dialog for a duplicate group: pick the surviving bookmark, pick which member's
 * value wins each differing field, and see what gets combined automatically. Applying merges the
 * group server-side and deletes the losers.
 */
export function MergeBookmarksDialog({
  group,
  onClose,
}: {
  group: DuplicateGroup | null;
  onClose: () => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    members, isLoading, survivorId, setSurvivorId, units, unitChoices, chooseUnit,
    summary, resolveCategoryName, apply, applying,
  } = useMergeBookmarksDialog(group, onClose);
  const memberCount = group?.members.length ?? 0;

  return (
    <Dialog
      open={group !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="
          flex max-h-[85vh] flex-col gap-0 overflow-hidden
          sm:max-w-2xl
        "
      >
        <DialogHeader>
          <DialogTitle>{t("Merge bookmarks")}</DialogTitle>
          <DialogDescription>
            {t("Pick the bookmark to keep and which values win. Everything else is combined automatically.")}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4">
          {isLoading
            ? (
              <div
                className="
                  flex items-center gap-2 text-sm text-muted-foreground
                "
              >
                <Loader2 className="size-4 animate-spin" />
                {t("Loading…")}
              </div>
            )
            : null}
          {members
            ? (
              <>
                <div>
                  <div className="text-sm font-medium">{t("Keep")}</div>
                  <div
                    className="mt-1 grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${members.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {members.map(member => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setSurvivorId(member.id)}
                        aria-pressed={member.id === survivorId}
                        className={cn(
                          `
                            min-w-0 rounded-md border p-2 text-left
                            hover:bg-accent
                          `,
                          member.id === survivorId && `
                            border-primary ring-1 ring-primary
                          `,
                        )}
                      >
                        <span
                          className="block text-sm font-medium wrap-break-word"
                        >{member.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {t("Added {{when}}", {
                            when: new Date(member.createdAt).toLocaleDateString(),
                          })}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                {units.length > 0 ? <Separator /> : null}
                {units.map(unit => (
                  <MergeFieldRow
                    key={unit.key}
                    label={t(unit.label)}
                    options={members.map(member => ({
                      memberId: member.id,
                      display: unitDisplayValue(member, unit, resolveCategoryName),
                    }))}
                    selectedId={unitChoices[unit.key] ?? survivorId ?? ""}
                    onSelect={memberId => chooseUnit(unit.key, memberId)}
                  />
                ))}
                {summary.length > 0
                  ? (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium">{t("Combined automatically")}</div>
                        <ul className="mt-1 text-sm text-muted-foreground">
                          {summary.map(entry => (
                            <li key={entry.label}>
                              {t(entry.label)}
                              {": "}
                              {entry.count}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )
                  : null}
              </>
            )
            : null}
        </div>
        <DialogFooter className="items-center gap-3 border-t pt-4">
          <p className="flex-1 text-xs text-muted-foreground">
            {t("The {{count}} unselected bookmarks will be deleted.", {
              count: memberCount - 1,
            })}
          </p>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={applying}
          >
            {t("Cancel")}
          </Button>
          <Button
            onClick={apply}
            disabled={applying || members === null}
          >
            {applying ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("Merge {{count}} bookmarks", {
              count: memberCount,
            })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
