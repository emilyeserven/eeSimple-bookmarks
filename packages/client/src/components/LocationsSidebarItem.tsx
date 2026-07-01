import { useRef, useState } from "react";

import { Link } from "@tanstack/react-router";
import { ChevronDown, MapPin, MapPinned } from "lucide-react";

import { useIsMobile } from "../hooks/use-mobile";

import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/** The Place Types shortcut revealed by the Locations flyout — shared by desktop popover + mobile inline. */
function PlaceTypesLink({
  onNavigate,
}: {
  onNavigate: () => void;
}) {
  return (
    <Link
      to="/taxonomies/place-types"
      onClick={onNavigate}
      className="
        flex items-center gap-2 rounded-md px-2 py-1.5 text-sm
        hover:bg-accent hover:text-accent-foreground
      "
    >
      <MapPinned className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">Place Types</span>
    </Link>
  );
}

/**
 * The sidebar "Locations" entry with a hover flyout surfacing its Place Types taxonomy. On desktop,
 * hovering the button (or the flyout) opens a popover to the right; on mobile, a chevron expands the
 * shortcut inline (hover popovers don't work on touch). Clicking the button still navigates to the
 * Locations listing. Mirrors {@link SettingsFavoritesFlyout}.
 */
export function LocationsSidebarItem({
  pathname,
}: {
  pathname: string;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = pathname.startsWith("/taxonomies/locations");

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

  const locationsButton = (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip="Locations"
    >
      <Link to="/taxonomies/locations">
        <MapPin />
        <span>Locations</span>
      </Link>
    </SidebarMenuButton>
  );

  // On touch, expand the shortcut inline below the button rather than relying on a hover popover.
  if (isMobile) {
    return (
      <>
        <SidebarMenuItem>
          {locationsButton}
          <SidebarMenuAction
            aria-label={expanded ? "Hide Place Types" : "Show Place Types"}
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
              <PlaceTypesLink onNavigate={() => setExpanded(false)} />
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
            {locationsButton}
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
            Locations
          </p>
          <PlaceTypesLink onNavigate={() => setOpen(false)} />
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
