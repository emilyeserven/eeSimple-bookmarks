import type { EntityLayout, LayoutableEntityKind } from "@eesimple/types";

import { useEffect, useMemo, useState } from "react";

import { resolveLayout } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { LayoutBoard } from "./LayoutBoard";
import { navLinkClass } from "./TabbedShell";
import { useEntityLayout } from "../hooks/useEntityLayout";
import { useEntityLayouts, useResetEntityLayout, useSaveEntityLayout } from "../hooks/useEntityLayouts";
import { describeError } from "../lib/apiError";
import { notifyFieldSaveError, notifyFieldSaved } from "../lib/autoSave";
import { LAYOUT_DRIVEN_ENTITIES } from "../lib/layoutDrivenEntities";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Settings → Display → Page Layouts (#1162): pick a layout-driven entity kind (only kinds whose
 * field registry — #1159/#1161 — has landed, per `LAYOUT_DRIVEN_ENTITIES`) and rearrange its
 * Tab › Section › Field tree with the shared `LayoutBoard`. The board is a controlled
 * `value`/`onChange` editor with no persistence of its own — this page owns staging the edits and
 * committing them via `useSaveEntityLayout`, plus a confirm-gated `useResetEntityLayout`.
 */
interface PageLayoutsSettingsProps {
  /** The selected entity kind, driven by the route's `?entity=` search param. */
  selectedKind: LayoutableEntityKind;
  /** Change the selection — writes the `?entity=` search param (see the route). */
  onSelectKind: (kind: LayoutableEntityKind) => void;
}

export function PageLayoutsSettings({
  selectedKind,
  onSelectKind,
}: PageLayoutsSettingsProps) {
  const {
    t,
  } = useTranslation();
  const {
    isLoading,
  } = useEntityLayouts();
  const [resetOpen, setResetOpen] = useState(false);

  const selectedEntity = LAYOUT_DRIVEN_ENTITIES.find(entity => entity.kind === selectedKind) ?? LAYOUT_DRIVEN_ENTITIES[0];
  const knownFieldKeys = useMemo(
    () => new Set(selectedEntity.fields.map(field => field.key)),
    [selectedEntity],
  );
  const stored = useEntityLayout(selectedKind);
  const resolved = useMemo(
    () => resolveLayout(stored, selectedEntity.defaultLayout, knownFieldKeys),
    [stored, selectedEntity, knownFieldKeys],
  );
  const [value, setValue] = useState<EntityLayout>(resolved);

  // Re-stage the board whenever the selected entity kind changes, or the server's stored layout for
  // it loads/changes (e.g. after a save/reset on another tab) — a fresh edit always starts from what
  // the server actually has.
  useEffect(() => {
    setValue(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sync only on kind/server-data change, not on `resolved`'s identity from local recompute
  }, [selectedKind, stored]);

  const saveLayout = useSaveEntityLayout();
  const resetLayout = useResetEntityLayout();

  function handleSave() {
    saveLayout.mutate({
      kind: selectedKind,
      layout: value,
    }, {
      onSuccess: () => notifyFieldSaved(`${selectedEntity.label} layout`),
      onError: error => notifyFieldSaveError(`${selectedEntity.label} layout`, describeError(error)),
    });
  }

  function handleReset() {
    resetLayout.mutate(selectedKind, {
      onSuccess: () => {
        setValue(selectedEntity.defaultLayout);
        setResetOpen(false);
        notifySuccess(t("{{label}} layout reset to default", {
          label: selectedEntity.label,
        }));
      },
      onError: error => notifyError(describeError(error)),
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("Rearrange an entity's view/edit tabs, sections, and fields. Changes only apply after Save; Reset restores the built-in default.")}
      </p>

      <div
        className="
          flex flex-col gap-4
          md:flex-row
        "
      >
        <nav
          aria-label={t("Entity")}
          className="
            flex flex-row gap-1 overflow-x-auto border-b pb-1
            md:w-48 md:shrink-0 md:flex-col md:border-b-0 md:pb-0
          "
        >
          {LAYOUT_DRIVEN_ENTITIES.map(entity => (
            <button
              key={entity.kind}
              type="button"
              onClick={() => onSelectKind(entity.kind)}
              className={cn(
                navLinkClass,
                `
                  text-left
                  md:w-full
                `,
                entity.kind === selectedKind && `
                  bg-accent text-accent-foreground
                `,
              )}
              aria-current={entity.kind === selectedKind ? "page" : undefined}
            >
              {entity.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-4">
          {isLoading
            ? <p className="text-sm text-muted-foreground">{t("Loading…")}</p>
            : (
              <LayoutBoard
                value={value}
                onChange={setValue}
                fields={selectedEntity.fields}
                idPrefix={selectedKind}
              />
            )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saveLayout.isPending}
            >
              {saveLayout.isPending ? t("Saving…") : t("Save layout")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setResetOpen(true)}
            >
              {t("Reset to default")}
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={resetOpen}
        onOpenChange={(next) => {
          if (!next) setResetOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("Reset “{{label}}” layout to default?", {
                label: selectedEntity.label,
              })}
            </DialogTitle>
            <DialogDescription>
              {t("This discards any custom tab, section, and field placement for this entity and restores the built-in default layout.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("Cancel")}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={resetLayout.isPending}
              onClick={handleReset}
            >
              {resetLayout.isPending ? t("Resetting…") : t("Reset")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
