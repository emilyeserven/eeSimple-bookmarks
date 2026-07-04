import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface ExpandAllToggleProps {
  /** Ids of every node that can expand (nodes with children). Empty → the toggle hides itself. */
  expandableIds: string[];
  /** Currently-expanded node ids. */
  expanded: Set<string>;
  /** Expand every node in {@link expandableIds}. */
  onExpandAll: (ids: string[]) => void;
  /** Collapse every node. */
  onCollapseAll: () => void;
}

/**
 * "Expand all" / "Collapse all" toggle for a collapsible taxonomy tree listing (Tags, Media Types,
 * Locations). Flips to "Collapse all" once every expandable node is open; hides when nothing can
 * expand.
 */
export function ExpandAllToggle({
  expandableIds, expanded, onExpandAll, onCollapseAll,
}: ExpandAllToggleProps) {
  const {
    t,
  } = useTranslation();
  if (expandableIds.length === 0) return null;

  const allExpanded = expandableIds.every(id => expanded.has(id));

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => (allExpanded ? onCollapseAll() : onExpandAll(expandableIds))}
    >
      {allExpanded
        ? (
          <>
            <ChevronsDownUp />
            {t("Collapse all")}
          </>
        )
        : (
          <>
            <ChevronsUpDown />
            {t("Expand all")}
          </>
        )}
    </Button>
  );
}
