import type { Bookmark } from "@eesimple/types";
import type { MouseEvent } from "react";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { ChevronDown, ExternalLink, ShoppingBasket, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useBookmarks } from "../hooks/useBookmarks";
import { openBasketTabs } from "../lib/openBasketTabs";
import { useBasketStore } from "../stores/basketStore";

import { Button } from "@/components/ui/button";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

/**
 * The Tab Basket panel in the sidebar footer (directly above the Settings / "Manage preferences"
 * button). Desktop-only. Collapsed it is a single line — a basket icon, the count, an expander, and
 * an "open all in tabs" button; expanded it reveals a bounded (≤10em), scrollable list of basketed
 * bookmarks with per-row remove and a "Clear basket" action. The basket persists across reloads and
 * is only emptied on request (see {@link useBasketStore}).
 */
export function SidebarTabBasket() {
  const {
    t,
  } = useTranslation();
  const {
    state, isMobile,
  } = useSidebar();
  const bookmarkIds = useBasketStore(s => s.bookmarkIds);
  const remove = useBasketStore(s => s.remove);
  const clear = useBasketStore(s => s.clear);
  const {
    data: bookmarks,
  } = useBookmarks();
  const [expanded, setExpanded] = useState(false);

  // Desktop-only feature.
  if (isMobile) return null;

  const byId = new Map((bookmarks ?? []).map(b => [b.id, b] as const));
  const resolved: Bookmark[] = bookmarkIds.flatMap((id) => {
    const bookmark = byId.get(id);
    return bookmark ? [bookmark] : [];
  });
  const openableUrls = resolved.flatMap(b => (b.url ? [b.url] : []));
  const count = bookmarkIds.length;

  const openAll = () => openBasketTabs(openableUrls);

  // CMD (macOS) / Ctrl (Windows/Linux) + click opens the bookmark's *external* link in a new tab
  // instead of navigating to its detail page. Falls through to the normal Link navigation when the
  // bookmark has no url. Reuses the same trusted-handler window.open path as "open all" for Arc
  // compatibility (see {@link openBasketTabs}).
  const handleRowClick = (bookmark: Bookmark) => (event: MouseEvent) => {
    if ((event.metaKey || event.ctrlKey) && bookmark.url) {
      event.preventDefault();
      openBasketTabs([bookmark.url]);
    }
  };

  // In icon-collapsed mode the rail is too narrow for the list — show just an icon button that opens
  // all basketed tabs, with the count as a small overlay badge.
  if (state === "collapsed") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={t("Open Basket tabs")}
            disabled={openableUrls.length === 0}
            onClick={openAll}
          >
            <div className="relative">
              <ShoppingBasket />
              {count > 0 && (
                <span
                  className="
                    absolute -top-1.5 -right-1.5 flex min-w-3.5 items-center
                    justify-center rounded-full bg-sidebar-primary px-1
                    text-[0.625rem]/3.5 text-sidebar-primary-foreground
                  "
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </div>
            <span>{t("Basket")}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <div className="px-1 pb-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          aria-expanded={expanded}
          className="
            flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5
            text-sm
            hover:bg-accent hover:text-accent-foreground
          "
        >
          <ShoppingBasket className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{t("Basket")}</span>
          <span className="text-xs text-muted-foreground">({count})</span>
          <ChevronDown
            className={`
              ml-auto size-3.5 shrink-0 transition-transform duration-200
              ${expanded ? "" : "-rotate-90"}
            `}
          />
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label={t("Open Basket tabs")}
          title={t("Open all basket links in new tabs")}
          disabled={openableUrls.length === 0}
          onClick={openAll}
        >
          <ExternalLink className="size-4" />
        </Button>
      </div>

      {expanded && (
        <div className="mt-1">
          {resolved.length === 0
            ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                {t("Basket is empty. Add bookmarks to open them all at once.")}
              </p>
            )
            : (
              <>
                <ul className="max-h-[10em] space-y-0.5 overflow-y-auto">
                  {resolved.map(bookmark => (
                    <li
                      key={bookmark.id}
                      className="
                        group flex items-center gap-1 rounded-md pr-1
                        hover:bg-accent hover:text-accent-foreground
                      "
                    >
                      <Link
                        to="/bookmarks/$bookmarkId"
                        params={{
                          bookmarkId: bookmark.id,
                        }}
                        className="min-w-0 flex-1 truncate px-2 py-1 text-xs"
                        title={bookmark.url
                          ? t("{{title}} — ⌘/Ctrl+click to open the link in a new tab", {
                            title: bookmark.title,
                          })
                          : bookmark.title}
                        onClick={handleRowClick(bookmark)}
                      >
                        {bookmark.title}
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0"
                        aria-label={t("Remove from Basket")}
                        onClick={() => remove(bookmark.id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="ghost"
                  size="sm"
                  className="
                    mt-1 h-7 w-full justify-start text-xs text-muted-foreground
                  "
                  onClick={clear}
                >
                  <Trash2 className="size-3.5" />
                  {t("Clear basket")}
                </Button>
              </>
            )}
        </div>
      )}
    </div>
  );
}
