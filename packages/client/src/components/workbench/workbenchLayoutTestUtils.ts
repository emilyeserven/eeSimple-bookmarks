import type { EntityWorkbench, WorkbenchMode } from "./types";
import type { EntityLayout } from "@eesimple/types";

import { resolveLayout } from "@eesimple/types";

import { deriveWorkbenchTabs, knownFieldKeys, visibleSectionsForTab } from "@/lib/workbenchLayout";

/**
 * Shared test helper for the layout-driven pilot (#1161) and rollout-batch (#1164/#1165) byte-identical
 * snapshot checks: resolves a workbench's default (or a `stored` override) layout to its visible tab →
 * section → field-key shape for a given mode, without invoking any renderers. See `pilotLayouts.test.tsx`
 * for the two field-registry pilots (Category, Newsletter); rollout-batch tests reuse this verbatim.
 */

export interface TabShape {
  key: string;
  group?: string;
  sections: { key: string;
    fields: string[]; }[];
}

export function shape<E extends { id: string }>(
  workbench: EntityWorkbench<E>,
  mode: WorkbenchMode,
  stored: EntityLayout | null = null,
): TabShape[] {
  const {
    defaultLayout, fields,
  } = workbench;
  if (!defaultLayout || !fields) throw new Error("workbench must be layout-driven");
  const layout = resolveLayout(stored, defaultLayout, knownFieldKeys(workbench));
  return deriveWorkbenchTabs(workbench, layout, mode, undefined).flatMap((tab) => {
    const layoutTab = layout.tabs.find(candidate => candidate.key === tab.key);
    if (!layoutTab) return [];
    return [{
      key: tab.key,
      group: tab.group,
      sections: visibleSectionsForTab(layoutTab, fields, mode, undefined).map(section => ({
        key: section.section.key,
        fields: section.fieldKeys,
      })),
    }];
  });
}
