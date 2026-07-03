import { useRef, useState } from "react";

import { Link } from "@tanstack/react-router";
import { BookOpen, ChevronDown, ChevronRight, Library } from "lucide-react";

import { useIsMobile } from "../hooks/use-mobile";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/** The Books shortcut revealed by the Media Properties flyout — shared by desktop popover + mobile inline. */
function BooksLink({
  onNavigate,
  booksCount,
}: {
  onNavigate: () => void;
  booksCount?: number;
}) {
  return (
    <Link
      to="/taxonomies/books"
      onClick={onNavigate}
      className="
        flex items-center gap-2 rounded-md px-2 py-1.5 text-sm
        hover:bg-accent hover:text-accent-foreground
      "
    >
      <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">Books</span>
      {booksCount != null && booksCount > 0
        ? (
          <Badge
            variant="secondary"
            className="shrink-0"
          >
            {booksCount}
          </Badge>
        )
        : null}
    </Link>
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
  sidebarState,
}: {
  pathname: string;
  mediaPropertiesCount?: number;
  booksCount?: number;
  sidebarState?: string;
}) {
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
      tooltip="Media Properties"
    >
      <Link to="/taxonomies/media-properties">
        <Library />
        <span className="flex-1 truncate">Media Properties</span>
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
            aria-label={expanded ? "Hide Books" : "Show Books"}
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
              <BooksLink
                onNavigate={() => setExpanded(false)}
                booksCount={booksCount}
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
            Media Properties
          </p>
          <BooksLink
            onNavigate={() => setOpen(false)}
            booksCount={booksCount}
          />
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
