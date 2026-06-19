import type { Bookmark, Category, CustomProperty, PropertyGroup } from "@eesimple/types";

import { youtubeEmbedUrl } from "@eesimple/types";

import { BookmarkDetailBody } from "./BookmarkDetailBody";
import { DetailHeaderActions } from "./DetailHeaderActions";

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
}

/**
 * The full view of a single bookmark, showing every field including each custom-property value.
 * Shared by the bookmark detail page and the right panel's bookmark view so the two stay identical.
 * Presentational: pass `categories`/`properties` for labels and `onEdit`/`onDelete` for actions.
 */
export function BookmarkDetail({
  bookmark, categories = [], properties = [], propertyGroups = [], onEdit, onDelete,
}: BookmarkDetailProps) {
  // For YouTube bookmarks, show a playable embed in place of the static thumbnail.
  const embedUrl = youtubeEmbedUrl(bookmark.url);

  return (
    <div className="@container space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-bold">
            <a
              href={bookmark.url}
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
            href={bookmark.url}
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

      <div
        className="
          flex flex-col gap-6
          @2xl:flex-row @2xl:items-start
        "
      >
        {embedUrl
          ? (
            <div
              className="
                aspect-video w-full overflow-hidden rounded-md border
                @2xl:w-96 @2xl:shrink-0
              "
            >
              <iframe
                src={embedUrl}
                title={bookmark.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="size-full"
              />
            </div>
          )
          : bookmark.image
            ? (
              <img
                src={bookmark.image.url}
                alt=""
                loading="lazy"
                className="
                  max-h-72 w-full rounded-md border object-contain
                  @2xl:w-72 @2xl:shrink-0
                "
              />
            )
            : null}

        <BookmarkDetailBody
          bookmark={bookmark}
          categories={categories}
          properties={properties}
          propertyGroups={propertyGroups}
        />
      </div>
    </div>
  );
}
