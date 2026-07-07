import type { GenreMoodNode } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";

import { TreeExpandToggle } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import i18n from "../../i18n";
import { LocalizedNameLabel } from "../LocalizedNameLabel";

/** Column definitions for the Genres & Moods listing Table view (a flattened, expandable tree). */
export function useGenreMoodColumns(): ColumnDef<GenreMoodNode>[] {
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
              to="/taxonomies/genres-moods/$genreMoodSlug/info"
              params={{
                genreMoodSlug: row.original.slug,
              }}
              title={row.original.name}
              className="
                font-medium
                hover:underline
              "
            >
              <LocalizedNameLabel
                names={row.original.names ?? []}
                base={row.original.name}
              />
            </Link>
          </div>
        ),
      },
      bookmarkCountColumn<GenreMoodNode>(),
    ],
    [],
  );
}
