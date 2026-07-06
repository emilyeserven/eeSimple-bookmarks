import type { LocationNode } from "@eesimple/types";

import { useState } from "react";

import { Link, createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { useLocationBySlug } from "../hooks/useLocations";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/_hub")({
  component: LocationHubLayout,
});

/**
 * A single sub-location chip. When the location has its own children, hovering the pill opens a popover
 * listing its descendant tree (preserving hierarchy), so each pill exposes its own subtree.
 */
function SubLocationPill({
  location,
}: { location: LocationNode }) {
  const [open, setOpen] = useState(false);
  const hasChildren = location.children.length > 0;

  const pill = (
    <Link
      to="/taxonomies/locations/$locationSlug"
      params={{
        locationSlug: location.slug,
      }}
      className="
        rounded-full border px-2.5 py-0.5 font-medium
        hover:bg-accent
      "
      onMouseEnter={hasChildren ? () => setOpen(true) : undefined}
      onMouseLeave={hasChildren ? () => setOpen(false) : undefined}
    >
      <LocalizedNameLabel
        names={location.names ?? []}
        base={location.name}
      />
    </Link>
  );

  if (!hasChildren) {
    return pill;
  }

  return (
    <Popover open={open}>
      <PopoverTrigger asChild>{pill}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[500px] w-64 overflow-y-auto"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <LocationChildrenTree locations={location.children} />
      </PopoverContent>
    </Popover>
  );
}

/** Recursively renders a location subtree, indenting each level to preserve its hierarchy. */
function LocationChildrenTree({
  locations,
}: { locations: LocationNode[] }) {
  return (
    <ul className="space-y-1 text-sm">
      {locations.map(child => (
        <li key={child.id}>
          <Link
            to="/taxonomies/locations/$locationSlug"
            params={{
              locationSlug: child.slug,
            }}
            className="hover:underline"
          >
            <LocalizedNameLabel
              names={child.names ?? []}
              base={child.name}
            />
          </Link>
          {child.children.length > 0 && (
            <div className="mt-1 ml-3 border-l pl-2">
              <LocationChildrenTree locations={child.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function LocationHubLayout() {
  const {
    t,
  } = useTranslation();
  const {
    locationSlug,
  } = Route.useParams();
  const {
    location, isLoading,
  } = useLocationBySlug(locationSlug);

  return (
    <ListingHubLayout
      header={(
        <div className="space-y-2">
          <h1
            className="
              flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
            "
          >
            <MapPin className="size-6 shrink-0" />
            {isLoading
              ? t("Location")
              : location
                ? (
                  <LocalizedNameLabel
                    names={location.names ?? []}
                    base={location.name}
                    stacked
                  />
                )
                : t("Location not found")}
          </h1>
          {location && location.children.length > 0 && (
            <div
              className="
                flex flex-wrap items-center gap-2 text-sm text-muted-foreground
              "
            >
              <span>{t("Sub-locations:")}</span>
              {location.children.map(child => (
                <SubLocationPill
                  key={child.id}
                  location={child}
                />
              ))}
            </div>
          )}
        </div>
      )}
      tabs={[
        {
          to: "/taxonomies/locations/$locationSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/locations/$locationSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/locations/$locationSlug/media",
          label: t("Media"),
        },
        {
          to: "/taxonomies/locations/$locationSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        locationSlug,
      }}
      navAriaLabel={t("Location views")}
    />
  );
}
