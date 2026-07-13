import type { Tag } from "@eesimple/types";

import { useRef, useState } from "react";

import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Tags, Tag as TagIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SidebarCountBadge } from "./SidebarCountBadge";
import { useIsMobile } from "../hooks/use-mobile";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/** One starred-tag shortcut — shared by the desktop popover + the mobile inline list. */
function StarredTagLink({
  tag,
  onNavigate,
}: {
  tag: Tag;
  onNavigate: () => void;
}) {
  return (
    <Link
      to="/tags/$tagSlug"
      params={{
        tagSlug: tag.slug,
      }}
      onClick={onNavigate}
      className="
        flex items-center gap-2 rounded-md px-2 py-1.5 text-sm
        hover:bg-accent hover:text-accent-foreground
      "
    >
      <TagIcon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{tag.name}</span>
      {tag.bookmarkCount != null && tag.bookmarkCount > 0
        ? (
          <Badge
            variant="secondary"
            className="shrink-0"
          >
            {tag.bookmarkCount}
          </Badge>
        )
        : null}
    </Link>
  );
}

/**
 * The sidebar "Tags" entry with a hover flyout surfacing the user's starred tags. On desktop,
 * hovering the button (or the flyout) opens a popover to the right; on mobile the chevron doubles
 * as an expand toggle. Clicking the button still navigates to the Tags listing. When no tags are
 * starred, renders as a plain link with no flyout. Mirrors {@link CategoriesSidebarItem}.
 */
export function TagsSidebarItem({
  pathname,
  tagsCount,
  starredTags,
  sidebarState,
}: {
  pathname: string;
  tagsCount?: number;
  starredTags: Tag[];
  sidebarState?: string;
}) {
  const {
    t,
  } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = pathname.startsWith("/tags");
  const hasStarred = starredTags.length > 0;
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

  const tagsButton = (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={t("Tags")}
    >
      <Link to="/tags">
        <Tags />
        <span className="flex-1 truncate">{t("Tags")}</span>
        {showTrailingContent && tagsCount != null && tagsCount > 0
          ? (
            <Badge
              variant="secondary"
              className="shrink-0"
            >
              {tagsCount}
            </Badge>
          )
          : null}
        {/* Signals the hover flyout even before the user hovers — desktop only, only when starred. */}
        {showTrailingContent && hasStarred && !isMobile
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

  // No starred tags → a plain link, no flyout affordance.
  if (!hasStarred) {
    return (
      <SidebarMenuItem>
        {tagsButton}
        <SidebarCountBadge
          count={tagsCount}
          sidebarState={sidebarState ?? "expanded"}
        />
      </SidebarMenuItem>
    );
  }

  // On touch, expand the shortcuts inline below the button rather than relying on a hover popover.
  if (isMobile) {
    return (
      <>
        <SidebarMenuItem>
          {tagsButton}
          <SidebarMenuAction
            aria-label={expanded ? t("Hide starred tags") : t("Show starred tags")}
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
              <div className="flex flex-col gap-0.5">
                {starredTags.map(tag => (
                  <StarredTagLink
                    key={tag.id}
                    tag={tag}
                    onNavigate={() => setExpanded(false)}
                  />
                ))}
              </div>
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
            {tagsButton}
          </div>
        </PopoverAnchor>
        <PopoverContent
          side="right"
          align="start"
          className="w-56 p-2"
          onOpenAutoFocus={e => e.preventDefault()}
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
            {t("Starred Tags")}
          </p>
          {starredTags.map(tag => (
            <StarredTagLink
              key={tag.id}
              tag={tag}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
