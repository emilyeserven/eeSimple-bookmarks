import type { EntityWorkbench, WorkbenchField, WorkbenchMode } from "./types";
import type { SectionMatches, VisibleSection } from "@/lib/workbenchLayout";
import type { EntityLayout, LayoutSection } from "@eesimple/types";

import { Fragment, useCallback, useLayoutEffect, useRef, useState } from "react";

import { LabeledSection } from "../LabeledSection";

import { Separator } from "@/components/ui/separator";
import { sectionColumnsClass } from "@/lib/layoutColumns";
import { visibleSectionsForTab } from "@/lib/workbenchLayout";

interface Props<E extends { id: string }> {
  workbench: EntityWorkbench<E>;
  /** The resolved layout (already reconciled by `resolveLayout`). */
  layout: EntityLayout;
  /** Which layout tab to render — a `layout.tabs[].key`. */
  tabKey: string;
  mode: WorkbenchMode;
  /** The loaded entity (resolved upstream by `TabWrapper`). */
  entity: E;
  /**
   * Optional per-section condition gate (a section's `visibleIf`). Bookmark surfaces pass this from
   * `useBookmarkSectionVisibility`; other kinds omit it, so every section shows as before.
   */
  sectionMatches?: SectionMatches;
}

/** CSS selector for "the section rendered something meaningful" — media / interactive / tabular content. */
const CONTENT_SELECTOR = "img,svg,canvas,video,input,textarea,select,button,a,table,[role='img']";

/** Render a section's fields for the given mode, in layout order. */
function SectionFields<E extends { id: string }>({
  section, fieldKeys, fields, mode, entity,
}: {
  section: LayoutSection;
  fieldKeys: string[];
  fields: Record<string, WorkbenchField<E>>;
  mode: WorkbenchMode;
  entity: E;
}) {
  return (
    <div className={sectionColumnsClass(section.columns)}>
      {fieldKeys.map((key) => {
        const render = mode === "edit" ? fields[key]?.edit : fields[key]?.view;
        return render
          ? (
            <Fragment key={key}>{render({
              entity,
            })}
            </Fragment>
          )
          : null;
      })}
    </div>
  );
}

/** Wrap a section body in its `LabeledSection` heading (if titled/described) or render it bare. */
function sectionShell(section: LayoutSection, body: React.ReactNode): React.ReactNode {
  return section.title || section.description
    ? (
      <LabeledSection
        title={section.title ?? ""}
        description={section.description}
      >
        {body}
      </LabeledSection>
    )
    : body;
}

/**
 * One **view**-mode section that hides itself when its fields render nothing (#1225). It measures its
 * rendered field container after layout (before paint → no flicker) and reports emptiness up; an
 * empty section is `display:none` (kept mounted so it keeps measuring and re-appears if async field
 * data arrives). A `MutationObserver` re-measures on any subtree change, since a field's own async
 * render doesn't re-render this wrapper.
 */
function MeasuredViewSection<E extends { id: string }>({
  section, fieldKeys, fields, entity, hidden, showSeparator, onEmptyChange,
}: {
  section: LayoutSection;
  fieldKeys: string[];
  fields: Record<string, WorkbenchField<E>>;
  entity: E;
  hidden: boolean;
  showSeparator: boolean;
  onEmptyChange: (key: string, isEmpty: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const isEmpty = !el.textContent?.trim() && el.querySelector(CONTENT_SELECTOR) === null;
      onEmptyChange(section.key, isEmpty);
    };
    measure();
    const observer = new MutationObserver(measure);
    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [section.key, onEmptyChange]);

  const body = (
    <div ref={ref}>
      <SectionFields
        section={section}
        fieldKeys={fieldKeys}
        fields={fields}
        mode="view"
        entity={entity}
      />
    </div>
  );

  return (
    <div
      hidden={hidden}
      className="space-y-6"
    >
      {showSeparator ? <Separator /> : null}
      {sectionShell(section, body)}
    </div>
  );
}

/**
 * The **view**-mode body: renders each section through {@link MeasuredViewSection}, tracks which
 * sections measured empty, and hides them — so a section whose fields have no filled-in values doesn't
 * show, on the real detail page and in the Page Layouts preview alike. The leading `<Separator/>` is
 * placed on the first *visible* section's successors only, so a hidden section leaves no stray divider.
 */
function ViewSectionsBody<E extends { id: string }>({
  sections, fields, entity, tabDescription,
}: {
  sections: VisibleSection[];
  fields: Record<string, WorkbenchField<E>>;
  entity: E;
  tabDescription?: string;
}) {
  const [emptyKeys, setEmptyKeys] = useState<Set<string>>(() => new Set());
  const onEmptyChange = useCallback((key: string, isEmpty: boolean) => {
    setEmptyKeys((prev) => {
      if (isEmpty === prev.has(key)) return prev;
      const next = new Set(prev);
      if (isEmpty) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const firstVisibleKey = sections.find(entry => !emptyKeys.has(entry.section.key))?.section.key;

  return (
    <div className="space-y-6">
      {tabDescription
        ? <p className="text-sm text-muted-foreground">{tabDescription}</p>
        : null}
      {sections.map(({
        section, fieldKeys,
      }) => (
        <MeasuredViewSection
          key={section.key}
          section={section}
          fieldKeys={fieldKeys}
          fields={fields}
          entity={entity}
          hidden={emptyKeys.has(section.key)}
          showSeparator={!emptyKeys.has(section.key) && section.key !== firstVisibleKey}
          onEmptyChange={onEmptyChange}
        />
      ))}
    </div>
  );
}

/**
 * Renders one layout tab's body as a flat `LabeledSection` stack (CLAUDE.md "Content hierarchies").
 * For each of the tab's **mode-visible** sections (structurally-empty sections already dropped by
 * {@link visibleSectionsForTab}), a section with a title and/or description becomes a `LabeledSection`
 * (its optional muted description under the heading), an untitled/undescribed one a bare full-width
 * stack; sections are divided by `<Separator/>`. Each field renders in array order via its registry
 * entry's mode renderer — one layout tree, the mode picks the renderer, so view/edit parity is by
 * construction. In **view** mode a section whose fields render no value is additionally hidden (#1225,
 * measured post-render); **edit** mode always shows every section so inputs stay reachable. The rail
 * label + section titles identify the content, but an operator-set **tab description** renders as a
 * muted blurb at the top; the danger zone stays a `WorkbenchRouteTab` fixture (this body is fields only).
 */
export function LayoutDrivenTabBody<E extends { id: string }>({
  workbench, layout, tabKey, mode, entity, sectionMatches,
}: Props<E>) {
  const fields = workbench.fields ?? {};
  const tab = layout.tabs.find(candidate => candidate.key === tabKey);
  if (!tab) return null;

  const sections = visibleSectionsForTab(tab, fields, mode, entity, sectionMatches);
  if (sections.length === 0) return null;

  if (mode === "view") {
    return (
      <ViewSectionsBody
        sections={sections}
        fields={fields}
        entity={entity}
        tabDescription={tab.description}
      />
    );
  }

  return (
    <div className="space-y-6">
      {tab.description
        ? <p className="text-sm text-muted-foreground">{tab.description}</p>
        : null}
      {sections.map(({
        section, fieldKeys,
      }, index) => (
        <Fragment key={section.key}>
          {index > 0 ? <Separator /> : null}
          {sectionShell(
            section,
            <SectionFields
              section={section}
              fieldKeys={fieldKeys}
              fields={fields}
              mode="edit"
              entity={entity}
            />,
          )}
        </Fragment>
      ))}
    </div>
  );
}
