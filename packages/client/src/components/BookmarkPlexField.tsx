import type { Bookmark, PlexItemResult } from "@eesimple/types";

import { ExternalLink, Film, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useBookmarkPlexLink } from "../hooks/useBookmarkMediaLinks";
import { useBookmarkPlexSearch } from "../hooks/useBookmarkPlexSearch";
import { useConnectors } from "../hooks/useConnectors";
import { plexItemUrl } from "../lib/plex";

import { DetailField } from "@/components/DetailField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** The Plex web-UI deep link for a resolved rating key, or `null` when the link can't be built. */
function plexUrlFor(
  ratingKey: string,
  connectors: ReturnType<typeof useConnectors>["data"],
): string | null {
  const plex = connectors?.plex;
  if (!plex?.enabled || !plex.baseUrl || !plex.machineIdentifier) return null;
  return plexItemUrl(plex.baseUrl, plex.machineIdentifier, ratingKey);
}

/**
 * The bookmark's linked Plex item as a detail-view value: the item title, deep-linked into Plex's
 * web UI when the connector is enabled and the server's machineIdentifier is known.
 */
export function BookmarkPlexDetailLink({
  bookmark,
}: { bookmark: Bookmark }) {
  const {
    data: connectors,
  } = useConnectors();
  const link = useBookmarkPlexLink(bookmark);
  if (!link) return null;
  const url = plexUrlFor(link.ratingKey, connectors);
  if (!url) return <span>{link.title}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="hover:underline"
    >
      {link.title}
    </a>
  );
}

/**
 * The bookmark detail page's linked-Plex-item row: the `"Plex"` label + Plex web-UI deep link.
 * Renders nothing when the bookmark isn't linked. Self-gating so the pure `bookmarkDetailSections`
 * builder (which can't call hooks itself) can render this row unconditionally.
 */
export function BookmarkPlexDetailRow({
  bookmark,
}: { bookmark: Bookmark }) {
  const {
    t,
  } = useTranslation();
  const plexLink = useBookmarkPlexLink(bookmark);
  if (!plexLink) return null;
  return (
    <DetailField label={t("Plex")}>
      <BookmarkPlexDetailLink bookmark={bookmark} />
    </DetailField>
  );
}

interface BookmarkPlexFieldProps {
  bookmark: Bookmark;
  /** Persists the selection (or `null` to unlink) — the section's immediate-save handler. */
  onSelect: (item: PlexItemResult | null) => void;
}

/** One-line summary of a search hit: title — subtitle (year / library). */
function itemSummary(item: PlexItemResult): string {
  return item.subtitle ? `${item.title} — ${item.subtitle}` : item.title;
}

/**
 * Link a bookmark directly to an item on the connected Plex server. Renders nothing when the Plex
 * connector is unconfigured. Unlinked, it offers a debounced all-kinds item search (proxied through
 * the middleware so the token stays server-side); linked, it shows the item title with a deep link
 * into Plex's web UI and a clear button. Selection and clearing save immediately (like Tags),
 * outside the tab's per-field auto-save flow — the Plex twin of `BookmarkKavitaField`.
 */
export function BookmarkPlexField({
  bookmark,
  onSelect,
}: BookmarkPlexFieldProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: connectors,
  } = useConnectors();
  const {
    query, setQuery, enabled, search,
  } = useBookmarkPlexSearch();

  if (!enabled) return null;

  const linked = bookmark.plexRatingKey !== null;
  const linkUrl = bookmark.plexRatingKey ? plexUrlFor(bookmark.plexRatingKey, connectors) : null;
  const linkedTitle = bookmark.plexItemTitle ?? bookmark.plexRatingKey ?? "";

  return (
    <div className="space-y-1.5">
      <Label htmlFor="bookmark-plex-item">{t("Plex item")}</Label>
      {linked
        ? (
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Film className="size-4 shrink-0 text-muted-foreground" />
            {linkUrl
              ? (
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    flex min-w-0 items-center gap-1 text-sm font-medium
                    underline-offset-2
                    hover:underline
                  "
                >
                  <span className="truncate">{linkedTitle}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              )
              : <span className="truncate text-sm font-medium">{linkedTitle}</span>}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto size-6 shrink-0"
              aria-label={t("Unlink Plex item")}
              onClick={() => onSelect(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        )
        : (
          <>
            <div className="relative">
              <Input
                id="bookmark-plex-item"
                placeholder={t("Search your Plex library…")}
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
              {search.isFetching
                ? (
                  <Loader2
                    className="
                      absolute top-1/2 right-3 size-4 -translate-y-1/2
                      animate-spin text-muted-foreground
                    "
                  />
                )
                : null}
            </div>
            {search.isError
              ? <p className="text-xs text-destructive">{search.error.message}</p>
              : null}
            {search.isSuccess && search.data.length === 0
              ? <p className="text-xs text-muted-foreground">{t("No matching items found.")}</p>
              : null}
            {search.isSuccess && search.data.length > 0
              ? (
                <ul className="space-y-1 rounded-md border p-1">
                  {search.data.map(item => (
                    <li key={`${item.type}:${item.ratingKey}`}>
                      <button
                        type="button"
                        className="
                          w-full rounded-sm px-2 py-1 text-left text-sm
                          hover:bg-accent hover:text-accent-foreground
                        "
                        onClick={() => {
                          onSelect(item);
                          setQuery("");
                        }}
                      >
                        {itemSummary(item)}
                      </button>
                    </li>
                  ))}
                </ul>
              )
              : null}
            <p className="text-xs text-muted-foreground">
              {t("Link this bookmark to an item on your Plex server.")}
            </p>
          </>
        )}
    </div>
  );
}
