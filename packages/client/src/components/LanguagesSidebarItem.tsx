import { useRef, useState } from "react";

import { Link } from "@tanstack/react-router";
import { Captions, ChevronDown, ChevronRight, Languages } from "lucide-react";

import { useIsMobile } from "../hooks/use-mobile";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/** The Usage Levels shortcut revealed by the Languages flyout — shared by desktop popover + mobile inline. */
function UsageLevelsLink({
  onNavigate,
  usageLevelsCount,
}: {
  onNavigate: () => void;
  usageLevelsCount?: number;
}) {
  return (
    <Link
      to="/taxonomies/language-usage-levels"
      onClick={onNavigate}
      className="
        flex items-center gap-2 rounded-md px-2 py-1.5 text-sm
        hover:bg-accent hover:text-accent-foreground
      "
    >
      <Captions className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">Usage Levels</span>
      {usageLevelsCount != null && usageLevelsCount > 0
        ? (
          <Badge
            variant="secondary"
            className="shrink-0"
          >
            {usageLevelsCount}
          </Badge>
        )
        : null}
    </Link>
  );
}

/**
 * The sidebar "Languages" entry with a hover flyout surfacing its Usage Levels taxonomy. On desktop,
 * hovering the button (or the flyout) opens a popover to the right — a chevron affordance on the
 * button signals the flyout even before hovering; on mobile, the same chevron doubles as the expand
 * toggle (hover popovers don't work on touch). Clicking the button still navigates to the Languages
 * listing. Mirrors {@link GroupsSidebarItem}.
 */
export function LanguagesSidebarItem({
  pathname,
  languagesCount,
  usageLevelsCount,
  sidebarState,
}: {
  pathname: string;
  languagesCount?: number;
  usageLevelsCount?: number;
  sidebarState?: string;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = pathname.startsWith("/taxonomies/languages");
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

  const languagesButton = (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip="Languages"
    >
      <Link to="/taxonomies/languages">
        <Languages />
        <span className="flex-1 truncate">Languages</span>
        {showTrailingContent && languagesCount != null && languagesCount > 0
          ? (
            <Badge
              variant="secondary"
              className="shrink-0"
            >
              {languagesCount}
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
          {languagesButton}
          <SidebarMenuAction
            aria-label={expanded ? "Hide Usage Levels" : "Show Usage Levels"}
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
              <UsageLevelsLink
                onNavigate={() => setExpanded(false)}
                usageLevelsCount={usageLevelsCount}
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
            {languagesButton}
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
            Languages
          </p>
          <UsageLevelsLink
            onNavigate={() => setOpen(false)}
            usageLevelsCount={usageLevelsCount}
          />
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
