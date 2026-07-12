import type { TaxonomyTermNode } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";

import { TreeExpandToggle } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import i18n from "../../i18n";
import { LocalizedNameLabel } from "../LocalizedNameLabel";

/** Column definitions for a taxonomy-term listing Table view (a flattened, expandable tree). Mirrors
 * `useGenreMoodColumns`, generalized to any user taxonomy. */
export function useTaxonomyTermColumns(taxonomySlug: string): ColumnDef<TaxonomyTermNode>[] {
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
              to="/taxonomies/$taxonomyKey/$termSlug/info"
              params={{
                taxonomyKey: taxonomySlug,
                termSlug: row.original.slug,
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
      bookmarkCountColumn<TaxonomyTermNode>(),
    ],
    [taxonomySlug],
  );
}
