import type { MediaTypeNode } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";

import { TreeExpandToggle } from "./cells";
import { bookmarkCountColumn } from "./columnHelpers";
import i18n from "../../i18n";

import { Badge } from "@/components/ui/badge";
import { builtInName } from "@/lib/builtInName";
import { CategoryIcon } from "@/lib/icons";

/** Column definitions for the Media Types listing Table view (a flattened, expandable tree). */
export function useMediaTypeColumns(): ColumnDef<MediaTypeNode>[] {
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
              to="/taxonomies/media-types/$mediaTypeSlug/info"
              params={{
                mediaTypeSlug: row.original.slug,
              }}
              title={builtInName(row.original, i18n.t)}
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
    [],
  );
}
