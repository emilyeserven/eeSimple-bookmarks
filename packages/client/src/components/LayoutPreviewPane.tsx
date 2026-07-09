import type { EntityWorkbench, WorkbenchMode } from "./workbench/types";
import type { RenderTab, SectionMatches } from "@/lib/workbenchLayout";
import type { Bookmark, EntityLayout, LayoutableEntityKind } from "@eesimple/types";
import type { ReactNode } from "react";

import { Component, useCallback, useEffect, useMemo, useState } from "react";

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
import { useBookmarkSectionVisibility } from "../hooks/useBookmarkSectionVisibility";
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
 * suppresses the "Sync from source" header registration these providers publish.
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

/**
 * One view tab in the preview: renders its {@link LayoutDrivenTabBody} (shown only when active, else
 * `hidden` but still mounted) so the tab measures its own emptiness and reports it up — an empty tab is
 * disabled in the rail. The body always mounts so its emptiness is known before the user selects it.
 */
function PreviewViewTab({
  workbench, layout, tabKey, entity, sectionMatches, visible, onTabEmptyChange,
}: {
  workbench: EntityWorkbench<{ id: string }>;
  layout: EntityLayout;
  tabKey: string;
  entity: { id: string };
  sectionMatches: SectionMatches;
  visible: boolean;
  onTabEmptyChange: (key: string, isEmpty: boolean) => void;
}) {
  const handle = useCallback(
    (isEmpty: boolean) => onTabEmptyChange(tabKey, isEmpty),
    [tabKey, onTabEmptyChange],
  );
  return (
    <div hidden={!visible}>
      <LayoutDrivenTabBody
        workbench={workbench}
        layout={layout}
        tabKey={tabKey}
        mode="view"
        entity={entity}
        sectionMatches={sectionMatches}
        onViewEmptyChange={handle}
      />
    </div>
  );
}

/**
 * Clears the header "Sync from source" registration that an edit-form provider mounted for the preview
 * would publish — a settings-page leak. Runs after the providers' registration effects each commit, so
 * it wins; the unmount cleanup also clears it.
 */
function useSyncProviderSuppression() {
  const setSyncProvider = useUiStore(state => state.setSyncProvider);
  useEffect(() => {
    setSyncProvider(null);
  });
  useEffect(() => () => setSyncProvider(null), [setSyncProvider]);
}

/** The previewed entity plus the View/Edit + entity-picker state. */
function usePreviewSelection(kind: LayoutableEntityKind, workbench: EntityWorkbench<{ id: string }>) {
  const instancesByKind = usePreviewInstancesByKind();
  const instanceOptions = instancesByKind[kind] ?? [];
  const sample = useMemo(() => buildSampleEntity(kind), [kind]);

  const [mode, setMode] = useState<WorkbenchMode>("view");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const resolvedSelectedId = selectedId ?? (sample ? SAMPLE_ID : (instanceOptions[0]?.value ?? ""));

  // Load the picked real entity by id (empty for the Sample sentinel — its useById no-ops/misses).
  const byId = workbench.useById(resolvedSelectedId === SAMPLE_ID ? "" : resolvedSelectedId);
  const entity = resolvedSelectedId === SAMPLE_ID ? sample : (byId.entity ?? null);

  return {
    mode,
    setMode,
    setSelectedId,
    resolvedSelectedId,
    sample,
    instanceOptions,
    entity,
  };
}

