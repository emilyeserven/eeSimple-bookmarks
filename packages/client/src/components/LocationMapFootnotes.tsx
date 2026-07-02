import { NO_LEVEL_MAP_COLOR, NO_PLACE_TYPE_MAP_COLOR } from "@eesimple/types";

/** A muted one-line note under the map, optionally led by a color-legend dot. */
function CountNote({
  count,
  dotColor,
  singular,
  plural,
}: {
  count: number;
  dotColor?: string;
  /** Sentence tail after the count when count === 1 (e.g. " location has no place type."). */
  singular: string;
  /** Sentence tail after the count otherwise. */
  plural: string;
}) {
  if (count === 0) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {dotColor
        ? (
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{
              backgroundColor: dotColor,
            }}
            aria-hidden="true"
          />
        )
        : null}
      {count}
      {count === 1 ? singular : plural}
    </p>
  );
}

/** The muted counts under a location map: omitted / level-hidden / unstyled locations. */
export function LocationMapFootnotes({
  omitted,
  hiddenByLevel,
  noPlaceTypeCount,
  noLevelCount,
}: {
  omitted: number;
  hiddenByLevel: number;
  noPlaceTypeCount: number;
  noLevelCount: number;
}) {
  return (
    <>
      <CountNote
        count={omitted}
        singular=" location has no coordinates and isn’t shown."
        plural=" locations have no coordinates and aren’t shown."
      />
      <CountNote
        count={hiddenByLevel}
        singular=" location is hidden by the current level filter."
        plural=" locations are hidden by the current level filter."
      />
      <CountNote
        count={noPlaceTypeCount}
        dotColor={NO_PLACE_TYPE_MAP_COLOR}
        singular=" location has no place type."
        plural=" locations have no place type."
      />
      <CountNote
        count={noLevelCount}
        dotColor={NO_LEVEL_MAP_COLOR}
        singular=" location has a place type with no level."
        plural=" locations have a place type with no level."
      />
    </>
  );
}
