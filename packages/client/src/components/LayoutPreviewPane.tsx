import type { EntityWorkbench, WorkbenchMode } from "./workbench/types";
import type { Bookmark, EntityLayout, LayoutableEntityKind } from "@eesimple/types";
import type { ReactNode } from "react";

import { Component, useEffect, useMemo, useState } from "react";

import { resolveLayout } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { BookmarkGeneralFormProvider } from "./BookmarkGeneralFormContext";
import { BookmarkImageEditFormProvider } from "./BookmarkImageEditFormContext";
import { BookmarkPropertiesFormProvider } from "./BookmarkPropertiesFormContext";
import { Combobox } from "./Combobox";
import { navLinkClass } from "./TabbedShell";
import { bookmarkWorkbench } from "./workbench/bookmark";
import { LayoutDrivenTabBody } from "./workbench/LayoutDrivenTabBody";
import { ENTITY_DESCRIPTORS } from "../entities/registry";
import { useLayoutDrivenWorkbench } from "../hooks/useEntityLayout";
import { usePreviewInstancesByKind } from "../lib/layoutPreviewInstances";
import { buildSampleEntity, SAMPLE_ID } from "../lib/layoutPreviewSamples";
import { useUiStore } from "../stores/uiStore";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { knownFieldKeys, modeVisibleTabs } from "@/lib/workbenchLayout";

/** The base (pre-dynamic-merge) workbench for a kind — bookmark is off `ENTITY_DESCRIPTORS`. */
function baseWorkbenchForKind(kind: LayoutableEntityKind): EntityWorkbench<{ id: string }> {
  if (kind === "bookmark") return bookmarkWorkbench as unknown as EntityWorkbench<{ id: string }>;
  const descriptors = ENTITY_DESCRIPTORS as unknown as Record<string, { workbench: EntityWorkbench<{ id: string }> }>;
  return descriptors[kind].workbench;
}

/**
 * A minimal error boundary local to the preview: an edit field that reads a context this read-only
 * preview intentionally doesn't wire will throw during render; catching it keeps the settings page
 * alive and shows a friendly note instead. Reset by remounting via the `resetKey` prop.
 */
class PreviewErrorBoundary extends Component<
  { resetKey: string;
    fallback: ReactNode;
    children: ReactNode; },
  { failed: boolean }
