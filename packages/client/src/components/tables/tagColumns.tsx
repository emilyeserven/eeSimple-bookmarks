import type { TagNode } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";

import { TreeExpandToggle } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import i18n from "../../i18n";
import { useViewPanelClick } from "../panel/useEditPanelClick";
import { RomanizedLabel } from "../RomanizedLabel";

/** Column definitions for the Tags listing Table view (a flattened, expandable tree). */
export function useTagColumns(): ColumnDef<TagNode>[] {
  const viewClick = useViewPanelClick();
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
              to="/tags/$tagSlug"
              params={{
                tagSlug: row.original.slug,
              }}
              title={i18n.t("Browse bookmarks tagged {{name}}", {
                name: row.original.name,
              })}
              onClick={event => viewClick(event, "tag", row.original.id, row.original.slug)}
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
      bookmarkCountColumn<TagNode>(),
    ],
    [viewClick],
  );
}
