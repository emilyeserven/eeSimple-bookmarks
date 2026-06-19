import type { TagNode } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";

import { TreeExpandToggle } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import { useViewPanelClick } from "../panel/useEditPanelClick";

import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** Column definitions for the Tags listing Table view (a flattened, expandable tree). */
export function useTagColumns(): ColumnDef<TagNode>[] {
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  return useMemo(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({
          row,
        }) => (
          <div
            className="flex items-center gap-1"
            style={{
              paddingLeft: `${row.depth * 1.25}rem`,
            }}
          >
            <TreeExpandToggle row={row} />
            <Link
              to="/tags/$tagSlug/general"
              params={{
                tagSlug: row.original.slug,
              }}
              title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
              onClick={event => viewClick(event, "tag", row.original.id)}
              className="
                font-medium
                hover:underline
              "
            >
              {row.original.name}
            </Link>
          </div>
        ),
      },
      bookmarkCountColumn<TagNode>(),
    ],
    [viewClick, modifier],
  );
}