> {
  constructor(props: { resetKey: string;
    fallback: ReactNode;
    children: ReactNode; }) {
    super(props);
    this.state = {
      failed: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      failed: true,
    };
  }

  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({
        failed: false,
      });
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Wrap the edit body in the entity's edit-form provider(s) so provider-backed edit fields render. For a
 * read-only preview we mount them unconditionally in edit mode (no per-tab gating needed — the real
 * `BookmarkEditView`/`EntityEditView` gate only to avoid unnecessary mounts). The pane separately
 * suppresses the "Sync from source" header registration these providers publish (see the effect below).
 */
function EditModeProviders({
  kind, workbench, entity, mode, children,
}: {
  kind: LayoutableEntityKind;
  workbench: EntityWorkbench<{ id: string }>;
  entity: { id: string };
  mode: WorkbenchMode;
  children: ReactNode;
}) {
  if (mode !== "edit") return children;
  if (kind === "bookmark") {
    const bookmark = entity as Bookmark;
    return (
      <BookmarkGeneralFormProvider bookmark={bookmark}>
        <BookmarkPropertiesFormProvider bookmark={bookmark}>
          <BookmarkImageEditFormProvider bookmark={bookmark}>
            {children}
          </BookmarkImageEditFormProvider>
        </BookmarkPropertiesFormProvider>
      </BookmarkGeneralFormProvider>
    );
  }
  const Provider = workbench.editFormProvider;
  return Provider ? <Provider entity={entity}>{children}</Provider> : children;
}

interface Props {
  /** The layout-driven entity kind being edited in the board. */
  kind: LayoutableEntityKind;
  /** The staged (unsaved) layout from the board — the preview reflects it live. */
  layout: EntityLayout;
}

/**
 * The live preview pane for the Page Layouts editor (#1225). Renders the selected entity's resolved
 * **staged** layout through the same `LayoutDrivenTabBody` the real View/Edit pages use, so the preview
 * matches exactly. A View/Edit toggle picks the mode; a picker chooses the "Sample — all fields filled
 * in" synthetic entity (default) or any real instance of the kind. The rendered body is **read-only**
 * (`pointer-events-none`) so it can never save to real data.
 *
 * Mounted keyed by `kind` (see `PageLayoutsSettings`), so the per-kind hook set (dynamic fields, the
 * selected workbench's `useDynamicFields`, `useById`) resets cleanly on kind change.
 */
export function LayoutPreviewPane({
  kind, layout,
}: Props) {
  const {
    t,
  } = useTranslation();

  const base = baseWorkbenchForKind(kind);
  const workbench = useLayoutDrivenWorkbench(base);

  const instancesByKind = usePreviewInstancesByKind();
  const instanceOptions = instancesByKind[kind] ?? [];
  const sample = useMemo(() => buildSampleEntity(kind), [kind]);

  const [mode, setMode] = useState<WorkbenchMode>("view");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const resolvedSelectedId
    = selectedId ?? (sample ? SAMPLE_ID : (instanceOptions[0]?.value ?? ""));

  // Load the picked real entity by id (empty for the Sample sentinel — its useById no-ops/misses).
  const byId = workbench.useById(resolvedSelectedId === SAMPLE_ID ? "" : resolvedSelectedId);
  const entity = resolvedSelectedId === SAMPLE_ID ? sample : (byId.entity ?? null);

  // Suppress the header "Sync from source" button that any edit-form provider we mount for the preview
  // would register — a settings-page leak. This parent effect runs after the providers' registration
  // effects each commit, so it wins; the unmount cleanup also clears it.
  const setSyncProvider = useUiStore(state => state.setSyncProvider);
  useEffect(() => {
    setSyncProvider(null);
  });
  useEffect(() => () => setSyncProvider(null), [setSyncProvider]);

  const resolved = useMemo(
    () => resolveLayout(layout, workbench.defaultLayout ?? {
      tabs: [],
    }, knownFieldKeys(workbench)),
    [layout, workbench],
  );

  const fields = workbench.fields ?? {};
  const tabs = entity ? modeVisibleTabs(resolved, fields, mode, entity) : [];
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const active = tabs.find(tab => tab.key === activeTab)?.key ?? tabs[0]?.key;

  const pickerOptions = [
    ...(sample
      ? [{
        value: SAMPLE_ID,
        label: t("Sample — all fields filled in"),
      }]
      : []),
    ...instanceOptions,
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={value => value && setMode(value as WorkbenchMode)}
          variant="outline"
          size="sm"
          aria-label={t("Preview mode")}
        >
          <ToggleGroupItem value="view">{t("View")}</ToggleGroupItem>
          <ToggleGroupItem value="edit">{t("Edit")}</ToggleGroupItem>
        </ToggleGroup>
        <div className="min-w-40 flex-1">
          <Combobox
            options={pickerOptions}
            value={resolvedSelectedId}
            onValueChange={value => setSelectedId(value ?? null)}
            aria-label={t("Preview entity")}
            placeholder={t("Pick an entity to preview")}
          />
        </div>
      </div>

      {tabs.length > 1
        ? (
          <nav
            aria-label={t("Preview tabs")}
            className="flex flex-row gap-1 overflow-x-auto border-b pb-1"
          >
            {tabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(navLinkClass, tab.key === active && `
                  bg-accent text-accent-foreground
                `)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )
        : null}

      <div
        className="pointer-events-none select-none"
        aria-hidden
      >
        {entity && active
          ? (
            <PreviewErrorBoundary
              resetKey={`${kind}:${mode}:${resolvedSelectedId}:${active}`}
              fallback={(
                <p className="text-sm text-muted-foreground">
                  {t("This tab's fields can't be previewed here — switch to View mode to preview them.")}
                </p>
              )}
            >
              <EditModeProviders
                kind={kind}
                workbench={workbench}
                entity={entity}
                mode={mode}
              >
                <LayoutDrivenTabBody
                  workbench={workbench}
                  layout={resolved}
                  tabKey={active}
                  mode={mode}
                  entity={entity}
                />
              </EditModeProviders>
            </PreviewErrorBoundary>
          )
          : (
            <p className="text-sm text-muted-foreground">
              {t("Nothing to preview yet.")}
            </p>
          )}
      </div>
    </div>
  );
}
