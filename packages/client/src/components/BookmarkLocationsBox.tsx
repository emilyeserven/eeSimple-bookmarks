import type { BookmarkLocation } from "@eesimple/types";

import { Fragment } from "react";

import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { LocationHierarchyHoverCard } from "./LocationHierarchyHoverCard";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { ScrollFadeBox } from "./ScrollFadeBox";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { Badge } from "@/components/ui/badge";
import { entityLinkTitle } from "@/lib/sidebarModifier";

interface LocationsBoxProps {
  locations: BookmarkLocation[];
  /** Show each location's ancestor chain in a hover popover (the `showLocationHierarchyOnHover` placement knob). */
  showHierarchyOnHover?: boolean;
}

/** Scrollable, fading box of a bookmark's location badges (each links to the location's page). */
export function BookmarkLocationsBox({
  locations,
}: LocationsBoxProps) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <ScrollFadeBox itemCount={locations.length}>
      {locations.map(location => (
        <li key={location.id}>
          <Link
            to="/taxonomies/locations/$locationSlug"
            params={{
              locationSlug: location.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "location", location.id, location.slug)}
          >
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-1"
            >
              <MapPin className="size-3 shrink-0" />
              {location.name}
            </Badge>
          </Link>
        </li>
      ))}
    </ScrollFadeBox>
  );
}

/**
 * A bookmark's location badges with no wrapping box — each renders standalone so it flows alongside
 * the card's other pills (category, media type, website, …) in the `card-labels` zone's flex row,
 * rather than sitting in its own bordered, scrollable container like {@link BookmarkLocationsBox}.
 */
export function BookmarkLocationBadges({
  locations, showHierarchyOnHover = false,
}: LocationsBoxProps) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return (
    <div className="flex flex-wrap items-center gap-1">
      {locations.map((location) => {
        const link = (
          <Link
            to="/taxonomies/locations/$locationSlug"
            params={{
              locationSlug: location.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "location", location.id, location.slug)}
          >
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-1"
            >
              <MapPin className="size-3 shrink-0" />
              {location.name}
            </Badge>
          </Link>
        );
        return (
          <div key={location.id}>
            {showHierarchyOnHover
              ? (
                <LocationHierarchyHoverCard location={location}>
                  {link}
                </LocationHierarchyHoverCard>
              )
              : link}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Inline, comma-separated location links — the `card-table` zone's value form of a bookmark's
 * locations. Each name links to the location's page like the {@link BookmarkLocationsBox} badges,
 * but laid out as plain inline text to fit the table value column. Mirrors {@link BookmarkTagLinks}.
 */
export function BookmarkLocationLinks({
  locations, showHierarchyOnHover = false,
}: LocationsBoxProps) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return (
    <span className="text-sm">
      {locations.map((location, index) => {
        const link = (
          <Link
            to="/taxonomies/locations/$locationSlug"
            params={{
              locationSlug: location.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "location", location.id, location.slug)}
            className="
              text-primary
              hover:underline
            "
          >
            {location.name}
          </Link>
        );
        return (
          <Fragment key={location.id}>
            {index > 0 ? ", " : null}
            {showHierarchyOnHover
              ? (
                <LocationHierarchyHoverCard location={location}>
                  {link}
                </LocationHierarchyHoverCard>
              )
              : link}
          </Fragment>
        );
      })}
    </span>
  );
}
