import type { MediaTypeNode } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";

import { TreeExpandToggle } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import { useSidebarOpenModifier } from "../../hooks/useAppSettings";
import i18n from "../../i18n";
import { useViewPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
import { builtInName } from "@/lib/builtInName";
import { CategoryIcon } from "@/lib/icons";
import { entityLinkTitle } from "@/lib/sidebarModifier";

/** Column definitions for the Media Types listing Table view (a flattened, expandable tree). */
export function useMediaTypeColumns(): ColumnDef<MediaTypeNode>[] {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return useMemo(
    () => [
      {
        id: "name",
        header: i18n.t("Name"),
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
              title={entityLinkTitle(modifier)}
              onClick={event => viewClick(event, "media-type", row.original.id, row.original.slug)}
              className="
                font-medium
                hover:underline
              "
            >
              {builtInName(row.original, i18n.t)}
            </Link>
            {row.original.builtIn ? <Badge variant="outline">{i18n.t("Built-in")}</Badge> : null}
          </div>
        ),
      },
      bookmarkCountColumn<MediaTypeNode>(),
    ],
    [viewClick, modifier],
  );
}
