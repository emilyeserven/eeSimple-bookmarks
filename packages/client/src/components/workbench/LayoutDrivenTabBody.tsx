import type { EntityWorkbench, WorkbenchMode } from "./types";
import type { EntityLayout } from "@eesimple/types";

import { Fragment } from "react";

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
}

/**
 * Renders one layout tab's body as a flat `LabeledSection` stack (CLAUDE.md "Content hierarchies").
 * For each of the tab's **mode-visible** sections (empty sections already dropped by
 * {@link visibleSectionsForTab}), a section with a title and/or description becomes a
 * `LabeledSection` (its optional muted description under the heading), an untitled/undescribed one a
 * bare full-width stack; sections are divided by `<Separator/>`. Each field renders in array order
 * via its registry entry's mode renderer — one layout tree, the mode picks the renderer, so
 * view/edit parity is by construction. The rail label + section titles identify the content, but an
 * operator-set **tab description** (if any) renders as a muted blurb at the top of the body; the
 * danger zone stays a `WorkbenchRouteTab` fixture (this body is fields only).
 */
export function LayoutDrivenTabBody<E extends { id: string }>({
  workbench, layout, tabKey, mode, entity,
}: Props<E>) {
  const fields = workbench.fields ?? {};
  const tab = layout.tabs.find(candidate => candidate.key === tabKey);
  if (!tab) return null;

  const sections = visibleSectionsForTab(tab, fields, mode, entity);
  if (sections.length === 0) return null;

  return (
    <div className="space-y-6">
      {tab.description
        ? <p className="text-sm text-muted-foreground">{tab.description}</p>
        : null}
      {sections.map(({
        section, fieldKeys,
      }, index) => {
        const body = (
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
        return (
          <Fragment key={section.key}>
            {index > 0 ? <Separator /> : null}
            {section.title || section.description
              ? (
                <LabeledSection
                  title={section.title ?? ""}
                  description={section.description}
                >
                  {body}
                </LabeledSection>
              )
              : body}
          </Fragment>
        );
      })}
    </div>
  );
}