/** The active tab plus the empty-view-tab tracking, so empty view tabs can be disabled in the rail. */
function usePreviewActiveTab(tabs: RenderTab[], mode: WorkbenchMode, resolvedSelectedId: string) {
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const active = tabs.find(tab => tab.key === activeTab)?.key ?? tabs[0]?.key;

  // Which view tabs measured empty (every section renders no value) — reset when the entity/mode changes.
  const [emptyTabKeys, setEmptyTabKeys] = useState<Set<string>>(() => new Set());
  const handleTabEmpty = useCallback((key: string, isEmpty: boolean) => {
    setEmptyTabKeys((prev) => {
      if (isEmpty === prev.has(key)) return prev;
      const next = new Set(prev);
      if (isEmpty) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);
  useEffect(() => {
    setEmptyTabKeys(new Set());
  }, [resolvedSelectedId, mode]);
  // If the active view tab is empty, advance to the first tab that has content.
  useEffect(() => {
    if (mode !== "view" || !active || !emptyTabKeys.has(active)) return;
    const firstNonEmpty = tabs.find(tab => !emptyTabKeys.has(tab.key))?.key;
    if (firstNonEmpty) setActiveTab(firstNonEmpty);
  }, [mode, active, emptyTabKeys, tabs]);

  return {
    active,
    setActiveTab,
    emptyTabKeys,
    handleTabEmpty,
  };
}

/** The non-navigating preview tab rail; empty view tabs are disabled. Dropped for a single-tab surface. */
function PreviewRail({
  tabs, active, mode, emptyTabKeys, onSelect,
}: {
  tabs: RenderTab[];
  active: string | undefined;
  mode: WorkbenchMode;
  emptyTabKeys: Set<string>;
  onSelect: (key: string) => void;
}) {
  const {
    t,
  } = useTranslation();
  if (tabs.length <= 1) return null;
  return (
    <nav
      aria-label={t("Preview tabs")}
      className="flex flex-row gap-1 overflow-x-auto border-b pb-1"
    >
      {tabs.map((tab) => {
        const disabled = mode === "view" && emptyTabKeys.has(tab.key);
        return (
          <button
            key={tab.key}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(tab.key)}
            title={disabled ? t("No content for the previewed entity") : undefined}
            className={cn(
              navLinkClass,
              tab.key === active && "bg-accent text-accent-foreground",
              disabled && "cursor-not-allowed opacity-40",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * The read-only preview body. In **view** mode every tab is rendered (only the active shown) so each
 * reports its emptiness for the rail; **edit** mode renders just the active tab wrapped in its edit-form
 * providers. Errors are caught so a field that needs unwired context can't take down the settings page.
 */
function PreviewBody({
  kind, workbench, resolved, entity, active, mode, sectionMatches, resolvedSelectedId, tabs, onTabEmptyChange,
}: {
  kind: LayoutableEntityKind;
  workbench: EntityWorkbench<{ id: string }>;
  resolved: EntityLayout;
  entity: { id: string } | null;
  active: string | undefined;
  mode: WorkbenchMode;
  sectionMatches: SectionMatches;
  resolvedSelectedId: string;
  tabs: RenderTab[];
  onTabEmptyChange: (key: string, isEmpty: boolean) => void;
}) {
  const {
    t,
  } = useTranslation();
  if (!entity || !active) {
    return <p className="text-sm text-muted-foreground">{t("Nothing to preview yet.")}</p>;
  }
  if (mode === "view") {
    return (
      <PreviewErrorBoundary
        resetKey={`${kind}:view:${resolvedSelectedId}`}
        fallback={<p className="text-sm text-muted-foreground">{t("Couldn't render this preview.")}</p>}
      >
        {tabs.map(tab => (
          <PreviewViewTab
            key={tab.key}
            workbench={workbench}
            layout={resolved}
            tabKey={tab.key}
            entity={entity}
            sectionMatches={sectionMatches}
            visible={tab.key === active}
            onTabEmptyChange={onTabEmptyChange}
          />
        ))}
      </PreviewErrorBoundary>
    );
  }
  return (
    <PreviewErrorBoundary
      resetKey={`${kind}:edit:${resolvedSelectedId}:${active}`}
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
          sectionMatches={sectionMatches}
        />
      </EditModeProviders>
    </PreviewErrorBoundary>
  );
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
  const workbench = useLayoutDrivenWorkbench(baseWorkbenchForKind(kind));
  const {
    mode, setMode, setSelectedId, resolvedSelectedId, sample, instanceOptions, entity,
  } = usePreviewSelection(kind, workbench);

  // Section "Show only if…" (visibleIf) gate — only bookmarks carry section conditions, so other kinds
  // get an always-true predicate. Mode-agnostic, so it gates both preview modes like the real pages.
  const sectionMatches = useBookmarkSectionVisibility(
    kind === "bookmark" && entity ? entity as Bookmark : undefined,
  );
  useSyncProviderSuppression();

  const resolved = useMemo(
    () => resolveLayout(layout, workbench.defaultLayout ?? {
      tabs: [],
    }, knownFieldKeys(workbench)),
    [layout, workbench],
  );
  const fields = workbench.fields ?? {};
  const tabs = entity ? modeVisibleTabs(resolved, fields, mode, entity, sectionMatches) : [];
  const {
    active, setActiveTab, emptyTabKeys, handleTabEmpty,
  } = usePreviewActiveTab(tabs, mode, resolvedSelectedId);

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

      <PreviewRail
        tabs={tabs}
        active={active}
        mode={mode}
        emptyTabKeys={emptyTabKeys}
        onSelect={key => setActiveTab(key)}
      />

      <div
        className="pointer-events-none select-none"
        aria-hidden
      >
        <PreviewBody
          kind={kind}
          workbench={workbench}
          resolved={resolved}
          entity={entity}
          active={active}
          mode={mode}
          sectionMatches={sectionMatches}
          resolvedSelectedId={resolvedSelectedId}
          tabs={tabs}
          onTabEmptyChange={handleTabEmpty}
        />
      </div>
    </div>
  );
}
