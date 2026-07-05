import type { GenreMoodNode } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";

import { TreeExpandToggle } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import { useSidebarOpenModifier } from "../../hooks/useAppSettings";
import i18n from "../../i18n";
import { useViewPanelClick } from "../panel/useEditPanelClick";
import { RomanizedLabel } from "../RomanizedLabel";

import { entityLinkTitle } from "@/lib/sidebarModifier";

/** Column definitions for the Genres & Moods listing Table view (a flattened, expandable tree). */
export function useGenreMoodColumns(): ColumnDef<GenreMoodNode>[] {
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
            <Link
              to="/taxonomies/genres-moods/$genreMoodSlug/general"
              params={{
                genreMoodSlug: row.original.slug,
              }}
              title={entityLinkTitle(modifier)}
              onClick={event => viewClick(event, "genre-mood", row.original.id, row.original.slug)}
              className="
                font-medium
                hover:underline
              "
            >
              <RomanizedLabel
                name={row.original.name}
                romanized={row.original.romanizedName}
              />
            </Link>
          </div>
        ),
      },
      bookmarkCountColumn<GenreMoodNode>(),
    ],
    [viewClick, modifier],
  );
}
