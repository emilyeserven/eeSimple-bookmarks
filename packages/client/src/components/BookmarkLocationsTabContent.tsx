import type { BookmarkLocation, LocationNode } from "@eesimple/types";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";
import { ChevronRight, MapPin } from "lucide-react";

import { LocationMapSection } from "./LocationMapSection";
import { RomanizedLabel } from "./RomanizedLabel";
import { findAncestorPath, flattenTree } from "../lib/tagTree";

import { LabeledSection } from "@/components/LabeledSection";
import { Separator } from "@/components/ui/separator";

interface BookmarkLocationsTabContentProps {
  bookmarkId: string;
  locations: BookmarkLocation[];
  /** Full location tree; undefined while still loading. */
  locationTree: LocationNode[] | undefined;
}

/**
 * Body for the bookmark detail "Locations" tab: a collapsible map (with the Levels overlay) showing
 * every tagged location, followed by a list of each location with its full ancestor breadcrumb trail.
 */
export function BookmarkLocationsTabContent({
  bookmarkId, locations, locationTree,
}: BookmarkLocationsTabContentProps) {
  // Full LocationNode for each tagged location — strips children so only the tagged nodes appear.
  const mapNodes = useMemo(() => {
    if (!locationTree) return [];
    const flat = flattenTree(locationTree);
    return locations.flatMap((loc) => {
      const found = flat.find(item => item.node.id === loc.id)?.node;
      return found
        ? [{
          ...found,
          children: [] as LocationNode[],
        }]
        : [];
    });
  }, [locationTree, locations]);

  // Ancestor path (root → location) for each tagged location.
  const ancestorPaths = useMemo(() => {
    if (!locationTree) return new Map<string, LocationNode[]>();
    return new Map(
      locations.map(loc => [loc.id, findAncestorPath(locationTree, loc.slug) ?? []]),
    );
  }, [locationTree, locations]);

  return (
    <div className="space-y-6">
      {locationTree
        ? (
          <LocationMapSection
            mapKey={`bookmark:${bookmarkId}:locations`}
            tree={mapNodes}
            mapClassName="h-80 w-full rounded-lg border"
            showLevels
            scope={{
              kind: "bookmark",
            }}
          />
        )
        : <p className="text-sm text-muted-foreground">Loading map…</p>}

      <Separator />

      <LabeledSection title="Locations">
        <ul className="space-y-3">
          {locations.map((loc) => {
            const path = ancestorPaths.get(loc.id) ?? [];
            if (path.length === 0) {
              return (
                <li key={loc.id}>
                  <Link
                    to="/taxonomies/locations/$locationSlug"
                    params={{
                      locationSlug: loc.slug,
                    }}
                    className="
                      flex items-center gap-1 text-sm font-medium
                      hover:underline
                    "
                  >
                    <MapPin className="size-3.5 shrink-0" />
                    {loc.name}
                  </Link>
                </li>
              );
            }
            return (
              <li key={loc.id}>
                <div className="flex flex-wrap items-center gap-1 text-sm">
                  {path.map((ancestor, i) => (
                    <span
                      key={ancestor.id}
                      className="flex items-center gap-1"
                    >
                      {i > 0 && (
                        <ChevronRight
                          className="size-3 shrink-0 text-muted-foreground"
                        />
                      )}
                      <Link
                        to="/taxonomies/locations/$locationSlug"
                        params={{
                          locationSlug: ancestor.slug,
                        }}
                        className={
                          i === path.length - 1
                            ? `
                              flex items-center gap-1 font-medium
                              hover:underline
                            `
                            : `
                              text-muted-foreground
                              hover:underline
                            `
                        }
                      >
                        {i === path.length - 1 && (
                          <MapPin className="size-3.5 shrink-0" />
                        )}
                        <RomanizedLabel
                          name={ancestor.name}
                          romanized={ancestor.romanizedName}
                        />
                      </Link>
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </LabeledSection>
    </div>
  );
}
