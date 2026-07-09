import type { EntityLayout, LayoutableEntityKind } from "@eesimple/types";
import type { CSSProperties } from "react";

import { useEffect, useMemo, useState } from "react";

import { resolveLayout } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { setSectionVisibility } from "./entityLayoutMutations";
import { LayoutBoard } from "./LayoutBoard";
import { LayoutPreviewPane } from "./LayoutPreviewPane";
import { SectionVisibilityEditor } from "./SectionVisibilityEditor";
import { navLinkClass } from "./TabbedShell";
import { useEntityLayout } from "../hooks/useEntityLayout";
import { useEntityLayouts, useResetEntityLayout, useSaveEntityLayout } from "../hooks/useEntityLayouts";
import { useHorizontalSplit } from "../hooks/useHorizontalSplit";
import { describeError } from "../lib/apiError";
import { notifyFieldSaveError, notifyFieldSaved } from "../lib/autoSave";
import { LAYOUT_DRIVEN_ENTITIES, useDynamicLayoutFieldsByKind } from "../lib/layoutDrivenEntities";
import { notifyError, notifySuccess } from "../lib/notifications";
import { augmentDefaultLayout } from "../lib/workbenchLayout";

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
  /** Whether the live preview pane is shown — toggled by the page-header Preview button (route). */
  previewOpen: boolean;
}

export function PageLayoutsSettings({
  selectedKind,
  onSelectKind,
  previewOpen,
}: PageLayoutsSettingsProps) {
  const {
    t,
  } = useTranslation();
  const {
    isLoading,
  } = useEntityLayouts();
  const [resetOpen, setResetOpen] = useState(false);
  // Draggable board/preview split — starts 50/50, the divider resizes it (preview mode only).
  const {
    containerRef, percent, onHandlePointerDown,
  } = useHorizontalSplit();

  const selectedEntity = LAYOUT_DRIVEN_ENTITIES.find(entity => entity.kind === selectedKind) ?? LAYOUT_DRIVEN_ENTITIES[0];
  // Dynamic (user-defined) placeable fields for the selected kind — e.g. one per custom property on
  // bookmarks. Merged into the tray + the resolve inputs so they list and place like static fields.
  const dynamicByKind = useDynamicLayoutFieldsByKind();
  const dynamic = dynamicByKind[selectedEntity.kind];
  const fields = useMemo(
    () => (dynamic ? [...selectedEntity.fields, ...dynamic.metas] : selectedEntity.fields),
    [selectedEntity, dynamic],
  );
  const defaultLayout = useMemo(
    () => (dynamic
      ? augmentDefaultLayout(selectedEntity.defaultLayout, dynamic.metas.map(meta => meta.key), dynamic.defaultHome)
      : selectedEntity.defaultLayout),
    [selectedEntity, dynamic],
  );
  const knownFieldKeys = useMemo(
    () => new Set(fields.map(field => field.key)),
    [fields],
  );
  const stored = useEntityLayout(selectedKind);
  const resolved = useMemo(
    () => resolveLayout(stored, defaultLayout, knownFieldKeys),
    [stored, defaultLayout, knownFieldKeys],
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
        setValue(defaultLayout);
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
        ref={containerRef}
        className="
          flex flex-col gap-4
          md:flex-row
        "
      >
        {previewOpen
          ? null
          : (
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
          )}

        <div
          className={cn("min-w-0 space-y-4", previewOpen
            ? `
              md:max-h-[calc(100vh-13rem)] md:grow-(--g) md:basis-0
              md:overflow-y-auto
            `
            : "flex-1")}
          style={previewOpen
            ? {
              "--g": percent,
            } as CSSProperties
            : undefined}
        >
          {isLoading
            ? <p className="text-sm text-muted-foreground">{t("Loading…")}</p>
            : (
              <LayoutBoard
                value={value}
                onChange={setValue}
                fields={fields}
                idPrefix={selectedKind}
                renderSectionExtras={selectedKind === "bookmark"
                  ? ({
                    tabKey, section, value: layout, onChange,
                  }) => (
                    <SectionVisibilityEditor
                      tree={section.visibleIf}
                      onChange={tree => onChange(setSectionVisibility(layout, tabKey, section.key, tree))}
                    />
                  )
                  : undefined}
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

        {previewOpen
          ? (
            <>
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label={t("Resize preview")}
                onPointerDown={onHandlePointerDown}
                className="
                  hidden w-1.5 shrink-0 cursor-col-resize rounded-sm bg-border
                  hover:bg-primary
                  md:block
                "
              />
              <div
                className="
                  min-w-0 space-y-2
                  md:max-h-[calc(100vh-13rem)] md:grow-(--g) md:basis-0
                  md:overflow-y-auto
                "
                style={{
                  "--g": 100 - percent,
                } as CSSProperties}
              >
                <h3 className="text-sm font-medium">{t("Preview")}</h3>
                <LayoutPreviewPane
                  key={selectedKind}
                  kind={selectedKind}
                  layout={value}
                />
              </div>
            </>
          )
          : null}
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
