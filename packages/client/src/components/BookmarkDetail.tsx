import type { Bookmark, Category, CustomProperty, PropertyGroup } from "@eesimple/types";

import { youtubeEmbedUrl } from "@eesimple/types";

import { BookmarkDetailBody } from "./BookmarkDetailBody";
import { BookmarkDetailMedia } from "./BookmarkDetailMedia";
import { BookmarkDetailTabbed } from "./BookmarkDetailTabbed";
import { CopyJsonButton } from "./CopyJsonButton";
import { DetailHeaderActions } from "./DetailHeaderActions";
import { useBookmarkDetailLayout } from "../hooks/useAppSettings";
import { bookmarkToConditionInputJson } from "../lib/debugJson";

import { Separator } from "@/components/ui/separator";

interface BookmarkDetailProps {
  bookmark: Bookmark;
  /** All categories, used to resolve the bookmark's category name/icon/slug. */
  categories?: Category[];
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties?: CustomProperty[];
  /** Property groups, used to group property values under their group headings. */
  propertyGroups?: PropertyGroup[];
  onEdit?: () => void;
  onDelete?: () => void;
  /** When provided, boolean properties with `clickableInView` enabled render as toggles. */
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
}

/**
 * The full view of a single bookmark, showing every field including each custom-property value.
 * Shared by the bookmark detail page and the right panel's bookmark view so the two stay identical.
 * Presentational: pass `categories`/`properties` for labels and `onEdit`/`onDelete` for actions.
 * The body renders as a single stacked column or vertical tabs per the `bookmarkDetailLayout` pref.
 */
export function BookmarkDetail({
  bookmark, categories = [], properties = [], propertyGroups = [], onEdit, onDelete, onSaveBoolean,
}: BookmarkDetailProps) {
  const layout = useBookmarkDetailLayout();

  // For YouTube bookmarks, show a playable embed in place of the static thumbnail.
  const embedUrl = youtubeEmbedUrl(bookmark.url ?? "");

  const isSingle = layout !== "tabbed";

  return (
    <div className="@container space-y-6">
      {isSingle
        ? (
          <>
            {/* Single layout: title + URL on left (space-between), media on right */}
            <div
              className="
                flex flex-col gap-6
                @2xl:flex-row @2xl:items-stretch
              "
            >
              <div
                className="flex min-w-0 flex-1 flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-xl font-bold">
                    <a
                      href={bookmark.url ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="
                        text-primary
                        hover:underline
                      "
                    >
                      {bookmark.title}
                    </a>
                  </h1>
                  <DetailHeaderActions
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
                <a
                  href={bookmark.url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    block truncate text-sm text-muted-foreground
                    hover:underline
                  "
                >
                  {bookmark.url}
                </a>
              </div>
              <BookmarkDetailMedia
                bookmark={bookmark}
                embedUrl={embedUrl}
              />
            </div>
            <BookmarkDetailBody
              bookmark={bookmark}
              categories={categories}
              properties={properties}
              propertyGroups={propertyGroups}
              onSaveBoolean={onSaveBoolean}
            />
          </>
        )
        : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <h1 className="text-xl font-bold">
                  <a
                    href={bookmark.url ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="
                      text-primary
                      hover:underline
                    "
                  >
                    {bookmark.title}
                  </a>
                </h1>
                <a
                  href={bookmark.url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    block truncate text-sm text-muted-foreground
                    hover:underline
                  "
                >
                  {bookmark.url}
                </a>
              </div>
              <DetailHeaderActions
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
            <BookmarkDetailTabbed
              bookmark={bookmark}
              categories={categories}
              properties={properties}
              propertyGroups={propertyGroups}
              embedUrl={embedUrl}
              onSaveBoolean={onSaveBoolean}
            />
          </>
        )}

      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Debug</p>
        <div className="flex flex-wrap gap-2">
          <CopyJsonButton
            data={bookmark}
            label="Copy Bookmark JSON"
          />
          <CopyJsonButton
            data={bookmarkToConditionInputJson(bookmark)}
            label="Copy Condition Input JSON"
          />
        </div>
      </div>
    </div>
  );
}
