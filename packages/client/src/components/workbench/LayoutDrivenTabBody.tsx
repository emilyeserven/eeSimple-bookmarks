import type { EntityWorkbench, WorkbenchMode } from "./types";
import type { EntityLayout } from "@eesimple/types";

import { Fragment } from "react";

import { LabeledSection } from "../LabeledSection";

import { Separator } from "@/components/ui/separator";
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
 * {@link visibleSectionsForTab}), a titled section becomes a `LabeledSection`, an untitled one a bare
 * full-width stack; sections are divided by `<Separator/>`. Each field renders in array order via its
 * registry entry's mode renderer — one layout tree, the mode picks the renderer, so view/edit parity
 * is by construction. There is no tab-level heading: the rail label + section titles identify the
 * content, and the danger zone stays a `WorkbenchRouteTab` fixture (this body is fields only).
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
      {sections.map(({
        section, fieldKeys,
      }, index) => {
        const body = (
          <div className="space-y-6">
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
            {section.title
              ? <LabeledSection title={section.title}>{body}</LabeledSection>
              : body}
          </Fragment>
        );
      })}
    </div>
  );
}
