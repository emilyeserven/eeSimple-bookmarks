import { useRef, useState } from "react";

import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, MapPin, MapPinned, Waypoints } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useIsMobile } from "../hooks/use-mobile";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/** The Place Types shortcut revealed by the Locations flyout — shared by desktop popover + mobile inline. */
function PlaceTypesLink({
  onNavigate,
  placeTypesCount,
}: {
  onNavigate: () => void;
  placeTypesCount?: number;
}) {
  const {
    t,
  } = useTranslation();
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
      <span className="flex-1 truncate">{t("Place Types")}</span>
      {placeTypesCount != null && placeTypesCount > 0
        ? (
          <Badge
            variant="secondary"
            className="shrink-0"
          >
            {placeTypesCount}
          </Badge>
        )
        : null}
    </Link>
  );
}

/** The Location Relations shortcut revealed by the Locations flyout — shared by desktop + mobile. */
function LocationRelationsLink({
  onNavigate,
  locationRelationsCount,
}: {
  onNavigate: () => void;
  locationRelationsCount?: number;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <Link
      to="/taxonomies/location-relations"
      onClick={onNavigate}
      className="
        flex items-center gap-2 rounded-md px-2 py-1.5 text-sm
        hover:bg-accent hover:text-accent-foreground
      "
    >
      <Waypoints className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{t("Location Relations")}</span>
      {locationRelationsCount != null && locationRelationsCount > 0
        ? (
          <Badge
            variant="secondary"
            className="shrink-0"
          >
            {locationRelationsCount}
          </Badge>
        )
        : null}
    </Link>
  );
}

/**
 * The sidebar "Locations" entry with a hover flyout surfacing its Place Types taxonomy. On desktop,
 * hovering the button (or the flyout) opens a popover to the right — a chevron affordance on the
 * button signals the flyout even before hovering; on mobile, the same chevron doubles as the expand
 * toggle (hover popovers don't work on touch). Clicking the button still navigates to the Locations
 * listing. Mirrors {@link SettingsFavoritesFlyout}.
 */
export function LocationsSidebarItem({
  pathname,
  locationsCount,
  placeTypesCount,
  locationRelationsCount,
  sidebarState,
}: {
  pathname: string;
  locationsCount?: number;
  placeTypesCount?: number;
  locationRelationsCount?: number;
  sidebarState?: string;
}) {
  const {
    t,
  } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = pathname.startsWith("/taxonomies/locations");
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

  const locationsButton = (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={t("Locations")}
    >
      <Link to="/taxonomies/locations">
        <MapPin />
        <span className="flex-1 truncate">{t("Locations")}</span>
        {showTrailingContent && locationsCount != null && locationsCount > 0
          ? (
            <Badge
              variant="secondary"
              className="shrink-0"
            >
              {locationsCount}
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
          {locationsButton}
          <SidebarMenuAction
            aria-label={expanded ? t("Hide Place Types") : t("Show Place Types")}
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
            <SidebarMenuItem className="space-y-1 px-1 pb-1">
              <PlaceTypesLink
                onNavigate={() => setExpanded(false)}
                placeTypesCount={placeTypesCount}
              />
              <LocationRelationsLink
                onNavigate={() => setExpanded(false)}
                locationRelationsCount={locationRelationsCount}
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
            {t("Locations")}
          </p>
          <div className="space-y-1">
            <PlaceTypesLink
              onNavigate={() => setOpen(false)}
              placeTypesCount={placeTypesCount}
            />
            <LocationRelationsLink
              onNavigate={() => setOpen(false)}
              locationRelationsCount={locationRelationsCount}
            />
          </div>
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
