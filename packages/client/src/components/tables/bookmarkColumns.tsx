import type { Bookmark, BookmarkImageVisibility, CustomProperty } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";

import { BookmarkImageColumnCell } from "./bookmarkImageCell";
import {
  BookmarkCategoryColumnCell,
  BookmarkMediaTypeColumnCell,
  BookmarkPropertyColumnCell,
  BookmarkSourceColumnCell,
  BookmarkTagsColumnCell,
} from "./bookmarkPillCells";
import { BookmarkTitleColumnCell } from "./bookmarkTitleCell";
import i18n from "../../i18n";
import { useDefaultFieldZones, useHideWebsiteForYouTube } from "../../lib/bookmarkCardFields";
import { resolveFieldPlacements } from "../../lib/bookmarkCardValues";
import { useBookmarkImageMode, useBookmarkImageVisibility } from "../../lib/bookmarkColumns";

import { useCategories } from "@/hooks/useCategories";

interface UseBookmarkTableColumnsArgs {
  properties: CustomProperty[];
  /** Listing-page key, so the table honors that page's Card Options field toggles. Omitted for DB-backed surfaces. */
  pageKey?: string;
  /** When the listing is scoped to one category, only that category's applicable properties get columns. */
  categoryId?: string;
  /** Explicit hidden field keys, overriding the `pageKey` lookup (homepage sections). */
  hidden?: Set<string>;
  /** Explicit image aspect mode, overriding the `pageKey` lookup (homepage sections). */
  imageMode?: string;
  /** Explicit image visibility, overriding the `pageKey` lookup (homepage sections). */
  imageVisibility?: BookmarkImageVisibility;
  /** Explicit "hide website pill for YouTube" value, overriding the Default card display rule (homepage sections). */
  hideWebsiteForYouTube?: boolean;
}

/**
 * Column definitions for a bookmark listing Table view: fixed taxonomy columns plus one column per
 * applicable, listing-visible custom property. Reuses the same pills, formatters, and
 * `hiddenCardFields` toggles as the bookmark cards so the two views stay consistent. Display state
 * comes from `pageKey` (listings) or explicit overrides (DB-backed homepage sections).
 */
export function useBookmarkTableColumns({
  properties, pageKey, categoryId,
  hidden: hiddenOverride,
  imageMode: imageModeOverride,
  imageVisibility: imageVisibilityOverride,
  hideWebsiteForYouTube: hideWebsiteForYouTubeOverride,
}: UseBookmarkTableColumnsArgs): ColumnDef<Bookmark>[] {
  const defaultZones = useDefaultFieldZones();
  const pageImageMode = useBookmarkImageMode(pageKey ?? "");
  const pageImageVisibility = useBookmarkImageVisibility(pageKey ?? "");
  const defaultHideWebsiteForYouTube = useHideWebsiteForYouTube();
  const hideWebsiteForYouTube = hideWebsiteForYouTubeOverride ?? defaultHideWebsiteForYouTube;
  // Field visibility: an explicit override (homepage sections) wins; otherwise a field is shown when
  // the Default card display rule places it in any zone (a corner placement still gets a table column).
  const defaultPlacements = defaultZones ? resolveFieldPlacements(defaultZones) : null;
  const imageMode = imageModeOverride ?? pageImageMode;
  const imageVisibility = imageVisibilityOverride ?? pageImageVisibility;
  const {
    data: allCategories,
  } = useCategories();

  return useMemo(() => {
    const fieldHidden = (key: string): boolean =>
      hiddenOverride
        ? hiddenOverride.has(key)
        : defaultPlacements
          ? !defaultPlacements.has(key)
          : false;
    const cols: ColumnDef<Bookmark>[] = [];

    if (imageVisibility !== "off") {
      cols.push({
        id: "image",
        header: "",
        size: 76,
        minSize: 76,
        maxSize: 76,
        enableResizing: false,
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <BookmarkImageColumnCell
            bookmark={row.original}
            imageMode={imageMode}
          />
        ),
      });
    }

    cols.push({
      accessorKey: "title",
      header: i18n.t("Title"),
      size: 400,
      minSize: 120,
      meta: {
        fill: true,
      },
      cell: ({
        row,
      }) => <BookmarkTitleColumnCell bookmark={row.original} />,
    });

    if (!fieldHidden("category")) {
      cols.push({
        id: "category",
        header: i18n.t("Category"),
        size: 120,
        minSize: 80,
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <BookmarkCategoryColumnCell
            bookmark={row.original}
            allCategories={allCategories ?? []}
          />
        ),
      });
    }

    if (!fieldHidden("website") || !fieldHidden("youtubeChannel")) {
      cols.push({
        id: "source",
        header: i18n.t("Source"),
        size: 140,
        minSize: 80,
        enableSorting: false,
        cell: ({
          row,
        }) => (
          <BookmarkSourceColumnCell
            bookmark={row.original}
            hideWebsiteForYouTube={hideWebsiteForYouTube}
            websiteHidden={fieldHidden("website")}
            youtubeChannelHidden={fieldHidden("youtubeChannel")}
          />
        ),
      });
    }

    if (!fieldHidden("mediaType")) {
      cols.push({
        id: "mediaType",
        header: i18n.t("Media Type"),
        size: 120,
        minSize: 80,
        enableSorting: false,
        cell: ({
          row,
        }) => <BookmarkMediaTypeColumnCell bookmark={row.original} />,
      });
    }

    if (!fieldHidden("tags")) {
      cols.push({
        id: "tags",
        header: i18n.t("Tags"),
        size: 160,
        minSize: 80,
        enableSorting: false,
        cell: ({
          row,
        }) => <BookmarkTagsColumnCell bookmark={row.original} />,
      });
    }

    for (const property of properties) {
      if (!property.showInListings || fieldHidden(property.id)) continue;
      if (categoryId && !propertyAppliesToCategory(property, categoryId)) continue;
      cols.push({
        id: property.id,
        header: property.name,
        size: 120,
        minSize: 80,
        enableSorting: false,
        cell: ({
          row,
        }) => {
          // On the all-bookmarks page rows span categories: only show the value where it applies.
          if (!propertyAppliesToCategory(property, row.original.categoryId)) return null;
          const showIfFalse = defaultPlacements?.get(property.id)?.showIfFalse ?? false;
          return (
            <BookmarkPropertyColumnCell
              bookmark={row.original}
              property={property}
              showIfFalse={showIfFalse}
            />
          );
        },
      });
    }

    cols.push({
      accessorKey: "createdAt",
      header: i18n.t("Added"),
      size: 100,
      minSize: 80,
      cell: ({
        row,
      }) => (
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    });

    return cols;
  }, [
    properties,
    categoryId,
    hiddenOverride,
    defaultPlacements,
    allCategories,
    imageVisibility,
    imageMode,
    hideWebsiteForYouTube,
  ]);
}
