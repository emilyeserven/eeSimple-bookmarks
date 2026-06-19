import type { Bookmark, CustomProperty } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";

import { ImageCell } from "./cells";
import { useHiddenCardFields } from "../../lib/bookmarkCardFields";
import { formatBoolean, formatDateTime, formatNumber } from "../../lib/bookmarkFormat";
import { BookmarkTagsBox } from "../BookmarkTagsBox";
import { CategoryPill } from "../CategoryPill";
import { MediaTypePill } from "../MediaTypePill";
import { useViewPanelClick } from "../panel/useEditPanelClick";
import { SourcePill } from "../SourcePill";

import { useCategories } from "@/hooks/useCategories";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** Format a single custom-property value for a bookmark, or `null` when it has no displayable value. */
function formatPropertyValue(bookmark: Bookmark, property: CustomProperty): string | null {
  if (property.type === "number" || property.type === "calculate") {
    const entry = bookmark.numberValues.find(value => value.propertyId === property.id);
    return entry ? formatNumber(entry.value, property) : null;
  }
  if (property.type === "boolean") {
    const entry = bookmark.booleanValues.find(value => value.propertyId === property.id);
    if (!entry) return null;
    if (!entry.value && !property.showIfFalse) return null;
    return formatBoolean(entry.value, property);
  }
  const entry = bookmark.dateTimeValues.find(value => value.propertyId === property.id);
  return entry ? formatDateTime(entry.value, property) : null;
}

interface UseBookmarkTableColumnsArgs {
  properties: CustomProperty[];
  /** Listing-page key, so the table honors that page's Card Options field toggles. */
  pageKey: string;
  /** When the listing is scoped to one category, only that category's applicable properties get columns. */
  categoryId?: string;
}

/**
 * Column definitions for a bookmark listing Table view: fixed taxonomy columns plus one column per
 * applicable, listing-visible custom property. Reuses the same pills, formatters, and
 * `hiddenCardFields` toggles as the bookmark cards so the two views stay consistent.
 */
export function useBookmarkTableColumns({
  properties, pageKey, categoryId,
}: UseBookmarkTableColumnsArgs): ColumnDef<Bookmark>[] {
  const hidden = useHiddenCardFields(pageKey);
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const {
    data: allCategories,
  } = useCategories();

  return useMemo(() => {
    const cols: ColumnDef<Bookmark>[] = [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({
          row,
        }) => (
          <Link
            to="/bookmarks/$bookmarkId"
            params={{
              bookmarkId: row.original.id,
            }}
            title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => viewClick(event, "bookmark", row.original.id)}
            className="
              flex items-center gap-2 font-medium
              hover:underline
            "
          >
            <ImageCell
              src={row.original.website?.imageUrl}
              fallback={<Globe className="size-4" />}
            />
            <span className="line-clamp-2">{row.original.title}</span>
          </Link>
        ),
      },
    ];

    if (!hidden.has("category")) {
      cols.push({
        id: "category",
        header: "Category",
        enableSorting: false,
        cell: ({
          row,
        }) => {
          const category = (allCategories ?? []).find(
            c => c.id === row.original.categoryId && !c.builtIn,
          );
          return category ? <CategoryPill category={category} /> : null;
        },
      });
    }

    if (!hidden.has("website") || !hidden.has("youtubeChannel")) {
      cols.push({
        id: "source",
        header: "Source",
        enableSorting: false,
        cell: ({
          row,
        }) => {
          const {
            website, youtubeChannel,
          } = row.original;
          if (website && !hidden.has("website")) {
            return (
              <SourcePill
                type="website"
                data={website}
              />
            );
          }
          if (youtubeChannel && !hidden.has("youtubeChannel")) {
            return (
              <SourcePill
                type="youtube-channel"
                data={youtubeChannel}
              />
            );
          }
          return null;
        },
      });
    }

    if (!hidden.has("mediaType")) {
      cols.push({
        id: "mediaType",
        header: "Media Type",
        enableSorting: false,
        cell: ({
          row,
        }) => (row.original.mediaType ? <MediaTypePill mediaType={row.original.mediaType} /> : null),
      });
    }

    if (!hidden.has("tags")) {
      cols.push({
        id: "tags",
        header: "Tags",
        enableSorting: false,
        cell: ({
          row,
        }) => (row.original.tags.length > 0 ? <BookmarkTagsBox tags={row.original.tags} /> : null),
      });
    }

    for (const property of properties) {
      if (!property.showInListings || hidden.has(property.id)) continue;
      if (categoryId && !propertyAppliesToCategory(property, categoryId)) continue;
      cols.push({
        id: property.id,
        header: property.name,
        enableSorting: false,
        cell: ({
          row,
        }) => {
          // On the all-bookmarks page rows span categories: only show the value where it applies.
          if (!propertyAppliesToCategory(property, row.original.categoryId)) return null;
          const formatted = formatPropertyValue(row.original, property);
          return formatted ? <span className="text-sm">{formatted}</span> : null;
        },
      });
    }

    cols.push({
      accessorKey: "createdAt",
      header: "Added",
      cell: ({
        row,
      }) => (
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    });

    return cols;
  }, [properties, categoryId, hidden, viewClick, modifier, allCategories]);
}
