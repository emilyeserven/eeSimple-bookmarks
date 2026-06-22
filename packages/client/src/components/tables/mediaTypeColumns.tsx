import type { MediaTypeNode } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";

import { TreeExpandToggle } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import { useSidebarOpenModifier } from "../../hooks/useAppSettings";
import { useViewPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

/** Column definitions for the Media Types listing Table view (a flattened, expandable tree). */
export function useMediaTypeColumns(): ColumnDef<MediaTypeNode>[] {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
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
            <CategoryIcon
              name={row.original.icon}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <Link
              to="/taxonomies/media-types/$mediaTypeSlug/general"
              params={{
                mediaTypeSlug: row.original.slug,
              }}
              title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
              onClick={event => viewClick(event, "media-type", row.original.id)}
              className="
                font-medium
                hover:underline
              "
            >
              {row.original.name}
            </Link>
            {row.original.builtIn ? <Badge variant="outline">Built-in</Badge> : null}
          </div>
        ),
      },
      bookmarkCountColumn<MediaTypeNode>(),
    ],
    [viewClick, modifier],
  );
}
