import type { TagNode } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";

import { useViewPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
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
            {row.getCanExpand()
              ? (
                <button
                  type="button"
                  data-no-row-click
                  aria-label={row.getIsExpanded() ? "Collapse" : "Expand"}
                  onClick={row.getToggleExpandedHandler()}
                  className="
                    flex size-4 items-center justify-center
                    text-muted-foreground
                    hover:text-foreground
                  "
                >
                  {row.getIsExpanded()
                    ? <ChevronDown className="size-4" />
                    : <ChevronRight className="size-4" />}
                </button>
              )
              : (
                <span
                  className="inline-block size-4"
                  aria-hidden="true"
                />
              )}
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
      {
        accessorKey: "bookmarkCount",
        header: "Bookmarks",
        cell: ({
          row,
        }) => (row.original.bookmarkCount !== undefined
          ? <Badge variant="secondary">{row.original.bookmarkCount}</Badge>
          : null),
      },
    ],
    [viewClick, modifier],
  );
}
