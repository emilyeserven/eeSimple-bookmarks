import type { LucideIcon } from "lucide-react";

import { useRef, useState } from "react";

import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Disc3,
  Film,
  Library,
  Music,
  Podcast,
  Tv,
  Tv2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useIsMobile } from "../hooks/use-mobile";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/** A single taxonomy shortcut inside the Media Properties flyout — shared by desktop + mobile. */
function FlyoutChildLink({
  to,
  icon: Icon,
  label,
  count,
  onNavigate,
}: {
  to:
    | "/taxonomies/books"
    | "/taxonomies/podcasts"
    | "/taxonomies/movies"
    | "/taxonomies/tv-shows"
    | "/taxonomies/episodes"
    | "/taxonomies/albums"
    | "/taxonomies/tracks";
  icon: LucideIcon;
  label: string;
  count?: number;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="
        flex items-center gap-2 rounded-md px-2 py-1.5 text-sm
        hover:bg-accent hover:text-accent-foreground
      "
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{label}</span>
      {count != null && count > 0
        ? (
          <Badge
            variant="secondary"
            className="shrink-0"
          >
            {count}
          </Badge>
        )
        : null}
    </Link>
  );
}

/** The eight Media Properties flyout children, rendered for both the desktop popover and mobile inline. */
function FlyoutChildren({
  booksCount,
  podcastsCount,
  moviesCount,
  tvShowsCount,
  episodesCount,
  albumsCount,
  tracksCount,
  onNavigate,
}: {
  booksCount?: number;
  podcastsCount?: number;
  moviesCount?: number;
  tvShowsCount?: number;
  episodesCount?: number;
  albumsCount?: number;
  tracksCount?: number;
  onNavigate: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <>
      <FlyoutChildLink
        to="/taxonomies/books"
        icon={BookOpen}
        label={t("Books")}
        count={booksCount}
        onNavigate={onNavigate}
      />
      <FlyoutChildLink
        to="/taxonomies/podcasts"
        icon={Podcast}
        label={t("Podcasts")}
        count={podcastsCount}
        onNavigate={onNavigate}
      />
      <FlyoutChildLink
        to="/taxonomies/movies"
        icon={Film}
        label={t("Movies")}
        count={moviesCount}
        onNavigate={onNavigate}
      />
      <FlyoutChildLink
        to="/taxonomies/tv-shows"
        icon={Tv}
        label={t("TV Shows")}
        count={tvShowsCount}
        onNavigate={onNavigate}
      />
      <FlyoutChildLink
        to="/taxonomies/episodes"
        icon={Tv2}
        label={t("Episodes")}
        count={episodesCount}
        onNavigate={onNavigate}
      />
      <FlyoutChildLink
        to="/taxonomies/albums"
        icon={Disc3}
        label={t("Albums")}
        count={albumsCount}
        onNavigate={onNavigate}
      />
      <FlyoutChildLink
        to="/taxonomies/tracks"
        icon={Music}
        label={t("Tracks")}
        count={tracksCount}
        onNavigate={onNavigate}
      />
    </>
  );
}

/**
 * The sidebar "Media Properties" entry with a hover flyout surfacing its Books taxonomy. On desktop,
 * hovering the button (or the flyout) opens a popover to the right — a chevron affordance on the
 * button signals the flyout even before hovering; on mobile, the same chevron doubles as the expand
 * toggle (hover popovers don't work on touch). Clicking the button still navigates to the Media
 * Properties listing. Mirrors {@link LocationsSidebarItem}.
 */
export function MediaPropertiesSidebarItem({
  pathname,
  mediaPropertiesCount,
  booksCount,
  podcastsCount,
  moviesCount,
  tvShowsCount,
  episodesCount,
  albumsCount,
  tracksCount,
  sidebarState,
}: {
  pathname: string;
  mediaPropertiesCount?: number;
  booksCount?: number;
  podcastsCount?: number;
  moviesCount?: number;
  tvShowsCount?: number;
  episodesCount?: number;
  albumsCount?: number;
  tracksCount?: number;
  sidebarState?: string;
}) {
  const {
    t,
  } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = pathname.startsWith("/taxonomies/media-properties");
  const showTrailingContent = sidebarState !== "collapsed";

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openNow() {
    cancelClose();
    setOpen(true);
  }

  function closeSoon() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  const mediaPropertiesButton = (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={t("Media Properties")}
    >
      <Link to="/taxonomies/media-properties">
        <Library />
        <span className="flex-1 truncate">{t("Media Properties")}</span>
        {showTrailingContent && mediaPropertiesCount != null && mediaPropertiesCount > 0
          ? (
            <Badge
              variant="secondary"
              className="shrink-0"
            >
              {mediaPropertiesCount}
            </Badge>
          )
          : null}
        {/* Signals the hover flyout even before the user hovers — desktop only, mobile has its own toggle. */}
        {showTrailingContent && !isMobile
          ? (
            <ChevronRight
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          )
          : null}
      </Link>
    </SidebarMenuButton>
  );

  // On touch, expand the shortcut inline below the button rather than relying on a hover popover.
  if (isMobile) {
    return (
      <>
        <SidebarMenuItem>
          {mediaPropertiesButton}
          <SidebarMenuAction
            aria-label={expanded ? t("Hide taxonomies") : t("Show taxonomies")}
            onClick={() => setExpanded(value => !value)}
          >
            <ChevronDown
              className={`
                transition-transform duration-200
                ${expanded ? "" : "-rotate-90"}
              `}
            />
          </SidebarMenuAction>
        </SidebarMenuItem>
        {expanded
          ? (
            <SidebarMenuItem className="px-1 pb-1">
              <FlyoutChildren
                booksCount={booksCount}
                podcastsCount={podcastsCount}
                moviesCount={moviesCount}
                tvShowsCount={tvShowsCount}
                episodesCount={episodesCount}
                albumsCount={albumsCount}
                tracksCount={tracksCount}
                onNavigate={() => setExpanded(false)}
              />
            </SidebarMenuItem>
          )
          : null}
      </>
    );
  }

  return (
    <SidebarMenuItem>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverAnchor asChild>
          <div
            onMouseEnter={openNow}
            onMouseLeave={closeSoon}
          >
            {mediaPropertiesButton}
          </div>
        </PopoverAnchor>
        <PopoverContent
          side="right"
          align="start"
          className="w-48 p-2"
          onOpenAutoFocus={e => e.preventDefault()}
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
            {t("Media Properties")}
          </p>
          <FlyoutChildren
            booksCount={booksCount}
            podcastsCount={podcastsCount}
            moviesCount={moviesCount}
            tvShowsCount={tvShowsCount}
            episodesCount={episodesCount}
            albumsCount={albumsCount}
            tracksCount={tracksCount}
            onNavigate={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
