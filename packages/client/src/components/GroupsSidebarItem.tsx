import { useRef, useState } from "react";

import { Link } from "@tanstack/react-router";
import { Building2, ChevronDown, ChevronRight, Shapes } from "lucide-react";

import { useIsMobile } from "../hooks/use-mobile";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/** The Group Types shortcut revealed by the Groups flyout — shared by desktop popover + mobile inline. */
function GroupTypesLink({
  onNavigate,
  groupTypesCount,
}: {
  onNavigate: () => void;
  groupTypesCount?: number;
}) {
  return (
    <Link
      to="/taxonomies/group-types"
      onClick={onNavigate}
      className="
        flex items-center gap-2 rounded-md px-2 py-1.5 text-sm
        hover:bg-accent hover:text-accent-foreground
      "
    >
      <Shapes className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">Group Types</span>
      {groupTypesCount != null && groupTypesCount > 0
        ? (
          <Badge
            variant="secondary"
            className="shrink-0"
          >
            {groupTypesCount}
          </Badge>
        )
        : null}
    </Link>
  );
}

/**
 * The sidebar "Groups" entry with a hover flyout surfacing its Group Types taxonomy. On desktop,
 * hovering the button (or the flyout) opens a popover to the right — a chevron affordance on the
 * button signals the flyout even before hovering; on mobile, the same chevron doubles as the expand
 * toggle (hover popovers don't work on touch). Clicking the button still navigates to the Groups
 * listing. Mirrors {@link LocationsSidebarItem}.
 */
export function GroupsSidebarItem({
  pathname,
  groupsCount,
  groupTypesCount,
  sidebarState,
}: {
  pathname: string;
  groupsCount?: number;
  groupTypesCount?: number;
  sidebarState?: string;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = pathname.startsWith("/taxonomies/groups");
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

  const groupsButton = (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip="Groups"
    >
      <Link to="/taxonomies/groups">
        <Building2 />
        <span className="flex-1 truncate">Groups</span>
        {showTrailingContent && groupsCount != null && groupsCount > 0
          ? (
            <Badge
              variant="secondary"
              className="shrink-0"
            >
              {groupsCount}
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
          {groupsButton}
          <SidebarMenuAction
            aria-label={expanded ? "Hide Group Types" : "Show Group Types"}
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
              <GroupTypesLink
                onNavigate={() => setExpanded(false)}
                groupTypesCount={groupTypesCount}
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
            {groupsButton}
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
            Groups
          </p>
          <GroupTypesLink
            onNavigate={() => setOpen(false)}
            groupTypesCount={groupTypesCount}
          />
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
