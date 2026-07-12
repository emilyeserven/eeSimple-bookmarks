import type { TermDisplayProps } from "./bookmarkCardTermBadges";
import type { BookmarkLocation } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { TaxonomyBadgeRow, TaxonomyLinkList } from "./bookmarkCardTermBadges";
import { LocationHierarchyHoverCard } from "./LocationHierarchyHoverCard";
import { ScrollFadeBox } from "./ScrollFadeBox";

import { Badge } from "@/components/ui/badge";
import i18n from "@/i18n";

interface LocationsBoxProps extends TermDisplayProps {
  locations: BookmarkLocation[];
  /** Show each location's ancestor chain in a hover popover (the `showLocationHierarchyOnHover` placement knob). */
  showHierarchyOnHover?: boolean;
}

/** The count-form label for a bookmark's locations, e.g. "5 locations". */
function locationsCountLabel(count: number): string {
  return i18n.t("{{count}} locations", {
    count,
  });
}

/** Scrollable, fading box of a bookmark's location badges (each links to the location's page). */
export function BookmarkLocationsBox({
  locations,
}: LocationsBoxProps) {
  return (
    <ScrollFadeBox itemCount={locations.length}>
      {locations.map(location => (
        <li key={location.id}>
          <Link
            to="/taxonomies/locations/$locationSlug"
            params={{
              locationSlug: location.slug,
            }}
            title={location.name}
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
  locations, showHierarchyOnHover = false, maxTerms = null, collapseToCount = false,
}: LocationsBoxProps) {
  return (
    <TaxonomyBadgeRow
      items={locations}
      keyOf={location => location.id}
      icon={MapPin}
      countLabel={locationsCountLabel}
      maxTerms={maxTerms}
      collapseToCount={collapseToCount}
      renderBadge={(location) => {
        const link = (
          <Link
            to="/taxonomies/locations/$locationSlug"
            params={{
              locationSlug: location.slug,
            }}
            title={location.name}
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
        return showHierarchyOnHover
          ? (
            <LocationHierarchyHoverCard location={location}>
              {link}
            </LocationHierarchyHoverCard>
          )
          : link;
      }}
    />
  );
}

/**
 * Inline, comma-separated location links — the `card-table` zone's value form of a bookmark's
 * locations. Each name links to the location's page like the {@link BookmarkLocationsBox} badges,
 * but laid out as plain inline text to fit the table value column. Mirrors {@link BookmarkTagLinks}.
 */
export function BookmarkLocationLinks({
  locations, showHierarchyOnHover = false, maxTerms = null, collapseToCount = false,
}: LocationsBoxProps) {
  return (
    <TaxonomyLinkList
      items={locations}
      keyOf={location => location.id}
      countLabel={locationsCountLabel}
      maxTerms={maxTerms}
      collapseToCount={collapseToCount}
      renderLink={(location) => {
        const link = (
          <Link
            to="/taxonomies/locations/$locationSlug"
            params={{
              locationSlug: location.slug,
            }}
            title={location.name}
            className="
              text-primary
              hover:underline
            "
          >
            {location.name}
          </Link>
        );
        return showHierarchyOnHover
          ? (
            <LocationHierarchyHoverCard location={location}>
              {link}
            </LocationHierarchyHoverCard>
          )
          : link;
      }}
    />
  );
}
