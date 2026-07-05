import type { Podcast } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { EditActionCell } from "./cells";
import i18n from "../../i18n";
import { useEditPanelClick } from "../panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";

/** Column definitions for the Podcasts listing Table view. */
export function usePodcastColumns(): ColumnDef<Podcast>[] {
  const editClick = useEditPanelClick();
  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("Name"),
        cell: ({
          row,
        }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: "authors",
        header: i18n.t("Authors"),
        enableSorting: false,
        cell: ({
          row,
        }) => {
          const count = row.original.personIds.length + row.original.groupIds.length;
          return (
            <span className="text-muted-foreground">
              {count > 0
                ? i18n.t(count === 1 ? "{{count}} author" : "{{count}} authors", {
                  count,
                })
                : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "feedUrl",
        header: i18n.t("Feed"),
        enableSorting: false,
        cell: ({
          row,
        }) => (row.original.feedUrl
          ? (
            <a
              href={row.original.feedUrl}
              target="_blank"
              rel="noreferrer"
              className="
                text-muted-foreground
                hover:underline
              "
              onClick={event => event.stopPropagation()}
            >
              {i18n.t("Feed")}
            </a>
          )
          : <span className="text-muted-foreground">—</span>),
      },
      {
        accessorKey: "bookmarkCount",
        header: i18n.t("Bookmarks"),
        cell: ({
          row,
        }) => (row.original.bookmarkCount !== undefined
          ? <Badge variant="secondary">{row.original.bookmarkCount}</Badge>
          : null),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <EditActionCell
            to="/taxonomies/podcasts/$podcastSlug/edit"
            params={{
              podcastSlug: row.original.slug,
            }}
            label={i18n.t("Edit {{name}}", {
              name: row.original.name,
            })}
            onClick={event => editClick(event, "podcast", row.original.id)}
          />
        ),
      },
    ],
    [editClick],
  );
}
