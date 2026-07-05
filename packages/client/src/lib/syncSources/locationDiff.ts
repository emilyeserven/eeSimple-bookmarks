import type { SyncDiff, SyncFieldDiff } from "./syncSourceTypes";
import type { LocationLookupCandidate } from "@eesimple/types";

import { fillEmptyDefault, rowDiffers } from "./syncSourceTypes";
import i18n from "../../i18n";

/**
 * The location's current field values, for building the current-vs-candidate diff. Excludes the
 * name/English name on purpose — those are user-set identity fields that also drive the slug, so
 * a geocoder shouldn't be offered as a source to overwrite them.
 */
export interface LocationDiffCurrent {
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  placeType: string | null;
  countryCode: string | null;
}

/** Which editable location field a diff row applies (used by the registration hook's `applyStaged`). */
export type LocationSyncField = keyof LocationDiffCurrent;

/** The coordinate/map fields that a forced re-geocode overwrites server-side (incl. boundary). */
export const LOCATION_COORD_FIELDS: ReadonlySet<LocationSyncField> = new Set<LocationSyncField>([
  "latitude",
  "longitude",
  "mapUrl",
]);

const FIELD_LABELS: Record<LocationSyncField, string> = {
  latitude: i18n.t("Latitude"),
  longitude: i18n.t("Longitude"),
  mapUrl: i18n.t("Map URL"),
  placeType: i18n.t("Place type"),
  countryCode: i18n.t("Country code"),
};

/**
 * Builds the "Geocoding" diff group from a fresh geocode `candidate` and the location's `current`
 * values. Only fields the geocoder actually returned and that differ from the current value become
 * rows; each row's checkbox defaults to checked only when it fills an empty field (fill-empty) — so
 * with the re-geocode toggle off nothing overwrites a populated field unless the user opts in. Each
 * row carries a `{ field, value }` payload the registration hook applies. Pure + unit-tested.
 */
export function buildLocationDiff(
  candidate: LocationLookupCandidate,
  current: LocationDiffCurrent,
): SyncDiff {
  const rows: SyncFieldDiff[] = [];
  const push = (field: LocationSyncField, currentValue: string | number | null, nextValue: string | number | null) => {
    if (nextValue === null || nextValue === "") return;
    if (!rowDiffers(currentValue, nextValue)) return;
    rows.push({
      key: field,
      label: FIELD_LABELS[field],
      current: currentValue,
      next: nextValue,
      kind: "text",
      defaultChecked: fillEmptyDefault(currentValue, nextValue),
      payload: {
        field,
        value: nextValue,
      },
    });
  };

  push("latitude", current.latitude, candidate.latitude);
  push("longitude", current.longitude, candidate.longitude);
  push("mapUrl", current.mapUrl, candidate.mapUrl);
  push("placeType", current.placeType, candidate.placeType);
  push("countryCode", current.countryCode, candidate.countryCode);

  return {
    groups: [
      {
        source: i18n.t("Geocoding"),
        rows,
      },
    ],
  };
}
