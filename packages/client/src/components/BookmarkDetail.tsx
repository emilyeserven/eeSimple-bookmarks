import type { Bookmark } from "@eesimple/types";

import { youtubeEmbedUrl } from "@eesimple/types";
import { BookOpen, ShoppingBasket } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BookmarkArchiveLinkButton, BookmarkArchiveNowButton } from "./BookmarkCardActions";
import { BookmarkDetailBody } from "./BookmarkDetailBody";
import { BookmarkDetailMedia } from "./BookmarkDetailMedia";
import { BookmarkDetailTabbed } from "./BookmarkDetailTabbed";
import { DetailHeaderActions } from "./DetailHeaderActions";
import { LocalizedNameLabel } from "./LocalizedNameLabel";
import { useBookmarkDetailLayout } from "../hooks/useAppSettings";
import { useConnectors } from "../hooks/useConnectors";
import { kavitaSeriesUrl } from "../lib/kavita";
import { useBasketStore } from "../stores/basketStore";

import { Button } from "@/components/ui/button";

/** A ghost icon toggle that adds/removes this bookmark from the Tab Basket (detail-header action). */
function BookmarkBasketToggleButton({
  bookmarkId,
}: {
  bookmarkId: string;
}) {
  const {
    t,
  } = useTranslation();
  const inBasket = useBasketStore(s => s.bookmarkIds.includes(bookmarkId));
  const toggle = useBasketStore(s => s.toggle);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={inBasket ? t("Remove from Basket") : t("Add to Basket")}
      title={inBasket ? t("Remove from Basket") : t("Add to Basket")}
      aria-pressed={inBasket}
      onClick={() => toggle(bookmarkId)}
    >
      <ShoppingBasket className={inBasket ? "text-primary" : undefined} />
    </Button>
  );
}

interface BookmarkDetailProps {
  bookmark: Bookmark;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * The full view of a single bookmark, showing every field including each custom-property value.
 * Shared by the bookmark detail page and the right panel's bookmark view so the two stay identical.
 * The body is layout-driven (the `"bookmark"` field registry): it resolves the stored/default
 * `EntityLayout` and renders each view field, self-loading the data each field needs — so only the
 * bookmark + optional `onEdit`/`onDelete` header actions are passed in. The body renders as a single
 * stacked column or horizontal tabs per the `bookmarkDetailLayout` pref.
 */
export function BookmarkDetail({
  bookmark, onEdit, onDelete,
}: BookmarkDetailProps) {
  const {
    t,
  } = useTranslation();
  const layout = useBookmarkDetailLayout();
  const {
    data: connectors,
  } = useConnectors();

  // For YouTube bookmarks, show a playable embed in place of the static thumbnail.
  const embedUrl = youtubeEmbedUrl(bookmark.url ?? "", connectors?.youtubeEmbed.useNoCookie ?? true);

  const isSingle = layout !== "tabbed";

  // ArchiveBox link-outs render only when the connector is configured and the bookmark has a url.
  const archiveBaseUrl = connectors?.archiveBox.baseUrl ?? null;
  const showArchive = archiveBaseUrl !== null && Boolean(bookmark.url);

  // "View on Kavita" renders only when the connector is enabled and the bookmark is linked.
  const kavitaBaseUrl = connectors?.kavita.enabled ? connectors.kavita.baseUrl : null;
  const showKavita = kavitaBaseUrl !== null
    && bookmark.kavitaSeriesId !== null
    && bookmark.kavitaLibraryId !== null;

  return (
    <div className="@container space-y-6">
      {/* Shared header — identical in Single and Tabbed modes */}
      <div
        className="
          flex flex-col gap-6
          @2xl:flex-row @2xl:items-center
        "
      >
        <div className="min-w-0 flex-1 space-y-1">
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
                <LocalizedNameLabel
                  names={bookmark.names}
                  base={bookmark.title}
                  stacked
                />
              </a>
            </h1>
            <div className="flex items-center gap-1">
              {showArchive && archiveBaseUrl !== null && bookmark.url && (
                <>
                  <BookmarkArchiveLinkButton
                    baseUrl={archiveBaseUrl}
                    url={bookmark.url}
                  />
                  <BookmarkArchiveNowButton
                    baseUrl={archiveBaseUrl}
                    url={bookmark.url}
                  />
                </>
              )}
              <BookmarkBasketToggleButton bookmarkId={bookmark.id} />
              <DetailHeaderActions
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </div>
          {showKavita && kavitaBaseUrl !== null
            && bookmark.kavitaLibraryId !== null && bookmark.kavitaSeriesId !== null && (
            <a
              href={kavitaSeriesUrl(kavitaBaseUrl, bookmark.kavitaLibraryId, bookmark.kavitaSeriesId)}
              target="_blank"
              rel="noreferrer"
              className="
                flex w-fit items-center gap-1 text-sm text-muted-foreground
                hover:underline
              "
            >
              <BookOpen className="size-3.5" />
              {t("View on Kavita")}
            </a>
          )}
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
      {isSingle
        ? <BookmarkDetailBody bookmark={bookmark} />
        : <BookmarkDetailTabbed bookmark={bookmark} />}

    </div>
  );
}
